import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { realMaps } from '../game/data/realMaps';
import { Play, FastForward, Swords } from 'lucide-react';
import { Player } from '../types';
import { TeamCrest } from '../components/ui/TeamCrest';

/**
 * Tela de PRÉ-JOGO (spec §25.1): mostra o confronto, odds e mapa, e deixa o usuário
 * escolher entre assistir round a round ou simular rápido (ir direto ao resultado).
 */
export const MatchPreview: React.FC = () => {
  const { activeMatch, teams, players, assistirPartida, finalizarPartidaAtiva } = useGameStore();

  if (!activeMatch) return null;

  const teamA = teams[activeMatch.teamAId];
  const teamB = teams[activeMatch.teamBId];
  if (!teamA || !teamB) return null;

  const squadOf = (teamId: string): Player[] =>
    Object.values(players).filter(p => p.teamId === teamId && p.status === 'titular');

  const avgOverall = (squad: Player[]): number =>
    squad.length > 0 ? Math.round(squad.reduce((acc, p) => acc + p.overall, 0) / squad.length) : 70;

  const ovrA = avgOverall(squadOf(teamA.id));
  const ovrB = avgOverall(squadOf(teamB.id));
  const probA = Math.round((ovrA / (ovrA + ovrB)) * 100);
  const probB = 100 - probA;
  const mapName = realMaps.find(m => m.id === activeMatch.mapId)?.name ?? activeMatch.mapId.replace('de_', '');

  const TeamBadge: React.FC<{ teamId: string }> = ({ teamId }) => {
    const t = teams[teamId];
    return (
      <div className="flex flex-col items-center gap-2">
        <TeamCrest team={t} size={80} shape="rounded" />
        <p className="text-sm font-black text-white">{t.name}</p>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t.region} • Rank #{t.points}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-brand-border">
      <div className="text-center">
        <span className="text-[11px] font-black text-brand-cyan uppercase tracking-[0.3em] text-neon-cyan">Pré-Jogo</span>
        <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">Sala de Preparação</h2>
      </div>

      {/* CONFRONTO */}
      <div className="bg-zinc-950 border border-brand-border/60 rounded-2xl p-8 glow-cyan">
        <div className="flex items-center justify-around">
          <TeamBadge teamId={teamA.id} />
          <div className="flex flex-col items-center gap-2">
            <Swords className="w-8 h-8 text-brand-purple" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">VS</span>
            <span className="text-[10px] font-extrabold text-slate-400 bg-zinc-900 px-3 py-1 rounded border border-brand-border">
              Mapa: {mapName}
            </span>
          </div>
          <TeamBadge teamId={teamB.id} />
        </div>

        {/* ODDS */}
        <div className="mt-8 max-w-md mx-auto space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Vitória {teamA.tag}: {probA}%</span>
            <span>Vitória {teamB.tag}: {probB}%</span>
          </div>
          <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-brand-cyan h-full" style={{ width: `${probA}%` }} />
            <div className="bg-brand-purple h-full flex-1" />
          </div>
          <p className="text-center text-[10px] text-slate-500 font-semibold pt-1">
            Média de Overall — {teamA.tag}: {ovrA} · {teamB.tag}: {ovrB}
          </p>
        </div>
      </div>

      {/* AÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <button
          onClick={() => assistirPartida()}
          className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 active:scale-98 transition-all duration-300 uppercase tracking-wider"
        >
          <Play className="w-5 h-5 fill-brand-dark" />
          <span>Assistir Round a Round</span>
        </button>
        <button
          onClick={() => finalizarPartidaAtiva()}
          className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-extrabold border border-brand-border bg-zinc-900 hover:bg-zinc-800 text-slate-200 hover:text-white transition-all duration-300 uppercase tracking-wider"
        >
          <FastForward className="w-5 h-5" />
          <span>Simular Rápido</span>
        </button>
      </div>
    </div>
  );
};
