import React, { useMemo, useState } from 'react';
import { Team } from '../../types';
import { teamLogos } from '../../game/data/teamLogos';

/**
 * Subconjunto de dados de um time necessário para renderizar o emblema.
 * Aceita um Team completo (que satisfaz este shape) ou um literal enxuto.
 */
export type CrestTeam = Pick<Team, 'id' | 'name' | 'tag' | 'colorPrimary' | 'colorSecondary'> & {
  readonly logoUrl?: string;
};

interface TeamCrestProps {
  readonly team: CrestTeam;
  /** Lado do quadrado/círculo em pixels. */
  readonly size: number;
  /** 'rounded' => quadrado com cantos arredondados; 'circle' => círculo. Default: 'circle'. */
  readonly shape?: 'rounded' | 'circle';
  /** Classe extra aplicada ao container (ex.: borda customizada). */
  readonly className?: string;
}

/** Resultado de cor derivado de forma determinística do time. */
interface DerivedCrestColors {
  readonly background: string;
  readonly text: string;
  readonly initials: string;
}

const WHITE = '#ffffff';
const BLACK = '#0a0a0a';

/** Hash estável (FNV-1a 32-bit) de uma string — determinístico, sem dependências. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    // multiplicação FNV em 32 bits via Math.imul
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // força unsigned 32-bit
}

/** Converte um hex (#rgb ou #rrggbb) em componentes RGB; null se inválido. */
function parseHex(hex: string): { readonly r: number; readonly g: number; readonly b: number } | null {
  const normalized = hex.trim().replace(/^#/, '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  if (expanded.length !== 6 || /[^0-9a-fA-F]/.test(expanded)) return null;
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/** Luminância relativa (WCAG) para decidir contraste do texto. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Cor de texto (preto/branco) que maximiza contraste sobre o fundo informado. */
function contrastingTextColor(r: number, g: number, b: number): string {
  return relativeLuminance(r, g, b) > 0.5 ? BLACK : WHITE;
}

/** Mistura levemente a cor base com uma cor-semente derivada do hash (variação determinística). */
function deriveBackground(colorPrimary: string, seed: number): { readonly hex: string; readonly r: number; readonly g: number; readonly b: number } {
  const base = parseHex(colorPrimary);
  // Cor-semente do hash em HSL convertida para RGB seria mais elaborado;
  // aqui aplicamos um deslocamento determinístico por canal a partir do seed.
  const fallback = { r: (seed & 0xff), g: ((seed >> 8) & 0xff), b: ((seed >> 16) & 0xff) };
  const source = base ?? fallback;
  const shift = ((seed >> 24) & 0x1f) - 16; // [-16, +15]
  const clamp = (value: number): number => Math.max(20, Math.min(235, value + shift));
  const r = clamp(source.r);
  const g = clamp(source.g);
  const b = clamp(source.b);
  const toHex = (value: number): string => value.toString(16).padStart(2, '0');
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, r, g, b };
}

/** Extrai as iniciais a exibir: tag (até 3 chars) ou, em fallback, iniciais do nome. */
function resolveInitials(tag: string, name: string): string {
  const cleanTag = tag.trim();
  if (cleanTag.length > 0) return cleanTag.slice(0, 3).toUpperCase();
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Emblema de time DETERMINÍSTICO.
 * Ordem de render:
 *  1. Se `logoUrl` existir e for não-vazio → <img>, com onError caindo no procedural.
 *  2. Caso contrário → emblema procedural: fundo derivado (hash estável + colorPrimary)
 *     e tag/iniciais centralizada com cor de texto por contraste de luminância.
 */
export const TeamCrest: React.FC<TeamCrestProps> = ({ team, size, shape = 'circle', className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const { background, text, initials } = useMemo<DerivedCrestColors>(() => {
    const seed = hashString(`${team.name}|${team.tag}`);
    const derived = deriveBackground(team.colorPrimary, seed);
    return {
      background: derived.hex,
      text: contrastingTextColor(derived.r, derived.g, derived.b),
      initials: resolveInitials(team.tag, team.name),
    };
  }, [team.name, team.tag, team.colorPrimary]);

  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  // Fonte da logo: upload/URL do usuário (logoUrl) tem precedência; senão a logo real baixada
  // (teamLogos por id); senão cai no emblema procedural abaixo.
  const resolvedLogo = (team.logoUrl && team.logoUrl.trim()) || teamLogos[team.id] || '';
  const hasLogo = resolvedLogo.length > 0;
  // Fonte proporcional ao tamanho; limitada para não estourar em emblemas pequenos.
  const fontSize = Math.max(9, Math.round(size * (initials.length >= 3 ? 0.32 : 0.4)));

  if (hasLogo && !imageFailed) {
    return (
      <img
        src={resolvedLogo}
        alt={`Emblema ${team.name}`}
        width={size}
        height={size}
        onError={() => setImageFailed(true)}
        style={{ width: size, height: size, borderColor: team.colorSecondary }}
        className={`object-cover border bg-zinc-950 ${radiusClass} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Emblema ${team.name}`}
      style={{
        width: size,
        height: size,
        backgroundColor: background,
        color: text,
        borderColor: team.colorSecondary,
        fontSize,
      }}
      className={`flex items-center justify-center font-black border leading-none select-none ${radiusClass} ${className}`}
    >
      {initials}
    </div>
  );
};
