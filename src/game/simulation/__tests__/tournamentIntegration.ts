/**
 * Teste de INTEGRAÇÃO (FASE 3b): o motor de campeonatos (tournamentEngine) está integrado ao
 * fluxo da store. Roda uma temporada inteira (avançando semanas e jogando as partidas que abrem)
 * e verifica:
 *   (a) ao menos um torneio resolvido tem matches.length > 0 (jogos MATERIALIZADOS);
 *   (b) nenhum torneio teve o usuário enfrentando o MESMO adversário 2x na mesma edição;
 *   (c) os matches têm mapId preenchido (mapa mais jogado derivável);
 *   (d) algum torneio terminou com championId válido.
 *
 * Roda a store real no Node mockando localStorage. Uso:
 *   ./node_modules/.bin/tsx src/game/simulation/__tests__/tournamentIntegration.ts
 */

// Mock mínimo de localStorage para a store rodar fora do browser.
const lsStore: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in lsStore ? lsStore[k] : null),
  setItem: (k: string, v: string) => { lsStore[k] = String(v); },
  removeItem: (k: string) => { delete lsStore[k]; },
  clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
  key: () => null,
  length: 0,
} as Storage;

import { useGameStore } from '../../../store/useGameStore';
import type { Tournament, TournamentMatch } from '../../../types';

const failures: string[] = [];
const assert = (cond: boolean, msg: string): void => {
  if (!cond) failures.push(msg);
};

useGameStore.getState().iniciarCarreira('Tester', 'Brasil', 'furia', 'normal');

// Captura todos os torneios FINALIZADOS ao longo da temporada (antes do reset da virada apagar
// os artefatos). A virada de temporada ocorre quando currentSeason passa de 1 para 2.
const resolvedSnapshots: Tournament[] = [];
const seenIds = new Set<string>();

const snapshotFinished = (): void => {
  const { tournaments } = useGameStore.getState();
  Object.values(tournaments).forEach((t) => {
    if (t.isFinished && t.championId && !seenIds.has(`${t.id}`)) {
      seenIds.add(t.id);
      resolvedSnapshots.push(JSON.parse(JSON.stringify(t)) as Tournament);
    }
  });
};

let guard = 0;
while (useGameStore.getState().currentSeason === 1 && guard < 2000) {
  guard += 1;
  useGameStore.getState().avancarSemana();
  if (useGameStore.getState().activeMatch) {
    useGameStore.getState().finalizarPartidaAtiva();
  }
  snapshotFinished();
}
// Snapshot final (cobre os torneios de fundo resolvidos na própria virada de temporada).
snapshotFinished();

console.log(`=== INTEGRAÇÃO DE TORNEIOS (FASE 3b) — temporada 1 em ${guard} ticks ===`);
console.log(`Torneios finalizados capturados: ${resolvedSnapshots.length}`);

// (a) ao menos um torneio resolvido tem jogos materializados.
const withMatches = resolvedSnapshots.filter((t) => t.matches.length > 0);
assert(withMatches.length > 0, `(a) nenhum torneio resolvido tem matches.length > 0`);
console.log(`(a) Torneios com matches materializados: ${withMatches.length}`);

// (b) nenhum torneio com adversário REPETIDO para o usuário na mesma edição. Considera os jogos
//     em que o usuário (furia) participou; cada adversário deve aparecer no máximo 1x.
const { userTeamId } = useGameStore.getState();
let userMatchCount = 0;
resolvedSnapshots.forEach((t) => {
  const opponents: string[] = [];
  t.matches.forEach((m: TournamentMatch) => {
    if (m.teamAId === userTeamId) opponents.push(m.teamBId);
    else if (m.teamBId === userTeamId) opponents.push(m.teamAId);
  });
  userMatchCount += opponents.length;
  const dupes = opponents.filter((id, i) => opponents.indexOf(id) !== i);
  if (dupes.length > 0) {
    failures.push(`(b) ${t.name}: usuário repetiu adversário(s) ${[...new Set(dupes)].join(', ')}`);
  }
});
console.log(`(b) Partidas do usuário registradas em torneios: ${userMatchCount} (sem adversário repetido = ok)`);

// (c) TODOS os matches têm mapId preenchido (mapa mais jogado derivável).
let totalMatches = 0;
let missingMap = 0;
resolvedSnapshots.forEach((t) => {
  t.matches.forEach((m) => {
    totalMatches += 1;
    if (!m.mapId) missingMap += 1;
  });
});
assert(totalMatches > 0, `(c) nenhum match registrado para checar mapId`);
assert(missingMap === 0, `(c) ${missingMap}/${totalMatches} matches sem mapId`);
console.log(`(c) Matches com mapId: ${totalMatches - missingMap}/${totalMatches}`);

// (c-extra) Demonstra a derivação do "mapa mais jogado" de um torneio com jogos.
const sample = withMatches[0];
if (sample) {
  const mapCount = new Map<string, number>();
  sample.matches.forEach((m) => {
    if (m.mapId) mapCount.set(m.mapId, (mapCount.get(m.mapId) ?? 0) + 1);
  });
  const top = [...mapCount.entries()].sort((a, b) => b[1] - a[1])[0];
  console.log(`    Mapa mais jogado em "${sample.name}": ${top ? `${top[0]} (${top[1]}x)` : 'n/d'}`);
}

// (d) algum torneio terminou com championId válido (campeão real).
const { teams } = useGameStore.getState();
const validChamps = resolvedSnapshots.filter((t) => t.championId && teams[t.championId]);
assert(validChamps.length > 0, `(d) nenhum torneio com championId válido`);
console.log(`(d) Torneios com campeão válido: ${validChamps.length}`);

if (failures.length > 0) {
  console.log('\nFALHAS:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('\nOK: integração do motor de campeonatos validada.');
