/**
 * Harness de balanceamento (standalone) — Fase F.
 * Roda N simulações entre fixtures sintéticas e imprime distribuição de placar,
 * winrate, taxa de zebra e CT-winrate. Executar: npx tsx src/game/simulation/__tests__/balanceHarness.ts
 * NÃO é test runner — é uma ferramenta de calibração manual.
 */
import { Player, Team, GameMap } from '../../../types';
import { simulateWholeMatchQuick } from '../matchSimulator';
import { realMaps } from '../../data/realMaps';

const makePlayer = (teamId: string, overall: number, i: number, role: Player['role'] = 'Rifler'): Player => ({
  id: `${teamId}_p${i}`,
  nickname: `${teamId}${i}`,
  name: `Player ${i}`,
  nationality: 'Brasil',
  age: 24,
  teamId,
  role,
  subRoles: [],
  overall,
  potential: overall,
  value: 100000,
  salary: 5000,
  contractMonths: 12,
  moral: 80,
  form: 85,
  energy: 100,
  personality: 'Focado',
  attributes: { aim: overall, gamesense: overall, clutch: overall, utility: overall, igl: overall },
  stats: { rating: 1, kills: 0, deaths: 0, assists: 0, adr: 70, kast: 70, hsPercentage: 40, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
  status: 'titular',
});

const makeSquad = (teamId: string, overall: number): Player[] =>
  [0, 1, 2, 3, 4].map((i) => makePlayer(teamId, overall, i, i === 0 ? 'AWPer' : i === 1 ? 'IGL' : 'Rifler'));

const makeTeam = (id: string, tier: Team['tier'], mastery: number, recentForm: ('W' | 'L')[]): Team => ({
  id,
  name: id,
  tag: id.toUpperCase().slice(0, 3),
  country: 'Brasil',
  region: 'América do Sul',
  tier,
  points: 500,
  reputation: 70,
  budget: 100000,
  tactics: { playstyle: 'balanced', tempo: 'normal', focus: 'default', utilityUsage: 'medium', economyStyle: 'balanced' },
  mapMastery: { de_mirage: mastery, de_anubis: mastery },
  colorPrimary: '#ffffff',
  colorSecondary: '#000000',
  isUser: false,
  stats: { wins: 0, losses: 0, titles: 0, recentForm },
  staff: {},
});

interface ScenarioResult {
  nome: string;
  winrateA: number;
  zebraRate: number;
  ctWinrate: number;
  mediaRounds: number;
  topPlacares: string;
}

const runScenario = (
  nome: string,
  ovrA: number,
  ovrB: number,
  map: GameMap,
  N: number
): ScenarioResult => {
  const teamA = makeTeam('aaa', 1, 50, []);
  const teamB = makeTeam('bbb', ovrA === ovrB ? 1 : 2, 50, []);
  let winsA = 0;
  let ctRounds = 0;
  let totalRounds = 0;
  let sumRounds = 0;
  const placares: Record<string, number> = {};

  for (let n = 0; n < N; n++) {
    const squadA = makeSquad('aaa', ovrA);
    const squadB = makeSquad('bbb', ovrB);
    const m = simulateWholeMatchQuick(teamA, teamB, squadA, squadB, map, 'test');
    if (m.winnerId === 'aaa') winsA++;
    const key = `${Math.max(m.scoreA, m.scoreB)}-${Math.min(m.scoreA, m.scoreB)}`;
    placares[key] = (placares[key] || 0) + 1;
    sumRounds += m.scoreA + m.scoreB;
    for (const r of m.rounds) {
      totalRounds++;
      if (r.winningTeamSide === 'CT') ctRounds++;
    }
  }

  const top = Object.entries(placares).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([k, v]) => `${k} (${Math.round((v / N) * 100)}%)`).join(', ');

  // zebra = time de menor overall vence
  const zebra = ovrA === ovrB ? 0 : (ovrA > ovrB ? (N - winsA) : winsA);

  return {
    nome,
    winrateA: Math.round((winsA / N) * 100),
    zebraRate: Math.round((zebra / N) * 100),
    ctWinrate: Math.round((ctRounds / totalRounds) * 100),
    mediaRounds: Math.round((sumRounds / N) * 10) / 10,
    topPlacares: top,
  };
};

const N = Number(process.argv[2] ?? 1000);
const mirage = realMaps.find((m) => m.id === 'de_mirage') ?? realMaps[0];
const anubis = realMaps.find((m) => m.id === 'de_anubis') ?? realMaps[0];

console.log(`\n=== HARNESS DE BALANCEAMENTO (N=${N}) — mapa base: ${mirage.name} (bias ${mirage.sideBias}) ===\n`);
const cenarios = [
  runScenario('Tier1 vs Tier1 (85 vs 85)', 85, 85, mirage, N),
  runScenario('Tier1 vs Tier2 (85 vs 78)', 85, 78, mirage, N),
  runScenario('Tier1 vs Tier3 (85 vs 72)', 85, 72, mirage, N),
  runScenario(`CT-bias check em ${anubis.name} (85 vs 85)`, 85, 85, anubis, N),
];
for (const c of cenarios) {
  console.log(`• ${c.nome}`);
  console.log(`    winrate A: ${c.winrateA}% | zebra: ${c.zebraRate}% | CT-winrate: ${c.ctWinrate}% | média rounds: ${c.mediaRounds}`);
  console.log(`    placares: ${c.topPlacares}\n`);
}
