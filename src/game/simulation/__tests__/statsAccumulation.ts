/**
 * Teste da FASE 1 (Stats de Partida). Verifica que:
 *   (a) a simulação credita ASSISTÊNCIAS (assists > 0) em uma partida;
 *   (b) o MVP eleito tem o MAIOR impactScore (coerência da seleção);
 *   (c) ao avançar várias semanas, jogadores que disputaram partidas OFICIAIS acumulam
 *       carreira de forma imutável em Player.stats (mapsPlayed > 0, rating > 0, assists > 0).
 *
 * Roda a store real no Node mockando localStorage. Uso:
 *   ./node_modules/.bin/tsx src/game/simulation/__tests__/statsAccumulation.ts
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
import { simulateWholeMatchQuick } from '../matchSimulator';
import { realMaps } from '../../data/realMaps';
import type { Player } from '../../../types';

const failures: string[] = [];
const assert = (cond: boolean, msg: string): void => {
  if (!cond) failures.push(msg);
};

useGameStore.getState().iniciarCarreira('Tester', 'Brasil', 'furia', 'normal');

// --- (a) e (b): simula uma partida direta com os titulares reais e inspeciona as liveStats. ---
const { teams, players } = useGameStore.getState();
const teamIds = Object.keys(teams).filter((id) => id !== 'free_agents');
const teamAId = teamIds[0];
const teamBId = teamIds[1];
const squadOf = (teamId: string): Player[] =>
  Object.values(players).filter((p) => p.teamId === teamId && p.status === 'titular');

const map = realMaps.find((m) => m.status === 'active') ?? realMaps[0];
const match = simulateWholeMatchQuick(
  teams[teamAId],
  teams[teamBId],
  squadOf(teamAId),
  squadOf(teamBId),
  map,
  'tournament_test',
);

const totalAssists = Object.values(match.liveStats).reduce((acc, s) => acc + s.assists, 0);
assert(totalAssists > 0, `(a) esperava assists > 0 na partida, obtido ${totalAssists}`);

// (b) MVP eleito deve ter o maior impactScore (com bônus de 1.15 para o time vencedor).
const winnerId = match.scoreA > match.scoreB ? teamAId : teamBId;
const impactOf = (id: string, teamId: string): number => {
  const s = match.liveStats[id];
  const base =
    s.kills * 1.0 + s.assists * 0.4 + s.clutchesWon * 2.0 + s.multiKills * 1.5 + s.firstKills * 0.5 - s.deaths * 0.3;
  return base * (teamId === winnerId ? 1.15 : 1.0);
};
const allMatchPlayers = [...squadOf(teamAId), ...squadOf(teamBId)];
const maxImpact = Math.max(...allMatchPlayers.map((p) => impactOf(p.id, p.teamId)));
const mvp = allMatchPlayers.find((p) => p.id === match.mvpPlayerId);
assert(mvp !== undefined, '(b) MVP da partida não encontrado entre os participantes');
if (mvp) {
  const mvpImpact = impactOf(mvp.id, mvp.teamId);
  assert(
    Math.abs(mvpImpact - maxImpact) < 1e-6,
    `(b) MVP ${mvp.nickname} tem impact ${mvpImpact.toFixed(2)} mas o máximo é ${maxImpact.toFixed(2)}`,
  );
}

// --- (c): avança semanas; ao final, titulares da furia devem ter carreira acumulada. ---
let guard = 0;
while (useGameStore.getState().currentSeason <= 2 && guard < 4000) {
  guard += 1;
  useGameStore.getState().avancarSemana();
  if (useGameStore.getState().activeMatch) {
    useGameStore.getState().finalizarPartidaAtiva();
  }
}

const finalPlayers = useGameStore.getState();
const furiaId = finalPlayers.userTeamId;
const furiaSquad = Object.values(finalPlayers.players).filter((p) => p.teamId === furiaId);
const withMaps = furiaSquad.filter((p) => p.stats.mapsPlayed > 0);
const withRating = withMaps.filter((p) => p.stats.rating > 0);
const withAssists = furiaSquad.filter((p) => p.stats.assists > 0);

assert(withMaps.length > 0, `(c) nenhum jogador da furia com mapsPlayed > 0 após ${guard} ticks`);
assert(
  withRating.length === withMaps.length && withMaps.length > 0,
  `(c) jogadores com mapsPlayed mas rating <= 0: ${withMaps.length - withRating.length}`,
);
assert(withAssists.length > 0, '(c) nenhum jogador da furia acumulou assists na carreira');

console.log('=== STATS ACCUMULATION (FASE 1) ===');
console.log(`Partida direta: assists totais=${totalAssists}, MVP=${mvp?.nickname ?? '?'} (${match.scoreA}-${match.scoreB})`);
console.log(`Carreira furia: ${withMaps.length}/${furiaSquad.length} com mapsPlayed>0, ${withAssists.length} com assists>0 (${guard} ticks)`);
const sample = withMaps[0];
if (sample) {
  console.log(
    `Exemplo ${sample.nickname}: maps=${sample.stats.mapsPlayed} K=${sample.stats.kills} A=${sample.stats.assists} ` +
    `FK=${sample.stats.firstKills} CL=${sample.stats.clutchesWon} rating=${sample.stats.rating} adr=${sample.stats.adr} kast=${sample.stats.kast} mvps=${sample.stats.mvps}`,
  );
}

if (failures.length > 0) {
  console.log('FALHAS:');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('OK: stats de partida e acúmulo de carreira validados.');
