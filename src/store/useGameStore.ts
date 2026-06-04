import { create } from 'zustand';
import { Match, Player, SaveGame, Sponsor, Staff, Team, Tournament, GameMap, NewsItem, SeasonSummary, SeasonChampionSnapshot, SeasonHistoryEntry, Toast, ToastType, NegotiationResult } from '../types';
import { realPlayers } from '../game/data/realPlayers';
import { realTeams } from '../game/data/realTeams';
import { realMaps } from '../game/data/realMaps';
import { defaultSponsors } from '../game/data/defaultSponsors';
import { defaultCompetitions } from '../game/data/defaultCompetitions';
import { generatePlayer, computePlayerValue } from '../game/generators/playerGenerator';
import { generateMatchNews, generateTransferNews } from '../game/generators/newsGenerator';
import { simulateMapVeto } from '../game/simulation/mapVetoSimulator';
import { simulateWholeMatchQuick, computeTeamMod } from '../game/simulation/matchSimulator';
import { materializeTournament, deriveEngineFormat, defaultWinProbability, type TournamentTeam } from '../game/simulation/tournamentEngine';
import type { TournamentMatch, TournamentStanding, TournamentEngineFormat } from '../types';
import { processarUmaSemana, processarFimTemporada, resolverProgressoTorneioInterativo } from '../game/simulation/seasonEngine';

// Base/Scout: custo de cada rodada de investimento na base (observação de jovens talentos).
const INVESTIMENTO_BASE_CUSTO = 30000;

// Resultado da coroação de um campeão de IA: o time premiado (cópia imutável) + a notícia +
// os jogos/tabela MATERIALIZADOS pelo motor de campeonatos (Fase 3b — CHAMP-01/02).
interface AiChampionOutcome {
  readonly championId: string;
  readonly championTeam: Team;
  readonly news: NewsItem;
  readonly matches: readonly TournamentMatch[];
  readonly standings: readonly TournamentStanding[];
}

/**
 * Força de combate de um time para o motor de campeonatos (Fase 3b): overall médio dos titulares
 * × computeTeamMod (mapa/forma/moral/tática/IGL). Espelha o critério de `simulateAiWeeklyMatches`.
 * Times sem titulares recebem força mínima (1) para não quebrar a probabilidade por razão.
 */
const computeTournamentStrength = (
  team: Team,
  players: Record<string, Player>,
  map: GameMap
): number => {
  const starters = Object.values(players).filter((p) => p.teamId === team.id && p.status === 'titular');
  if (starters.length === 0) return 1;
  const avgOverall = starters.reduce((acc, p) => acc + p.overall, 0) / starters.length;
  return Math.max(1, computeTeamMod(team, starters, map) * avgOverall);
};

/** Constrói os participantes (TournamentTeam) do motor a partir dos teamIds do torneio. */
const buildTournamentTeams = (
  teamIds: readonly string[],
  teams: Record<string, Team>,
  players: Record<string, Player>,
  map: GameMap,
  excludeTeamId: string | null
): TournamentTeam[] =>
  teamIds
    .filter((id) => id !== excludeTeamId && teams[id])
    .map((id, index) => ({ id, seed: index + 1, strength: computeTournamentStrength(teams[id], players, map) }));

/** Nome da fase do bracket do usuário a partir de quantos times restam na rodada. */
const userRoundName = (teamsInRound: number): string => {
  switch (teamsInRound) {
    case 2: return 'Final';
    case 4: return 'Semifinal';
    case 8: return 'Quartas de Final';
    case 16: return 'Oitavas de Final';
    case 32: return 'Rodada de 32';
    default: return `Rodada de ${teamsInRound}`;
  }
};

/** Sorteia o id de um mapa ativo (fallback: primeiro mapa). Usado para carimbar matches. */
const makeActiveMapPicker = (): (() => string) => {
  const active = realMaps.filter((m) => m.status === 'active');
  const pool = active.length > 0 ? active : realMaps;
  return () => pool[Math.floor(Math.random() * pool.length)].id;
};

/**
 * Coroa um campeão de IA para um torneio em que o usuário NÃO venceu (foi eliminado ou
 * o torneio é de fundo). MATERIALIZA o torneio inteiro via tournamentEngine (jogos + tabela +
 * campeão real), premia o campeão (budget/points/stats.titles) de forma imutável e devolve a
 * notícia + os jogos/tabela para anexar ao Tournament (Fase 3b).
 *
 * @param tournament   Torneio a resolver.
 * @param teams        Mapa atual de times (não é mutado).
 * @param players      Mapa atual de jogadores (não é mutado).
 * @param excludeTeamId Time a excluir do bracket de IA (tipicamente o usuário já resolvido).
 * @param map          Mapa usado para modular o poder dos confrontos.
 * @param currentWeek  Semana atual (para a notícia).
 * @returns Outcome com o campeão de IA, ou null se não houver times de IA elegíveis.
 */
const crownAiChampion = (
  tournament: Tournament,
  teams: Record<string, Team>,
  players: Record<string, Player>,
  excludeTeamId: string | null,
  map: GameMap,
  currentWeek: number
): AiChampionOutcome | null => {
  const participants = buildTournamentTeams(tournament.teamIds, teams, players, map, excludeTeamId);
  if (participants.length === 0) return null;

  const engineFormat = tournament.engineFormat ?? deriveEngineFormat(tournament.id, tournament.format);
  const materialized = materializeTournament(participants, engineFormat, makeActiveMapPicker(), defaultWinProbability);
  if (!materialized || !teams[materialized.championId]) return null;

  const championId = materialized.championId;
  const champTeam = teams[championId];
  const championTeam: Team = {
    ...champTeam,
    budget: champTeam.budget + tournament.prizePool,
    points: champTeam.points + Math.round(150 * EVENT_WEIGHT[tournament.tier]), // F4: título de S-Tier rende mais ranking
    // Conquistar o bracket também conta como vitórias (antes só somava títulos, deixando a
    // coluna de vitórias das IAs zerada para sempre — bug C do relatório).
    stats: { ...champTeam.stats, titles: champTeam.stats.titles + 1, wins: champTeam.stats.wins + 1 },
  };

  const news: NewsItem = {
    id: `champ_ai_${tournament.id}_${currentWeek}`,
    title: `${champTeam.name} conquista o ${tournament.name}!`,
    content: `O ${champTeam.name} superou os adversários no bracket e levantou a taça do ${tournament.name}, faturando $${tournament.prizePool.toLocaleString()} em premiação. Um novo nome entra para a história da competição.`,
    category: 'results',
    week: currentWeek,
    dateStr: `Semana ${currentWeek}`,
  };

  return { championId, championTeam, news, matches: materialized.matches, standings: materialized.standings };
};

// Pontos por resultado de uma partida de fundo (amistoso/liga paralela). Valem METADE de um
// confronto de torneio do usuário (±50/−20), para manter o ranking VIVO sem fazer a IA
// disparar irrealisticamente à frente do progresso do jogador.
const AI_WEEKLY_WIN_POINTS = 25;
const AI_WEEKLY_LOSS_POINTS = 10;

/**
 * Simula uma rodada SEMANAL de partidas de fundo entre as IAs (bug C do relatório: sem isto o
 * ranking mundial fica congelado entre as poucas viradas de torneio). Emparelha times de IA do
 * MESMO tier (realismo de divisão) e decide cada confronto por probabilidade derivada da força
 * (computeTeamMod × overall médio dos titulares), atualizando points/stats/recentForm de AMBOS
 * de forma imutável. Barata: não roda round-a-round, só uma decisão probabilística por par.
 *
 * Função pura: não muta `teams`/`players`. Retorna apenas os times alterados (merge no chamador).
 */
const simulateAiWeeklyMatches = (
  teams: Record<string, Team>,
  players: Record<string, Player>,
  map: GameMap,
  excludeTeamId: string
): Record<string, Team> => {
  const startersOf = (teamId: string): Player[] =>
    Object.values(players).filter((p) => p.teamId === teamId && p.status === 'titular');

  // Times de IA aptos a jogar (têm titulares), agrupados por tier para confrontos coerentes.
  const byTier = new Map<Team['tier'], Team[]>();
  Object.values(teams).forEach((t) => {
    if (t.id === excludeTeamId || t.id === 'free_agents') return;
    if (startersOf(t.id).length === 0) return;
    const bucket = byTier.get(t.tier) ?? [];
    bucket.push(t);
    byTier.set(t.tier, bucket);
  });

  const updates: Record<string, Team> = {};
  const avgOverall = (squad: Player[]): number =>
    squad.length > 0 ? squad.reduce((acc, p) => acc + p.overall, 0) / squad.length : 50;
  const pushForm = (form: Team['stats']['recentForm'], r: 'W' | 'L'): Team['stats']['recentForm'] =>
    [...form, r].slice(-10);

  byTier.forEach((group) => {
    // Embaralha (Fisher–Yates) e emparelha consecutivos; um time ímpar folga na semana.
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const teamA = shuffled[i];
      const teamB = shuffled[i + 1];
      const squadA = startersOf(teamA.id);
      const squadB = startersOf(teamB.id);
      const strengthA = computeTeamMod(teamA, squadA, map) * avgOverall(squadA);
      const strengthB = computeTeamMod(teamB, squadB, map) * avgOverall(squadB);
      const probA = strengthA / (strengthA + strengthB);
      const aWon = Math.random() < probA;

      const winner = aWon ? teamA : teamB;
      const loser = aWon ? teamB : teamA;
      updates[winner.id] = {
        ...winner,
        points: winner.points + AI_WEEKLY_WIN_POINTS,
        stats: { ...winner.stats, wins: winner.stats.wins + 1, recentForm: pushForm(winner.stats.recentForm, 'W') },
      };
      updates[loser.id] = {
        ...loser,
        points: Math.max(10, loser.points - AI_WEEKLY_LOSS_POINTS),
        stats: { ...loser.stats, losses: loser.stats.losses + 1, recentForm: pushForm(loser.stats.recentForm, 'L') },
      };
    }
  });

  return updates;
};

// Faixas de overall por tier para gerar jogadores coerentes ao nível do time (reposição de elenco).
const overallRangeByTier: Record<Team['tier'], { min: number; max: number }> = {
  1: { min: 76, max: 88 },
  2: { min: 70, max: 80 },
  3: { min: 63, max: 74 },
  4: { min: 55, max: 67 },
};

// Roles que uma line saudável de CS deve cobrir (F2). Usadas para recompor a IA mantendo uma
// composição coerente: ao gerar substitutos, prioriza cobrir essas funções ainda ausentes.
const ESSENTIAL_ROLES: readonly Player['role'][] = ['IGL', 'AWPer', 'Entry Fragger', 'Support'] as const;

/**
 * Garante que `team` tenha 5 TITULARES, de forma IMUTÁVEL (F1) e CONSCIENTE DE ROLE (F2: ao
 * perder um jogador, o time repõe a MESMA função — ex.: tirou o AWPer, entra outro AWPer).
 *  - `lostRole`: função do jogador que acabou de sair (reposição fiel: reserva da role → senão gera da role).
 *  - vagas restantes: promove os melhores reservas; sem reservas, gera cobrindo as ESSENTIAL_ROLES ausentes.
 * Retorna um NOVO Record de players (só altera os afetados); se já há 5+, devolve o mesmo objeto.
 */
const ensureFiveStarters = (
  players: Record<string, Player>,
  team: Team,
  lostRole?: Player['role']
): Record<string, Player> => {
  const titulares = Object.values(players).filter((p) => p.teamId === team.id && p.status === 'titular');
  let faltam = 5 - titulares.length;
  if (faltam <= 0) return players;

  const updated = { ...players };
  const range = overallRangeByTier[team.tier];
  const bestReserves = (): Player[] =>
    Object.values(updated)
      .filter((p) => p.teamId === team.id && p.status === 'reserva')
      .sort((a, b) => b.overall - a.overall);
  const gen = (role?: Player['role']): void => {
    const generated = generatePlayer({ minOverall: range.min, maxOverall: range.max, teamId: team.id, forceRole: role });
    generated.status = 'titular';
    updated[generated.id] = generated;
  };

  // 1) Reposição FIEL da role perdida: reserva da mesma role, senão gera um jogador dessa role.
  if (lostRole && faltam > 0) {
    const sameRole = bestReserves().find((r) => r.role === lostRole);
    if (sameRole) updated[sameRole.id] = { ...sameRole, status: 'titular' };
    else gen(lostRole);
    faltam -= 1;
  }

  // 2) Completa até 5: promove os melhores reservas; sem reservas, gera cobrindo roles essenciais ausentes.
  while (faltam > 0) {
    const reservas = bestReserves();
    if (reservas.length > 0) {
      updated[reservas[0].id] = { ...reservas[0], status: 'titular' };
    } else {
      const cobertas = new Set(
        Object.values(updated).filter((p) => p.teamId === team.id && p.status === 'titular').map((p) => p.role)
      );
      gen(ESSENTIAL_ROLES.find((r) => !cobertas.has(r)) ?? 'Rifler');
    }
    faltam -= 1;
  }
  return updated;
};

/**
 * Recompõe os participantes elegíveis de um torneio com base no tier dos times, garantindo
 * sempre a vaga do time do usuário no torneio do seu tier (senão ele nunca jogaria).
 *
 * Função pura: não muta `teams` nem o `tournament`. Reusada na criação da carreira
 * (`iniciarCarreira`) e na virada de temporada (após promoção/rebaixamento de tier), para
 * que a mudança de divisão do usuário se reflita imediatamente nas vagas dos torneios.
 *
 * Critério de elegibilidade: time do mesmo tier do torneio; no tier 1 (Elite), também os de
 * tier 2 (Challenger) podem disputar. Limita a 16 vagas no Major Mundial e 8 nos demais.
 *
 * @param tournament    Torneio-alvo (somente leitura).
 * @param teams         Mapa atual de times (não é mutado).
 * @param userTeamId    Id do time do usuário (terá vaga garantida se elegível).
 * @returns Lista de teamIds elegíveis para o torneio.
 */
// Região competitiva canônica (F4: VRS-lite). Mapeia os valores livres de Team.region para os
// três grandes circuitos do CS — Europa (inclui CIS), Américas (NA+SA), Ásia (inclui Oceania).
export type CompetitiveRegion = 'EU' | 'AM' | 'AS';
export const canonicalRegion = (region: string): CompetitiveRegion => {
  if (/europa|europe|cis/i.test(region)) return 'EU';
  if (/[áa]sia|pac[íi]f|oceania/i.test(region)) return 'AS';
  return 'AM'; // América do Sul/Norte e qualquer outro
};

// Cotas regionais do Major (16 vagas), espelhando a alocação por região do CS real (EU domina).
const MAJOR_REGION_QUOTA: Record<CompetitiveRegion, number> = { EU: 7, AM: 6, AS: 3 };

// Event Weight por tier de torneio (F4): pontos de ranking ganhos escalam com o prestígio do
// evento (tier 1 = S-Tier vale muito mais que tier 4 = base). Espelha o Event Weight do VRS real.
const EVENT_WEIGHT: Record<Team['tier'], number> = { 1: 1.5, 2: 1.0, 3: 0.6, 4: 0.35 };

/**
 * Define os participantes de um torneio por MÉRITO (F4): em vez de um slice arbitrário, ordena
 * os times elegíveis (mesmo tier; o Major tier 1 aceita tier ≤ 2) por `points` (ranking) e
 * convida os melhores. O Major respeita COTAS REGIONAIS (EU/AM/AS). O usuário tem vaga garantida
 * apenas nos torneios do SEU tier (no seu nível ele sempre compete); torneios de tier superior
 * (ex.: o Major) exigem CLASSIFICAÇÃO por ranking — é o que dá sentido a "ser convidado por mérito".
 * Função pura: não muta `teams` nem o torneio.
 */
export const computeTournamentTeamIds = (
  tournament: Pick<Tournament, 'id' | 'tier'>,
  teams: Record<string, Team>,
  userTeamId: string
): string[] => {
  const userTier = teams[userTeamId]?.tier;
  const eligible = Object.values(teams)
    .filter((t) => t.id !== 'free_agents' && (t.tier === tournament.tier || (tournament.tier === 1 && t.tier <= 2)))
    .sort((a, b) => b.points - a.points); // mérito: maior ranking primeiro

  const isMajor = tournament.id === 'major_mundial';
  const limit = isMajor ? 16 : 8;

  let selected: string[];
  if (isMajor) {
    const picked = new Set<string>();
    const byRegion: Record<CompetitiveRegion, Team[]> = { EU: [], AM: [], AS: [] };
    eligible.forEach((t) => byRegion[canonicalRegion(t.region)].push(t));
    (['EU', 'AM', 'AS'] as const).forEach((reg) => {
      byRegion[reg].slice(0, MAJOR_REGION_QUOTA[reg]).forEach((t) => picked.add(t.id));
    });
    // Completa as vagas que sobraram (região sem times suficientes) com os melhores globais.
    for (const t of eligible) { if (picked.size >= limit) break; picked.add(t.id); }
    selected = [...picked].slice(0, limit);
  } else {
    selected = eligible.slice(0, limit).map((t) => t.id);
  }

  // Vaga garantida do usuário SOMENTE no(s) torneio(s) do seu próprio tier.
  if (userTier === tournament.tier && teams[userTeamId] && !selected.includes(userTeamId)) {
    selected[selected.length - 1] = userTeamId;
  }
  return selected;
};

/**
 * Normaliza os torneios de um save (Fase 3b — fallback p/ saves antigos): garante `matches`
 * como array, `engineFormat` derivado quando ausente e mantém `standings`/`userOpponents`
 * opcionais. Imutável: devolve um novo Record.
 */
const normalizeTournaments = (
  tournaments: Record<string, Tournament>
): Record<string, Tournament> => {
  const out: Record<string, Tournament> = {};
  Object.entries(tournaments ?? {}).forEach(([id, t]) => {
    out[id] = {
      ...t,
      matches: t.matches ?? [],
      engineFormat: t.engineFormat ?? deriveEngineFormat(t.id, t.format),
      standings: t.standings ?? [],
    };
  });
  return out;
};

// ===== NEGOCIAÇÃO DE TRANSFERÊNCIAS =====
// Resultado puro da avaliação de interesse (sem efeitos colaterais nem checagem de caixa).
interface NegotiationEvaluation {
  readonly status: import('../types').NegotiationStatus;
  readonly contraproposta?: import('../types').NegotiationCounter;
}

/**
 * Avalia o interesse do jogador/clube vendedor numa oferta de contratação.
 *
 * Heurística (0..1, quanto maior, mais atraente a oferta):
 *  - valorScore: passe oferecido vs valor de mercado (peso maior — é o que o clube vendedor
 *    mais pesa). Free agents não têm passe, então o valor exigido é simbólico.
 *  - salarioScore: salário oferecido vs salário atual (o jogador quer manter/melhorar ganhos).
 *  - reputacaoScore: reputação do time do usuário torna o destino mais desejável.
 *
 * Decisão:
 *  - score >= 1.0  → aceita
 *  - score >= 0.75 → contraproposta (devolve valor/salário-alvo que destravariam o acordo)
 *  - score <  0.75 → recusada
 *
 * @param player          Jogador-alvo (não é mutado).
 * @param sellerTeam      Time vendedor, ou null para agente livre.
 * @param userReputation  Reputação do time do usuário (0-100).
 * @param valorOferta     Passe oferecido ($).
 * @param salarioOferta   Salário semanal oferecido ($).
 */
const evaluateNegotiation = (
  player: Player,
  sellerTeam: Team | null,
  userReputation: number,
  valorOferta: number,
  salarioOferta: number
): NegotiationEvaluation => {
  const isFreeAgent = sellerTeam === null;

  // Valor de referência do passe. Agentes livres não exigem passe alto — apenas luvas simbólicas.
  const referenceValue = isFreeAgent ? Math.max(1, Math.round(player.value * 0.15)) : Math.max(1, player.value);
  const valorScore = Math.min(1.5, valorOferta / referenceValue);

  // Salário de referência: jogador quer pelo menos manter o salário atual.
  const referenceSalary = Math.max(1, player.salary);
  const salarioScore = Math.min(1.5, salarioOferta / referenceSalary);

  // Reputação: 0..100 → 0..0.2 de bônus. Times grandes atraem mais facilmente.
  const reputacaoScore = (userReputation / 100) * 0.2;

  // Resistência do clube vendedor: quanto melhor o jogador para ele, mais difícil liberar.
  // (free agent não tem clube, então sem resistência).
  const sellerResistance = isFreeAgent ? 0 : Math.min(0.15, (player.overall / 100) * 0.15);

  // Score composto: valor pesa 60%, salário 40%, + bônus de reputação − resistência do clube.
  const score = valorScore * 0.6 + salarioScore * 0.4 + reputacaoScore - sellerResistance;

  if (score >= 1.0) {
    return { status: 'aceita' };
  }

  if (score >= 0.75) {
    // Contraproposta: pede o que destravaria o acordo (valor de mercado cheio + 5%, salário atual + 10%).
    const valorAlvo = Math.round((isFreeAgent ? referenceValue : player.value) * 1.05);
    const salarioAlvo = Math.round(player.salary * 1.1);
    return {
      status: 'contraproposta',
      contraproposta: {
        // Nunca pede menos do que já foi oferecido (evita contraproposta "para baixo").
        valor: Math.max(valorAlvo, valorOferta),
        salario: Math.max(salarioAlvo, salarioOferta),
      },
    };
  }

  return { status: 'recusada' };
};

interface GameState {
  // Dados salváveis
  managerName: string;
  managerNationality: string;
  currentWeek: number;
  currentSeason: number;
  userTeamId: string;
  difficulty: 'facil' | 'normal' | 'dificil' | 'hardcore';
  teams: Record<string, Team>;
  players: Record<string, Player>;
  maps: Record<string, GameMap>;
  sponsors: Record<string, Sponsor>;
  staffList: Record<string, Staff>;
  tournaments: Record<string, Tournament>;
  historyNews: import('../types').NewsItem[];
  financialHistory: SaveGame['financialHistory'];
  trainingPlan: { intensity: 'leve' | 'normal' | 'pesada' | 'bootcamp'; focus: string };
  youthProspects: Player[]; // Base/Scout: jovens observados aguardando promoção
  historicoTemporadas: SeasonHistoryEntry[]; // Histórico permanente de temporadas encerradas
  invitations: import('../types').TournamentInvitation[];
  isFixedTeam: boolean;

  // Estados locais UI / Sessão
  currentScreen: string;
  selectedPlayerId: string | null;
  selectedTeamId: string | null;
  activeTournamentId: string | null;
  activeMatch: Match | null;
  activeSeries: import('../types').ActiveSeries | null;
  finishedMatch: Match | null; // Partida recém-concluída, exibida na tela de resultado
  activeMatchRoundIndex: number;
  isSimulatingMatch: boolean;
  gameLoaded: boolean;
  seasonSummary: SeasonSummary | null; // Snapshot da temporada encerrada (UI transiente, não salvo)
  toasts: Toast[]; // Notificações in-app (UI transiente, não salvo)

  // Ações
  iniciarCarreira: (
    managerName: string,
    managerNationality: string,
    teamId: string,
    difficulty: 'facil' | 'normal' | 'dificil' | 'hardcore',
    customTeamData?: { name: string; tag: string; colorPrimary: string; colorSecondary: string }
  ) => void;
  avancarSemana: () => void;
  avancarAtePartida: () => void; // Avança semanas em sequência até abrir a próxima partida do usuário
  avancarAposPartida: () => void;
  encerrarTemporada: () => void;
  definirTitular: (playerId: string, status: 'titular' | 'reserva') => void;
  definirPapelEspecial: (playerId: string, roleType: 'IGL' | 'AWPer' | 'Rifler') => void;
  definirTaticas: (tactics: Team['tactics']) => void;
  definirTreinoSemanal: (intensity: 'leve' | 'normal' | 'pesada' | 'bootcamp', focus: string) => { success: boolean; message: string };
  fazerPropostaContratacao: (playerId: string) => { success: boolean; message: string };
  negociarContratacao: (playerId: string, valorOferta: number, salarioOferta: number, forcarAceite?: boolean) => NegotiationResult;
  venderJogador: (playerId: string) => { success: boolean; message: string };
  renovarContrato: (playerId: string) => { success: boolean; message: string };
  dispensarJogador: (playerId: string) => { success: boolean; message: string };
  assinarPatrocinio: (sponsorId: string) => { success: boolean; message: string };
  rescindirPatrocinio: () => { success: boolean; message: string };
  renegociarPatrocinio: () => { success: boolean; message: string };
  contratarStaff: (staff: Staff) => { success: boolean; message: string };
  demitirStaff: (role: Staff['role']) => { success: boolean; message: string };
  investirNaBase: () => { success: boolean; message: string };
  promoverJovem: (playerId: string) => { success: boolean; message: string };
  editarJogador: (playerId: string, patch: Partial<Player>) => void;
  editarTimeLogo: (teamId: string, logoUrl: string) => void;
  setScreen: (screen: string) => void;
  setSelectedPlayerId: (id: string | null) => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setSelectedTeamId: (id: string | null) => void;
  setActiveTournamentId: (id: string | null) => void;
  obterProximoAdversario: (tournamentId: string) => Team | undefined;
  
  // Ações de Partida
  iniciarPartidaAtiva: (match: Match) => void;
  iniciarPartidaContra: (opponentId: string, competitionId?: string) => boolean; // Gera partida e abre o pré-jogo
  assistirPartida: () => void;       // Do pré-jogo: assiste round a round
  avancarRoundVisual: () => boolean; // Avança o round visual na simulação interativa
  finalizarPartidaAtiva: () => void;
  fecharResultado: () => void;       // Fecha a tela de resultado e volta ao painel
  iniciarProximaTemporada: () => void; // Fecha o resumo de temporada e volta ao painel

  // Persistência
  salvarJogo: (slot?: string) => void;
  carregarJogo: (slot?: string) => boolean;
  exportarSave: () => string;
  importarSave: (jsonStr: string) => boolean;
  excluirSave: (slot?: string) => void;
  resetarDadosEditor: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  managerName: '',
  managerNationality: '',
  currentWeek: 1,
  currentSeason: 1,
  userTeamId: '',
  difficulty: 'normal',
  teams: {},
  players: {},
  maps: {},
  sponsors: {},
  staffList: {},
  tournaments: {},
  historyNews: [],
  financialHistory: [],
  trainingPlan: { intensity: 'normal', focus: 'aim' },
  youthProspects: [],
  historicoTemporadas: [],
  invitations: [],
  isFixedTeam: false,

  currentScreen: 'home',
  selectedPlayerId: null,
  selectedTeamId: null,
  activeTournamentId: null,
  activeMatch: null,
  activeSeries: null,
  finishedMatch: null,
  activeMatchRoundIndex: 0,
  isSimulatingMatch: false,
  gameLoaded: false,
  seasonSummary: null,
  toasts: [],

  iniciarCarreira: (managerName, managerNationality, teamId, difficulty, customTeamData) => {
    // Carrega dados iniciais novos
    const teamsData = JSON.parse(JSON.stringify(realTeams)) as Record<string, Team>;
    const playersData = {} as Record<string, Player>;

    // Mapeia jogadores reais
    realPlayers.forEach((p) => {
      playersData[p.id] = JSON.parse(JSON.stringify(p));
    });

    let finalUserTeamId = teamId;

    // Se o jogador estiver criando uma organização própria
    if (teamId === 'custom' && customTeamData) {
      finalUserTeamId = 'custom_team';
      teamsData[finalUserTeamId] = {
        id: finalUserTeamId,
        name: customTeamData.name,
        tag: customTeamData.tag,
        country: 'Brasil',
        region: 'América do Sul',
        tier: 4,
        points: 50,
        reputation: 50,
        budget: 0, // Será ajustado pela dificuldade
        colorPrimary: customTeamData.colorPrimary,
        colorSecondary: customTeamData.colorSecondary,
        isUser: true,
        tactics: {
          playstyle: 'balanced',
          tempo: 'normal',
          focus: 'default',
          utilityUsage: 'medium',
          economyStyle: 'balanced',
        },
        mapMastery: {
          de_mirage: 50, de_nuke: 50, de_inferno: 50, de_dust2: 50, de_ancient: 50, de_anubis: 50, de_overpass: 50
        },
        stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
        staff: {},
      };

      // Gera 5 jogadores iniciais aleatórios para o time customizado
      for (let i = 0; i < 5; i++) {
        const newP = generatePlayer({ minOverall: 60, maxOverall: 70, teamId: finalUserTeamId, forceNationality: 'Brasil' });
        newP.status = 'titular';
        playersData[newP.id] = newP;
      }
    } else {
      // Marca o time existente escolhido como controlado pelo usuário
      if (teamsData[teamId]) {
        teamsData[teamId].isUser = true;
      }
    }

    // Ajusta o orçamento inicial do time do usuário baseado na dificuldade
    let startingBudget = 500000;
    if (difficulty === 'facil') startingBudget = 1000000;
    else if (difficulty === 'dificil') startingBudget = 250000;
    else if (difficulty === 'hardcore') startingBudget = 100000;

    if (teamsData[finalUserTeamId]) {
      teamsData[finalUserTeamId].budget = startingBudget;
    }

    // Garante que TODO time tenha pelo menos 5 titulares (spec §6.1/§8). Sem isso, ~60 times
    // ficam sem elenco e a simulação quebra. Reutiliza o helper ensureFiveStarters (DRY) que
    // promove reservas e gera por tier; aqui aplicamos o resultado in-place (estado pré-set).
    Object.values(teamsData).forEach((team) => {
      const filled = ensureFiveStarters(playersData, team);
      if (filled !== playersData) {
        Object.keys(filled).forEach((id) => { playersData[id] = filled[id]; });
      }
    });

    // Configura patrocinadores
    const sponsorsData = {} as Record<string, Sponsor>;
    defaultSponsors.forEach((s) => { sponsorsData[s.id] = s; });

    // Configura campeonatos
    const tournamentsData = {} as Record<string, Tournament>;
    defaultCompetitions.forEach((t) => {
      const copyT = JSON.parse(JSON.stringify(t)) as Tournament;
      // Preenche os participantes elegíveis pelo tier, garantindo a vaga do usuário.
      copyT.teamIds = computeTournamentTeamIds(t, teamsData, finalUserTeamId);
      // Fase 3b: define o formato real do motor (Swiss/GSL/RR/single-elim) por id/format.
      copyT.engineFormat = deriveEngineFormat(t.id, t.format);
      tournamentsData[t.id] = copyT;
    });

    const mapsData = {} as Record<string, typeof realMaps[0]>;
    realMaps.forEach(m => { mapsData[m.id] = m; });

    set({
      managerName,
      managerNationality,
      currentWeek: 1,
      currentSeason: 1,
      userTeamId: finalUserTeamId,
      difficulty,
      teams: teamsData,
      players: playersData,
      maps: mapsData,
      sponsors: sponsorsData,
      tournaments: tournamentsData,
      historyNews: [
        {
          id: 'welcome',
          title: `BEM-VINDO AO PROSTRIKE: ${managerName} assume o comando técnico do ${teamsData[finalUserTeamId]?.name}!`,
          content: `Foi anunciado oficialmente hoje que ${managerName} é o novo manager e coach do ${teamsData[finalUserTeamId]?.name}. Com o objetivo ambicioso de reestruturar a economia, treinar os novos jogadores e subir de divisão rumo aos Majors de Elite, o novo treinador assinou um contrato e já inicia as atividades de treino nesta semana. A torcida expressa grande expectativa de mudança!`,
          category: 'general',
          week: 1,
          dateStr: 'Semana 1',
        },
      ],
      financialHistory: [{ week: 1, description: 'Orçamento Inicial', amount: startingBudget }],
      youthProspects: [],
      historicoTemporadas: [],
      currentScreen: 'dashboard',
      gameLoaded: true,
    });

    get().salvarJogo();
  },

  obterProximoAdversario: (tournamentId) => {
    const { tournaments, userTeamId, teams, players } = get();
    const t = tournaments[tournamentId];
    if (!t) return undefined;

    const opponents = t.teamIds.filter(id => id !== userTeamId && teams[id]);
    if (opponents.length === 0) return undefined;

    let userOpponents = t.userOpponents;
    if (!userOpponents || userOpponents.length === 0) {
      const mapNeutral = realMaps[0];
      const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, t.teamIds.length))));
      const ranked = [...opponents].sort(
        (a, b) =>
          computeTournamentStrength(teams[a], players, mapNeutral) -
          computeTournamentStrength(teams[b], players, mapNeutral)
      );
      userOpponents = ranked.slice(0, Math.max(1, Math.min(totalRounds, ranked.length)));
    }

    const round = t.currentRound;
    const oppId = userOpponents[Math.min(round, userOpponents.length - 1)];
    return teams[oppId];
  },

  avancarSemana: () => {
    const { currentWeek, userTeamId, teams, players, tournaments, historyNews, financialHistory, currentSeason, trainingPlan, historicoTemporadas } = get();

    // Bloqueia avanço se o usuário não tiver exatamente 5 titulares escalados
    const userStarters = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
    if (userStarters.length < 5) {
      get().addToast('⚠️ Escalação Incompleta! Você precisa escalar exatamente 5 titulares na aba de Elenco antes de avançar.', 'error');
      return;
    }

    // 1. Há partida de campeonato do usuário nesta semana? (bracket por rodadas — A5)
    // O adversário varia por rodada; o avanço/eliminação é tratado em finalizarPartidaAtiva.
    const tournamentThisWeek = Object.values(tournaments).find(
      t => t.weekScheduled === currentWeek && !t.isFinished && t.teamIds.includes(userTeamId)
    );

    if (tournamentThisWeek) {
      // Inicialização segura e persistida de userOpponents se vazio durante o avanço da semana (fora do render)
      if (!tournamentThisWeek.userOpponents || tournamentThisWeek.userOpponents.length === 0) {
        const opponents = tournamentThisWeek.teamIds.filter(id => id !== userTeamId && teams[id]);
        if (opponents.length > 0) {
          const mapNeutral = realMaps[0];
          const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, tournamentThisWeek.teamIds.length))));
          const ranked = [...opponents].sort(
            (a, b) =>
              computeTournamentStrength(teams[a], players, mapNeutral) -
              computeTournamentStrength(teams[b], players, mapNeutral)
          );
          const userOpponents = ranked.slice(0, Math.max(1, Math.min(totalRounds, ranked.length)));
          tournamentThisWeek.userOpponents = userOpponents;
          set({ tournaments: { ...tournaments, [tournamentThisWeek.id]: { ...tournamentThisWeek, userOpponents } } });
        }
      }

      const oppTeam = get().obterProximoAdversario(tournamentThisWeek.id);
      if (oppTeam) {
        const activeMaps = realMaps.filter(m => m.status === 'active');
        const mapSelected = activeMaps[Math.floor(Math.random() * activeMaps.length)] ?? realMaps[0];

        const userTeam = teams[userTeamId];
        const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
        const oppSquad = Object.values(players).filter(p => p.teamId === oppTeam.id && p.status === 'titular');

        // Efeito do Analista (Fase D): bônus de veto aplicado ao time do usuário (teamA).
        const analystId = userTeam.staff.analystId;
        const userAnalystLevel = analystId ? get().staffList[analystId]?.level ?? 0 : 0;

        const match = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapSelected, tournamentThisWeek.id, { a: userAnalystLevel });
        set({ activeMatch: match, currentScreen: 'matchPreview', activeMatchRoundIndex: 0, isSimulatingMatch: false });
        return;
      }
    }

    // 2. ECONOMIA SEMANAL:
    const userTeam = teams[userTeamId];
    let income = 0;
    let expense = 0;

    // Receita de patrocinador
    if (userTeam.sponsorId && get().sponsors[userTeam.sponsorId]) {
      const sp = get().sponsors[userTeam.sponsorId];
      income += sp.weeklyIncome;
    }

    // Receita operacional base (bilheteria/conteúdo/loja). Balanceado para divisões inferiores.
    const tierBaseFloor: Record<Team['tier'], number> = {
      1: 25000,
      2: 14000,
      3: 7500,
      4: 3000,
    };
    const baseIncome = Math.round(userTeam.reputation * 100) + tierBaseFloor[userTeam.tier];
    income += baseIncome;

    // Despesa de salários de jogadores ativos e staff
    const userPlayers = Object.values(players).filter(p => p.teamId === userTeamId);
    userPlayers.forEach(p => {
      expense += p.salary;
    });

    // Despesa do Staff — salário real de cada membro contratado.
    const staffList = get().staffList;
    const staffSlots: (keyof Team['staff'])[] = ['coachId', 'analystId', 'psychologistId', 'scoutId', 'physioId'];
    staffSlots.forEach((slot) => {
      const staffId = userTeam.staff[slot];
      if (staffId && staffList[staffId]) expense += staffList[staffId].salary;
    });

    // Níveis dos membros relevantes para os efeitos semanais e de partida
    const coachLevel = userTeam.staff.coachId ? staffList[userTeam.staff.coachId]?.level ?? 0 : 0;
    const psychologistLevel = userTeam.staff.psychologistId ? staffList[userTeam.staff.psychologistId]?.level ?? 0 : 0;
    const physioLevel = userTeam.staff.physioId ? staffList[userTeam.staff.physioId]?.level ?? 0 : 0;

    // Custo do Bootcamp (quando o plano de treino da semana for bootcamp e houver caixa)
    let bootcampCost = 0;
    if (trainingPlan.intensity === 'bootcamp' && userTeam.budget >= 50000) {
      bootcampCost = 50000;
      expense += bootcampCost;
    }

    // MULTIPLICADORES DE DIFICULDADE (Finanças Balanceadas & Desafiadoras)
    let diffIncomeMult = 0.90; // Normal é ligeiramente mais desafiador por padrão
    let diffExpenseMult = 1.10;
    const difficulty = get().difficulty;
    
    if (difficulty === 'facil') {
      diffIncomeMult = 1.15;
      diffExpenseMult = 0.90;
    } else if (difficulty === 'dificil') {
      diffIncomeMult = 0.75;
      diffExpenseMult = 1.25;
    } else if (difficulty === 'hardcore') {
      diffIncomeMult = 0.50;
      diffExpenseMult = 1.60;
    }

    income = Math.round(income * diffIncomeMult);
    expense = Math.round(expense * diffExpenseMult);

    const netAmount = income - expense;
    const newBudget = userTeam.budget + netAmount;

    // Atualiza caixa do time do usuário
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: newBudget
    };

    // Histórico financeiro
    const newFinEntry = [
      ...financialHistory,
      { week: currentWeek, description: 'Receita Operacional + Patrocínio', amount: income },
      { week: currentWeek, description: 'Folha Salarial, Staff e Custos', amount: -expense }
    ];

    // CICLO DE PATROCÍNIO: decrementa o contador semanal e expira o contrato ao zerar.
    const sponsorExpiryNews: NewsItem[] = [];
    if (updatedTeams[userTeamId].sponsorId && get().sponsors[updatedTeams[userTeamId].sponsorId as string]) {
      const activeSp = get().sponsors[updatedTeams[userTeamId].sponsorId as string];
      const weeksLeft = (updatedTeams[userTeamId].sponsorWeeksRemaining ?? 0) - 1;
      if (weeksLeft <= 0) {
        // Contrato encerrado: remove sponsorId/sponsorWeeksRemaining
        const { sponsorId: _sid, sponsorWeeksRemaining: _swr, ...teamWithoutSponsor } = updatedTeams[userTeamId];
        updatedTeams[userTeamId] = teamWithoutSponsor;
        sponsorExpiryNews.push({
          id: `sponsor_end_${currentSeason}_${currentWeek}`,
          title: `Contrato de patrocínio com ${activeSp.name} chega ao fim`,
          content: `O contrato de patrocínio entre o ${userTeam.name} e a ${activeSp.name} expirou nesta semana. A receita semanal de $${activeSp.weeklyIncome.toLocaleString()} foi interrompida. Negocie um novo patrocínio na aba de Finanças para manter as contas equilibradas.`,
          category: 'general',
          week: currentWeek,
          dateStr: `Semana ${currentWeek}`,
        });
        newFinEntry.push({ week: currentWeek, description: `Contrato de patrocínio encerrado: ${activeSp.name}`, amount: 0 });
      } else {
        updatedTeams[userTeamId] = { ...updatedTeams[userTeamId], sponsorWeeksRemaining: weeksLeft };
      }
    }

    // 3. EVOLUÇÃO POR TREINO (plano de treino semanal) + ENERGIA/MORAL.
    // Parâmetros por intensidade balanceados graduais (evita evolução ultra-rápida indesejada)
    const intensityParams: Record<typeof trainingPlan.intensity, { gainChance: number; energy: number; moral: number; allAttrs: number }> = {
      leve:     { gainChance: 0.01, energy: 15,  moral: 5,  allAttrs: 0 },
      normal:   { gainChance: 0.03, energy: -5,  moral: 0,  allAttrs: 0 },
      pesada:   { gainChance: 0.06, energy: -15, moral: -2, allAttrs: 0 },
      bootcamp: { gainChance: 0.09, energy: -10, moral: 3,  allAttrs: 0 },
    };
    const baseParams = intensityParams[trainingPlan.intensity];
    const coachMultiplier = coachLevel > 0 ? 1 + coachLevel * 0.05 : 1;
    const params = { ...baseParams, gainChance: baseParams.gainChance * coachMultiplier };
    const focusAttr: keyof Player['attributes'] =
      trainingPlan.focus === 'gamesense' ? 'gamesense'
      : trainingPlan.focus === 'utility' ? 'utility'
      : trainingPlan.focus === 'clutch' ? 'clutch'
      : 'aim';

    const caixaNegativo = newBudget < 0;
    const updatedPlayers = { ...players };
    Object.values(players).forEach(p => {
      if (p.teamId !== userTeamId) return;

      if (p.status === 'titular') {
        const youthBonus = p.age <= 22 ? 1.6 : 1.0; // jovens evoluem mais
        
        // MODIFICADORES DE DESEMPENHO (Rating real em partidas)
        let performanceMultiplier = 1.0;
        let potentialBonusChance = 0.0;
        if (p.stats.mapsPlayed > 0) {
          const rating = p.stats.rating;
          if (rating >= 1.30) {
            performanceMultiplier = 2.0;  // 100% bônus de evolução para desempenho espetacular!
            potentialBonusChance = 0.15;  // 15% chance de subir potencial máximo
          } else if (rating >= 1.15) {
            performanceMultiplier = 1.4;  // 40% bônus de evolução
            potentialBonusChance = 0.05;  // 5% chance de subir potencial
          } else if (rating >= 1.00) {
            performanceMultiplier = 0.9;  // evolução ligeiramente menor
          } else if (rating < 0.90) {
            performanceMultiplier = 0.3;  // evolução travada devido a desempenho fraco
          }
        } else {
          // No banco de reservas e sem ritmo de jogo: evolução severamente punida
          performanceMultiplier = 0.15;
        }

        const updatedAttrs: Player['attributes'] = { ...p.attributes };
        (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
          const chance = (k === focusAttr ? params.gainChance * 2 : params.gainChance) * youthBonus * performanceMultiplier;
          let gain = params.allAttrs;
          if (Math.random() < chance) gain += 1;
          if (gain > 0) updatedAttrs[k] = Math.min(99, updatedAttrs[k] + gain);
        });

        // Físio (Fase D)
        const physioBonus = physioLevel > 0 ? physioLevel * 2 : 0;
        const updatedEnergy = Math.max(0, Math.min(100, p.energy + params.energy + physioBonus));

        // Psicólogo (Fase D)
        const psychologistBonus = psychologistLevel > 0 ? psychologistLevel * 3 : 0;
        let moralDelta = params.moral + psychologistBonus;
        if (caixaNegativo) moralDelta -= 4;
        const updatedMoral = Math.max(0, Math.min(100, p.moral + moralDelta));

        const updatedOverall = Math.min(99, Math.round((updatedAttrs.aim + updatedAttrs.gamesense + updatedAttrs.clutch + updatedAttrs.utility + updatedAttrs.igl) / 5));

        // CAP DE POTENCIAL MÁXIMO NO TREINO SEMANAL (Evita crescimento infinito e ultra-rápido)
        let finalAttrs = updatedAttrs;
        let finalOverall = updatedOverall;

        if (updatedOverall > p.potential) {
          finalOverall = p.potential;
          finalAttrs = { ...p.attributes }; // Reverte os ganhos caso estoure o potencial
        } else {
          // Bônus de performance: aumenta o potencial de jovens que estão jogando muito!
          if (p.age <= 22 && Math.random() < potentialBonusChance && p.potential < 99) {
            const nextPot = p.potential + 1;
            updatedPlayers[p.id] = { ...p, potential: nextPot };
            // Adiciona toast avisando
            get().addToast(`🔥 Excelente desempenho de ${p.nickname}! Seu potencial máximo subiu para ${nextPot}!`, 'success');
          }
        }

        updatedPlayers[p.id] = {
          ...updatedPlayers[p.id] ?? p,
          attributes: finalAttrs,
          energy: updatedEnergy,
          moral: updatedMoral,
          overall: finalOverall,
        };
      } else if (p.status === 'reserva') {
        updatedPlayers[p.id] = {
          ...p,
          energy: Math.min(100, p.energy + 12),
          moral: caixaNegativo ? Math.max(0, p.moral - 4) : p.moral,
        };
      }
    });

    // A4: notícia de pressão da diretoria quando o caixa fecha no vermelho
    const newsAfterWeek = caixaNegativo
      ? [...sponsorExpiryNews, {
          id: `fin_${currentSeason}_${currentWeek}`,
          title: `Diretoria do ${userTeam.name} cobra equilíbrio financeiro!`,
          content: `O caixa do ${userTeam.name} fechou a semana no vermelho ($${newBudget.toLocaleString()}). A diretoria pressiona por cortes e a moral do elenco caiu. Assine um patrocínio ou venda jogadores para reequilibrar as contas.`,
          category: 'general' as const,
          week: currentWeek,
          dateStr: `Semana ${currentWeek}`,
        }, ...historyNews]
      : [...sponsorExpiryNews, ...historyNews];

    // 3b. PROPOSTA OCASIONAL DE IA por um jogador do usuário (não força a venda — só registra
    // o interesse como notícia/oportunidade de mercado). ~15% de chance por semana.
    const aiInterestNews: NewsItem[] = [];
    if (Math.random() < 0.15) {
      const venadeis = Object.values(updatedPlayers).filter(
        (p) => p.teamId === userTeamId && (p.status === 'titular' || p.status === 'reserva')
      );
      if (venadeis.length > 0) {
        const target = venadeis[Math.floor(Math.random() * venadeis.length)];
        // Clube interessado: uma IA aleatória de tier igual ou superior (mais reputado).
        const interestedTeams = Object.values(teams).filter(
          (t) => t.id !== userTeamId && t.id !== 'free_agents' && t.tier <= updatedTeams[userTeamId].tier
        );
        const bidder = interestedTeams.length > 0
          ? interestedTeams[Math.floor(Math.random() * interestedTeams.length)]
          : null;
        const bidValue = Math.round(target.value * (1.1 + Math.random() * 0.4)); // 110%–150% do valor
        aiInterestNews.push({
          id: `ai_bid_${currentSeason}_${currentWeek}_${target.id}`,
          title: bidder
            ? `${bidder.name} sonda a contratação de ${target.nickname}!`
            : `Clubes do exterior sondam ${target.nickname}!`,
          content: `${bidder ? `O ${bidder.name}` : 'Uma equipe internacional'} demonstrou interesse em ${target.nickname} (overall ${target.overall}) e teria oferecido cerca de $${bidValue.toLocaleString()} pelo passe. A diretoria do ${updatedTeams[userTeamId].name} não é obrigada a vender — avalie se é uma boa oportunidade de mercado na aba de Mercado/Elenco.`,
          category: 'transfers',
          week: currentWeek,
          dateStr: `Semana ${currentWeek}`,
        });
      }
    }

    // 4. SIMULAR PARTIDAS DE OUTRAS EQUIPES DE TORNEIOS DE FUNDO (bug C do relatório).
    // Mantém o ranking mundial VIVO: a cada semana as IAs disputam partidas de fundo (ligas
    // paralelas) que movem points/vitórias/forma recente. Sem isto, só o time do usuário se
    // mexia no ranking. Usa um mapa ativo aleatório como cenário do veto de fundo.
    const aiWeekMap = realMaps.filter(m => m.status === 'active');
    const aiBackgroundMap = aiWeekMap[Math.floor(Math.random() * aiWeekMap.length)] ?? realMaps[0];
    const aiWeeklyUpdates = simulateAiWeeklyMatches(updatedTeams, updatedPlayers, aiBackgroundMap, userTeamId);
    Object.assign(updatedTeams, aiWeeklyUpdates);

    // Avança a semana
    const nextWeek = currentWeek + 1;

    // ===== VIRADA DE TEMPORADA (spec §23) =====
    if (nextWeek > 48) {
      const nextSeason = currentSeason + 1;

      // 0. RESOLUÇÃO DE TORNEIOS PENDENTES (IA vs IA).
      // Até aqui, só os torneios em que o usuário JOGOU foram resolvidos. Os torneios de
      // fundo (em que o usuário não disputou) e os que ficaram sem campeão são fechados aqui,
      // coroando uma IA via bracket de eliminação e premiando-a. Garante que TODO torneio
      // termine a temporada com championId definido (objetivo da feature).
      const activeMapsForBracket = realMaps.filter(m => m.status === 'active');
      const resolvedTournaments: Record<string, Tournament> = { ...tournaments };
      Object.values(tournaments).forEach((t) => {
        if (t.championId && updatedTeams[t.championId]) return; // já tem campeão válido
        const bracketMap = activeMapsForBracket[Math.floor(Math.random() * activeMapsForBracket.length)] ?? realMaps[0];
        // Não excluímos ninguém: o usuário também pode ser coroado pela IA se for o mais forte
        // num torneio que nunca disputou (ainda assim entra no bracket de fundo).
        const aiOutcome = crownAiChampion(t, updatedTeams, updatedPlayers, null, bracketMap, currentWeek);
        if (aiOutcome) {
          updatedTeams[aiOutcome.championId] = aiOutcome.championTeam;
          // Anexa os jogos/tabela materializados (Fase 3b): Tournament.matches deixa de ser vazio.
          resolvedTournaments[t.id] = {
            ...t,
            isFinished: true,
            championId: aiOutcome.championId,
            matches: [...aiOutcome.matches],
            standings: [...aiOutcome.standings],
          };
        }
      });

      // 1. SNAPSHOT DOS CAMPEÕES — capturado ANTES de qualquer reset de torneio.
      const champions: SeasonChampionSnapshot[] = Object.values(resolvedTournaments)
        .filter(t => t.isFinished && t.championId && updatedTeams[t.championId])
        .map(t => {
          const champTeam = updatedTeams[t.championId as string];
          return {
            tournamentId: t.id,
            tournamentName: t.name,
            championId: champTeam.id,
            championName: champTeam.name,
            championTag: champTeam.tag,
            prizePool: t.prizePool,
            isUserChampion: champTeam.id === userTeamId,
          };
        });

      // 1b. PROMOÇÃO / REBAIXAMENTO DE TIER DO USUÁRIO (motor de progressão).
      // Critério de desempenho da temporada encerrada (stats são acumulados de carreira, então
      // subtraímos os totais das temporadas anteriores para isolar o delta DESTA temporada).
      const userTeamBeforeTier = updatedTeams[userTeamId];
      const promotionNews: NewsItem[] = [];
      if (userTeamBeforeTier) {
        const prevSeasonTotals = historicoTemporadas
          .filter(h => h.season !== currentSeason)
          .reduce((acc, h) => ({ w: acc.w + h.userWins, l: acc.l + h.userLosses }), { w: 0, l: 0 });
        const seasonWins = Math.max(0, userTeamBeforeTier.stats.wins - prevSeasonTotals.w);
        const seasonLosses = Math.max(0, userTeamBeforeTier.stats.losses - prevSeasonTotals.l);

        // Foi campeão de algum torneio do PRÓPRIO tier nesta temporada?
        const wonTierTitle = champions.some(
          c => c.isUserChampion && resolvedTournaments[c.tournamentId]?.tier === userTeamBeforeTier.tier
        );
        // Desempenho forte: título do tier OU saldo de vitórias sólido com maioria de vitórias.
        const strongSeason = wonTierTitle || (seasonWins >= 6 && seasonWins > seasonLosses);
        // Desempenho fraco: sem título e com muitas derrotas dominando o saldo.
        const weakSeason = !wonTierTitle && seasonLosses >= 6 && seasonLosses > seasonWins;

        const currentTier = userTeamBeforeTier.tier;
        // Menor número = melhor (tier 1 é o teto; tier 4 é o piso).
        const promote = strongSeason && currentTier > 1;
        const relegate = weakSeason && currentTier < 4;

        if (promote || relegate) {
          const newTier = (promote ? currentTier - 1 : currentTier + 1) as Team['tier'];
          updatedTeams[userTeamId] = { ...userTeamBeforeTier, tier: newTier };
          promotionNews.push({
            id: `tier_${promote ? 'promo' : 'releg'}_${currentSeason}`,
            title: promote
              ? `${userTeamBeforeTier.name} é PROMOVIDO para o Tier ${newTier}!`
              : `${userTeamBeforeTier.name} é REBAIXADO para o Tier ${newTier}.`,
            content: promote
              ? `Após uma campanha de destaque (${seasonWins} vitórias${wonTierTitle ? ' e título do seu tier' : ''}) na Temporada ${currentSeason}, o ${userTeamBeforeTier.name} subiu de divisão e agora disputa o Tier ${newTier}. Adversários mais fortes e premiações maiores aguardam na Temporada ${nextSeason}.`
              : `A Temporada ${currentSeason} foi dura para o ${userTeamBeforeTier.name} (${seasonLosses} derrotas e sem título). O time foi rebaixado para o Tier ${newTier} e terá a chance de se reerguer na Temporada ${nextSeason}.`,
            category: 'general',
            week: currentWeek,
            dateStr: `Semana ${currentWeek}`,
          });
        }
      }

      // 2. ENVELHECIMENTO + APOSENTADORIA + EVOLUÇÃO/DECLÍNIO (cobre TODOS os times, inclusive IA).
      // F3 — mundo vivo: jovens evoluem rumo ao potencial (com headroom para destravar o gate),
      // veteranos declinam de reflexo, e o restante só envelhece. media5 = overall pelos atributos.
      const media5 = (a: Player['attributes']): number =>
        Math.round((a.aim + a.gamesense + a.clutch + a.utility + a.igl) / 5);
      Object.values(updatedPlayers).forEach(prev => {
        const newAge = prev.age + 1;
        const ativo = prev.status === 'titular' || prev.status === 'reserva';

        // Aposentadoria por idade (obrigatória acima de 38, probabilística acima de 35)
        if (newAge > 38 || (newAge > 35 && Math.random() < 0.4)) {
          updatedPlayers[prev.id] = { ...prev, age: newAge, status: 'aposentado', teamId: 'free_agents' };
          return;
        }

        // F3 — HEADROOM DE POTENCIAL: jovens promissores "descobrem teto". Sem isto, astros de IA
        // com potential≈overall (FalleN 83/83) nunca evoluem e o mundo congela. Eleva levemente o teto.
        let potential = prev.potential;
        if (ativo && newAge <= 23 && potential - prev.overall < 3 && Math.random() < 0.4) {
          potential = Math.min(99, potential + 1 + Math.floor(Math.random() * 2));
        }

        // Evolução rumo ao potencial: jovens evoluem mais forte (spec §15).
        if (ativo && prev.overall < potential) {
          const evolBoost = newAge <= 22 ? 2 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
          if (evolBoost > 0) {
            const updatedAttrs: Player['attributes'] = { ...prev.attributes };
            (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
              if (Math.random() < (newAge <= 22 ? 0.6 : 0.3)) updatedAttrs[k] = Math.min(99, updatedAttrs[k] + evolBoost);
            });
            updatedPlayers[prev.id] = { ...prev, age: newAge, potential, attributes: updatedAttrs, overall: Math.min(potential, media5(updatedAttrs)) };
            return;
          }
        }

        // F3 — DECLÍNIO DE VETERANOS: dos 31+, reflexo/clutch caem aos poucos (chance cresce com a idade).
        if (ativo && newAge >= 31 && Math.random() < (newAge - 30) * 0.15) {
          const updatedAttrs: Player['attributes'] = { ...prev.attributes };
          const decair = (k: keyof Player['attributes']) => { updatedAttrs[k] = Math.max(40, updatedAttrs[k] - (1 + Math.floor(Math.random() * 2))); };
          decair('aim');
          decair('clutch');
          updatedPlayers[prev.id] = { ...prev, age: newAge, potential, attributes: updatedAttrs, overall: media5(updatedAttrs) };
          return;
        }

        // Sem evolução nem declínio: apenas envelhece (mantém o potential possivelmente elevado)
        updatedPlayers[prev.id] = { ...prev, age: newAge, potential };
      });

      // 2b. REPOSIÇÃO DE ELENCO (F1): aposentadorias deixam times de IA com <5 titulares; sem
      // repor, os elencos encolhem até sumir. Garante 5 titulares em TODOS os times na virada.
      Object.values(updatedTeams).forEach((team) => {
        if (team.id === 'free_agents') return;
        const filled = ensureFiveStarters(updatedPlayers, team);
        if (filled !== updatedPlayers) Object.assign(updatedPlayers, filled);
      });

      // 2c. MERCADO E REPUTAÇÃO VIVOS (F3): o value de mercado acompanha a força ATUAL (jovens que
      // evoluíram valem mais; veteranos em queda, menos) e a reputação das IAs deriva da forma
      // recente (sobe quem vem vencendo, cai quem vem perdendo) — mobilidade sem achatar a hierarquia.
      Object.values(updatedPlayers).forEach((p) => {
        if (p.status === 'aposentado') return;
        const v = computePlayerValue(p.overall, p.age, p.potential);
        if (v !== p.value) updatedPlayers[p.id] = { ...p, value: v };
      });
      Object.values(updatedTeams).forEach((team) => {
        if (team.id === 'free_agents' || team.id === userTeamId) return;
        const form = team.stats.recentForm.slice(-10);
        if (form.length === 0) return;
        const winRatio = form.filter((r) => r === 'W').length / form.length;
        const deltaRep = Math.round((winRatio - 0.5) * 6); // -3..+3 por temporada
        if (deltaRep !== 0) {
          updatedTeams[team.id] = { ...team, reputation: Math.max(30, Math.min(99, team.reputation + deltaRep)) };
        }
      });

      // 3. RESET DOS TORNEIOS — volta ao estado inicial mantendo os participantes.
      const competitionDefaults: Record<string, Tournament> = {};
      defaultCompetitions.forEach(c => { competitionDefaults[c.id] = c; });
      const resetTournaments: Record<string, Tournament> = {};
      Object.values(tournaments).forEach(t => {
        const baseline = competitionDefaults[t.id];
        const { championId: _champ, mvpPlayerId: _mvp, standings: _st, userOpponents: _uo, ...rest } = t;
        resetTournaments[t.id] = {
          ...rest,
          isFinished: false,
          currentRound: 0,
          // Fase 3b: zera os artefatos da edição anterior (jogos/tabela/bracket do usuário) e
          // garante o formato do motor para a nova temporada.
          matches: [],
          engineFormat: t.engineFormat ?? deriveEngineFormat(t.id, t.format),
          weekScheduled: baseline ? baseline.weekScheduled : t.weekScheduled,
          // Recompõe os participantes com o tier ATUALIZADO do usuário (pós-promoção/rebaixamento),
          // garantindo a vaga dele nos torneios do novo tier para a próxima temporada.
          teamIds: computeTournamentTeamIds(t, updatedTeams, userTeamId),
        };
      });

      // 4. NOTÍCIA DE FIM DE TEMPORADA com os campeões da temporada encerrada.
      const championsLine = champions.length > 0
        ? champions.map(c => `${c.tournamentName}: ${c.championName}`).join(' · ')
        : 'Nenhum torneio teve campeão definido nesta temporada.';
      const seasonEndNews: NewsItem = {
        id: `season_end_${currentSeason}`,
        title: `Temporada ${currentSeason} encerrada! Confira os campeões da temporada.`,
        content: `A Temporada ${currentSeason} chegou ao fim. ${championsLine}. Uma nova temporada começa agora — recalibre seu elenco, renove patrocínios e mire nos títulos da Temporada ${nextSeason}.`,
        category: 'results',
        week: currentWeek,
        dateStr: `Semana ${currentWeek}`,
      };

      // 5. SNAPSHOT DO RESUMO para a tela SeasonSummary (UI transiente).
      const userStatsSnapshot = {
        wins: updatedTeams[userTeamId]?.stats.wins ?? 0,
        losses: updatedTeams[userTeamId]?.stats.losses ?? 0,
        titles: updatedTeams[userTeamId]?.stats.titles ?? 0,
      };
      const seasonSummary: SeasonSummary = {
        season: currentSeason,
        champions,
        userStats: userStatsSnapshot,
      };

      // 6. REGISTRO PERMANENTE NO HISTÓRICO — reaproveita o snapshot de campeões da temporada
      // encerrada. Persistido no SaveGame (Histórico & Títulos). Forma enxuta: só os campos
      // necessários para a sala de troféus e a lista de temporadas passadas.
      // stats.wins/losses/titles do Team são ACUMULADOS de carreira. Para registrar o desempenho
      // DESTA temporada, subtrai a soma das temporadas anteriores já no histórico (delta da temporada).
      const prevTotals = historicoTemporadas
        .filter(h => h.season !== currentSeason)
        .reduce((acc, h) => ({ w: acc.w + h.userWins, l: acc.l + h.userLosses, t: acc.t + h.userTitles }), { w: 0, l: 0, t: 0 });
      const seasonHistoryEntry: SeasonHistoryEntry = {
        season: currentSeason,
        champions: champions.map(c => ({
          tournamentId: c.tournamentId,
          tournamentName: c.tournamentName,
          championId: c.championId,
          championName: c.championName,
          championTag: c.championTag,
        })),
        userWins: Math.max(0, userStatsSnapshot.wins - prevTotals.w),
        userLosses: Math.max(0, userStatsSnapshot.losses - prevTotals.l),
        userTitles: Math.max(0, userStatsSnapshot.titles - prevTotals.t),
      };
      // Evita duplicar a entrada se a virada de temporada for reprocessada (idempotência defensiva).
      const updatedHistorico: SeasonHistoryEntry[] = [
        ...historicoTemporadas.filter(h => h.season !== currentSeason),
        seasonHistoryEntry,
      ];

      set({
        currentWeek: 1,
        currentSeason: nextSeason,
        teams: updatedTeams,
        players: updatedPlayers,
        tournaments: resetTournaments,
        financialHistory: newFinEntry,
        historyNews: [...promotionNews, seasonEndNews, ...aiInterestNews, ...newsAfterWeek],
        seasonSummary,
        historicoTemporadas: updatedHistorico,
        currentScreen: 'seasonSummary',
      });

      get().salvarJogo();
      return;
    }

    set({
      currentWeek: nextWeek,
      currentSeason,
      teams: updatedTeams,
      players: updatedPlayers,
      financialHistory: newFinEntry,
      historyNews: [...aiInterestNews, ...newsAfterWeek],
    });

    // Auto-save no avanço
    get().salvarJogo();
  },

  // Fast-forward: avança semana a semana até que `avancarSemana` abra uma tela imersiva
  // (matchPreview de torneio ou seasonSummary na virada de temporada). Reaproveita 100% da
  // lógica de `avancarSemana` (economia, treino, virada) — apenas a invoca em sequência.
  // O cap de segurança (uma temporada inteira) impede laço infinito caso o usuário não tenha
  // mais torneios agendados no ano.
  avancarAtePartida: () => {
    const { currentWeek, userTeamId, tournaments, players } = get();

    // Bloqueia avanço se o usuário não tiver exatamente 5 titulares escalados
    const userStarters = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
    if (userStarters.length < 5) {
      get().addToast('⚠️ Escalação Incompleta! Você precisa escalar exatamente 5 titulares na aba de Elenco antes de avançar.', 'error');
      return;
    }
    const temCampeonatosAtivos = Object.values(tournaments).some(
      t => t.teamIds.includes(userTeamId) && !t.isFinished && !t.userEliminated && t.weekScheduled >= currentWeek
    );

    if (!temCampeonatosAtivos) {
      return;
    }

    const MAX_AVANCOS = 48;
    for (let i = 0; i < MAX_AVANCOS; i++) {
      const { currentWeek: cw } = get();
      const hasGameNow = Object.values(tournaments).some(
        t => t.weekScheduled === cw && !t.isFinished && t.teamIds.includes(userTeamId) && !t.userEliminated
      );
      if (hasGameNow) {
        get().avancarSemana();
        return;
      }

      get().avancarSemana();
      if (get().currentScreen !== 'dashboard') return;
    }
  },

  avancarAposPartida: () => {
    // Limpa a tela de resultado e volta para o dashboard
    set({
      finishedMatch: null,
      activeMatch: null,
      isSimulatingMatch: false,
      activeMatchRoundIndex: 0,
      currentScreen: 'dashboard'
    });

    // Roda a simulação da semana pós-partida
    get().avancarSemana();
    if (get().currentScreen !== 'dashboard') return;
    
    // Avança silenciosamente até o próximo jogo do usuário
    get().avancarAtePartida();
  },

  encerrarTemporada: () => {
    processarFimTemporada(get, set);
  },

  definirTitular: (playerId, status) => {
    const { players, userTeamId } = get();
    const updatedPlayers = { ...players };
    
    // Conta quantos titulares ativos o time do usuário tem
    const userTitulares = Object.values(updatedPlayers).filter(
      p => p.teamId === userTeamId && p.status === 'titular' && p.id !== playerId
    );

    if (status === 'titular' && userTitulares.length >= 5) {
      // Nega se já houver 5 titulares escalados
      return;
    }

    if (players[playerId]) {
      updatedPlayers[playerId] = { ...players[playerId], status };
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
  },

  definirPapelEspecial: (playerId, roleType) => {
    const { players } = get();
    const target = players[playerId];
    if (!target) {
      return;
    }

    const updatedPlayers = { ...players };

    // Remove a função antiga de outros titulares (cópia imutável de cada afetado)
    Object.values(players).forEach(p => {
      if (p.teamId === target.teamId && p.id !== playerId) {
        if ((roleType === 'IGL' && p.role === 'IGL') || (roleType === 'AWPer' && p.role === 'AWPer')) {
          updatedPlayers[p.id] = { ...p, role: 'Rifler' }; // Reseta para rifler padrão
        }
      }
    });

    updatedPlayers[playerId] = { ...target, role: roleType };

    set({ players: updatedPlayers });
    get().salvarJogo();
  },

  definirTaticas: (tactics) => {
    const { userTeamId, teams } = get();
    if (!teams[userTeamId]) return;
    // Atualização IMUTÁVEL do store (antes mutava o objeto direto e não persistia)
    const updatedTeams = {
      ...teams,
      [userTeamId]: { ...teams[userTeamId], tactics: { ...tactics } },
    };
    set({ teams: updatedTeams });
    get().salvarJogo();
  },

  definirTreinoSemanal: (intensity, focus) => {
    const { userTeamId, teams } = get();
    if (intensity === 'bootcamp' && (teams[userTeamId]?.budget ?? 0) < 50000) {
      return { success: false, message: 'Caixa insuficiente para bancar um Bootcamp ($50.000).' };
    }
    set({ trainingPlan: { intensity, focus } });
    get().salvarJogo();
    return { success: true, message: `Plano de treino (${intensity}) com foco em ${focus} definido para as próximas semanas.` };
  },

  fazerPropostaContratacao: (playerId) => {
    const { players, teams, userTeamId, currentWeek } = get();
    const player = players[playerId];
    const userTeam = teams[userTeamId];

    if (!player) return { success: false, message: 'Jogador não encontrado.' };
    if (player.teamId === userTeamId) return { success: false, message: 'Jogador já faz parte da sua equipe.' };

    // Luvas estimadas em 10% do valor do passe
    const signingBonus = Math.round(player.value * 0.1);
    const totalCost = player.value + signingBonus;

    // Regra Rígida de Saldo: Contrata se tiver Saldo >= Passe + Luvas
    if (userTeam.budget < totalCost) {
      return {
        success: false,
        message: `Saldo insuficiente! Você precisa de pelo menos $${totalCost.toLocaleString()} (Passe: $${player.value.toLocaleString()} + Luvas: $${signingBonus.toLocaleString()}).`
      };
    }

    const updatedTeams = { ...teams };
    const updatedPlayers = { ...players };

    // Atualiza saldos econômicos (cópia imutável do time do usuário)
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget - totalCost };

    // Se pertencer a um time real, paga o passe ao time vendedor
    const oldTeamId = player.teamId;
    let oldTeamName = 'Agente Livre';
    if (oldTeamId !== 'free_agents' && teams[oldTeamId]) {
      updatedTeams[oldTeamId] = { ...teams[oldTeamId], budget: teams[oldTeamId].budget + player.value };
      oldTeamName = teams[oldTeamId].name;
    }

    // Vincula jogador ao time do usuário
    updatedPlayers[playerId] = {
      ...player,
      teamId: userTeamId,
      status: 'reserva', // entra como reserva para o usuário escalar
      contractMonths: 18 // contrato inicial de 18 meses
    };

    // F1/F2: o time vendedor (IA) ficou desfalcado — repõe imediatamente a MESMA role do jogador que saiu.
    if (oldTeamId !== 'free_agents' && updatedTeams[oldTeamId]) {
      const filled = ensureFiveStarters(updatedPlayers, updatedTeams[oldTeamId], player.role);
      if (filled !== updatedPlayers) Object.assign(updatedPlayers, filled);
    }

    // Gera notícia dinamicamente
    const news = generateTransferNews(player, oldTeamName, userTeam.name, currentWeek);

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contratação de ${player.nickname}`, amount: -totalCost }
      ]
    });

    get().salvarJogo();
    return { success: true, message: `Contratação de ${player.nickname} concluída com sucesso!` };
  },

  negociarContratacao: (playerId, valorOferta, salarioOferta, forcarAceite = false) => {
    const { players, teams, userTeamId, currentWeek } = get();
    const player = players[playerId];
    const userTeam = teams[userTeamId];

    if (!player) {
      return { success: false, status: 'recusada', message: 'Jogador não encontrado.' };
    }
    if (player.teamId === userTeamId) {
      return { success: false, status: 'recusada', message: 'Jogador já faz parte da sua equipe.' };
    }

    // Saneamento: ofertas devem ser números finitos não-negativos.
    const valor = Number.isFinite(valorOferta) ? Math.max(0, Math.round(valorOferta)) : 0;
    const salario = Number.isFinite(salarioOferta) ? Math.max(0, Math.round(salarioOferta)) : 0;

    // Custo de caixa para o usuário: passe oferecido + luvas (10% do passe).
    const signingBonus = Math.round(valor * 0.1);
    const totalCost = valor + signingBonus;
    if (userTeam.budget < totalCost) {
      return {
        success: false,
        status: 'recusada',
        message: `Saldo insuficiente! A oferta exige $${totalCost.toLocaleString()} em caixa (Passe: $${valor.toLocaleString()} + Luvas: $${signingBonus.toLocaleString()}).`,
      };
    }

    // RESERVA DE FOLHA (risco B do relatório): aprovar uma compra que zera o caixa deixava o
    // time falir na semana seguinte pela folha salarial obrigatória. Exige que o caixa PÓS-
    // transferência cubra ao menos uma folha semanal (jogadores + staff + o novo salário).
    const staffList = get().staffList;
    const staffSlots: (keyof Team['staff'])[] = ['coachId', 'analystId', 'psychologistId', 'scoutId', 'physioId'];
    const folhaStaff = staffSlots.reduce((acc, slot) => {
      const staffId = userTeam.staff[slot];
      return acc + (staffId && staffList[staffId] ? staffList[staffId].salary : 0);
    }, 0);
    const folhaJogadores = Object.values(players).reduce((acc, p) => (p.teamId === userTeamId ? acc + p.salary : acc), 0);
    const proximaFolha = folhaJogadores + folhaStaff + salario; // o recém-contratado entra na folha
    const caixaPosTransferencia = userTeam.budget - totalCost;
    if (caixaPosTransferencia < proximaFolha) {
      return {
        success: false,
        status: 'recusada',
        message: `Caixa insuficiente para sustentar a folha! Após a transferência sobrariam $${caixaPosTransferencia.toLocaleString()}, abaixo da folha salarial semanal de $${proximaFolha.toLocaleString()}. Reduza o salário, venda um jogador ou assine um patrocínio antes de fechar.`,
      };
    }

    const oldTeamId = player.teamId;
    const sellerTeam = oldTeamId !== 'free_agents' && teams[oldTeamId] ? teams[oldTeamId] : null;

    // Ao ACEITAR uma contraproposta (forcarAceite), o clube/jogador já concordou com esses termos —
    // não reavalia o interesse (evita o loop de gerar nova contraproposta). Só o caixa é validado (acima).
    if (!forcarAceite) {
      const evaluation = evaluateNegotiation(player, sellerTeam, userTeam.reputation, valor, salario);

      if (evaluation.status === 'recusada') {
        const motivo = sellerTeam
          ? `O ${sellerTeam.name} considerou a proposta por ${player.nickname} muito abaixo do esperado e recusou as negociações.`
          : `${player.nickname} recusou os termos oferecidos e seguirá no mercado.`;
        return { success: false, status: 'recusada', message: motivo };
      }

      if (evaluation.status === 'contraproposta' && evaluation.contraproposta) {
        const { valor: cValor, salario: cSalario } = evaluation.contraproposta;
        const alvo = sellerTeam ? `O ${sellerTeam.name}` : `${player.nickname}`;
        return {
          success: false,
          status: 'contraproposta',
          contraproposta: evaluation.contraproposta,
          message: `${alvo} apresentou uma contraproposta: passe de $${cValor.toLocaleString()} e salário semanal de $${cSalario.toLocaleString()}. Ajuste a oferta para fechar o acordo.`,
        };
      }
    }

    // ACEITA: efetiva a transferência de forma imutável (mesma lógica de fazerPropostaContratacao,
    // porém com valor de passe e salário negociados).
    const updatedTeams = { ...teams };
    const updatedPlayers = { ...players };

    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget - totalCost };

    let oldTeamName = 'Agente Livre';
    if (sellerTeam) {
      updatedTeams[oldTeamId] = { ...sellerTeam, budget: sellerTeam.budget + valor };
      oldTeamName = sellerTeam.name;
    }

    updatedPlayers[playerId] = {
      ...player,
      teamId: userTeamId,
      status: 'reserva',
      contractMonths: 18,
      salary: salario,
      value: Math.max(player.value, valor), // valorização: passe negociado vira o novo piso de mercado
    };

    // F1/F2: repõe o time vendedor (IA) com a MESMA role do jogador negociado (ex.: AWPer → AWPer).
    if (sellerTeam) {
      const filled = ensureFiveStarters(updatedPlayers, updatedTeams[oldTeamId], player.role);
      if (filled !== updatedPlayers) Object.assign(updatedPlayers, filled);
    }

    const news = generateTransferNews(player, oldTeamName, userTeam.name, currentWeek);

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contratação negociada de ${player.nickname}`, amount: -totalCost },
      ],
    });

    get().salvarJogo();
    return {
      success: true,
      status: 'aceita',
      message: `Acordo fechado! ${player.nickname} assinou com o ${userTeam.name} por um passe de $${valor.toLocaleString()} e salário semanal de $${salario.toLocaleString()}.`,
    };
  },

  venderJogador: (playerId) => {
    const { players, teams, userTeamId, currentWeek } = get();
    const player = players[playerId];
    const userTeam = teams[userTeamId];

    if (!player || player.teamId !== userTeamId) {
      return { success: false, message: 'Jogador não faz parte da sua equipe.' };
    }

    // Regra: Não pode vender se o time ficar com menos de 5 jogadores totais
    const userTotalPlayers = Object.values(players).filter(p => p.teamId === userTeamId).length;
    if (userTotalPlayers <= 5) {
      return { success: false, message: 'Negado! Sua equipe precisa de no mínimo 5 jogadores no elenco.' };
    }

    const updatedTeams = { ...teams };
    const updatedPlayers = { ...players };

    // Adiciona o valor do passe ao orçamento do usuário (cópia imutável)
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget + player.value };

    // Remove jogador do time do usuário
    updatedPlayers[playerId] = {
      ...player,
      teamId: 'free_agents',
      status: 'free_agent',
      contractMonths: 0
    };

    // F1/F2: se um titular saiu, promove automaticamente o melhor reserva da MESMA role (mantém 5).
    const filledAfterSale = ensureFiveStarters(updatedPlayers, updatedTeams[userTeamId], player.role);
    if (filledAfterSale !== updatedPlayers) Object.assign(updatedPlayers, filledAfterSale);

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Venda de ${player.nickname}`, amount: player.value }
      ]
    });

    get().salvarJogo();
    return { success: true, message: `Vendido! ${player.nickname} foi colocado na lista de agentes livres e o valor de $${player.value.toLocaleString()} foi creditado no seu caixa.` };
  },

  renovarContrato: (playerId) => {
    const { players } = get();
    const updatedPlayers = { ...players };
    if (players[playerId]) {
      updatedPlayers[playerId] = { ...players[playerId], contractMonths: players[playerId].contractMonths + 12 }; // adiciona 1 ano
    }
    set({ players: updatedPlayers });
    get().salvarJogo();
    return { success: true, message: 'Contrato renovado por mais 12 meses!' };
  },

  dispensarJogador: (playerId) => {
    const { players, teams, userTeamId } = get();
    const updatedPlayers = { ...players };

    const userTotalPlayers = Object.values(players).filter(p => p.teamId === userTeamId).length;
    if (userTotalPlayers <= 5) {
      return { success: false, message: 'Você precisa manter no mínimo 5 jogadores no elenco.' };
    }

    if (players[playerId]) {
      updatedPlayers[playerId] = {
        ...players[playerId],
        teamId: 'free_agents',
        status: 'free_agent',
        contractMonths: 0,
      };
    }

    // F1/F2: promove o melhor reserva (preferindo a role do dispensado) para manter 5 titulares.
    const userTeamObj = teams[userTeamId];
    if (userTeamObj) {
      const filled = ensureFiveStarters(updatedPlayers, userTeamObj, players[playerId]?.role);
      if (filled !== updatedPlayers) Object.assign(updatedPlayers, filled);
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
    return { success: true, message: 'Jogador dispensado com sucesso.' };
  },

  assinarPatrocinio: (sponsorId) => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const sp = sponsors[sponsorId];
    if (!sp) return { success: false, message: 'Patrocinador não encontrado.' };

    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (userTeam.reputation < sp.minReputation) {
      return {
        success: false,
        message: `Negado! A ${sp.name} exige reputação mínima de ${sp.minReputation}. A reputação atual do seu time é ${userTeam.reputation}.`,
      };
    }

    if (userTeam.sponsorId && (userTeam.sponsorWeeksRemaining ?? 0) > 0) {
      const activeName = sponsors[userTeam.sponsorId]?.name ?? 'patrocinador atual';
      return {
        success: false,
        message: `Já existe um contrato ativo com ${activeName}. Rescinda o contrato atual ou aguarde sua expiração antes de assinar um novo.`,
      };
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, sponsorId, sponsorWeeksRemaining: sp.durationWeeks };

    set({
      teams: updatedTeams,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contrato assinado: ${sp.name}`, amount: 0 },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato assinado com a ${sp.name}! Receita semanal de $${sp.weeklyIncome.toLocaleString()} por ${sp.durationWeeks} semanas.`,
    };
  },

  rescindirPatrocinio: () => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (!userTeam.sponsorId || !sponsors[userTeam.sponsorId]) {
      return { success: false, message: 'Não há contrato de patrocínio ativo para rescindir.' };
    }

    const sp = sponsors[userTeam.sponsorId];
    const weeksRemaining = userTeam.sponsorWeeksRemaining ?? 0;
    const penalty = Math.max(0, Math.round(sp.weeklyIncome * weeksRemaining * 0.2));

    if (userTeam.budget < penalty) {
      return {
        success: false,
        message: `Saldo insuficiente para pagar a multa rescisória de $${penalty.toLocaleString()}.`,
      };
    }

    const updatedTeams = { ...teams };
    const { sponsorId: _sid, sponsorWeeksRemaining: _swr, ...teamWithoutSponsor } = userTeam;
    updatedTeams[userTeamId] = { ...teamWithoutSponsor, budget: userTeam.budget - penalty };

    const news: NewsItem = {
      id: `sponsor_rescind_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} rescinde contrato com ${sp.name}`,
      content: `O ${userTeam.name} rescindiu antecipadamente o contrato de patrocínio com a ${sp.name}, pagando uma multa rescisória de $${penalty.toLocaleString()}. A receita semanal foi encerrada.`,
      category: 'general',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Multa rescisória: ${sp.name}`, amount: -penalty },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato com a ${sp.name} rescindido. Multa de $${penalty.toLocaleString()} debitada do caixa.`,
    };
  },

  renegociarPatrocinio: () => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (!userTeam.sponsorId || !sponsors[userTeam.sponsorId]) {
      return { success: false, message: 'Não há contrato de patrocínio ativo para renegociar.' };
    }

    const weeksRemaining = userTeam.sponsorWeeksRemaining ?? 0;
    if (weeksRemaining > 4) {
      return {
        success: false,
        message: `A renegociação só é permitida nas últimas 4 semanas do contrato. Restam ${weeksRemaining} semanas.`,
      };
    }

    const sp = sponsors[userTeam.sponsorId];
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, sponsorWeeksRemaining: sp.durationWeeks };

    const news: NewsItem = {
      id: `sponsor_renew_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} renova patrocínio com ${sp.name}`,
      content: `O ${userTeam.name} renovou o acordo de patrocínio com a ${sp.name} por mais ${sp.durationWeeks} semanas, mantendo a receita semanal de $${sp.weeklyIncome.toLocaleString()}.`,
      category: 'general',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contrato renegociado: ${sp.name}`, amount: 0 },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato renovado por mais ${sp.durationWeeks} semanas com a ${sp.name}.`,
    };
  },

  // Mapeia cada role do Staff ao seu slot correspondente em Team.staff (DRY entre contratar/demitir)
  // (definido inline nas ações abaixo)

  contratarStaff: (staff) => {
    const { userTeamId, teams, staffList, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    const slotByRole: Record<Staff['role'], keyof Team['staff']> = {
      coach: 'coachId',
      analyst: 'analystId',
      psychologist: 'psychologistId',
      scout: 'scoutId',
      physio: 'physioId',
    };
    const slot = slotByRole[staff.role];

    // Custo de luvas de entrada = 4 semanas de salário
    const signingCost = staff.salary * 4;
    if (userTeam.budget < signingCost) {
      return {
        success: false,
        message: `Saldo insuficiente! A contratação de ${staff.name} custa $${signingCost.toLocaleString()} (4 semanas de salário).`,
      };
    }

    // Se já houver um membro no slot, devolve mensagem orientando a demissão primeiro
    if (userTeam.staff[slot]) {
      return {
        success: false,
        message: `Já existe um(a) ${staff.role} contratado(a). Demita o atual antes de contratar ${staff.name}.`,
      };
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: userTeam.budget - signingCost,
      staff: { ...userTeam.staff, [slot]: staff.id },
    };

    const updatedStaffList = { ...staffList, [staff.id]: staff };

    set({
      teams: updatedTeams,
      staffList: updatedStaffList,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contratação: ${staff.name}`, amount: -signingCost },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `${staff.name} foi contratado(a) por $${signingCost.toLocaleString()} (salário semanal de $${staff.salary.toLocaleString()}).`,
    };
  },

  demitirStaff: (role) => {
    const { userTeamId, teams, staffList, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    const slotByRole: Record<Staff['role'], keyof Team['staff']> = {
      coach: 'coachId',
      analyst: 'analystId',
      psychologist: 'psychologistId',
      scout: 'scoutId',
      physio: 'physioId',
    };
    const slot = slotByRole[role];
    const staffId = userTeam.staff[slot];
    if (!staffId) {
      return { success: false, message: 'Nenhum membro contratado neste cargo.' };
    }

    const member = staffList[staffId];
    const severance = member ? member.salary * 2 : 0;
    if (userTeam.budget < severance) {
      return {
        success: false,
        message: `Saldo insuficiente para pagar a rescisão de $${severance.toLocaleString()}.`,
      };
    }

    // Remove o slot do staff de forma imutável
    const { [slot]: _removedSlot, ...staffWithoutRole } = userTeam.staff;
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: userTeam.budget - severance,
      staff: staffWithoutRole,
    };

    // Remove do staffList global
    const { [staffId]: _removedMember, ...staffListWithout } = staffList;

    set({
      teams: updatedTeams,
      staffList: staffListWithout,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Rescisão: ${member ? member.name : 'Staff'}`, amount: -severance },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: member
        ? `${member.name} foi demitido(a). Rescisão de $${severance.toLocaleString()} debitada do caixa.`
        : 'Cargo de comissão técnica liberado.',
    };
  },

  // BASE / SCOUT (spec §18): investe na base para observar 1-2 jovens talentos.
  investirNaBase: () => {
    const { userTeamId, teams, currentWeek, youthProspects } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (userTeam.budget < INVESTIMENTO_BASE_CUSTO) {
      return {
        success: false,
        message: `Saldo insuficiente! O investimento na base custa $${INVESTIMENTO_BASE_CUSTO.toLocaleString()}.`,
      };
    }

    // Gera 1-2 jovens observados (não entram no elenco — ficam na lista de prospects)
    const quantidade = 1 + Math.floor(Math.random() * 2);
    const novosJovens: Player[] = [];
    for (let i = 0; i < quantidade; i++) {
      const jovem = generatePlayer({ isYouth: true });
      jovem.teamId = 'free_agents'; // ainda não pertence ao elenco
      jovem.status = 'free_agent';
      novosJovens.push(jovem);
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget - INVESTIMENTO_BASE_CUSTO };

    const news: NewsItem = {
      id: `base_scout_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} investe na base e revela ${quantidade} jovem(ns) talento(s)`,
      content: `O departamento de scout do ${userTeam.name} mapeou ${quantidade} nova(s) promessa(s) após um novo aporte na infraestrutura da base. Avalie os jovens observados na Academia e promova quem merecer uma chance no elenco principal.`,
      category: 'base',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      youthProspects: [...youthProspects, ...novosJovens],
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: 'Investimento na Base', amount: -INVESTIMENTO_BASE_CUSTO },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Investimento concluído! ${quantidade} jovem(ns) talento(s) sendo observado(s) na base.`,
    };
  },

  // Promove um jovem observado ao elenco principal como reserva.
  promoverJovem: (playerId) => {
    const { userTeamId, players, youthProspects, currentWeek } = get();
    const jovem = youthProspects.find((p) => p.id === playerId);
    if (!jovem) {
      return { success: false, message: 'Jovem não encontrado na lista de observados.' };
    }

    // Teto de elenco: o time do usuário não pode passar de 12 jogadores (titulares + reservas).
    const elencoAtual = Object.values(players).filter(
      (p) => p.teamId === userTeamId && (p.status === 'titular' || p.status === 'reserva')
    ).length;
    if (elencoAtual >= 12) {
      return { success: false, message: 'Elenco cheio! O limite é de 12 jogadores (titulares + reservas). Dispense ou venda alguém antes de promover.' };
    }

    const promovido: Player = {
      ...jovem,
      teamId: userTeamId,
      status: 'reserva',
      contractMonths: 24, // contrato júnior padrão
    };

    const news: NewsItem = {
      id: `base_promote_${promovido.id}_${currentWeek}`,
      title: `${promovido.nickname} é promovido da base ao elenco do ${get().teams[userTeamId]?.name ?? ''}`,
      content: `A joia da base ${promovido.nickname} (${promovido.age} anos, overall ${promovido.overall}, potencial ${promovido.potential}) assinou seu primeiro contrato profissional e foi integrado(a) ao elenco como reserva. Os olheiros enxergam um futuro promissor.`,
      category: 'base',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      players: { ...players, [promovido.id]: promovido },
      youthProspects: youthProspects.filter((p) => p.id !== playerId),
      historyNews: [news, ...get().historyNews],
    });
    get().salvarJogo();
    return { success: true, message: `${promovido.nickname} foi promovido(a) ao elenco como reserva!` };
  },

  // Edição (editor) de jogador — atualização imutável aplicando o patch parcial.
  editarJogador: (playerId, patch) => {
    const { players } = get();
    const existing = players[playerId];
    if (!existing) return;
    set({ players: { ...players, [playerId]: { ...existing, ...patch } } });
    get().salvarJogo();
  },

  // Define/limpa o emblema (logoUrl) de um time. String vazia => remove o logo (volta ao
  // emblema procedural). Atualização IMUTÁVEL: copia o map e o time alterado.
  editarTimeLogo: (teamId, logoUrl) => {
    const { teams } = get();
    const existing = teams[teamId];
    if (!existing) return;
    const trimmed = logoUrl.trim();
    set({
      teams: {
        ...teams,
        [teamId]: { ...existing, logoUrl: trimmed.length > 0 ? trimmed : undefined },
      },
    });
    get().salvarJogo();
  },

  setScreen: (screen) => set({ currentScreen: screen }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  // Toasts in-app: estado UI transiente (não persistido no save). Atualização imutável via spread.
  addToast: (message, type = 'info') => {
    const toast: Toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setSelectedTeamId: (id) => set({ selectedTeamId: id }),
  setActiveTournamentId: (id) => set({ activeTournamentId: id }),

  iniciarPartidaAtiva: (match) => {
    set({
      activeMatch: match,
      activeMatchRoundIndex: 0,
      isSimulatingMatch: true,
      currentScreen: 'matchSim'
    });
  },

  // Gera uma partida contra um adversário e abre o pré-jogo.
  // Centraliza a criação do confronto para que Dashboard e simulação usem a MESMA partida.
  iniciarPartidaContra: (opponentId, competitionId = 'amistoso') => {
    const { userTeamId, teams, players, tournaments, staffList } = get();
    const userTeam = teams[userTeamId];
    const oppTeam = teams[opponentId];
    if (!userTeam || !oppTeam) return false;

    const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
    if (userSquad.length < 5) {
      get().addToast('⚠️ Escalação Incompleta! Você precisa escalar exatamente 5 titulares na aba de Elenco antes de disputar uma partida.', 'error');
      return false;
    }

    const oppSquad = Object.values(players).filter(p => p.teamId === opponentId && p.status === 'titular');
    
    // Determina o formato (bestOf)
    let bestOf: 1 | 3 | 5 = 1; 
    if (competitionId === 'amistoso') {
      bestOf = 3; // Friendly padrão é MD3
    } else {
      const tourney = tournaments[competitionId];
      if (tourney) {
        if (tourney.phase === 'playoff') {
          const isFinal = tourney.currentRound >= Math.max(1, Math.ceil(Math.log2(Math.max(2, tourney.playoffTeamIds?.length ?? 8)))) - 1;
          bestOf = isFinal ? (tourney.bestOfFinal ?? 3) : (tourney.bestOfPlayoff ?? 3);
        } else if (tourney.stageFormat === 'swiss') {
          const rec = tourney.swissRecords?.[userTeamId];
          bestOf = (rec && (rec.w === 2 || rec.l === 2)) ? 3 : 1;
        } else if (tourney.stageFormat === 'gsl_groups') {
          bestOf = 3; // GSL sempre MD3 para consistência
        } else if (tourney.stageFormat === 'round_robin') {
          bestOf = 1; // Round robin MD1
        } else {
          bestOf = 1;
        }
      }
    }

    // Simula veto de mapas
    const vetoRes = simulateMapVeto(userTeam, oppTeam, realMaps, bestOf === 5 ? 'MD5' : bestOf === 3 ? 'MD3' : 'MD1');
    const seriesMatches: Match[] = [];
    let scoreA = 0;
    let scoreB = 0;
    const target = Math.floor(bestOf / 2) + 1;
    
    // Efeito do Analista (Fase D)
    const analystId = userTeam.staff.analystId;
    const userAnalystLevel = analystId ? staffList[analystId]?.level ?? 0 : 0;

    for (const mapId of vetoRes.selectedMapIds) {
      const mapObj = realMaps.find(m => m.id === mapId) ?? realMaps[0];
      const m = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapObj, competitionId, { a: userAnalystLevel });
      seriesMatches.push(m);
      if (m.winnerId === userTeamId) scoreA++;
      else scoreB++;
      if (scoreA >= target || scoreB >= target) break;
    }

    const activeSeries = {
      tournamentId: competitionId,
      teamAId: userTeamId,
      teamBId: opponentId,
      bestOf,
      vetoSteps: vetoRes.steps,
      mapIds: vetoRes.selectedMapIds,
      currentMapIndex: 0,
      matches: seriesMatches,
      scoreA: 0, // Acumulado em exibição
      scoreB: 0,
      isFinished: false,
      winnerId: undefined as string | undefined
    };

    set({
      activeSeries,
      activeMatch: seriesMatches[0],
      activeMatchRoundIndex: 0,
      isSimulatingMatch: false,
      currentScreen: 'matchPreview'
    });
    return true;
  },

  // Do pré-jogo: assiste a partida round a round (ativa os controles de simulação visual).
  assistirPartida: () => {
    if (!get().activeSeries) return;
    set({ isSimulatingMatch: true, currentScreen: 'mapVeto', activeMatchRoundIndex: 0 });
  },

  avancarRoundVisual: () => {
    const { activeMatch, activeMatchRoundIndex, activeSeries } = get();
    if (!activeMatch || !activeSeries) return false;

    const nextIndex = activeMatchRoundIndex + 1;
    if (nextIndex >= activeMatch.rounds.length) {
      // Fim do mapa atual! Atualiza os placares da série
      const mapWinnerId = activeMatch.winnerId;
      const newScoreA = activeSeries.scoreA + (mapWinnerId === activeSeries.teamAId ? 1 : 0);
      const newScoreB = activeSeries.scoreB + (mapWinnerId === activeSeries.teamBId ? 1 : 0);
      const target = Math.floor(activeSeries.bestOf / 2) + 1;
      const finished = newScoreA >= target || newScoreB >= target;

      const nextMapIdx = activeSeries.currentMapIndex + 1;

      const updatedSeries = {
        ...activeSeries,
        scoreA: newScoreA,
        scoreB: newScoreB,
        currentMapIndex: finished ? activeSeries.currentMapIndex : nextMapIdx,
        isFinished: finished,
        winnerId: finished ? (newScoreA > newScoreB ? activeSeries.teamAId : activeSeries.teamBId) : undefined
      };

      set({
        activeSeries: updatedSeries,
        isSimulatingMatch: false
      });
      return false;
    }

    set({ activeMatchRoundIndex: nextIndex });
    return true;
  },

  finalizarPartidaAtiva: () => {
    const { activeSeries, userTeamId, teams, currentWeek, tournaments } = get();
    if (!activeSeries) return;

    // Se é simulação rápida direta do Preview, finaliza a série no background imediatamente
    let finalSeries = { ...activeSeries };
    if (!finalSeries.isFinished) {
      let scoreA = 0;
      let scoreB = 0;
      finalSeries.matches.forEach(m => {
        if (m.winnerId === finalSeries.teamAId) scoreA++;
        else scoreB++;
      });
      finalSeries.scoreA = scoreA;
      finalSeries.scoreB = scoreB;
      finalSeries.isFinished = true;
      finalSeries.winnerId = scoreA > scoreB ? finalSeries.teamAId : finalSeries.teamBId;
    }

    const isUserWinner = finalSeries.winnerId === userTeamId;
    const userTeam = teams[userTeamId];
    const updatedTeams = { ...teams };
    
    const tourneyForMatch = tournaments[finalSeries.tournamentId];
    const isFriendly = finalSeries.tournamentId === 'amistoso' || !tourneyForMatch;
    const eventWeight = tourneyForMatch ? EVENT_WEIGHT[tourneyForMatch.tier] : 0;
    
    const finEntries: { week: number; description: string; amount: number }[] = [];

    if (isFriendly) {
      updatedTeams[userTeamId] = userTeam;
    } else if (isUserWinner) {
      const basePrize = 5000;
      const activeSponsor = userTeam.sponsorId ? get().sponsors[userTeam.sponsorId] : undefined;
      const winBonus = activeSponsor?.winBonus ?? 0;

      updatedTeams[userTeamId] = {
        ...userTeam,
        points: userTeam.points + Math.round(50 * eventWeight),
        budget: userTeam.budget + basePrize + winBonus,
        reputation: Math.min(100, userTeam.reputation + 2),
        stats: { ...userTeam.stats, wins: userTeam.stats.wins + 1 },
      };

      finEntries.push({ week: currentWeek, description: 'Premiação por Vitória (Série)', amount: basePrize });
      if (activeSponsor && winBonus > 0) {
        finEntries.push({ week: currentWeek, description: `Bônus de Vitória: ${activeSponsor.name}`, amount: winBonus });
      }
    } else {
      updatedTeams[userTeamId] = {
        ...userTeam,
        points: Math.max(10, userTeam.points - 20),
        stats: { ...userTeam.stats, losses: userTeam.stats.losses + 1 },
      };
    }

    // Registra notícia sobre a partida (usa o primeiro mapa para ilustração da notícia)
    const winnerTeam = finalSeries.winnerId === userTeamId ? userTeam : teams[finalSeries.teamAId === userTeamId ? finalSeries.teamBId : finalSeries.teamAId];
    const loserTeam = finalSeries.winnerId === userTeamId ? teams[finalSeries.teamAId === userTeamId ? finalSeries.teamBId : finalSeries.teamAId] : userTeam;
    
    const firstMatch = finalSeries.matches[0];
    const mvpPlayer = get().players[firstMatch.mvpPlayerId ?? ''] ?? Object.values(get().players)[0];
    const mapObj = realMaps.find(m => m.id === firstMatch.mapId) ?? realMaps[0];
    const news = generateMatchNews(winnerTeam, loserTeam, finalSeries.scoreA, finalSeries.scoreB, mvpPlayer, mapObj.name, currentWeek);

    // Progresso de campeonato interativo
    const tourney = tournaments[finalSeries.tournamentId];
    let championNews: NewsItem | null = null;
    if (tourney && !tourney.isFinished) {
      resolverProgressoTorneioInterativo(get, set, finalSeries);
      
      const updatedTourney = get().tournaments[finalSeries.tournamentId];
      if (updatedTourney) {
        if (isUserWinner) {
          const roundIndex = tourney.currentRound;
          const roundPrize = Math.round(tourney.prizePool * Math.min(0.20, 0.05 * (roundIndex + 1)));
          if (roundPrize > 0) {
            const teamBeforeRoundPrize = updatedTeams[userTeamId];
            updatedTeams[userTeamId] = {
              ...teamBeforeRoundPrize,
              budget: teamBeforeRoundPrize.budget + roundPrize,
            };
            finEntries.push({ week: currentWeek, description: `Premiação de rodada: ${tourney.name}`, amount: roundPrize });
          }

          if (updatedTourney.isFinished && updatedTourney.championId === userTeamId) {
            const titleSponsor = userTeam.sponsorId ? get().sponsors[userTeam.sponsorId] : undefined;
            const titleBonus = titleSponsor?.titleBonus ?? 0;

            const champTeam = updatedTeams[userTeamId];
            updatedTeams[userTeamId] = {
              ...champTeam,
              budget: champTeam.budget + tourney.prizePool + titleBonus,
              points: champTeam.points + Math.round(150 * EVENT_WEIGHT[tourney.tier]),
              reputation: Math.min(100, champTeam.reputation + 8),
              stats: { ...champTeam.stats, titles: champTeam.stats.titles + 1 },
            };

            finEntries.push({ week: currentWeek, description: `Premiação: Campeão do ${tourney.name}`, amount: tourney.prizePool });
            if (titleSponsor && titleBonus > 0) {
              finEntries.push({ week: currentWeek, description: `Bônus de Título: ${titleSponsor.name}`, amount: titleBonus });
            }
            championNews = {
              id: `champ_${tourney.id}_${currentWeek}`,
              title: `${userTeam.name} é CAMPEÃO do ${tourney.name}!`,
              content: `Em uma campanha de tirar o fôlego, o ${userTeam.name} conquistou o título do ${tourney.name} e faturou $${tourney.prizePool.toLocaleString()} em premiação. A torcida faz a festa!`,
              category: 'results',
              week: currentWeek,
              dateStr: `Semana ${currentWeek}`,
            };
          }
        } else {
          if (updatedTourney.isFinished && updatedTourney.championId && updatedTourney.championId !== userTeamId) {
            const champTeamId = updatedTourney.championId;
            const champTeam = updatedTeams[champTeamId] ?? teams[champTeamId] ?? Object.values(teams)[0];
            if (champTeam) {
              updatedTeams[champTeamId] = {
                ...champTeam,
                budget: champTeam.budget + tourney.prizePool,
                points: champTeam.points + Math.round(150 * EVENT_WEIGHT[tourney.tier]),
                stats: { ...champTeam.stats, titles: (champTeam.stats?.titles ?? 0) + 1, wins: (champTeam.stats?.wins ?? 0) + 1 },
              };
            }
            championNews = {
              id: `champ_ai_${tourney.id}_${currentWeek}`,
              title: `${champTeam?.name ?? 'Equipe'} conquista o ${tourney.name}!`,
              content: `O ${champTeam?.name ?? 'vencedor'} superou os adversários no bracket e levantou a taça do ${tourney.name}, faturando $${tourney.prizePool.toLocaleString()} em premiação. Um novo nome entra para a história da competição.`,
              category: 'results',
              week: currentWeek,
              dateStr: `Semana ${currentWeek}`,
            };
          }
        }
      }
    }

    // Acúmulo de stats de carreira para todos os mapas da série (HLTV Style)
    const players = get().players;
    let updatedPlayers = { ...players };
    if (!isFriendly) {
      finalSeries.matches.forEach(mapMatch => {
        const rounds = mapMatch.scoreA + mapMatch.scoreB;
        const mvpId = mapMatch.mvpPlayerId ?? '';

        for (const [playerId, live] of Object.entries(mapMatch.liveStats)) {
          const prev = updatedPlayers[playerId];
          if (!prev) continue;

          const safeRounds = Math.max(1, rounds);
          const kpr = live.kills / safeRounds;
          const dpr = live.deaths / safeRounds;
          const adrMatch = live.damage / safeRounds;
          const kast = Math.max(
            40,
            Math.min(100, Math.round(70 + (live.kills - live.deaths) * 2 + live.assists * 1.5))
          );
          const impact = 2.13 * kpr + 0.42 * (live.assists / safeRounds) - 0.41;
          const ratingMatch = Math.max(
            0,
            0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adrMatch + 0.1587
          );

          const old = prev.stats;
          const mapsOld = old.mapsPlayed;
          const mapsNew = mapsOld + 1;

          const newRating = Math.round(((old.rating * mapsOld + ratingMatch) / mapsNew) * 100) / 100;
          const newAdr = Math.round((old.adr * mapsOld + adrMatch) / mapsNew);
          const newKast = Math.round((old.kast * mapsOld + kast) / mapsNew);

          updatedPlayers[playerId] = {
            ...prev,
            stats: {
              ...old,
              kills: old.kills + live.kills,
              deaths: old.deaths + live.deaths,
              assists: old.assists + live.assists,
              firstKills: old.firstKills + live.firstKills,
              clutchesWon: old.clutchesWon + live.clutchesWon,
              mapsPlayed: mapsNew,
              mvps: old.mvps + (playerId === mvpId ? 1 : 0),
              rating: newRating,
              adr: newAdr,
              kast: newKast,
            },
          };
        }
      });
    }

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      finishedMatch: finalSeries.matches[0], // Legado
      activeSeries: finalSeries,
      activeMatch: null,
      isSimulatingMatch: false,
      currentScreen: 'matchResult',
      financialHistory: [...get().financialHistory, ...finEntries],
      historyNews: championNews ? [championNews, news, ...get().historyNews] : [news, ...get().historyNews]
    });

    get().salvarJogo();
  },

  fecharResultado: () => {
    // Encerra a tela de resultado e retorna ao painel principal
    set({
      finishedMatch: null,
      activeMatch: null,
      activeSeries: null,
      isSimulatingMatch: false,
      activeMatchRoundIndex: 0,
      currentScreen: 'dashboard'
    });
  },

  iniciarProximaTemporada: () => {
    // Fecha o resumo de fim de temporada e retorna ao painel para iniciar a nova temporada
    set({ seasonSummary: null, currentScreen: 'dashboard' });
    get().salvarJogo();
  },

  salvarJogo: (slot = 'prostrike_save') => {
    const {
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects,
      historicoTemporadas,
      invitations,
      isFixedTeam
    } = get();

    const saveObj: SaveGame = {
      id: slot,
      saveName: `Carreira ${managerName} - Ano ${currentSeason} (Semana ${currentWeek})`,
      createdAt: new Date().toISOString(),
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects,
      historicoTemporadas,
      invitations,
      isFixedTeam
    };

    localStorage.setItem(slot, JSON.stringify(saveObj));
  },

  carregarJogo: (slot = 'prostrike_save') => {
    const saveStr = localStorage.getItem(slot);
    if (!saveStr) return false;

    try {
      const saveObj = JSON.parse(saveStr) as SaveGame;
      set({
        managerName: saveObj.managerName,
        managerNationality: saveObj.managerNationality,
        currentWeek: saveObj.currentWeek,
        currentSeason: saveObj.currentSeason,
        userTeamId: saveObj.userTeamId,
        difficulty: saveObj.difficulty ?? 'normal',
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: normalizeTournaments(saveObj.tournaments),
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
        trainingPlan: saveObj.trainingPlan ?? { intensity: 'normal', focus: 'aim' },
        youthProspects: saveObj.youthProspects ?? [],
        historicoTemporadas: saveObj.historicoTemporadas ?? [],
        invitations: saveObj.invitations ?? [],
        isFixedTeam: saveObj.isFixedTeam ?? false,
        currentScreen: 'dashboard',
        gameLoaded: true
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  exportarSave: () => {
    const {
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects,
      historicoTemporadas,
      invitations,
      isFixedTeam
    } = get();

    const saveObj: SaveGame = {
      id: 'export',
      saveName: `Exportado - ${managerName}`,
      createdAt: new Date().toISOString(),
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects,
      historicoTemporadas,
      invitations,
      isFixedTeam
    };

    return btoa(JSON.stringify(saveObj));
  },

  importarSave: (jsonStr) => {
    try {
      const decoded = atob(jsonStr);
      const saveObj = JSON.parse(decoded) as SaveGame;
      set({
        managerName: saveObj.managerName,
        managerNationality: saveObj.managerNationality,
        currentWeek: saveObj.currentWeek,
        currentSeason: saveObj.currentSeason,
        userTeamId: saveObj.userTeamId,
        difficulty: saveObj.difficulty ?? 'normal',
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: normalizeTournaments(saveObj.tournaments),
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
        trainingPlan: saveObj.trainingPlan ?? { intensity: 'normal', focus: 'aim' },
        youthProspects: saveObj.youthProspects ?? [],
        historicoTemporadas: saveObj.historicoTemporadas ?? [],
        invitations: saveObj.invitations ?? [],
        isFixedTeam: saveObj.isFixedTeam ?? false,
        currentScreen: 'dashboard',
        gameLoaded: true
      });
      get().salvarJogo();
      return true;
    } catch (e) {
      return false;
    }
  },

  excluirSave: (slot = 'prostrike_save') => {
    localStorage.removeItem(slot);
  },

  resetarDadosEditor: () => {
    // Remove apenas o save principal (antes apagava TODOS os dados do localStorage do site)
    localStorage.removeItem('prostrike_save');
    window.location.reload();
  }
}));

