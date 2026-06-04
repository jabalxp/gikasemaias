import { 
  Team, 
  Player, 
  Tournament, 
  GameMap, 
  Sponsor, 
  Staff, 
  NewsItem, 
  SeasonSummary, 
  SeasonHistoryEntry, 
  TournamentInvitation, 
  UserTournamentResult, 
  TournamentMatch, 
  TournamentStanding, 
  SeasonChampionSnapshot
} from '../../types';
import { realMaps } from '../data/realMaps';
import { defaultCompetitions } from '../data/defaultCompetitions';
import { generatePlayer, computePlayerValue } from '../generators/playerGenerator';
import { generateMatchNews, generateTransferNews } from '../generators/newsGenerator';
import { simulateWholeMatchQuick, computeTeamMod } from './matchSimulator';
import { materializeTournament, deriveEngineFormat, defaultWinProbability, type TournamentTeam } from './tournamentEngine';

// ==========================================
// CONSTANTES E CONFIGURAÇÕES
// ==========================================

const AI_WEEKLY_WIN_POINTS = 25;
const AI_WEEKLY_LOSS_POINTS = 10;

const EVENT_WEIGHT: Record<Team['tier'], number> = { 1: 1.5, 2: 1.0, 3: 0.6, 4: 0.35 };

const overallRangeByTier: Record<Team['tier'], { min: number; max: number }> = {
  1: { min: 76, max: 88 },
  2: { min: 70, max: 80 },
  3: { min: 63, max: 74 },
  4: { min: 55, max: 67 },
};

const ESSENTIAL_ROLES: readonly Player['role'][] = ['IGL', 'AWPer', 'Entry Fragger', 'Support'] as const;

export type CompetitiveRegion = 'EU' | 'AM' | 'AS';

export const canonicalRegion = (region: string): CompetitiveRegion => {
  if (/europa|europe|cis/i.test(region)) return 'EU';
  if (/[áa]sia|pac[íi]f|oceania/i.test(region)) return 'AS';
  return 'AM';
};

const MAJOR_REGION_QUOTA: Record<CompetitiveRegion, number> = { EU: 7, AM: 6, AS: 3 };

// ==========================================
// HELPERS PUROS
// ==========================================

export const computeTournamentStrength = (
  team: Team,
  players: Record<string, Player>,
  map: GameMap
): number => {
  const starters = Object.values(players).filter((p) => p.teamId === team.id && p.status === 'titular');
  if (starters.length === 0) return 1;
  const avgOverall = starters.reduce((acc, p) => acc + p.overall, 0) / starters.length;
  return Math.max(1, computeTeamMod(team, starters, map) * avgOverall);
};

export const buildTournamentTeams = (
  teamIds: readonly string[],
  teams: Record<string, Team>,
  players: Record<string, Player>,
  map: GameMap,
  excludeTeamId: string | null
): TournamentTeam[] =>
  teamIds
    .filter((id) => id !== excludeTeamId && teams[id])
    .map((id, index) => ({ id, seed: index + 1, strength: computeTournamentStrength(teams[id], players, map) }));

export const makeActiveMapPicker = (): (() => string) => {
  const active = realMaps.filter((m) => m.status === 'active');
  const pool = active.length > 0 ? active : realMaps;
  return () => pool[Math.floor(Math.random() * pool.length)].id;
};

export interface AiChampionOutcome {
  readonly championId: string;
  readonly championTeam: Team;
  readonly news: NewsItem;
  readonly matches: readonly TournamentMatch[];
  readonly standings: readonly TournamentStanding[];
}

export const crownAiChampion = (
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
    points: champTeam.points + Math.round(150 * EVENT_WEIGHT[tournament.tier]),
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

export const simulateAiWeeklyMatches = (
  teams: Record<string, Team>,
  players: Record<string, Player>,
  map: GameMap,
  excludeTeamId: string
): Record<string, Team> => {
  const startersOf = (teamId: string): Player[] =>
    Object.values(players).filter((p) => p.teamId === teamId && p.status === 'titular');

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

export const ensureFiveStarters = (
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

  if (lostRole && faltam > 0) {
    const sameRole = bestReserves().find((r) => r.role === lostRole);
    if (sameRole) updated[sameRole.id] = { ...sameRole, status: 'titular' };
    else gen(lostRole);
    faltam -= 1;
  }

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

export const computeTournamentTeamIds = (
  tournament: Pick<Tournament, 'id' | 'tier'>,
  teams: Record<string, Team>,
  userTeamId: string,
  invitations: TournamentInvitation[] = [],
  isFixedTeam = false
): string[] => {
  const userTeam = teams[userTeamId];
  const userTier = userTeam?.tier;
  
  const hasUserInvitation = invitations.some(inv => inv.tournamentId === tournament.id);
  const isEligibleForFixedSlot = isFixedTeam && (tournament.tier === 1 || tournament.tier === 2);
  const shouldGuaranteeUser = (userTier === tournament.tier) || hasUserInvitation || isEligibleForFixedSlot;

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
    for (const t of eligible) { if (picked.size >= limit) break; picked.add(t.id); }
    selected = [...picked].slice(0, limit);
  } else {
    selected = eligible.slice(0, limit).map((t) => t.id);
  }

  if (shouldGuaranteeUser && teams[userTeamId] && !selected.includes(userTeamId)) {
    selected[selected.length - 1] = userTeamId;
  }
  
  return selected;
};

// ==========================================
// PROCESSAR UMA SEMANA
// ==========================================

export const processarUmaSemana = (get: any, set: any): void => {
  const { 
    currentWeek, 
    userTeamId, 
    teams, 
    players, 
    tournaments, 
    historyNews, 
    financialHistory, 
    currentSeason, 
    trainingPlan 
  } = get() as {
    currentWeek: number;
    userTeamId: string;
    teams: Record<string, Team>;
    players: Record<string, Player>;
    tournaments: Record<string, Tournament>;
    historyNews: NewsItem[];
    financialHistory: any[];
    currentSeason: number;
    trainingPlan: any;
  };

  // 1. Há partida de campeonato do usuário nesta semana?
  const tournamentThisWeek = Object.values(tournaments).find(
    (t) => t.weekScheduled === currentWeek && !t.isFinished && t.teamIds.includes(userTeamId) && !t.userEliminated
  );

  if (tournamentThisWeek) {
    const opponents = tournamentThisWeek.teamIds.filter(id => id !== userTeamId && teams[id]);
    if (opponents.length > 0) {
      const activeMaps = realMaps.filter(m => m.status === 'active');
      const mapSelected = activeMaps[Math.floor(Math.random() * activeMaps.length)] ?? realMaps[0];

      // Determina oponente
      let oppId = '';
      if (tournamentThisWeek.stageFormat === 'swiss') {
        const swissRecs = tournamentThisWeek.swissRecords ?? {};
        const oponentesEnfrentados = tournamentThisWeek.matches
          .filter(m => m.teamAId === userTeamId || m.teamBId === userTeamId)
          .map(m => m.teamAId === userTeamId ? m.teamBId : m.teamAId);
          
        const userRec = swissRecs[userTeamId];
        const userWL = userRec ? `${userRec.w}-${userRec.l}` : '0-0';
        
        const possibleOpps = opponents.filter(id => {
          const rec = swissRecs[id] || { w: 0, l: 0 };
          const oppWL = `${rec.w}-${rec.l}`;
          const playedUser = oponentesEnfrentados.includes(id);
          return oppWL === userWL && !playedUser;
        });
        
        oppId = possibleOpps[0] ?? opponents[0];
      } else if (tournamentThisWeek.stageFormat === 'gsl_groups') {
        const userGroup = tournamentThisWeek.groups?.find(g => g.teamIds.includes(userTeamId));
        if (userGroup) {
          const completedGroupMatches = userGroup.matches.map(m => ({
            teamAId: m.teamAId,
            teamBId: m.teamBId,
            winnerId: m.winnerId
          }));
          
          if (completedGroupMatches.length === 0) {
            if (userGroup.teamIds[0] === userTeamId) oppId = userGroup.teamIds[3];
            else if (userGroup.teamIds[3] === userTeamId) oppId = userGroup.teamIds[0];
            else if (userGroup.teamIds[1] === userTeamId) oppId = userGroup.teamIds[2];
            else oppId = userGroup.teamIds[1];
          } else if (completedGroupMatches.length === 2) {
            const m1 = completedGroupMatches[0];
            const m2 = completedGroupMatches[1];
            const w1 = m1.winnerId;
            const l1 = m1.winnerId === m1.teamAId ? m1.teamBId : m1.teamAId;
            const w2 = m2.winnerId;
            const l2 = m2.winnerId === m2.teamAId ? m2.teamBId : m2.teamAId;
            
            const isUserWinner = userTeamId === w1 || userTeamId === w2;
            if (isUserWinner) {
              oppId = userTeamId === w1 ? w2 : w1;
            } else {
              oppId = userTeamId === l1 ? l2 : l1;
            }
          } else if (completedGroupMatches.length === 4) {
            const winnersMatch = completedGroupMatches[2];
            const eliminationMatch = completedGroupMatches[3];
            const deciderL = winnersMatch.winnerId === winnersMatch.teamAId ? winnersMatch.teamBId : winnersMatch.teamAId;
            const deciderW = eliminationMatch.winnerId;
            
            if (userTeamId === deciderL) oppId = deciderW;
            else oppId = deciderL;
          }
        }
      } else if (tournamentThisWeek.stageFormat === 'round_robin') {
        const userGroup = tournamentThisWeek.groups?.find(g => g.teamIds.includes(userTeamId));
        if (userGroup) {
          const rrRound = tournamentThisWeek.currentRound;
          const ids = userGroup.teamIds;
          if (rrRound === 0) {
            if (ids[0] === userTeamId) oppId = ids[3];
            else if (ids[3] === userTeamId) oppId = ids[0];
            else if (ids[1] === userTeamId) oppId = ids[2];
            else oppId = ids[1];
          } else if (rrRound === 1) {
            if (ids[0] === userTeamId) oppId = ids[2];
            else if (ids[2] === userTeamId) oppId = ids[0];
            else if (ids[3] === userTeamId) oppId = ids[1];
            else oppId = ids[3];
          } else if (rrRound === 2) {
            if (ids[0] === userTeamId) oppId = ids[1];
            else if (ids[1] === userTeamId) oppId = ids[0];
            else if (ids[2] === userTeamId) oppId = ids[3];
            else oppId = ids[2];
          }
        }
      }
      
      if (!oppId || !teams[oppId]) {
        const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, tournamentThisWeek.teamIds.length))));
        let userOpponents = tournamentThisWeek.userOpponents;
        if (!userOpponents || userOpponents.length === 0) {
          const ranked = [...opponents].sort(
            (a, b) =>
              computeTournamentStrength(teams[a], players, mapSelected) -
              computeTournamentStrength(teams[b], players, mapSelected)
          );
          userOpponents = ranked.slice(0, Math.max(1, Math.min(totalRounds, ranked.length)));
        }
        const round = tournamentThisWeek.currentRound;
        oppId = userOpponents[Math.min(round, userOpponents.length - 1)] ?? opponents[0];
      }

      const userTeam = teams[userTeamId];
      const oppTeam = teams[oppId];
      const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
      const oppSquad = Object.values(players).filter(p => p.teamId === oppId && p.status === 'titular');

      const analystId = userTeam.staff.analystId;
      const userAnalystLevel = analystId ? get().staffList[analystId]?.level ?? 0 : 0;

      const match = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapSelected, tournamentThisWeek.id, { a: userAnalystLevel });
      
      set({ 
        activeMatch: match, 
        currentScreen: 'matchPreview', 
        activeMatchRoundIndex: 0, 
        isSimulatingMatch: false,
        activeTournamentId: tournamentThisWeek.id
      });
      return;
    }
  }

  // 2. ECONOMIA SEMANAL
  const userTeam = teams[userTeamId];
  let income = 0;
  let expense = 0;

  if (userTeam.sponsorId && get().sponsors[userTeam.sponsorId]) {
    const sp = get().sponsors[userTeam.sponsorId];
    income += sp.weeklyIncome;
  }

  const tierBaseFloor: Record<number, number> = {
    1: 40000,
    2: 22000,
    3: 12000,
    4: 7000,
  };
  const baseIncome = Math.round(userTeam.reputation * 500) + (tierBaseFloor[userTeam.tier] ?? 7000);
  income += baseIncome;

  const userPlayers = Object.values(players).filter(p => p.teamId === userTeamId);
  userPlayers.forEach(p => {
    expense += p.salary;
  });

  const staffList = get().staffList;
  const staffSlots: (keyof Team['staff'])[] = ['coachId', 'analystId', 'psychologistId', 'scoutId', 'physioId'];
  staffSlots.forEach((slot) => {
    const staffId = userTeam.staff[slot];
    if (staffId && staffList[staffId]) expense += staffList[staffId].salary;
  });

  const coachLevel = userTeam.staff.coachId ? staffList[userTeam.staff.coachId]?.level ?? 0 : 0;
  const psychologistLevel = userTeam.staff.psychologistId ? staffList[userTeam.staff.psychologistId]?.level ?? 0 : 0;
  const physioLevel = userTeam.staff.physioId ? staffList[userTeam.staff.physioId]?.level ?? 0 : 0;

  let bootcampCost = 0;
  if (trainingPlan.intensity === 'bootcamp' && userTeam.budget >= 50000) {
    bootcampCost = 50000;
    expense += bootcampCost;
  }

  const netAmount = income - expense;
  const newBudget = userTeam.budget + netAmount;

  const updatedTeams = { ...teams };
  updatedTeams[userTeamId] = {
    ...userTeam,
    budget: newBudget
  };

  const newFinEntry = [
    ...financialHistory,
    { week: currentWeek, description: `Semana ${currentWeek} - Receita Operacional`, amount: income },
    { week: currentWeek, description: `Semana ${currentWeek} - Folha Salarial e Custos`, amount: -expense }
  ];

  const sponsorExpiryNews: NewsItem[] = [];
  if (updatedTeams[userTeamId].sponsorId && get().sponsors[updatedTeams[userTeamId].sponsorId as string]) {
    const activeSp = get().sponsors[updatedTeams[userTeamId].sponsorId as string];
    const weeksLeft = (updatedTeams[userTeamId].sponsorWeeksRemaining ?? 0) - 1;
    if (weeksLeft <= 0) {
      const { sponsorId: _sid, sponsorWeeksRemaining: _swr, ...teamWithoutSponsor } = updatedTeams[userTeamId];
      updatedTeams[userTeamId] = teamWithoutSponsor as Team;
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

  // 3. EVOLUÇÃO POR TREINO + ENERGIA/MORAL
  const intensityParams: Record<string, { gainChance: number; energy: number; moral: number; allAttrs: number }> = {
    leve:     { gainChance: 0.05, energy: 15,  moral: 5,  allAttrs: 0 },
    normal:   { gainChance: 0.15, energy: -5,  moral: 0,  allAttrs: 0 },
    pesada:   { gainChance: 0.30, energy: -15, moral: -2, allAttrs: 0 },
    bootcamp: { gainChance: 0.40, energy: -10, moral: 3,  allAttrs: bootcampCost > 0 ? 1 : 0 },
  };
  const baseParams = intensityParams[trainingPlan.intensity] ?? intensityParams.normal;
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
      const youthBonus = p.age <= 22 ? 1.6 : 1.0;
      const updatedAttrs: Player['attributes'] = { ...p.attributes };
      (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
        const chance = (k === focusAttr ? params.gainChance * 2 : params.gainChance) * youthBonus;
        let gain = params.allAttrs;
        if (Math.random() < chance) gain += 1;
        if (gain > 0) updatedAttrs[k] = Math.min(99, updatedAttrs[k] + gain);
      });

      const physioBonus = physioLevel > 0 ? physioLevel * 2 : 0;
      const updatedEnergy = Math.max(0, Math.min(100, p.energy + params.energy + physioBonus));

      const psychologistBonus = psychologistLevel > 0 ? psychologistLevel * 3 : 0;
      let moralDelta = params.moral + psychologistBonus;
      if (caixaNegativo) moralDelta -= 4;
      const updatedMoral = Math.max(0, Math.min(100, p.moral + moralDelta));

      const updatedOverall = Math.min(99, Math.round((updatedAttrs.aim + updatedAttrs.gamesense + updatedAttrs.clutch + updatedAttrs.utility + updatedAttrs.igl) / 5));

      updatedPlayers[p.id] = {
        ...p,
        attributes: updatedAttrs,
        energy: updatedEnergy,
        moral: updatedMoral,
        overall: updatedOverall,
      };
    } else if (p.status === 'reserva') {
      updatedPlayers[p.id] = {
        ...p,
        energy: Math.min(100, p.energy + 12),
        moral: caixaNegativo ? Math.max(0, p.moral - 4) : p.moral,
      };
    }
  });

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

  const aiInterestNews: NewsItem[] = [];
  if (Math.random() < 0.15) {
    const venadeis = Object.values(updatedPlayers).filter(
      (p) => p.teamId === userTeamId && (p.status === 'titular' || p.status === 'reserva')
    );
    if (venadeis.length > 0) {
      const target = venadeis[Math.floor(Math.random() * venadeis.length)];
      const interestedTeams = Object.values(teams).filter(
        (t) => t.id !== userTeamId && t.id !== 'free_agents' && t.tier <= updatedTeams[userTeamId].tier
      );
      const bidder = interestedTeams.length > 0
        ? interestedTeams[Math.floor(Math.random() * interestedTeams.length)]
        : null;
      const bidValue = Math.round(target.value * (1.1 + Math.random() * 0.4));
      aiInterestNews.push({
        id: `ai_bid_${currentSeason}_${currentWeek}_${target.id}`,
        title: bidder
          ? `${bidder.name} sonda a contratação de ${target.nickname}!`
          : `Clubes do exterior sonda de ${target.nickname}!`,
        content: `${bidder ? `O ${bidder.name}` : 'Uma equipe internacional'} demonstrou interesse em ${target.nickname} (overall ${target.overall}) e teria oferecido cerca de $${bidValue.toLocaleString()} pelo passe. A diretoria do ${updatedTeams[userTeamId].name} não é obrigada a vender — avalie se é uma boa oportunidade de mercado na aba de Mercado/Elenco.`,
        category: 'transfers',
        week: currentWeek,
        dateStr: `Semana ${currentWeek}`,
      });
    }
  }

  const aiWeekMap = realMaps.filter(m => m.status === 'active');
  const aiBackgroundMap = aiWeekMap[Math.floor(Math.random() * aiWeekMap.length)] ?? realMaps[0];
  const aiWeeklyUpdates = simulateAiWeeklyMatches(updatedTeams, updatedPlayers, aiBackgroundMap, userTeamId);
  Object.assign(updatedTeams, aiWeeklyUpdates);

  const nextWeek = currentWeek + 1;

  set({
    currentWeek: nextWeek,
    teams: updatedTeams,
    players: updatedPlayers,
    financialHistory: newFinEntry,
    historyNews: [...aiInterestNews, ...newsAfterWeek],
  });
};

// ==========================================
// PROCESSAR FIM DE TEMPORADA
// ==========================================

export const processarFimTemporada = (get: any, set: any): void => {
  const { 
    currentWeek, 
    userTeamId, 
    teams, 
    players, 
    tournaments, 
    historyNews, 
    financialHistory, 
    currentSeason, 
    historicoTemporadas 
  } = get() as {
    currentWeek: number;
    userTeamId: string;
    teams: Record<string, Team>;
    players: Record<string, Player>;
    tournaments: Record<string, Tournament>;
    historyNews: NewsItem[];
    financialHistory: any[];
    currentSeason: number;
    historicoTemporadas: SeasonHistoryEntry[];
  };

  const activeMapsForBracket = realMaps.filter(m => m.status === 'active');
  const resolvedTournaments: Record<string, Tournament> = { ...tournaments };
  const updatedTeams = { ...teams };
  const updatedPlayers = { ...players };

  Object.values(tournaments).forEach((t) => {
    if (t.isFinished && t.championId && updatedTeams[t.championId]) return;
    const bracketMap = activeMapsForBracket[Math.floor(Math.random() * activeMapsForBracket.length)] ?? realMaps[0];
    
    const aiOutcome = crownAiChampion(t, updatedTeams, updatedPlayers, t.teamIds.includes(userTeamId) && t.userEliminated ? userTeamId : null, bracketMap, currentWeek);
    if (aiOutcome) {
      updatedTeams[aiOutcome.championId] = aiOutcome.championTeam;
      resolvedTournaments[t.id] = {
        ...t,
        isFinished: true,
        championId: aiOutcome.championId,
        matches: [...aiOutcome.matches],
        standings: [...aiOutcome.standings],
      };
    } else {
      resolvedTournaments[t.id] = {
        ...t,
        isFinished: true,
        championId: t.teamIds[0] ?? '',
      };
    }
  });

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

  const invitationsGenerated: TournamentInvitation[] = [];
  const nextSeason = currentSeason + 1;
  const userTeamObj = updatedTeams[userTeamId];
  
  let isFixedTeam = get().isFixedTeam ?? false;
  if (userTeamObj && userTeamObj.reputation >= 80) {
    isFixedTeam = true;
  }

  const userTitles = champions.filter(c => c.isUserChampion);
  userTitles.forEach(t => {
    const solvedT = resolvedTournaments[t.tournamentId];
    if (solvedT && solvedT.tier > 1) {
      const nextTierTournaments = Object.values(resolvedTournaments).filter(tor => tor.tier === (solvedT.tier - 1));
      const targetTor = nextTierTournaments[0];
      if (targetTor) {
        invitationsGenerated.push({
          tournamentId: targetTor.id,
          tournamentName: targetTor.name,
          tier: targetTor.tier,
          reason: 'champion',
          season: currentSeason
        });
      }
    }
  });

  if (isFixedTeam) {
    Object.values(resolvedTournaments).forEach(t => {
      if (t.tier === 1 || t.tier === 2) {
        invitationsGenerated.push({
          tournamentId: t.id,
          tournamentName: t.name,
          tier: t.tier,
          reason: 'fixed_slot',
          season: currentSeason
        });
      }
    });
  }

  const promotionNews: NewsItem[] = [];
  if (userTeamObj) {
    const prevSeasonTotals = historicoTemporadas
      .filter((h) => h.season !== currentSeason)
      .reduce((acc, h) => ({ w: acc.w + h.userWins, l: acc.l + h.userLosses }), { w: 0, l: 0 });
    const seasonWins = Math.max(0, userTeamObj.stats.wins - prevSeasonTotals.w);
    const seasonLosses = Math.max(0, userTeamObj.stats.losses - prevSeasonTotals.l);

    const wonTierTitle = champions.some(
      c => c.isUserChampion && resolvedTournaments[c.tournamentId]?.tier === userTeamObj.tier
    );
    const strongSeason = wonTierTitle || (seasonWins >= 6 && seasonWins > seasonLosses);
    const weakSeason = !wonTierTitle && seasonLosses >= 6 && seasonLosses > seasonWins;

    const currentTier = userTeamObj.tier;
    const promote = strongSeason && currentTier > 1;
    const relegate = weakSeason && currentTier < 4;

    if (promote || relegate) {
      const newTier = (promote ? currentTier - 1 : currentTier + 1) as Team['tier'];
      updatedTeams[userTeamId] = { ...userTeamObj, tier: newTier };
      promotionNews.push({
        id: `tier_${promote ? 'promo' : 'releg'}_${currentSeason}`,
        title: promote
          ? `${userTeamObj.name} é PROMOVIDO para o Tier ${newTier}!`
          : `${userTeamObj.name} é REBAIXADO para o Tier ${newTier}.`,
        content: promote
          ? `Após uma campanha de destaque (${seasonWins} vitórias${wonTierTitle ? ' e título do seu tier' : ''}) na Temporada ${currentSeason}, o ${userTeamObj.name} subiu de divisão e agora disputa o Tier ${newTier}. Adversários mais fortes e premiações maiores aguardam na Temporada ${nextSeason}.`
          : `A Temporada ${currentSeason} foi dura para o ${userTeamObj.name} (${seasonLosses} derrotas e sem título). O time foi rebaixado para o Tier ${newTier} e terá a chance de se reerguer na Temporada ${nextSeason}.`,
        category: 'general',
        week: currentWeek,
        dateStr: `Semana ${currentWeek}`,
      });
    }
  }

  const media5 = (a: Player['attributes']): number =>
    Math.round((a.aim + a.gamesense + a.clutch + a.utility + a.igl) / 5);

  Object.values(updatedPlayers).forEach(prev => {
    const newAge = prev.age + 1;
    const ativo = prev.status === 'titular' || prev.status === 'reserva';

    if (newAge > 38 || (newAge > 35 && Math.random() < 0.4)) {
      updatedPlayers[prev.id] = { ...prev, age: newAge, status: 'aposentado', teamId: 'free_agents' };
      return;
    }

    let potential = prev.potential;
    if (ativo && newAge <= 23 && potential - prev.overall < 3 && Math.random() < 0.3) {
      potential = Math.min(99, potential + 1 + Math.floor(Math.random() * 2));
    }

    if (ativo && prev.overall < potential) {
      // Moderado: evolução gradual para evitar OVRs inflados na IA
      const evolBoost = newAge <= 22 ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);
      if (evolBoost > 0) {
        const updatedAttrs: Player['attributes'] = { ...prev.attributes };
        (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
          if (Math.random() < (newAge <= 22 ? 0.35 : 0.15)) updatedAttrs[k] = Math.min(99, updatedAttrs[k] + evolBoost);
        });
        updatedPlayers[prev.id] = { ...prev, age: newAge, potential, attributes: updatedAttrs, overall: Math.min(potential, media5(updatedAttrs)) };
        return;
      }
    }

    if (ativo && newAge >= 31 && Math.random() < (newAge - 30) * 0.15) {
      const updatedAttrs: Player['attributes'] = { ...prev.attributes };
      const decair = (k: keyof Player['attributes']) => { updatedAttrs[k] = Math.max(40, updatedAttrs[k] - (1 + Math.floor(Math.random() * 2))); };
      decair('aim');
      decair('clutch');
      updatedPlayers[prev.id] = { ...prev, age: newAge, potential, attributes: updatedAttrs, overall: media5(updatedAttrs) };
      return;
    }

    updatedPlayers[prev.id] = { ...prev, age: newAge, potential };
  });

  Object.values(updatedTeams).forEach((team) => {
    if (team.id === 'free_agents') return;
    const filled = ensureFiveStarters(updatedPlayers, team);
    if (filled !== updatedPlayers) Object.assign(updatedPlayers, filled);
  });

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
    const deltaRep = Math.round((winRatio - 0.5) * 6);
    if (deltaRep !== 0) {
      updatedTeams[team.id] = { ...team, reputation: Math.max(30, Math.min(99, team.reputation + deltaRep)) };
    }
  });

  const competitionDefaults: Record<string, Tournament> = {};
  defaultCompetitions.forEach(c => { competitionDefaults[c.id] = c; });
  const resetTournaments: Record<string, Tournament> = {};

  Object.values(tournaments).forEach((t) => {
    const baseline = competitionDefaults[t.id];
    const { championId: _champ, mvpPlayerId: _mvp, standings: _st, userOpponents: _uo, ...rest } = t;
    
    const teamIdsForNewSeason = computeTournamentTeamIds(t, updatedTeams, userTeamId, invitationsGenerated, isFixedTeam);

    resetTournaments[t.id] = {
      ...rest,
      isFinished: false,
      currentRound: 0,
      matches: [],
      swissRound: 0,
      swissRecords: {},
      groups: [],
      playoffTeamIds: [],
      userEliminated: false,
      phase: 'group_stage',
      engineFormat: t.engineFormat ?? deriveEngineFormat(t.id, t.format),
      weekScheduled: baseline ? baseline.weekScheduled : t.weekScheduled,
      teamIds: teamIdsForNewSeason,
    };

    const newT = resetTournaments[t.id];
    if (newT.stageFormat === 'swiss') {
      const swissRecs: Record<string, { w: number; l: number; opponents: string[] }> = {};
      newT.teamIds.forEach(id => {
        swissRecs[id] = { w: 0, l: 0, opponents: [] };
      });
      newT.swissRecords = swissRecs;
      newT.swissRound = 0;
      newT.phase = 'group_stage';
    } else if (newT.stageFormat === 'gsl_groups') {
      const groupsCount = t.id === 'pro_league_regional' ? 4 : 2;
      const actualTeamIds = newT.teamIds.slice(0, groupsCount * 4);
      const divided = distributeIntoGroups(actualTeamIds, groupsCount);
      newT.groups = divided.map((groupTeams, idx) => ({
        groupName: `Grupo ${String.fromCharCode(65 + idx)}`,
        teamIds: groupTeams,
        standings: groupTeams.map(tid => ({ teamId: tid, wins: 0, losses: 0, roundsFor: 0, roundsAgainst: 0 })),
        matches: [],
        isFinished: false
      }));
      newT.phase = 'group_stage';
    } else if (newT.stageFormat === 'round_robin') {
      const groupsCount = 2;
      const actualTeamIds = newT.teamIds.slice(0, groupsCount * 4);
      const divided = distributeIntoGroups(actualTeamIds, groupsCount);
      newT.groups = divided.map((groupTeams, idx) => ({
        groupName: `Grupo ${String.fromCharCode(65 + idx)}`,
        teamIds: groupTeams,
        standings: groupTeams.map(tid => ({ teamId: tid, wins: 0, losses: 0, roundsFor: 0, roundsAgainst: 0 })),
        matches: [],
        isFinished: false
      }));
      newT.phase = 'group_stage';
    } else if (newT.stageFormat === 'single_elim') {
      newT.phase = 'playoff';
    }
  });

  const championsLine = champions.length > 0
    ? champions.map(c => `${c.tournamentName}: ${c.championName}`).join(' · ')
    : 'Nenhum torneio teve campeão definido nesta temporada.';
  const seasonEndNews: NewsItem = {
    id: `season_end_${currentSeason}`,
    title: `Temporada ${currentSeason} encerrada! Confira os campeões.`,
    content: `A Temporada ${currentSeason} chegou ao fim. ${championsLine}. Uma nova temporada começa agora — recalibre seu elenco, aproveite seus convites e mire nos títulos na Temporada ${nextSeason}.`,
    category: 'results',
    week: currentWeek,
    dateStr: `Semana ${currentWeek}`,
  };

  const userTournamentResults: UserTournamentResult[] = Object.values(resolvedTournaments)
    .filter((t) => t.teamIds.includes(userTeamId))
    .map((t) => {
      const won = t.championId === userTeamId;
      let placement = 'Eliminado na Fase de Grupos';
      if (won) placement = 'Campeão 🏆';
      else if (t.userEliminated) {
        placement = t.currentRound === 0 ? 'Fase de Grupos' : `Playoffs (R${t.currentRound})`;
      } else {
        placement = 'Finalista';
      }

      const userMatches = t.matches.filter((m) => m.teamAId === userTeamId || m.teamBId === userTeamId);
      const wins = userMatches.filter((m) => m.winnerId === userTeamId).length;
      const losses = userMatches.length - wins;

      return {
        tournamentId: t.id,
        tournamentName: t.name,
        tier: t.tier,
        placement,
        wins,
        losses,
        avgRating: 1.10
      };
    });

  const userStatsSnapshot = {
    wins: userTeamObj?.stats.wins ?? 0,
    losses: userTeamObj?.stats.losses ?? 0,
    titles: userTeamObj?.stats.titles ?? 0,
  };

  const seasonSummary: SeasonSummary = {
    season: currentSeason,
    champions,
    userStats: userStatsSnapshot,
    tournamentResults: userTournamentResults,
    invitationsGenerated
  };

  const prevTotals = historicoTemporadas
    .filter((h) => h.season !== currentSeason)
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

  const updatedHistorico: SeasonHistoryEntry[] = [
    ...historicoTemporadas.filter((h) => h.season !== currentSeason),
    seasonHistoryEntry,
  ];

  set({
    currentWeek: 1,
    currentSeason: nextSeason,
    teams: updatedTeams,
    players: updatedPlayers,
    tournaments: resetTournaments,
    historyNews: [...promotionNews, seasonEndNews, ...historyNews],
    seasonSummary,
    historicoTemporadas: updatedHistorico,
    invitations: invitationsGenerated,
    isFixedTeam,
    currentScreen: 'seasonSummary',
  });
};

const distributeIntoGroups = (teamIds: string[], groupCount: number): string[][] => {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  teamIds.forEach((id, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(id);
  });
  return groups;
};

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

// ==========================================
// ADICIONADO: MOTOR DE TORNEIO INTERATIVO
// ==========================================

export const resolverProgressoTorneioInterativo = (
  get: any,
  set: any,
  activeSeries: any
): void => {
  const { userTeamId, tournaments, currentWeek, teams, players } = get() as {
    userTeamId: string;
    tournaments: Record<string, Tournament>;
    currentWeek: number;
    teams: Record<string, Team>;
    players: Record<string, Player>;
  };
  
  const tourney = tournaments[activeSeries.tournamentId];
  if (!tourney) return;

  const updatedTournaments = { ...tournaments };
  const updatedTeams = { ...teams };
  const updatedT = { ...tourney };

  const isUserWinner = activeSeries.winnerId === userTeamId;
  const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, tourney.teamIds.length))));

  // Simulação IA vs IA
  const simularIaMatchPura = (teamAId: string, teamBId: string, tournamentId: string, roundName: string, stage: string): TournamentMatch => {
    const teamA = teams[teamAId];
    const teamB = teams[teamBId];
    const mapSelected = realMaps.filter(m => m.status === 'active')[0] ?? realMaps[0];
    const strengthA = computeTournamentStrength(teamA, players, mapSelected);
    const strengthB = computeTournamentStrength(teamB, players, mapSelected);
    const probA = strengthA / (strengthA + strengthB);
    
    const aWins = Math.random() < probA;
    const scoreA = aWins ? 2 : Math.floor(Math.random() * 2);
    const scoreB = !aWins ? 2 : Math.floor(Math.random() * 2);
    
    return {
      matchId: `ai_sim_${tournamentId}_${Math.random().toString(36).slice(2,8)}`,
      teamAId,
      teamBId,
      scoreA,
      scoreB,
      winnerId: aWins ? teamAId : teamBId,
      bestOf: 3,
      roundName,
      stage,
      mapId: mapSelected.id
    };
  };

  // ---------------------------------------------
  // FASE DE GRUPOS / SWISS / GSL / RR
  // ---------------------------------------------
  if (tourney.phase === 'group_stage') {
    if (tourney.stageFormat === 'swiss') {
      const swissRecs = { ...tourney.swissRecords };
      const userOpp = activeSeries.teamAId === userTeamId ? activeSeries.teamBId : activeSeries.teamAId;
      const roundIdx = tourney.swissRound ?? 0;
      
      swissRecs[userTeamId] = {
        w: (swissRecs[userTeamId]?.w ?? 0) + (isUserWinner ? 1 : 0),
        l: (swissRecs[userTeamId]?.l ?? 0) + (isUserWinner ? 0 : 1),
        opponents: [...(swissRecs[userTeamId]?.opponents ?? []), userOpp]
      };
      
      swissRecs[userOpp] = {
        w: (swissRecs[userOpp]?.w ?? 0) + (!isUserWinner ? 1 : 0),
        l: (swissRecs[userOpp]?.l ?? 0) + (!isUserWinner ? 0 : 1),
        opponents: [...(swissRecs[userOpp]?.opponents ?? []), userTeamId]
      };

      const jogadosNestaRodada = new Set<string>([userTeamId, userOpp]);
      const activeSwissTeams = tourney.teamIds.filter(tid => {
        if (jogadosNestaRodada.has(tid)) return false;
        const rec = swissRecs[tid] || { w: 0, l: 0 };
        return rec.w < 3 && rec.l < 3;
      });

      const newAiMatches: TournamentMatch[] = [];
      const groupsMap = new Map<string, string[]>();
      activeSwissTeams.forEach(tid => {
        const rec = swissRecs[tid] || { w: 0, l: 0 };
        const key = `${rec.w}-${rec.l}`;
        const arr = groupsMap.get(key) ?? [];
        arr.push(tid);
        groupsMap.set(key, arr);
      });

      groupsMap.forEach((gTimes) => {
        for (let i = 0; i + 1 < gTimes.length; i += 2) {
          const tA = gTimes[i];
          const tB = gTimes[i + 1];
          const m = simularIaMatchPura(tA, tB, tourney.id, `Rodada Swiss ${roundIdx + 1}`, 'Swiss');
          newAiMatches.push(m);
          
          swissRecs[tA] = {
            w: (swissRecs[tA]?.w ?? 0) + (m.winnerId === tA ? 1 : 0),
            l: (swissRecs[tA]?.l ?? 0) + (m.winnerId === tA ? 0 : 1),
            opponents: [...(swissRecs[tA]?.opponents ?? []), tB]
          };
          
          swissRecs[tB] = {
            w: (swissRecs[tB]?.w ?? 0) + (m.winnerId === tB ? 1 : 0),
            l: (swissRecs[tB]?.l ?? 0) + (m.winnerId === tB ? 0 : 1),
            opponents: [...(swissRecs[tB]?.opponents ?? []), tA]
          };
        }
      });

      const userMatchInfo: TournamentMatch = {
        matchId: `user_${tourney.id}_sw_${roundIdx}_${currentWeek}`,
        teamAId: activeSeries.teamAId,
        teamBId: activeSeries.teamBId,
        scoreA: activeSeries.scoreA,
        scoreB: activeSeries.scoreB,
        winnerId: activeSeries.winnerId ?? userTeamId,
        bestOf: activeSeries.bestOf,
        roundName: `Rodada Swiss ${roundIdx + 1}`,
        stage: 'Swiss',
        mapId: activeSeries.mapIds[0]
      };
      
      updatedT.matches = [...(tourney.matches ?? []), userMatchInfo, ...newAiMatches];
      updatedT.swissRecords = swissRecs;
      
      updatedT.standings = tourney.teamIds.map(tid => {
        const rec = swissRecs[tid] || { w: 0, l: 0, opponents: [] };
        return {
          teamId: tid,
          wins: rec.w,
          losses: rec.l,
          roundsFor: rec.w * 2,
          roundsAgainst: rec.l * 2
        };
      }).sort((a, b) => b.wins - a.wins || (b.roundsFor - b.roundsAgainst) - (a.roundsFor - a.roundsAgainst));

      const userRec = swissRecs[userTeamId];
      const userClassificado = userRec && userRec.w >= 3;
      const userEliminado = userRec && userRec.l >= 3;
      
      const proximoSwissRound = roundIdx + 1;
      const remainingSwissActive = tourney.teamIds.filter(tid => {
        const rec = swissRecs[tid] || { w: 0, l: 0 };
        return rec.w < 3 && rec.l < 3;
      });

      if (proximoSwissRound >= 5 || remainingSwissActive.length === 0 || userClassificado || userEliminado) {
        const classificados = updatedT.standings.slice(0, 8).map(s => s.teamId);
        
        if (classificados.includes(userTeamId) && !userEliminado) {
          updatedT.phase = 'playoff';
          updatedT.currentRound = 0;
          updatedT.playoffTeamIds = classificados;
          updatedT.weekScheduled = currentWeek + 1;
          set({ currentScreen: 'championships', activeTournamentId: tourney.id });
        } else {
          updatedT.userEliminated = true;
          updatedT.isFinished = true;
          
          const playoffResult = materializeTournament(
            buildTournamentTeams(classificados, teams, players, realMaps[0], null),
            'singleElim',
            makeActiveMapPicker(),
            defaultWinProbability
          );
          if (playoffResult) {
            updatedT.championId = playoffResult.championId;
            updatedT.matches = [...updatedT.matches, ...playoffResult.matches];
          }
          
          set({ currentScreen: 'dashboard' });
        }
      } else {
        updatedT.swissRound = proximoSwissRound;
        updatedT.weekScheduled = currentWeek + 1;
        set({ currentScreen: 'championships', activeTournamentId: tourney.id });
      }

    } else if (tourney.stageFormat === 'gsl_groups') {
      const userGroupIdx = tourney.groups?.findIndex(g => g.teamIds.includes(userTeamId)) ?? -1;
      if (userGroupIdx !== -1) {
        const newGroups = [...(tourney.groups ?? [])];
        const group = { ...newGroups[userGroupIdx] };
        
        const userMatch: TournamentMatch = {
          matchId: `user_${tourney.id}_gsl_${tourney.currentRound}_${currentWeek}`,
          teamAId: activeSeries.teamAId,
          teamBId: activeSeries.teamBId,
          scoreA: activeSeries.scoreA,
          scoreB: activeSeries.scoreB,
          winnerId: activeSeries.winnerId ?? userTeamId,
          bestOf: activeSeries.bestOf,
          roundName: `Rodada ${tourney.currentRound + 1}`,
          stage: group.groupName,
          mapId: activeSeries.mapIds[0]
        };

        group.matches = [...group.matches, userMatch];

        const opponents = group.teamIds.filter(id => id !== userTeamId);
        if (group.matches.length === 1) {
          const m = simularIaMatchPura(opponents[0], opponents[1], tourney.id, 'Opening Match', group.groupName);
          group.matches.push(m);
        } else if (group.matches.length === 3) {
          const jogaramR1 = new Set(group.matches.slice(2).flatMap(m => [m.teamAId, m.teamBId]));
          const pendentes = group.teamIds.filter(id => !jogaramR1.has(id));
          if (pendentes.length === 2) {
            const m = simularIaMatchPura(pendentes[0], pendentes[1], tourney.id, 'Group Match', group.groupName);
            group.matches.push(m);
          }
        }

        newGroups.forEach((g, gIdx) => {
          if (gIdx === userGroupIdx) return;
          const otherGroup = { ...g };
          
          if (otherGroup.matches.length === 0) {
            const m1 = simularIaMatchPura(otherGroup.teamIds[0], otherGroup.teamIds[3], tourney.id, 'Opening Match', otherGroup.groupName);
            const m2 = simularIaMatchPura(otherGroup.teamIds[1], otherGroup.teamIds[2], tourney.id, 'Opening Match', otherGroup.groupName);
            otherGroup.matches = [m1, m2];
          } else if (otherGroup.matches.length === 2) {
            const w1 = otherGroup.matches[0].winnerId;
            const l1 = otherGroup.matches[0].winnerId === otherGroup.matches[0].teamAId ? otherGroup.matches[0].teamBId : otherGroup.matches[0].teamAId;
            const w2 = otherGroup.matches[1].winnerId;
            const l2 = otherGroup.matches[1].winnerId === otherGroup.matches[1].teamAId ? otherGroup.matches[1].teamBId : otherGroup.matches[1].teamAId;
            
            const mWin = simularIaMatchPura(w1, w2, tourney.id, 'Winners Match', otherGroup.groupName);
            const mElim = simularIaMatchPura(l1, l2, tourney.id, 'Elimination Match', otherGroup.groupName);
            otherGroup.matches = [...otherGroup.matches, mWin, mElim];
          } else if (otherGroup.matches.length === 4) {
            const deciderL = otherGroup.matches[2].winnerId === otherGroup.matches[2].teamAId ? otherGroup.matches[2].teamBId : otherGroup.matches[2].teamAId;
            const deciderW = otherGroup.matches[3].winnerId;
            const mDec = simularIaMatchPura(deciderL, deciderW, tourney.id, 'Decider Match', otherGroup.groupName);
            otherGroup.matches = [...otherGroup.matches, mDec];
          }
          newGroups[gIdx] = otherGroup;
        });

        newGroups.forEach((g, gIdx) => {
          const gStandings = g.teamIds.map(tid => {
            const wins = g.matches.filter(m => m.winnerId === tid).length;
            const losses = g.matches.filter(m => (m.teamAId === tid || m.teamBId === tid) && m.winnerId !== tid).length;
            return {
              teamId: tid,
              wins,
              losses,
              roundsFor: wins * 2,
              roundsAgainst: losses * 2
            };
          });
          newGroups[gIdx] = { ...g, standings: gStandings };
        });

        newGroups[userGroupIdx] = group;
        updatedT.groups = newGroups;
        updatedT.matches = [...(tourney.matches ?? []), userMatch];

        const proximaRodada = (tourney.currentRound ?? 0) + 1;
        const totalMatchesDoGrupo = group.matches.length;
        
        if (proximaRodada >= 3 || totalMatchesDoGrupo >= 5) {
          const classificados: string[] = [];
          newGroups.forEach(g => {
            const winnersMatch = g.matches[2];
            const deciderMatch = g.matches[4];
            if (winnersMatch) classificados.push(winnersMatch.winnerId);
            if (deciderMatch) classificados.push(deciderMatch.winnerId);
          });

          if (classificados.includes(userTeamId)) {
            updatedT.phase = 'playoff';
            updatedT.currentRound = 0;
            updatedT.playoffTeamIds = classificados;
            updatedT.weekScheduled = currentWeek + 1;
            set({ currentScreen: 'championships', activeTournamentId: tourney.id });
          } else {
            updatedT.userEliminated = true;
            updatedT.isFinished = true;
            
            const playoffResult = materializeTournament(
              buildTournamentTeams(classificados, teams, players, realMaps[0], null),
              'singleElim',
              makeActiveMapPicker(),
              defaultWinProbability
            );
            if (playoffResult) {
              updatedT.championId = playoffResult.championId;
              updatedT.matches = [...updatedT.matches, ...playoffResult.matches];
            }
            
            set({ currentScreen: 'dashboard' });
          }
        } else {
          updatedT.currentRound = proximaRodada;
          updatedT.weekScheduled = currentWeek + 1;
          set({ currentScreen: 'championships', activeTournamentId: tourney.id });
        }
      }

    } else if (tourney.stageFormat === 'round_robin') {
      const userGroupIdx = tourney.groups?.findIndex(g => g.teamIds.includes(userTeamId)) ?? -1;
      if (userGroupIdx !== -1) {
        const newGroups = [...(tourney.groups ?? [])];
        const group = { ...newGroups[userGroupIdx] };
        
        const userMatch: TournamentMatch = {
          matchId: `user_${tourney.id}_rr_${tourney.currentRound}_${currentWeek}`,
          teamAId: activeSeries.teamAId,
          teamBId: activeSeries.teamBId,
          scoreA: activeSeries.scoreA,
          scoreB: activeSeries.scoreB,
          winnerId: activeSeries.winnerId ?? userTeamId,
          bestOf: activeSeries.bestOf,
          roundName: `Rodada RR ${tourney.currentRound + 1}`,
          stage: group.groupName,
          mapId: activeSeries.mapIds[0]
        };

        group.matches = [...group.matches, userMatch];

        const ids = group.teamIds;
        const rrRound = tourney.currentRound;
        let otherPartIdA = '';
        let otherPartIdB = '';
        if (rrRound === 0) {
          if (ids[0] === userTeamId || ids[3] === userTeamId) { otherPartIdA = ids[1]; otherPartIdB = ids[2]; }
          else { otherPartIdA = ids[0]; otherPartIdB = ids[3]; }
        } else if (rrRound === 1) {
          if (ids[0] === userTeamId || ids[2] === userTeamId) { otherPartIdA = ids[3]; otherPartIdB = ids[1]; }
          else { otherPartIdA = ids[0]; otherPartIdB = ids[2]; }
        } else if (rrRound === 2) {
          if (ids[0] === userTeamId || ids[1] === userTeamId) { otherPartIdA = ids[2]; otherPartIdB = ids[3]; }
          else { otherPartIdA = ids[0]; otherPartIdB = ids[1]; }
        }

        const mOther = simularIaMatchPura(otherPartIdA, otherPartIdB, tourney.id, `Rodada RR ${rrRound + 1}`, group.groupName);
        group.matches.push(mOther);

        newGroups.forEach((g, gIdx) => {
          if (gIdx === userGroupIdx) return;
          const otherGroup = { ...g };
          const otherIds = otherGroup.teamIds;
          
          let tA1 = '', tB1 = '', tA2 = '', tB2 = '';
          if (rrRound === 0) {
            tA1 = otherIds[0]; tB1 = otherIds[3]; tA2 = otherIds[1]; tB2 = otherIds[2];
          } else if (rrRound === 1) {
            tA1 = otherIds[0]; tB1 = otherIds[2]; tA2 = otherIds[3]; tB2 = otherIds[1];
          } else if (rrRound === 2) {
            tA1 = otherIds[0]; tB1 = otherIds[1]; tA2 = otherIds[2]; tB2 = otherIds[3];
          }
          
          const m1 = simularIaMatchPura(tA1, tB1, tourney.id, `Rodada RR ${rrRound + 1}`, otherGroup.groupName);
          const m2 = simularIaMatchPura(tA2, tB2, tourney.id, `Rodada RR ${rrRound + 1}`, otherGroup.groupName);
          otherGroup.matches = [...otherGroup.matches, m1, m2];
          newGroups[gIdx] = otherGroup;
        });

        newGroups.forEach((g, gIdx) => {
          const gStandings = g.teamIds.map(tid => {
            const wins = g.matches.filter(m => m.winnerId === tid).length;
            const losses = g.matches.filter(m => (m.teamAId === tid || m.teamBId === tid) && m.winnerId !== tid).length;
            return {
              teamId: tid,
              wins,
              losses,
              roundsFor: wins * 2,
              roundsAgainst: losses * 2
            };
          });
          newGroups[gIdx] = { ...g, standings: gStandings };
        });

        newGroups[userGroupIdx] = group;
        updatedT.groups = newGroups;
        updatedT.matches = [...(tourney.matches ?? []), userMatch];

        const proximaRodada = rrRound + 1;
        if (proximaRodada >= 3) {
          const classificados: string[] = [];
          newGroups.forEach(g => {
            const sorted = [...g.standings].sort((a,b) => b.wins - a.wins || (b.roundsFor - b.roundsAgainst) - (a.roundsFor - a.roundsAgainst));
            classificados.push(sorted[0].teamId);
            classificados.push(sorted[1].teamId);
          });

          if (classificados.includes(userTeamId)) {
            updatedT.phase = 'playoff';
            updatedT.currentRound = 0;
            updatedT.playoffTeamIds = classificados;
            updatedT.weekScheduled = currentWeek + 1;
            set({ currentScreen: 'championships', activeTournamentId: tourney.id });
          } else {
            updatedT.userEliminated = true;
            updatedT.isFinished = true;
            
            const playoffResult = materializeTournament(
              buildTournamentTeams(classificados, teams, players, realMaps[0], null),
              'singleElim',
              makeActiveMapPicker(),
              defaultWinProbability
            );
            if (playoffResult) {
              updatedT.championId = playoffResult.championId;
              updatedT.matches = [...updatedT.matches, ...playoffResult.matches];
            }
            
            set({ currentScreen: 'dashboard' });
          }
        } else {
          updatedT.currentRound = proximaRodada;
          updatedT.weekScheduled = currentWeek + 1;
          set({ currentScreen: 'championships', activeTournamentId: tourney.id });
        }
      }
    }
  } else {
    // ---------------------------------------------
    // FASE MATA-MATA (Playoffs / Single Elimination)
    // ---------------------------------------------
    const userMatch: TournamentMatch = {
      matchId: `user_${tourney.id}_playoff_r${tourney.currentRound}_${currentWeek}`,
      teamAId: activeSeries.teamAId,
      teamBId: activeSeries.teamBId,
      scoreA: activeSeries.scoreA,
      scoreB: activeSeries.scoreB,
      winnerId: activeSeries.winnerId ?? userTeamId,
      bestOf: activeSeries.bestOf,
      roundName: userRoundName(Math.pow(2, totalRounds - tourney.currentRound)),
      stage: 'Playoff',
      mapId: activeSeries.mapIds[0]
    };

    updatedT.matches = [...(tourney.matches ?? []), userMatch];

    if (isUserWinner) {
      const proximaRodada = tourney.currentRound + 1;
      if (proximaRodada >= totalRounds) {
        updatedT.isFinished = true;
        updatedT.championId = userTeamId;
        set({ currentScreen: 'matchResult' });
      } else {
        updatedT.currentRound = proximaRodada;
        updatedT.weekScheduled = currentWeek + 1;
        set({ currentScreen: 'championships', activeTournamentId: tourney.id });
      }
    } else {
      updatedT.userEliminated = true;
      updatedT.isFinished = true;
      
      const bracketMap = realMaps.find(m => m.id === activeSeries.mapIds[0]) ?? realMaps[0];
      const aiOutcome = crownAiChampion(updatedT, updatedTeams, players, userTeamId, bracketMap, currentWeek);
      if (aiOutcome) {
        updatedT.championId = aiOutcome.championId;
        updatedT.matches = [...updatedT.matches, ...aiOutcome.matches];
        if (updatedT.standings && aiOutcome.standings) {
          updatedT.standings = [...aiOutcome.standings];
        }
      }
      
      set({ currentScreen: 'dashboard' });
    }
  }

  updatedTournaments[activeSeries.tournamentId] = updatedT;
  set({ tournaments: updatedTournaments });
  
  get().salvarJogo();
};
