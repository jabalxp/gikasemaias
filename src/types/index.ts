export interface PlayerAttributes {
  aim: number;        // Mira
  gamesense: number;  // Noção de Jogo
  clutch: number;     // Calma / Clutch
  utility: number;    // Utilitárias
  igl: number;        // Liderança / IGL
}

export interface PlayerStats {
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;       // Average Damage per Round
  kast: number;      // % of rounds with Kill, Assist, Survival or Trade
  hsPercentage: number;
  clutchesWon: number;
  firstKills: number;
  firstDeaths: number;
  mapsPlayed: number;
  mvps: number;
}

export interface Player {
  id: string;
  nickname: string;
  name: string;
  nationality: string;
  age: number;
  teamId: string; // ID do time ou "free_agents"
  role: 'AWPer' | 'Rifler' | 'Entry Fragger' | 'Lurker' | 'Support' | 'IGL' | 'Clutcher' | 'Star Player';
  subRoles: string[];
  overall: number;
  potential: number;
  value: number;            // Valor de passe/mercado ($)
  salary: number;           // Salário semanal ($)
  contractMonths: number;   // Duração restante do contrato em meses
  moral: number;            // 0 - 100
  form: number;             // Forma física (0 - 100)
  energy: number;           // Stamina restante (0 - 100)
  personality: 'Calmo' | 'Explosivo' | 'Líder' | 'Focado' | 'Inconsistente' | 'Estrela';
  attributes: PlayerAttributes;
  stats: PlayerStats;
  status: 'titular' | 'reserva' | 'free_agent' | 'aposentado' | 'coach';
}

export interface TeamTactics {
  playstyle: 'very_aggressive' | 'aggressive' | 'balanced' | 'defensive' | 'very_defensive';
  tempo: 'slow' | 'normal' | 'fast' | 'explosive';
  focus: 'map_control' | 'execute' | 'pickoffs' | 'retake' | 'default' | 'mid_control';
  utilityUsage: 'low' | 'medium' | 'high' | 'very_high';
  economyStyle: 'eco' | 'balanced' | 'force' | 'aggressive';
}

export interface TeamStats {
  wins: number;
  losses: number;
  titles: number;
  recentForm: ('W' | 'L')[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  country: string;
  region: string;
  tier: 1 | 2 | 3 | 4; // 1: Elite Mundial, 2: Challenger, 3: Semi-Pro, 4: Amador
  points: number;       // Pontos no ranking mundial
  reputation: number;   // 0 - 100
  budget: number;       // Saldo financeiro ($)
  tactics: TeamTactics;
  mapMastery: Record<string, number>; // ID do Mapa -> Porcentagem de domínio (0 - 100)
  colorPrimary: string;   // Cor Hexadecimal (ex: #00f0ff)
  colorSecondary: string; // Cor Hexadecimal (ex: #7000ff)
  logoUrl?: string;       // Emblema enviado pelo usuário (opcional; fallback = emblema procedural)
  isUser: boolean;        // Se o jogador está controlando esta equipe
  stats: TeamStats;
  sponsorId?: string;               // Patrocinador ativo
  sponsorWeeksRemaining?: number;   // Semanas restantes do patrocínio
  staff: {
    coachId?: string;
    analystId?: string;
    psychologistId?: string;
    scoutId?: string;
    physioId?: string;
  };
}

export interface GameMap {
  id: string;
  name: string;
  status: 'active' | 'reserve' | 'historical' | 'casual';
  aimRequirement: number;        // Peso para duelos de mira pura (0-100)
  tacticalRequirement: number;   // Peso para leitura tática (0-100)
  utilityRequirement: number;    // Peso para uso de utilitárias (0-100)
  awpImpact: number;             // Impacto de rifles de precisão (0-100)
  sideBias: 'CT' | 'TR' | 'balanced'; // Vantagem nativa de lado
  pace: 'slow' | 'medium' | 'fast';   // Ritmo natural de jogo
  description: string;
  imageUrl?: string;
}

export interface RoundSimEvent {
  time: string; // Ex: "1:15"
  description: string;
  type: 'kill' | 'plant' | 'defuse' | 'save' | 'clutch' | 'tactical' | 'economy';
  killerId?: string;
  victimId?: string;
  weaponUsed?: string;
}

export interface RoundSim {
  roundNumber: number;
  winningTeamSide: 'CT' | 'TR';
  winningTeamId: string;
  winReason: 'elimination' | 'c4_explosion' | 'defuse' | 'time_ran_out';
  events: RoundSimEvent[];
  economyBefore: {
    teamA: 'eco' | 'force' | 'buy' | 'half';
    teamB: 'eco' | 'force' | 'buy' | 'half';
  };
  cashAft: Record<string, number>; // ID do jogador -> Saldo após o round
}

export interface MatchLivePlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  mvps: number;
  firstKills: number;   // Aberturas (first blood) feitas pelo jogador na partida
  clutchesWon: number;  // Rounds vencidos sozinho (1 vivo + ≥1 kill no round)
  multiKills: number;   // Rounds com 3+ kills do jogador
  alive: boolean;
  hp: number;
  weapon: string;
  helmet: boolean;
  hasC4: boolean;
  cash: number;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  competitionId: string;
  mapId: string;
  scoreA: number;
  scoreB: number;
  halfScores: { scoreA: number; scoreB: number }[]; // Placar ao fim de cada metade
  rounds: RoundSim[];
  isFinished: boolean;
  winnerId?: string;
  mvpPlayerId?: string;
  liveStats: Record<string, MatchLivePlayerStats>; // ID do jogador -> status na partida
}

export interface VetoStep {
  teamId: string;
  teamName: string;
  action: 'ban' | 'pick' | 'decider';
  mapId: string;
  mapName: string;
}

export interface ActiveSeries {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  bestOf: 1 | 3 | 5;
  vetoSteps: VetoStep[];
  mapIds: string[];
  currentMapIndex: number;
  matches: Match[];
  scoreA: number; // placar acumulado em MAPAS do time A
  scoreB: number; // placar acumulado em MAPAS do time B
  isFinished: boolean;
  winnerId?: string;
}


export interface Sponsor {
  id: string;
  name: string;
  weeklyIncome: number;
  winBonus: number;
  titleBonus: number;
  durationWeeks: number;
  minReputation: number;
  requirements: string;
}

export interface Staff {
  id: string;
  name: string;
  nationality: string;
  role: 'coach' | 'analyst' | 'psychologist' | 'scout' | 'physio';
  level: number; // 1 a 5 estrelas
  salary: number;
  effectDescription: string;
  reputation: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'transfers' | 'results' | 'scandal' | 'base' | 'general';
  week: number;
  dateStr: string;
}

export interface TournamentMatch {
  matchId: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;       // Placar em MAPAS (ex.: Bo3 → 2)
  scoreB: number;       // Placar em MAPAS (ex.: Bo3 → 1)
  winnerId: string;
  bestOf: 1 | 3 | 5;
  roundName: string;    // Ex: "Quartas de Final", "Semifinal", "Grande Final"
  stage: string;        // Ex: "Single Elim", "Group A", "GSL", "Swiss R1"
  mapId?: string;       // Mapa jogado (sorteado dos mapas ativos). Permite derivar o "mapa mais jogado".
}

/** Classificação acumulada de um time num formato com tabela (RR/GSL/Swiss). */
export interface TournamentStanding {
  teamId: string;
  wins: number;
  losses: number;
  roundsFor: number;     // Mapas ganhos (somatório dos placares de série)
  roundsAgainst: number; // Mapas perdidos. Saldo = roundsFor - roundsAgainst
}

/** Formato real de simulação do torneio (Fase 3b). Derivado de id/format se ausente. */
export type TournamentEngineFormat = 'swiss' | 'gsl' | 'roundRobin' | 'singleElim';

/** Formato detalhado da fase de classificação (baseado em formatos reais da HLTV). */
export type TournamentStageFormat = 'swiss' | 'gsl_groups' | 'round_robin' | 'single_elim';

/** Grupo dentro de um torneio (GSL/RR). */
export interface TournamentGroup {
  groupName: string;           // Ex: "Grupo A", "Grupo B"
  teamIds: string[];
  standings: TournamentStanding[];
  matches: TournamentMatch[];  // Jogos dentro do grupo
  isFinished: boolean;
}

/** Convite para participar de um torneio na próxima temporada. */
export interface TournamentInvitation {
  tournamentId: string;
  tournamentName: string;
  tier: 1 | 2 | 3 | 4;
  reason: 'champion' | 'runner_up' | 'reputation' | 'fixed_slot';
  season: number;              // Temporada em que o convite foi emitido
}

/** Resultado do usuário num torneio da temporada (para SeasonSummary). */
export interface UserTournamentResult {
  tournamentId: string;
  tournamentName: string;
  tier: 1 | 2 | 3 | 4;
  placement: string;           // "Campeão", "Semifinal", "Eliminado na fase de grupos", etc.
  wins: number;
  losses: number;
  avgRating: number;
}

export interface Tournament {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  prizePool: number;
  teamIds: string[];
  format: 'bracket' | 'groups';
  isFinished: boolean;
  championId?: string;
  mvpPlayerId?: string;
  currentRound: number;
  matches: TournamentMatch[];
  weekScheduled: number;
  engineFormat?: TournamentEngineFormat;     // Formato do motor (Fase 3b). Fallback: derivado de id/format.
  standings?: TournamentStanding[];          // Tabela materializada (RR/Swiss/GSL). Opcional p/ saves antigos.
  userOpponents?: string[];                  // Sequência de adversários do usuário por rodada (sem repetição).
  // Novos campos — formatos reais HLTV
  stageFormat?: TournamentStageFormat;       // Formato detalhado da fase de classificação
  groups?: TournamentGroup[];                // Grupos da fase de classificação (GSL/RR)
  playoffTeamIds?: string[];                 // Times classificados para o playoff
  bestOfPlayoff?: 1 | 3 | 5;                // Formato do Bo do playoff
  bestOfFinal?: 1 | 3 | 5;                  // Formato especial da final (ex: Bo5 no Major)
  swissRound?: number;                       // Rodada atual do Swiss (0-based)
  swissRecords?: Record<string, { w: number; l: number; opponents?: string[] }>;  // W-L por time no Swiss
  phase?: 'group_stage' | 'playoff' | 'finished'; // Fase atual do torneio
  invitedTeamIds?: string[];                 // Times que entraram por convite (badge visual)
  userEliminated?: boolean;                  // O usuário já foi eliminado deste torneio
}

export interface SeasonChampionSnapshot {
  tournamentId: string;
  tournamentName: string;
  championId: string;
  championName: string;
  championTag: string;
  prizePool: number;
  isUserChampion: boolean;
}

export interface SeasonSummary {
  season: number;          // Temporada que foi encerrada
  champions: SeasonChampionSnapshot[];
  userStats: {
    wins: number;
    losses: number;
    titles: number;
  };
  // Novos campos — temporadas expandidas
  tournamentResults?: UserTournamentResult[];      // Resultados do user em cada torneio da temporada
  invitationsGenerated?: TournamentInvitation[];    // Convites gerados para a próxima temporada
}

/** Campeão de um torneio registrado no histórico permanente (forma enxuta do snapshot). */
export interface SeasonHistoryChampion {
  tournamentId: string;
  tournamentName: string;
  championId: string;
  championName: string;
  championTag: string;
}

/** Registro permanente de uma temporada encerrada (Histórico & Títulos). */
export interface SeasonHistoryEntry {
  season: number;
  champions: SeasonHistoryChampion[];
  userWins: number;
  userLosses: number;
  userTitles: number;
}

/** Status de uma rodada de negociação de contratação. */
export type NegotiationStatus = 'aceita' | 'contraproposta' | 'recusada';

/** Contraproposta do clube vendedor / jogador (valor de passe e salário exigidos). */
export interface NegotiationCounter {
  valor: number;
  salario: number;
}

/** Resultado de uma rodada de negociação (negociarContratacao). */
export interface NegotiationResult {
  success: boolean;
  message: string;
  status: NegotiationStatus;
  contraproposta?: NegotiationCounter;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface SaveGame {
  id: string;
  saveName: string;
  createdAt: string;
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
  historyNews: NewsItem[];
  financialHistory: {
    week: number;
    description: string;
    amount: number; // positivo (receita) ou negativo (despesa)
  }[];
  trainingPlan?: { intensity: 'leve' | 'normal' | 'pesada' | 'bootcamp'; focus: string };
  youthProspects?: Player[]; // Jovens observados na base/scout (opcional p/ saves antigos)
  historicoTemporadas?: SeasonHistoryEntry[]; // Histórico permanente de temporadas (opcional p/ saves antigos)
  // Novos campos — sistema de convites (opcional p/ saves antigos)
  invitations?: TournamentInvitation[];    // Convites pendentes para próxima temporada
  isFixedTeam?: boolean;                   // Time fixo em torneios do tier acima (reputação 80+)
}
