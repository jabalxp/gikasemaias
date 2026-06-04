/**
 * tournamentEngine — FASE 3a (módulo PURO de formatos de campeonato).
 *
 * Funções 100% puras: recebem times, uma função de probabilidade injetável e um
 * RNG injetável; retornam resultados materializados (matches/standings/advanced).
 * Nada de store, localStorage ou Math.random escondido — tudo determinístico se
 * o RNG e a winProbability forem determinísticos. Pronto para a integração 3b.
 *
 * Convenções:
 *  - `strength`: força pré-computada do time (ex.: overall médio × modificadores).
 *    Quem chama é responsável por calcular; o engine não conhece Players/Teams.
 *  - `winProbability(a, b)`: probabilidade de A vencer UM mapa (0..1).
 *  - Placar de série em MAPAS (Bo3 → 2-1), não em rounds de CS.
 */

import type { TournamentMatch, TournamentStanding, TournamentEngineFormat } from '../../types';

/** Time participante de um formato, com força pré-computada e seed. */
export interface TournamentTeam {
  readonly id: string;
  readonly seed: number;
  readonly strength: number;
}

/** Probabilidade de A vencer UM mapa contra B (0..1). */
export type WinProbability = (a: TournamentTeam, b: TournamentTeam) => number;

/** Fonte de aleatoriedade injetável (default Math.random). */
export type Rng = () => number;

export type BestOf = 1 | 3 | 5;

export interface SeriesResult {
  readonly winnerId: string;
  readonly scoreA: number;
  readonly scoreB: number;
}

export interface SingleElimResult {
  readonly championId: string;
  readonly matches: readonly TournamentMatch[];
}

export interface RoundRobinResult {
  readonly standings: readonly TournamentStanding[];
  readonly matches: readonly TournamentMatch[];
}

export interface GslResult {
  readonly advanced: readonly string[]; // 2 times
  readonly matches: readonly TournamentMatch[];
}

export interface SwissResult {
  readonly advanced: readonly string[];   // 8 times
  readonly eliminated: readonly string[]; // 8 times
  readonly matches: readonly TournamentMatch[];
  readonly standings: readonly TournamentStanding[];
}

/** Probabilidade default: razão de forças. Robusta a forças não-positivas. */
export const defaultWinProbability: WinProbability = (a, b) => {
  const total = a.strength + b.strength;
  if (total <= 0) return 0.5;
  return a.strength / total;
};

// --- Helpers internos -------------------------------------------------------

let matchCounter = 0;
const nextMatchId = (): string => {
  matchCounter += 1;
  return `tm_${matchCounter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
};

/** Mapas necessários para vencer a série (maioria simples). */
const winsNeeded = (bestOf: BestOf): number => Math.floor(bestOf / 2) + 1;

/** Nome de rodada do single-elim conforme quantos times restam nela. */
const roundNameForSize = (teamsInRound: number): string => {
  switch (teamsInRound) {
    case 2: return 'Final';
    case 4: return 'Semifinal';
    case 8: return 'Quartas de Final';
    case 16: return 'Oitavas de Final';
    case 32: return 'Rodada de 32';
    default: return `Rodada de ${teamsInRound}`;
  }
};

const findById = (teams: readonly TournamentTeam[], id: string): TournamentTeam => {
  const team = teams.find((t) => t.id === id);
  if (!team) throw new Error(`TournamentTeam não encontrado: ${id}`);
  return team;
};

const emptyStanding = (teamId: string): TournamentStanding => ({
  teamId, wins: 0, losses: 0, roundsFor: 0, roundsAgainst: 0,
});

/** Ordena standings por wins desc, depois saldo desc, depois roundsFor desc. */
const compareStandings = (a: TournamentStanding, b: TournamentStanding): number => {
  if (b.wins !== a.wins) return b.wins - a.wins;
  const balanceA = a.roundsFor - a.roundsAgainst;
  const balanceB = b.roundsFor - b.roundsAgainst;
  if (balanceB !== balanceA) return balanceB - balanceA;
  return b.roundsFor - a.roundsFor;
};

// --- seedTeams --------------------------------------------------------------

/** Ordena por strength desc e atribui seed 1..N (1 = mais forte). Puro. */
export const seedTeams = (teams: readonly TournamentTeam[]): TournamentTeam[] =>
  [...teams]
    .sort((a, b) => b.strength - a.strength)
    .map((team, index) => ({ ...team, seed: index + 1 }));

// --- simulateSeries ---------------------------------------------------------

/**
 * Roda uma série best-of-N (maioria) entre A e B. Cada mapa é decidido por
 * `winProbability(a, b)` vs `rng()`. Placar em MAPAS. Encerra ao atingir maioria.
 */
export const simulateSeries = (
  a: TournamentTeam,
  b: TournamentTeam,
  winProbability: WinProbability,
  bestOf: BestOf,
  rng: Rng = Math.random,
): SeriesResult => {
  const target = winsNeeded(bestOf);
  const probAWinsMap = winProbability(a, b);
  let scoreA = 0;
  let scoreB = 0;

  while (scoreA < target && scoreB < target) {
    if (rng() < probAWinsMap) scoreA += 1;
    else scoreB += 1;
  }

  return { winnerId: scoreA > scoreB ? a.id : b.id, scoreA, scoreB };
};

/** Materializa um TournamentMatch a partir de uma série já resolvida. */
const buildMatch = (
  a: TournamentTeam,
  b: TournamentTeam,
  series: SeriesResult,
  bestOf: BestOf,
  roundName: string,
  stage: string,
): TournamentMatch => ({
  matchId: nextMatchId(),
  teamAId: a.id,
  teamBId: b.id,
  scoreA: series.scoreA,
  scoreB: series.scoreB,
  winnerId: series.winnerId,
  bestOf,
  roundName,
  stage,
});

// --- simulateSingleElim -----------------------------------------------------

/**
 * Bracket de eliminação simples com SEEDING (1vN, 2v(N-1), ...). Requer N
 * potência de 2 (4, 8, 16...). Materializa cada confronto. O seed maior vence
 * sempre se winProbability favorecer o mais forte (prob 1.0).
 */
export const simulateSingleElim = (
  teams: readonly TournamentTeam[],
  winProbability: WinProbability,
  bestOf: BestOf,
  rng: Rng = Math.random,
): SingleElimResult => {
  if (teams.length < 2) {
    throw new Error('simulateSingleElim requer ao menos 2 times.');
  }
  const isPowerOfTwo = (teams.length & (teams.length - 1)) === 0;
  if (!isPowerOfTwo) {
    throw new Error(`simulateSingleElim requer N potência de 2, recebeu ${teams.length}.`);
  }

  const seeded = seedTeams(teams);
  // Emparelhamento por seed: melhor seed vs pior seed dentro da rodada.
  const ordered = [...seeded].sort((a, b) => a.seed - b.seed);

  let remaining: TournamentTeam[] = ordered;
  const matches: TournamentMatch[] = [];
  const stage = 'Single Elim';

  while (remaining.length > 1) {
    const roundName = roundNameForSize(remaining.length);
    const winners: TournamentTeam[] = [];
    const half = remaining.length / 2;
    for (let i = 0; i < half; i += 1) {
      const a = remaining[i];
      const b = remaining[remaining.length - 1 - i]; // 1vN, 2v(N-1)...
      const series = simulateSeries(a, b, winProbability, bestOf, rng);
      matches.push(buildMatch(a, b, series, bestOf, roundName, stage));
      winners.push(series.winnerId === a.id ? a : b);
    }
    // Reordena vencedores por seed para manter o chaveamento topo-vs-base.
    remaining = winners.sort((x, y) => x.seed - y.seed);
  }

  return { championId: remaining[0].id, matches };
};

// --- simulateRoundRobin -----------------------------------------------------

/**
 * Todos-contra-todos. Cada par joga uma série best-of-N. Standings ordenados
 * por wins, depois saldo de mapas. Gera C(N,2) partidas.
 */
export const simulateRoundRobin = (
  teams: readonly TournamentTeam[],
  winProbability: WinProbability,
  bestOf: BestOf = 1,
  rng: Rng = Math.random,
): RoundRobinResult => {
  if (teams.length < 2) {
    throw new Error('simulateRoundRobin requer ao menos 2 times.');
  }

  const standings = new Map<string, TournamentStanding>(
    teams.map((t) => [t.id, emptyStanding(t.id)]),
  );
  const matches: TournamentMatch[] = [];
  const stage = 'Round Robin';

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const a = teams[i];
      const b = teams[j];
      const series = simulateSeries(a, b, winProbability, bestOf, rng);
      matches.push(buildMatch(a, b, series, bestOf, 'Rodada Única', stage));

      const sa = standings.get(a.id);
      const sb = standings.get(b.id);
      if (!sa || !sb) throw new Error('Standing ausente no round-robin.');
      const aWon = series.winnerId === a.id;
      standings.set(a.id, {
        ...sa,
        wins: sa.wins + (aWon ? 1 : 0),
        losses: sa.losses + (aWon ? 0 : 1),
        roundsFor: sa.roundsFor + series.scoreA,
        roundsAgainst: sa.roundsAgainst + series.scoreB,
      });
      standings.set(b.id, {
        ...sb,
        wins: sb.wins + (aWon ? 0 : 1),
        losses: sb.losses + (aWon ? 1 : 0),
        roundsFor: sb.roundsFor + series.scoreB,
        roundsAgainst: sb.roundsAgainst + series.scoreA,
      });
    }
  }

  return { standings: [...standings.values()].sort(compareStandings), matches };
};

// --- simulateGSL ------------------------------------------------------------

/**
 * Formato GSL (dupla eliminação de 4 times): Opening Matches → Winners + Elimination
 * → Decider. 2 vitórias classifica; 2 derrotas elimina. 2 times avançam.
 *
 * Estrutura clássica (seeds 1..4):
 *  - Opening A: seed1 x seed4   | Opening B: seed2 x seed3
 *  - Winners:  vencedores das aberturas → vencedor AVANÇA (1º)
 *  - Elimination: perdedores das aberturas → perdedor ELIMINADO
 *  - Decider: perdedor do Winners x vencedor do Elimination → vencedor AVANÇA (2º)
 */
export const simulateGSL = (
  teams: readonly TournamentTeam[],
  winProbability: WinProbability,
  bestOf: BestOf,
  rng: Rng = Math.random,
): GslResult => {
  if (teams.length !== 4) {
    throw new Error(`simulateGSL requer exatamente 4 times, recebeu ${teams.length}.`);
  }

  const seeded = [...seedTeams(teams)].sort((a, b) => a.seed - b.seed);
  const [s1, s2, s3, s4] = seeded;
  const matches: TournamentMatch[] = [];
  const stage = 'GSL';

  const play = (a: TournamentTeam, b: TournamentTeam, roundName: string): {
    winner: TournamentTeam; loser: TournamentTeam;
  } => {
    const series = simulateSeries(a, b, winProbability, bestOf, rng);
    matches.push(buildMatch(a, b, series, bestOf, roundName, stage));
    const winner = series.winnerId === a.id ? a : b;
    const loser = series.winnerId === a.id ? b : a;
    return { winner, loser };
  };

  const openingA = play(s1, s4, 'Opening Match');
  const openingB = play(s2, s3, 'Opening Match');

  const winnersMatch = play(openingA.winner, openingB.winner, 'Winners Match');
  const eliminationMatch = play(openingA.loser, openingB.loser, 'Elimination Match');

  const decider = play(winnersMatch.loser, eliminationMatch.winner, 'Decider Match');

  // Avançam: vencedor do Winners (2 vitórias) e vencedor do Decider.
  const advanced: string[] = [winnersMatch.winner.id, decider.winner.id];

  return { advanced, matches };
};

// --- simulateSwiss ----------------------------------------------------------

interface SwissRecord {
  team: TournamentTeam;
  wins: number;
  losses: number;
  roundsFor: number;
  roundsAgainst: number;
  opponents: string[]; // ids já enfrentados (evitar rematch)
}

const ADVANCE_WINS = 3;
const ELIMINATE_LOSSES = 3;

/** Buchholz = soma de (wins - losses) dos oponentes já enfrentados. */
const buchholz = (record: SwissRecord, byId: Map<string, SwissRecord>): number =>
  record.opponents.reduce((acc, oppId) => {
    const opp = byId.get(oppId);
    return opp ? acc + (opp.wins - opp.losses) : acc;
  }, 0);

/**
 * Empareja times do mesmo grupo (mesmo record) topo-vs-base EVITANDO rematch.
 * Backtracking simples sobre uma lista já ordenada (topo→base). Retorna pares
 * [a, b] ou null se impossível (raro com 16 times).
 */
const pairGroup = (
  group: SwissRecord[],
  hasPlayed: (x: SwissRecord, y: SwissRecord) => boolean,
): Array<[SwissRecord, SwissRecord]> | null => {
  if (group.length === 0) return [];
  if (group.length % 2 !== 0) return null; // grupos de record sempre pares no suíço puro

  const used = new Array<boolean>(group.length).fill(false);
  const result: Array<[SwissRecord, SwissRecord]> = [];

  const backtrack = (): boolean => {
    const firstFree = used.indexOf(false);
    if (firstFree === -1) return true;
    used[firstFree] = true;
    const a = group[firstFree];
    // Topo-vs-base: tenta do fim para o começo (oponente mais distante primeiro).
    for (let j = group.length - 1; j > firstFree; j -= 1) {
      if (used[j]) continue;
      const b = group[j];
      if (hasPlayed(a, b)) continue;
      used[j] = true;
      result.push([a, b]);
      if (backtrack()) return true;
      result.pop();
      used[j] = false;
    }
    used[firstFree] = false;
    return false;
  };

  return backtrack() ? result : null;
};

/**
 * Sistema Suíço (16 → 8 avançam / 8 saem) com BUCHHOLZ.
 *  - Empareja times de mesmo record (wins-losses).
 *  - A partir da 3ª rodada, ordena dentro do grupo por Buchholz e empareja
 *    topo-vs-base, evitando rematch (backtracking).
 *  - 3 vitórias classifica; 3 derrotas elimina.
 *  - Jogos 0-0 em Bo1; decisivos (vitória ou eliminação iminente) em Bo3.
 */
export const simulateSwiss = (
  teams: readonly TournamentTeam[],
  winProbability: WinProbability,
  rng: Rng = Math.random,
): SwissResult => {
  if (teams.length !== 16) {
    throw new Error(`simulateSwiss requer exatamente 16 times, recebeu ${teams.length}.`);
  }

  const seeded = [...seedTeams(teams)].sort((a, b) => a.seed - b.seed);
  const records: SwissRecord[] = seeded.map((team) => ({
    team, wins: 0, losses: 0, roundsFor: 0, roundsAgainst: 0, opponents: [],
  }));
  const byId = new Map<string, SwissRecord>(records.map((r) => [r.team.id, r]));

  const matches: TournamentMatch[] = [];
  const advanced: string[] = [];
  const eliminated: string[] = [];
  const stage = 'Swiss';

  const hasPlayed = (x: SwissRecord, y: SwissRecord): boolean =>
    x.opponents.includes(y.team.id);

  let round = 0;
  // Times ainda ativos (não classificados nem eliminados).
  const active = (): SwissRecord[] =>
    records.filter((r) => r.wins < ADVANCE_WINS && r.losses < ELIMINATE_LOSSES);

  while (active().length > 0) {
    round += 1;
    const pool = active();

    // Agrupa por record "W-L".
    const groups = new Map<string, SwissRecord[]>();
    for (const r of pool) {
      const key = `${r.wins}-${r.losses}`;
      const arr = groups.get(key);
      if (arr) arr.push(r);
      else groups.set(key, [r]);
    }

    for (const [, group] of groups) {
      // Ordena: da 3ª rodada em diante por Buchholz desc; antes, por seed asc.
      const sorted = [...group].sort((a, b) => {
        if (round >= 3) {
          const diff = buchholz(b, byId) - buchholz(a, byId);
          if (diff !== 0) return diff;
        }
        return a.team.seed - b.team.seed;
      });

      const pairs = pairGroup(sorted, hasPlayed);
      if (!pairs) {
        throw new Error(`Swiss: impossível emparelhar sem rematch no grupo (rodada ${round}).`);
      }

      for (const [ra, rb] of pairs) {
        // Bo3 quando decisivo para qualquer um dos lados (2 vitórias ou 2 derrotas).
        const decisive =
          ra.wins === ADVANCE_WINS - 1 || ra.losses === ELIMINATE_LOSSES - 1 ||
          rb.wins === ADVANCE_WINS - 1 || rb.losses === ELIMINATE_LOSSES - 1;
        const bestOf: BestOf = decisive ? 3 : 1;

        const series = simulateSeries(ra.team, rb.team, winProbability, bestOf, rng);
        matches.push(buildMatch(ra.team, rb.team, series, bestOf, `Rodada ${round}`, stage));

        const aWon = series.winnerId === ra.team.id;
        ra.opponents.push(rb.team.id);
        rb.opponents.push(ra.team.id);

        ra.roundsFor += series.scoreA;
        ra.roundsAgainst += series.scoreB;
        rb.roundsFor += series.scoreB;
        rb.roundsAgainst += series.scoreA;

        if (aWon) { ra.wins += 1; rb.losses += 1; }
        else { rb.wins += 1; ra.losses += 1; }

        if (ra.wins >= ADVANCE_WINS && !advanced.includes(ra.team.id)) advanced.push(ra.team.id);
        if (rb.wins >= ADVANCE_WINS && !advanced.includes(rb.team.id)) advanced.push(rb.team.id);
        if (ra.losses >= ELIMINATE_LOSSES && !eliminated.includes(ra.team.id)) eliminated.push(ra.team.id);
        if (rb.losses >= ELIMINATE_LOSSES && !eliminated.includes(rb.team.id)) eliminated.push(rb.team.id);
      }
    }

    if (round > 32) throw new Error('Swiss: laço de rodadas não convergiu.');
  }

  const standings: TournamentStanding[] = records
    .map((r) => ({
      teamId: r.team.id,
      wins: r.wins,
      losses: r.losses,
      roundsFor: r.roundsFor,
      roundsAgainst: r.roundsAgainst,
    }))
    .sort(compareStandings);

  return { advanced, eliminated, matches, standings };
};

// --- materializeTournament (FASE 3b — orquestrador de integração) -----------

/** Resultado materializado de um torneio inteiro: jogos + tabela + campeão. */
export interface MaterializedTournament {
  readonly championId: string;
  readonly matches: readonly TournamentMatch[];
  readonly standings: readonly TournamentStanding[];
}

/** Maior potência de 2 que cabe em n (>=2). Ex.: 6→4, 16→16, 3→2. */
const largestPowerOfTwoAtMost = (n: number): number => {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return Math.max(2, p);
};

/** Roda um playoff single-elim entre os classificados (recortados à potência de 2). */
const runPlayoff = (
  qualified: readonly TournamentTeam[],
  winProbability: WinProbability,
  rng: Rng,
): SingleElimResult => {
  const size = largestPowerOfTwoAtMost(qualified.length);
  const seeded = seedTeams(qualified).slice(0, size);
  return simulateSingleElim(seeded, winProbability, 3, rng);
};

/** Encontra os TournamentTeam por id (filtra ausentes). */
const pickByIds = (
  teams: readonly TournamentTeam[],
  ids: readonly string[],
): TournamentTeam[] => ids.map((id) => teams.find((t) => t.id === id)).filter((t): t is TournamentTeam => Boolean(t));

/**
 * Orquestrador de integração (Fase 3b): recebe os participantes com força pré-computada,
 * o formato do motor e RNGs/winProbability injetáveis, e MATERIALIZA o torneio inteiro
 * (jogos + tabela + campeão) reusando os formatos puros. Lida com as restrições de tamanho
 * de cada formato (Swiss=16, GSL=4, single-elim=potência de 2) recortando por força.
 *
 * O campo `mapId` de cada match é preenchido por `pickMapId()` (injeção: o engine não conhece
 * mapas), garantindo que TODO jogo materializado tenha um mapa real (CHAMP-09).
 */
export const materializeTournament = (
  participants: readonly TournamentTeam[],
  engineFormat: TournamentEngineFormat,
  pickMapId: () => string,
  winProbability: WinProbability = defaultWinProbability,
  rng: Rng = Math.random,
): MaterializedTournament | null => {
  if (participants.length < 2) {
    if (participants.length === 1) {
      return { championId: participants[0].id, matches: [], standings: [] };
    }
    return null;
  }

  const seeded = seedTeams(participants);
  let matches: TournamentMatch[] = [];
  let standings: TournamentStanding[] = [];
  let championId: string;

  if (engineFormat === 'swiss' && seeded.length >= 16) {
    const pool = seeded.slice(0, 16);
    const swiss = simulateSwiss(pool, winProbability, rng);
    const playoff = runPlayoff(pickByIds(pool, swiss.advanced), winProbability, rng);
    matches = [...swiss.matches, ...playoff.matches];
    standings = [...swiss.standings];
    championId = playoff.championId;
  } else if (engineFormat === 'gsl' && seeded.length >= 4) {
    // Top-8 em dois grupos GSL de 4 (seeds intercalados) → 4 avançam → playoff single-elim.
    const top = seeded.slice(0, Math.min(8, largestPowerOfTwoAtMost(seeded.length)));
    if (top.length >= 8) {
      const groupA = [top[0], top[3], top[4], top[7]];
      const groupB = [top[1], top[2], top[5], top[6]];
      const gslA = simulateGSL(groupA, winProbability, 3, rng);
      const gslB = simulateGSL(groupB, winProbability, 3, rng);
      const advanced = pickByIds(top, [...gslA.advanced, ...gslB.advanced]);
      const playoff = runPlayoff(advanced, winProbability, rng);
      matches = [...gslA.matches, ...gslB.matches, ...playoff.matches];
      championId = playoff.championId;
    } else {
      // Menos de 8: um único grupo GSL de 4, vencedor do decider é o campeão direto.
      const group = top.slice(0, 4);
      const gsl = simulateGSL(group, winProbability, 3, rng);
      const final = runPlayoff(pickByIds(group, gsl.advanced), winProbability, rng);
      matches = [...gsl.matches, ...final.matches];
      championId = final.championId;
    }
  } else if (engineFormat === 'roundRobin') {
    const rr = simulateRoundRobin(seeded, winProbability, 1, rng);
    const top4 = pickByIds(seeded, rr.standings.slice(0, 4).map((s) => s.teamId));
    const playoff = runPlayoff(top4, winProbability, rng);
    matches = [...rr.matches, ...playoff.matches];
    standings = [...rr.standings];
    championId = playoff.championId;
  } else {
    // singleElim (e fallback de qualquer formato com poucos times).
    const playoff = runPlayoff(seeded, winProbability, rng);
    matches = [...playoff.matches];
    championId = playoff.championId;
  }

  // Carimba um mapa real em cada jogo (CHAMP-09): o engine não conhece mapas, então recebe
  // a função injetada. Imutável: gera novos objetos de match.
  const withMaps: TournamentMatch[] = matches.map((m) => ({ ...m, mapId: pickMapId() }));

  return { championId, matches: withMaps, standings };
};

/** Deriva o formato do motor a partir de id/format quando `engineFormat` não foi definido. */
export const deriveEngineFormat = (
  tournamentId: string,
  format: 'bracket' | 'groups',
): TournamentEngineFormat => {
  if (tournamentId === 'major_mundial') return 'swiss';
  if (tournamentId === 'blast_spring' || tournamentId === 'superliga_global') return 'gsl';
  if (format === 'groups') return 'roundRobin';
  return 'singleElim';
};

// ============================================================================
// --- HELPERS INTERATIVOS (FASE 3b - SIMULAÇÃO PASSO-A-PASSO COM USUÁRIO) ---
// ============================================================================

export interface SwissInteractiveRecord {
  w: number;
  l: number;
  opponents: string[];
}

/**
 * Emparelha os times da rodada suíça interativa (W-L) evitando rematch.
 * Retorna uma lista de pares de ids [timeA, timeB].
 */
export const generateSwissPairs = (
  records: Record<string, SwissInteractiveRecord>,
  teams: readonly TournamentTeam[],
  round: number
): [string, string][] => {
  const internalRecords = Object.entries(records).map(([teamId, rec]) => {
    const team = teams.find(t => t.id === teamId) || { id: teamId, seed: 99, strength: 50 };
    return {
      team,
      wins: rec.w,
      losses: rec.l,
      roundsFor: 0,
      roundsAgainst: 0,
      opponents: rec.opponents
    };
  });
  const byId = new Map<string, typeof internalRecords[0]>(internalRecords.map(r => [r.team.id, r]));
  
  // Filtra times que ainda não classificaram (3 vitórias) e nem foram eliminados (3 derrotas)
  const active = internalRecords.filter(r => r.wins < 3 && r.losses < 3);
  if (active.length === 0) return [];
  
  // Agrupa times por recorde de "V-D"
  const groups = new Map<string, typeof internalRecords[0][]>();
  for (const r of active) {
    const key = `${r.wins}-${r.losses}`;
    const arr = groups.get(key);
    if (arr) arr.push(r);
    else groups.set(key, [r]);
  }
  
  const allPairs: [string, string][] = [];
  const hasPlayed = (x: typeof internalRecords[0], y: typeof internalRecords[0]): boolean =>
    x.opponents.includes(y.team.id);
    
  for (const [, group] of groups) {
    const sorted = [...group].sort((a, b) => {
      if (round >= 2) { // Na rodada 3 em diante, ordena por Buchholz
        const calcBuchholz = (r: typeof internalRecords[0]) =>
          r.opponents.reduce((acc, oppId) => {
            const opp = byId.get(oppId);
            return opp ? acc + (opp.wins - opp.losses) : acc;
          }, 0);
        const diff = calcBuchholz(b) - calcBuchholz(a);
        if (diff !== 0) return diff;
      }
      return a.team.seed - b.team.seed;
    });
    
    const pairs = pairGroup(sorted, hasPlayed);
    if (!pairs) {
      // Fallback robusto se emparelhamento ideal falhar (rematches inevitáveis)
      const used = new Set<string>();
      for (let i = 0; i < sorted.length; i++) {
        if (used.has(sorted[i].team.id)) continue;
        for (let j = i + 1; j < sorted.length; j++) {
          if (used.has(sorted[j].team.id)) continue;
          allPairs.push([sorted[i].team.id, sorted[j].team.id]);
          used.add(sorted[i].team.id);
          used.add(sorted[j].team.id);
          break;
        }
      }
    } else {
      pairs.forEach(([a, b]) => {
        allPairs.push([a.team.id, b.team.id]);
      });
    }
  }
  
  return allPairs;
};

/**
 * Divide uma lista de timeIds em grupos de 4 times para o formato GSL ou Round Robin,
 * intercalando seeds para garantir grupos equilibrados.
 */
export const distributeIntoGroups = (
  teamIds: string[],
  groupCount: number
): string[][] => {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  teamIds.forEach((id, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(id);
  });
  return groups;
};

/**
 * Retorna os confrontos de um grupo GSL de 4 times com base nas partidas já realizadas.
 * Rodada 0: Opening Matches (Seed 1 v Seed 4, Seed 2 v Seed 3)
 * Rodada 1: Winners Match (Vencedores R0) + Elimination Match (Perdedores R0)
 * Rodada 2: Decider Match (Perdedor Winners v Vencedor Elimination)
 */
export const getGslGroupRoundMatches = (
  teamIds: string[],
  completedMatches: { teamAId: string; teamBId: string; winnerId: string }[]
): [string, string][] => {
  if (teamIds.length < 4) return [];
  
  if (completedMatches.length === 0) {
    // Rodada 0: Aberturas
    return [
      [teamIds[0], teamIds[3]], // Seed 1 v Seed 4
      [teamIds[1], teamIds[2]]  // Seed 2 v Seed 3
    ];
  }
  
  if (completedMatches.length === 2) {
    // Rodada 1: Winners e Elimination
    const m1 = completedMatches[0];
    const m2 = completedMatches[1];
    
    const w1 = m1.winnerId;
    const l1 = m1.winnerId === m1.teamAId ? m1.teamBId : m1.teamAId;
    
    const w2 = m2.winnerId;
    const l2 = m2.winnerId === m2.teamAId ? m2.teamBId : m2.teamAId;
    
    return [
      [w1, w2], // Winners Match
      [l1, l2]  // Elimination Match
    ];
  }
  
  if (completedMatches.length === 4) {
    // Rodada 2: Decider Match
    const winnersMatch = completedMatches[2];
    const eliminationMatch = completedMatches[3];
    
    const deciderL = winnersMatch.winnerId === winnersMatch.teamAId ? winnersMatch.teamBId : winnersMatch.teamAId; // Perdedor do Winners
    const deciderW = eliminationMatch.winnerId; // Vencedor do Elimination
    
    return [
      [deciderL, deciderW]
    ];
  }
  
  return [];
};

/**
 * Retorna os confrontos de um grupo Round Robin de 4 times com base na rodada.
 * Rodada 0: 1 v 4, 2 v 3
 * Rodada 1: 1 v 3, 4 v 2
 * Rodada 2: 1 v 2, 3 v 4
 */
export const getRoundRobinRoundMatches = (
  teamIds: string[],
  round: number
): [string, string][] => {
  if (teamIds.length < 4) return [];
  
  if (round === 0) {
    return [
      [teamIds[0], teamIds[3]],
      [teamIds[1], teamIds[2]]
    ];
  }
  if (round === 1) {
    return [
      [teamIds[0], teamIds[2]],
      [teamIds[3], teamIds[1]]
    ];
  }
  if (round === 2) {
    return [
      [teamIds[0], teamIds[1]],
      [teamIds[2], teamIds[3]]
    ];
  }
  
  return [];
};

