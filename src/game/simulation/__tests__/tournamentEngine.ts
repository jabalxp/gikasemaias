/**
 * Testes do tournamentEngine (FASE 3a) — PURO, sem store/localStorage.
 * Uso: ./node_modules/.bin/tsx src/game/simulation/__tests__/tournamentEngine.ts
 *
 * Valida cada formato com winProbability/rng determinísticos e mocks.
 * Sai com process.exit(1) em qualquer falha.
 */

import {
  seedTeams,
  simulateSeries,
  simulateSingleElim,
  simulateRoundRobin,
  simulateGSL,
  simulateSwiss,
  defaultWinProbability,
  type TournamentTeam,
  type WinProbability,
} from '../tournamentEngine';
import type { TournamentMatch } from '../../../types';

let failures = 0;
const check = (label: string, cond: boolean, detail = ''): void => {
  const status = cond ? 'OK  ' : 'FAIL';
  if (!cond) failures += 1;
  console.log(`  [${status}] ${label}${detail ? ` — ${detail}` : ''}`);
};

/** Gera N times com strength decrescente (seed provisório; engine re-seeda). */
const makeTeams = (n: number): TournamentTeam[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i + 1}`,
    seed: i + 1,
    strength: 100 - i, // t1 mais forte
  }));

/** winProbability que SEMPRE favorece o de menor seed (mais forte). */
const seedFavored: WinProbability = (a, b) => (a.seed < b.seed ? 1 : 0);

/** RNG determinístico (LCG) para reprodutibilidade quando prob ∈ (0,1). */
const makeLcg = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return (): number => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const distinctRounds = (matches: readonly TournamentMatch[]): string[] =>
  [...new Set(matches.map((m) => m.roundName))];

// --- simulateSeries ---------------------------------------------------------
console.log('\n=== simulateSeries ===');
{
  const [a, b] = makeTeams(2);
  const bo3Sweep = simulateSeries(a, b, () => 1, 3, makeLcg(1));
  check('Bo3 prob 1.0 → A vence 2-0', bo3Sweep.winnerId === a.id && bo3Sweep.scoreA === 2 && bo3Sweep.scoreB === 0,
    `${bo3Sweep.scoreA}-${bo3Sweep.scoreB}`);
  const bo5 = simulateSeries(a, b, () => 0, 5, makeLcg(2));
  check('Bo5 prob 0.0 → B vence 0-3', bo5.winnerId === b.id && bo5.scoreA === 0 && bo5.scoreB === 3,
    `${bo5.scoreA}-${bo5.scoreB}`);
  const bo1 = simulateSeries(a, b, () => 1, 1, makeLcg(3));
  check('Bo1 → soma de mapas = 1', bo1.scoreA + bo1.scoreB === 1);
}

// --- seedTeams --------------------------------------------------------------
console.log('\n=== seedTeams ===');
{
  const shuffled: TournamentTeam[] = [
    { id: 'weak', seed: 99, strength: 10 },
    { id: 'strong', seed: 99, strength: 90 },
    { id: 'mid', seed: 99, strength: 50 },
  ];
  const seeded = seedTeams(shuffled);
  check('seed 1 = mais forte', seeded[0].id === 'strong' && seeded[0].seed === 1);
  check('seeds 1..N contíguos', seeded.map((t) => t.seed).join(',') === '1,2,3');
}

// --- simulateSingleElim (8) -------------------------------------------------
console.log('\n=== simulateSingleElim (8 times) ===');
{
  const { championId, matches } = simulateSingleElim(makeTeams(8), defaultWinProbability, 3, makeLcg(42));
  check('exatamente 7 matches', matches.length === 7, `${matches.length}`);
  check('exatamente 1 champion', typeof championId === 'string' && championId.length > 0, championId);
  const rounds = distinctRounds(matches);
  const expected = ['Quartas de Final', 'Semifinal', 'Final'];
  check('rounds nomeados corretos', expected.every((r) => rounds.includes(r)), rounds.join(' | '));
  check('contagem por rodada 4/2/1',
    matches.filter((m) => m.roundName === 'Quartas de Final').length === 4 &&
    matches.filter((m) => m.roundName === 'Semifinal').length === 2 &&
    matches.filter((m) => m.roundName === 'Final').length === 1);

  // Determinismo: seed 1 sempre campeão quando o mais forte sempre vence.
  const favored = simulateSingleElim(makeTeams(8), seedFavored, 3, makeLcg(7));
  const seed1Id = seedTeams(makeTeams(8))[0].id;
  check('seed 1 vence o bracket com prob 1.0', favored.championId === seed1Id, favored.championId);
}

// --- simulateRoundRobin (5) -------------------------------------------------
console.log('\n=== simulateRoundRobin (5 times) ===');
{
  const { standings, matches } = simulateRoundRobin(makeTeams(5), defaultWinProbability, 1, makeLcg(99));
  check('matches == C(5,2) == 10', matches.length === 10, `${matches.length}`);
  check('standings com 5 times', standings.length === 5, `${standings.length}`);
  const totalWins = standings.reduce((s, x) => s + x.wins, 0);
  const totalLosses = standings.reduce((s, x) => s + x.losses, 0);
  check('soma wins == soma losses', totalWins === totalLosses, `${totalWins} vs ${totalLosses}`);
  check('soma wins == 10 (1 por jogo)', totalWins === 10, `${totalWins}`);
  const totalFor = standings.reduce((s, x) => s + x.roundsFor, 0);
  const totalAgainst = standings.reduce((s, x) => s + x.roundsAgainst, 0);
  check('roundsFor total == roundsAgainst total', totalFor === totalAgainst, `${totalFor} vs ${totalAgainst}`);
  check('ordenado por wins desc', standings.every((s, i) => i === 0 || standings[i - 1].wins >= s.wins));
}

// --- simulateGSL (4) --------------------------------------------------------
console.log('\n=== simulateGSL (4 times) ===');
{
  const { advanced, matches } = simulateGSL(makeTeams(4), defaultWinProbability, 3, makeLcg(123));
  check('exatamente 2 advanced', advanced.length === 2, advanced.join(','));
  check('5 matches (2 opening + W + Elim + Decider)', matches.length === 5, `${matches.length}`);
  // Dupla-elim: cada time joga 2 ou 3 séries.
  const gamesPerTeam = new Map<string, number>();
  for (const m of matches) {
    gamesPerTeam.set(m.teamAId, (gamesPerTeam.get(m.teamAId) ?? 0) + 1);
    gamesPerTeam.set(m.teamBId, (gamesPerTeam.get(m.teamBId) ?? 0) + 1);
  }
  check('cada time jogou 2 ou 3 jogos',
    [...gamesPerTeam.values()].every((g) => g === 2 || g === 3),
    [...gamesPerTeam.values()].join(','));
  check('todos os 4 times jogaram', gamesPerTeam.size === 4);

  // Determinismo: seeds 1 e 2 avançam quando o mais forte sempre vence.
  const favored = simulateGSL(makeTeams(4), seedFavored, 3, makeLcg(8));
  const seeds = seedTeams(makeTeams(4));
  const top2 = new Set([seeds[0].id, seeds[1].id]);
  check('seeds 1 e 2 avançam com prob 1.0', favored.advanced.every((id) => top2.has(id)), favored.advanced.join(','));
}

// --- simulateSwiss (16) -----------------------------------------------------
console.log('\n=== simulateSwiss (16 times) ===');
{
  const { advanced, eliminated, matches, standings } =
    simulateSwiss(makeTeams(16), defaultWinProbability, makeLcg(2024));
  check('exatamente 8 advanced', advanced.length === 8, `${advanced.length}`);
  check('exatamente 8 eliminated', eliminated.length === 8, `${eliminated.length}`);
  check('advanced e eliminated disjuntos', advanced.every((id) => !eliminated.includes(id)));
  check('união cobre os 16', new Set([...advanced, ...eliminated]).size === 16);

  // Records dentro do limite (3-x ou x-3, ninguém ultrapassa).
  check('ninguém com >3 vitórias', standings.every((s) => s.wins <= 3),
    standings.map((s) => s.wins).join(','));
  check('ninguém com >3 derrotas', standings.every((s) => s.losses <= 3),
    standings.map((s) => s.losses).join(','));
  check('avançados têm 3 vitórias', advanced.every((id) => standings.find((s) => s.teamId === id)?.wins === 3));
  check('eliminados têm 3 derrotas', eliminated.every((id) => standings.find((s) => s.teamId === id)?.losses === 3));

  // Sem rematches: nenhum par (teamA,teamB) aparece duas vezes.
  const seen = new Set<string>();
  let rematch = false;
  for (const m of matches) {
    const key = [m.teamAId, m.teamBId].sort().join('|');
    if (seen.has(key)) rematch = true;
    seen.add(key);
  }
  check('sem rematches', !rematch, `${matches.length} matches, ${seen.size} pares únicos`);

  console.log(`  (info) ${matches.length} séries jogadas no suíço`);
}

// --- Resumo -----------------------------------------------------------------
console.log('\n=== RESUMO ===');
if (failures > 0) {
  console.log(`FALHOU: ${failures} check(s) falharam.`);
  process.exit(1);
}
console.log('TODOS OS CHECKS PASSARAM.');
