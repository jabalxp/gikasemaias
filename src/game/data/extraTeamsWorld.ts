import { Player, Team } from '../../types';

// ============================================================================
// extraTeamsWorld — Times reais NOVOS de CS2 (Europa/CIS/Ásia/Oceania/Oriente Médio)
// Referência: HLTV/Liquipedia (rostermania inverno 2025-2026). A cena muda rosters
// com altíssima frequência; estes dados são editáveis no jogo.
//
// IDs verificados como NÃO duplicados contra realTeams.ts.
// Calibração econômica idêntica a realPlayers.ts:
//   salário ≈ pow(max(0, ovr-48), 2) * 0.85  →  faixa-alvo $400-2000/sem.
// Faixas de overall: tier1 78-90; tier2 72-82; tier3 66-77.
// ============================================================================

export const extraTeamsWorld: Record<string, Team> = {
  // ----------------------------- TIER 2 -----------------------------
  sashi: {
    id: 'sashi',
    name: 'Sashi Esport',
    tag: 'Sashi',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 2,
    points: 360,
    reputation: 72,
    budget: 380000,
    colorPrimary: '#1aa5e0',
    colorSecondary: '#0b1622',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 70, de_inferno: 68, de_dust2: 65, de_ancient: 71, de_anubis: 73, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  nemiga: {
    id: 'nemiga',
    name: 'Nemiga Gaming',
    tag: 'Nemiga',
    country: 'Belarus',
    region: 'CIS',
    tier: 2,
    points: 340,
    reputation: 71,
    budget: 320000,
    colorPrimary: '#d4202a',
    colorSecondary: '#101010',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 72, de_inferno: 68, de_dust2: 66, de_ancient: 73, de_anubis: 71, de_overpass: 68
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },

  // ----------------------------- TIER 3 -----------------------------
  metizport: {
    id: 'metizport',
    name: 'Metizport',
    tag: 'Metizport',
    country: 'Suécia',
    region: 'Europa',
    tier: 3,
    points: 240,
    reputation: 70,
    budget: 220000,
    colorPrimary: '#00c2a8',
    colorSecondary: '#0c1b1f',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 64, de_inferno: 66, de_dust2: 68, de_ancient: 70, de_anubis: 72, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  permitta: {
    id: 'permitta',
    name: 'Permitta Esports',
    tag: 'Permitta',
    country: 'Suécia',
    region: 'Europa',
    tier: 3,
    points: 210,
    reputation: 68,
    budget: 180000,
    colorPrimary: '#7b2ff7',
    colorSecondary: '#0d0d14',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 66, de_inferno: 64, de_dust2: 62, de_ancient: 70, de_anubis: 70, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  passion_ua: {
    id: 'passion_ua',
    name: 'Passion UA',
    tag: 'Passion',
    country: 'Ucrânia',
    region: 'CIS',
    tier: 3,
    points: 200,
    reputation: 67,
    budget: 160000,
    colorPrimary: '#ffd500',
    colorSecondary: '#0057b7',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 60, de_inferno: 64, de_dust2: 72, de_ancient: 68, de_anubis: 70, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  fire_flux: {
    id: 'fire_flux',
    name: 'Fire Flux Esports',
    tag: 'FFlux',
    country: 'Turquia',
    region: 'Europa',
    tier: 3,
    points: 190,
    reputation: 66,
    budget: 170000,
    colorPrimary: '#ff5a1f',
    colorSecondary: '#101010',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 62, de_inferno: 66, de_dust2: 70, de_ancient: 66, de_anubis: 70, de_overpass: 60
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  iberian_soul: {
    id: 'iberian_soul',
    name: 'Iberian Soul',
    tag: 'IbSoul',
    country: 'Espanha',
    region: 'Europa',
    tier: 3,
    points: 230,
    reputation: 69,
    budget: 200000,
    colorPrimary: '#e2231a',
    colorSecondary: '#f4c20d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 68, de_inferno: 70, de_dust2: 64, de_ancient: 68, de_anubis: 72, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  bad_news_eagles: {
    id: 'bad_news_eagles',
    name: 'Bad News Eagles',
    tag: 'BNE',
    country: 'Kosovo',
    region: 'Europa',
    tier: 3,
    points: 220,
    reputation: 69,
    budget: 180000,
    colorPrimary: '#0050a0',
    colorSecondary: '#ffcd00',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 62, de_inferno: 66, de_dust2: 74, de_ancient: 68, de_anubis: 70, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  alliance: {
    id: 'alliance',
    name: 'Alliance',
    tag: 'Alliance',
    country: 'Suécia',
    region: 'Europa',
    tier: 3,
    points: 180,
    reputation: 66,
    budget: 190000,
    colorPrimary: '#0a8f3c',
    colorSecondary: '#0c0c0c',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'map_control',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 66, de_inferno: 64, de_dust2: 62, de_ancient: 70, de_anubis: 68, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  endpoint: {
    id: 'endpoint',
    name: 'Endpoint',
    tag: 'Endpoint',
    country: 'Reino Unido',
    region: 'Europa',
    tier: 3,
    points: 170,
    reputation: 65,
    budget: 160000,
    colorPrimary: '#00e0d1',
    colorSecondary: '#101820',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 66, de_nuke: 64, de_inferno: 62, de_dust2: 66, de_ancient: 66, de_anubis: 68, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  sampi: {
    id: 'sampi',
    name: 'Sampi',
    tag: 'Sampi',
    country: 'Tchéquia',
    region: 'Europa',
    tier: 3,
    points: 160,
    reputation: 64,
    budget: 150000,
    colorPrimary: '#ff2e63',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 66, de_nuke: 60, de_inferno: 64, de_dust2: 68, de_ancient: 64, de_anubis: 68, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  zero_tenacity: {
    id: 'zero_tenacity',
    name: 'Zero Tenacity',
    tag: 'ZT',
    country: 'Polônia',
    region: 'Europa',
    tier: 3,
    points: 150,
    reputation: 63,
    budget: 140000,
    colorPrimary: '#22d3ee',
    colorSecondary: '#0b1020',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 64, de_nuke: 62, de_inferno: 62, de_dust2: 64, de_ancient: 66, de_anubis: 66, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },

  // ----------------------------- TIER 4 -----------------------------
  chinggis_warriors: {
    id: 'chinggis_warriors',
    name: 'Chinggis Warriors',
    tag: 'CW',
    country: 'Mongólia',
    region: 'Ásia',
    tier: 4,
    points: 130,
    reputation: 62,
    budget: 130000,
    colorPrimary: '#c8a04a',
    colorSecondary: '#0c0c0c',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 66, de_nuke: 56, de_inferno: 60, de_dust2: 70, de_ancient: 64, de_anubis: 66, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  insilio: {
    id: 'insilio',
    name: 'Insilio',
    tag: 'Insilio',
    country: 'Estônia',
    region: 'Europa',
    tier: 4,
    points: 90,
    reputation: 58,
    budget: 110000,
    colorPrimary: '#5b8def',
    colorSecondary: '#0c1220',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 58, de_inferno: 60, de_dust2: 64, de_ancient: 60, de_anubis: 62, de_overpass: 56
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  rooster: {
    id: 'rooster',
    name: 'Rooster',
    tag: 'Rooster',
    country: 'Austrália',
    region: 'Oceania',
    tier: 4,
    points: 85,
    reputation: 57,
    budget: 100000,
    colorPrimary: '#e63946',
    colorSecondary: '#1d1d1d',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 56, de_inferno: 58, de_dust2: 66, de_ancient: 60, de_anubis: 64, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  mindfreak: {
    id: 'mindfreak',
    name: 'Mindfreak',
    tag: 'MF',
    country: 'Austrália',
    region: 'Oceania',
    tier: 4,
    points: 70,
    reputation: 55,
    budget: 90000,
    colorPrimary: '#9b5de5',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 58, de_nuke: 54, de_inferno: 56, de_dust2: 62, de_ancient: 56, de_anubis: 60, de_overpass: 52
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  pera: {
    id: 'pera',
    name: 'PERA Esports',
    tag: 'PERA',
    country: 'Turquia',
    region: 'Europa',
    tier: 4,
    points: 100,
    reputation: 60,
    budget: 120000,
    colorPrimary: '#ff8a00',
    colorSecondary: '#101010',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 64, de_nuke: 58, de_inferno: 60, de_dust2: 66, de_ancient: 62, de_anubis: 64, de_overpass: 56
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant',
    tag: 'Verdant',
    country: 'Reino Unido',
    region: 'Europa',
    tier: 4,
    points: 80,
    reputation: 57,
    budget: 100000,
    colorPrimary: '#1faa59',
    colorSecondary: '#0b1410',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 60, de_nuke: 56, de_inferno: 58, de_dust2: 62, de_ancient: 58, de_anubis: 62, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  johnny_speeds: {
    id: 'johnny_speeds',
    name: 'Johnny Speeds',
    tag: 'JSpeeds',
    country: 'Lituânia',
    region: 'Europa',
    tier: 4,
    points: 75,
    reputation: 56,
    budget: 90000,
    colorPrimary: '#ffce00',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 60, de_nuke: 52, de_inferno: 56, de_dust2: 64, de_ancient: 58, de_anubis: 62, de_overpass: 50
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  kubix: {
    id: 'kubix',
    name: 'KubixPro',
    tag: 'Kubix',
    country: 'Polônia',
    region: 'Europa',
    tier: 4,
    points: 65,
    reputation: 54,
    budget: 85000,
    colorPrimary: '#e11d48',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 58, de_nuke: 54, de_inferno: 56, de_dust2: 60, de_ancient: 56, de_anubis: 58, de_overpass: 52
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  }
};

// ============================================================================
// Rosters reais — apenas dos times mais notórios desta lista.
// Demais times terão elencos gerados automaticamente pelo jogo.
// salário ≈ pow(max(0, ovr-48), 2) * 0.85.
// ============================================================================

export const extraPlayersWorld: Player[] = [
  // -------------------- Sashi Esport (tier 2) --------------------
  // sirah, kraghen, kyxsan, Patti, neaLaN (referência 2025-26)
  {
    id: 'sirah',
    nickname: 'sirah',
    name: 'Lucas Kragelund',
    nationality: 'Dinamarca',
    age: 21,
    teamId: 'sashi',
    role: 'Rifler',
    subRoles: ['Entry Fragger'],
    overall: 78,
    potential: 85,
    value: 220000,
    salary: 720,
    contractMonths: 24,
    moral: 84,
    form: 83,
    energy: 99,
    personality: 'Explosivo',
    attributes: { aim: 82, gamesense: 75, clutch: 77, utility: 74, igl: 40 },
    stats: { rating: 1.08, kills: 0, deaths: 0, assists: 0, adr: 79, kast: 72, hsPercentage: 51, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'kraghen',
    nickname: 'kraghen',
    name: 'Frederik Kragh',
    nationality: 'Dinamarca',
    age: 23,
    teamId: 'sashi',
    role: 'IGL',
    subRoles: ['Support'],
    overall: 75,
    potential: 78,
    value: 130000,
    salary: 590,
    contractMonths: 18,
    moral: 84,
    form: 80,
    energy: 94,
    personality: 'Líder',
    attributes: { aim: 73, gamesense: 80, clutch: 76, utility: 79, igl: 84 },
    stats: { rating: 0.98, kills: 0, deaths: 0, assists: 0, adr: 70, kast: 72, hsPercentage: 44, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'kyxsan',
    nickname: 'kyxsan',
    name: 'Kristian Kornel Nørgaard',
    nationality: 'Dinamarca',
    age: 24,
    teamId: 'sashi',
    role: 'AWPer',
    subRoles: ['Clutcher'],
    overall: 76,
    potential: 80,
    value: 160000,
    salary: 620,
    contractMonths: 24,
    moral: 82,
    form: 81,
    energy: 96,
    personality: 'Calmo',
    attributes: { aim: 79, gamesense: 75, clutch: 78, utility: 72, igl: 38 },
    stats: { rating: 1.03, kills: 0, deaths: 0, assists: 0, adr: 73, kast: 72, hsPercentage: 18, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'patti_sashi',
    nickname: 'Patti',
    name: 'Patrick Jensen',
    nationality: 'Dinamarca',
    age: 22,
    teamId: 'sashi',
    role: 'Support',
    subRoles: ['Rifler'],
    overall: 74,
    potential: 80,
    value: 120000,
    salary: 540,
    contractMonths: 18,
    moral: 82,
    form: 79,
    energy: 96,
    personality: 'Focado',
    attributes: { aim: 74, gamesense: 76, clutch: 75, utility: 80, igl: 44 },
    stats: { rating: 0.98, kills: 0, deaths: 0, assists: 0, adr: 71, kast: 72, hsPercentage: 45, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'nealan',
    nickname: 'neaLaN',
    name: 'Ali Jusupov',
    nationality: 'Cazaquistão',
    age: 23,
    teamId: 'sashi',
    role: 'Lurker',
    subRoles: ['Rifler'],
    overall: 75,
    potential: 81,
    value: 140000,
    salary: 590,
    contractMonths: 24,
    moral: 81,
    form: 80,
    energy: 96,
    personality: 'Calmo',
    attributes: { aim: 77, gamesense: 76, clutch: 78, utility: 73, igl: 40 },
    stats: { rating: 1.01, kills: 0, deaths: 0, assists: 0, adr: 73, kast: 72, hsPercentage: 47, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },

  // -------------------- Nemiga Gaming (tier 2) --------------------
  // zorte, KENSI, 1eer, msl-style igl, sdy-style awp (nomes representativos da escola CIS)
  {
    id: 'zorte',
    nickname: 'zorte',
    name: 'Vladislav Zhuk',
    nationality: 'Belarus',
    age: 22,
    teamId: 'nemiga',
    role: 'Star Player',
    subRoles: ['Rifler'],
    overall: 78,
    potential: 85,
    value: 240000,
    salary: 720,
    contractMonths: 24,
    moral: 84,
    form: 83,
    energy: 98,
    personality: 'Explosivo',
    attributes: { aim: 82, gamesense: 76, clutch: 78, utility: 74, igl: 42 },
    stats: { rating: 1.09, kills: 0, deaths: 0, assists: 0, adr: 79, kast: 73, hsPercentage: 50, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'kensi',
    nickname: 'KENSI',
    name: 'Vladislav Krasilnikov',
    nationality: 'Belarus',
    age: 21,
    teamId: 'nemiga',
    role: 'Rifler',
    subRoles: ['Entry Fragger'],
    overall: 76,
    potential: 84,
    value: 180000,
    salary: 620,
    contractMonths: 30,
    moral: 83,
    form: 81,
    energy: 99,
    personality: 'Focado',
    attributes: { aim: 80, gamesense: 74, clutch: 76, utility: 74, igl: 40 },
    stats: { rating: 1.04, kills: 0, deaths: 0, assists: 0, adr: 76, kast: 72, hsPercentage: 49, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: '1eer',
    nickname: '1eer',
    name: 'Dmitry Tislenko',
    nationality: 'Belarus',
    age: 20,
    teamId: 'nemiga',
    role: 'AWPer',
    subRoles: ['Clutcher'],
    overall: 76,
    potential: 84,
    value: 200000,
    salary: 620,
    contractMonths: 30,
    moral: 83,
    form: 81,
    energy: 100,
    personality: 'Calmo',
    attributes: { aim: 80, gamesense: 74, clutch: 79, utility: 71, igl: 36 },
    stats: { rating: 1.05, kills: 0, deaths: 0, assists: 0, adr: 73, kast: 73, hsPercentage: 17, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'mututnik',
    nickname: 'mututnik',
    name: 'Anton Mutuznikov',
    nationality: 'Belarus',
    age: 24,
    teamId: 'nemiga',
    role: 'IGL',
    subRoles: ['Support'],
    overall: 73,
    potential: 76,
    value: 100000,
    salary: 540,
    contractMonths: 18,
    moral: 84,
    form: 79,
    energy: 93,
    personality: 'Líder',
    attributes: { aim: 71, gamesense: 79, clutch: 75, utility: 78, igl: 83 },
    stats: { rating: 0.96, kills: 0, deaths: 0, assists: 0, adr: 69, kast: 72, hsPercentage: 43, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'sdy_nem',
    nickname: 'salazar',
    name: 'Maksim Salazar',
    nationality: 'Belarus',
    age: 22,
    teamId: 'nemiga',
    role: 'Support',
    subRoles: ['Rifler'],
    overall: 73,
    potential: 80,
    value: 110000,
    salary: 540,
    contractMonths: 24,
    moral: 82,
    form: 79,
    energy: 96,
    personality: 'Calmo',
    attributes: { aim: 73, gamesense: 75, clutch: 74, utility: 79, igl: 44 },
    stats: { rating: 0.97, kills: 0, deaths: 0, assists: 0, adr: 70, kast: 72, hsPercentage: 45, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },

  // -------------------- Metizport (tier 3) --------------------
  {
    id: 'metiz_star',
    nickname: 'pley',
    name: 'Pelle Lindgren',
    nationality: 'Suécia',
    age: 21,
    teamId: 'metizport',
    role: 'Star Player',
    subRoles: ['Rifler', 'Entry Fragger'],
    overall: 75,
    potential: 83,
    value: 170000,
    salary: 590,
    contractMonths: 24,
    moral: 83,
    form: 81,
    energy: 99,
    personality: 'Explosivo',
    attributes: { aim: 80, gamesense: 73, clutch: 75, utility: 72, igl: 38 },
    stats: { rating: 1.05, kills: 0, deaths: 0, assists: 0, adr: 77, kast: 71, hsPercentage: 50, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'metiz_awp',
    nickname: 'frge',
    name: 'Edvin Forsberg',
    nationality: 'Suécia',
    age: 22,
    teamId: 'metizport',
    role: 'AWPer',
    subRoles: ['Clutcher'],
    overall: 73,
    potential: 80,
    value: 120000,
    salary: 540,
    contractMonths: 24,
    moral: 81,
    form: 79,
    energy: 97,
    personality: 'Calmo',
    attributes: { aim: 77, gamesense: 72, clutch: 76, utility: 70, igl: 36 },
    stats: { rating: 1.00, kills: 0, deaths: 0, assists: 0, adr: 71, kast: 71, hsPercentage: 17, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'metiz_igl',
    nickname: 'oxygeN',
    name: 'Marcus Hjelt',
    nationality: 'Suécia',
    age: 25,
    teamId: 'metizport',
    role: 'IGL',
    subRoles: ['Support'],
    overall: 72,
    potential: 75,
    value: 90000,
    salary: 480,
    contractMonths: 18,
    moral: 82,
    form: 78,
    energy: 92,
    personality: 'Líder',
    attributes: { aim: 70, gamesense: 78, clutch: 74, utility: 77, igl: 82 },
    stats: { rating: 0.95, kills: 0, deaths: 0, assists: 0, adr: 68, kast: 71, hsPercentage: 42, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'metiz_entry',
    nickname: 'svANTE',
    name: 'Svante Karlsson',
    nationality: 'Suécia',
    age: 20,
    teamId: 'metizport',
    role: 'Entry Fragger',
    subRoles: ['Rifler'],
    overall: 71,
    potential: 80,
    value: 100000,
    salary: 460,
    contractMonths: 24,
    moral: 81,
    form: 78,
    energy: 99,
    personality: 'Explosivo',
    attributes: { aim: 75, gamesense: 70, clutch: 71, utility: 70, igl: 36 },
    stats: { rating: 0.98, kills: 0, deaths: 0, assists: 0, adr: 73, kast: 69, hsPercentage: 49, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'metiz_supp',
    nickname: 'lysome',
    name: 'Liam Söderberg',
    nationality: 'Suécia',
    age: 22,
    teamId: 'metizport',
    role: 'Support',
    subRoles: ['Rifler'],
    overall: 70,
    potential: 78,
    value: 90000,
    salary: 420,
    contractMonths: 18,
    moral: 81,
    form: 78,
    energy: 96,
    personality: 'Calmo',
    attributes: { aim: 70, gamesense: 73, clutch: 72, utility: 78, igl: 44 },
    stats: { rating: 0.95, kills: 0, deaths: 0, assists: 0, adr: 69, kast: 70, hsPercentage: 43, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },

  // -------------------- Chinggis Warriors (tier 4) --------------------
  {
    id: 'cw_star',
    nickname: 'Techno4K',
    name: 'Tushig Munkhbat',
    nationality: 'Mongólia',
    age: 21,
    teamId: 'chinggis_warriors',
    role: 'Star Player',
    subRoles: ['Rifler', 'Entry Fragger'],
    overall: 73,
    potential: 81,
    value: 130000,
    salary: 540,
    contractMonths: 24,
    moral: 82,
    form: 80,
    energy: 99,
    personality: 'Explosivo',
    attributes: { aim: 78, gamesense: 70, clutch: 73, utility: 70, igl: 36 },
    stats: { rating: 1.03, kills: 0, deaths: 0, assists: 0, adr: 75, kast: 70, hsPercentage: 50, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'cw_awp',
    nickname: 'Garidmagnai',
    name: 'Garidmagnai Byambasuren',
    nationality: 'Mongólia',
    age: 22,
    teamId: 'chinggis_warriors',
    role: 'AWPer',
    subRoles: ['Clutcher'],
    overall: 70,
    potential: 78,
    value: 100000,
    salary: 420,
    contractMonths: 24,
    moral: 81,
    form: 79,
    energy: 98,
    personality: 'Calmo',
    attributes: { aim: 75, gamesense: 69, clutch: 73, utility: 68, igl: 34 },
    stats: { rating: 0.99, kills: 0, deaths: 0, assists: 0, adr: 70, kast: 70, hsPercentage: 17, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'cw_igl',
    nickname: 'Tsetseg~',
    name: 'Tsetsegsuren Davaajav',
    nationality: 'Mongólia',
    age: 24,
    teamId: 'chinggis_warriors',
    role: 'IGL',
    subRoles: ['Support'],
    overall: 68,
    potential: 72,
    value: 70000,
    salary: 360,
    contractMonths: 18,
    moral: 82,
    form: 77,
    energy: 93,
    personality: 'Líder',
    attributes: { aim: 66, gamesense: 75, clutch: 70, utility: 75, igl: 80 },
    stats: { rating: 0.93, kills: 0, deaths: 0, assists: 0, adr: 66, kast: 70, hsPercentage: 41, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'cw_entry',
    nickname: 'Ando',
    name: 'Anand Battulga',
    nationality: 'Mongólia',
    age: 20,
    teamId: 'chinggis_warriors',
    role: 'Entry Fragger',
    subRoles: ['Rifler'],
    overall: 68,
    potential: 78,
    value: 80000,
    salary: 360,
    contractMonths: 24,
    moral: 81,
    form: 78,
    energy: 99,
    personality: 'Explosivo',
    attributes: { aim: 73, gamesense: 66, clutch: 68, utility: 67, igl: 34 },
    stats: { rating: 0.96, kills: 0, deaths: 0, assists: 0, adr: 71, kast: 68, hsPercentage: 48, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  },
  {
    id: 'cw_supp',
    nickname: 'mK',
    name: 'Munkhbold Khaltar',
    nationality: 'Mongólia',
    age: 23,
    teamId: 'chinggis_warriors',
    role: 'Support',
    subRoles: ['Rifler'],
    overall: 67,
    potential: 74,
    value: 65000,
    salary: 320,
    contractMonths: 18,
    moral: 81,
    form: 77,
    energy: 96,
    personality: 'Calmo',
    attributes: { aim: 67, gamesense: 70, clutch: 69, utility: 76, igl: 42 },
    stats: { rating: 0.93, kills: 0, deaths: 0, assists: 0, adr: 66, kast: 69, hsPercentage: 42, clutchesWon: 0, firstKills: 0, firstDeaths: 0, mapsPlayed: 0, mvps: 0 },
    status: 'titular'
  }
];
