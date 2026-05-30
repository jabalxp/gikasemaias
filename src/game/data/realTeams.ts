import { Team } from '../../types';

export const realTeams: Record<string, Team> = {
  // BRASILEIROS E SUL-AMERICANOS (Obrigatórios)
  furia: {
    id: 'furia',
    name: 'FURIA',
    tag: 'FURIA',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 1,
    points: 750,
    reputation: 88,
    budget: 650000,
    colorPrimary: '#010101',
    colorSecondary: '#05ff4b',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'map_control',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 82, de_nuke: 78, de_inferno: 65, de_dust2: 70, de_ancient: 85, de_anubis: 80, de_overpass: 72
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  pain: {
    id: 'pain',
    name: 'paiN Gaming',
    tag: 'paiN',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 2,
    points: 480,
    reputation: 80,
    budget: 450000,
    colorPrimary: '#ff0000',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 75, de_nuke: 82, de_inferno: 72, de_dust2: 60, de_ancient: 78, de_anubis: 85, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  mibr: {
    id: 'mibr',
    name: 'MIBR',
    tag: 'MIBR',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 2,
    points: 420,
    reputation: 82,
    budget: 500000,
    colorPrimary: '#0a3161',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 80, de_nuke: 70, de_inferno: 78, de_dust2: 68, de_ancient: 70, de_anubis: 72, de_overpass: 82
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  imperial: {
    id: 'imperial',
    name: 'Imperial Esports',
    tag: 'Imperial',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 2,
    points: 450,
    reputation: 81,
    budget: 480000,
    colorPrimary: '#00ff88',
    colorSecondary: '#0b1625',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'retake',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 75, de_inferno: 82, de_dust2: 78, de_ancient: 68, de_anubis: 70, de_overpass: 78
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  legacy: {
    id: 'legacy',
    name: 'Legacy',
    tag: 'Legacy',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 250,
    reputation: 72,
    budget: 280000,
    colorPrimary: '#c99a3c',
    colorSecondary: '#0f141d',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 65, de_inferno: 70, de_dust2: 75, de_ancient: 72, de_anubis: 74, de_overpass: 60
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  fluxo: {
    id: 'fluxo',
    name: 'Fluxo',
    tag: 'Fluxo',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 200,
    reputation: 70,
    budget: 350000,
    colorPrimary: '#5f00e8',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 58, de_inferno: 60, de_dust2: 80, de_ancient: 65, de_anubis: 76, de_overpass: 64
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  red_canids: {
    id: 'red_canids',
    name: 'RED Canids',
    tag: 'RED',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 180,
    reputation: 71,
    budget: 300000,
    colorPrimary: '#e60000',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 62, de_inferno: 68, de_dust2: 70, de_ancient: 75, de_anubis: 68, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  sharks: {
    id: 'sharks',
    name: 'Sharks Esports',
    tag: 'Sharks',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 160,
    reputation: 68,
    budget: 220000,
    colorPrimary: '#0055ff',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'retake',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 78, de_nuke: 64, de_inferno: 74, de_dust2: 55, de_ancient: 60, de_anubis: 62, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  oddik: {
    id: 'oddik',
    name: 'ODDIK',
    tag: 'ODDIK',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 140,
    reputation: 66,
    budget: 200000,
    colorPrimary: '#ff6600',
    colorSecondary: '#151515',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 65, de_nuke: 68, de_inferno: 60, de_dust2: 72, de_ancient: 64, de_anubis: 70, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  bestia: {
    id: 'bestia',
    name: 'BESTIA',
    tag: 'BESTIA',
    country: 'Argentina',
    region: 'América do Sul',
    tier: 3,
    points: 150,
    reputation: 67,
    budget: 180000,
    colorPrimary: '#ff4400',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'execute',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 55, de_inferno: 65, de_dust2: 78, de_ancient: 70, de_anubis: 72, de_overpass: 60
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  '9z': {
    id: '9z',
    name: '9z Team',
    tag: '9z',
    country: 'Argentina',
    region: 'América do Sul',
    tier: 2,
    points: 390,
    reputation: 78,
    budget: 350000,
    colorPrimary: '#9400d3',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 80, de_inferno: 70, de_dust2: 65, de_ancient: 82, de_anubis: 78, de_overpass: 72
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  case: {
    id: 'case',
    name: 'Case Esports',
    tag: 'Case',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 90,
    reputation: 60,
    budget: 180000,
    colorPrimary: '#eac15c',
    colorSecondary: '#1d2a44',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 58, de_inferno: 62, de_dust2: 66, de_ancient: 55, de_anubis: 64, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  w7m: {
    id: 'w7m',
    name: 'w7m esports',
    tag: 'w7m',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 85,
    reputation: 59,
    budget: 150000,
    colorPrimary: '#ff3c00',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 60, de_nuke: 62, de_inferno: 58, de_dust2: 70, de_ancient: 60, de_anubis: 65, de_overpass: 55
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  hype: {
    id: 'hype',
    name: 'Hype',
    tag: 'Hype',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 70,
    reputation: 55,
    budget: 120000,
    colorPrimary: '#00f0ff',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'execute',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 64, de_nuke: 50, de_inferno: 55, de_dust2: 72, de_ancient: 58, de_anubis: 68, de_overpass: 50
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  galorys: {
    id: 'galorys',
    name: 'Galorys',
    tag: 'Galorys',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 75,
    reputation: 56,
    budget: 130000,
    colorPrimary: '#ff00ff',
    colorSecondary: '#202020',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 58, de_nuke: 58, de_inferno: 60, de_dust2: 68, de_ancient: 62, de_anubis: 66, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  solid: {
    id: 'solid',
    name: 'Team Solid',
    tag: 'Solid',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 65,
    reputation: 54,
    budget: 110000,
    colorPrimary: '#ffcc00',
    colorSecondary: '#101010',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'retake',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 52, de_inferno: 64, de_dust2: 58, de_ancient: 54, de_anubis: 58, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  bounty_hunters: {
    id: 'bounty_hunters',
    name: 'Bounty Hunters',
    tag: 'Bounty',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 60,
    reputation: 53,
    budget: 100000,
    colorPrimary: '#1bb52c',
    colorSecondary: '#0a0a0a',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 55, de_nuke: 58, de_inferno: 52, de_dust2: 70, de_ancient: 58, de_anubis: 62, de_overpass: 50
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  players: {
    id: 'players',
    name: 'Players',
    tag: 'Players',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 50,
    reputation: 50,
    budget: 90000,
    colorPrimary: '#ffffff',
    colorSecondary: '#333333',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 60, de_nuke: 50, de_inferno: 54, de_dust2: 60, de_ancient: 52, de_anubis: 56, de_overpass: 52
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  corinthians: {
    id: 'corinthians',
    name: 'Corinthians Esports',
    tag: 'SCCP',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 55,
    reputation: 62,
    budget: 160000,
    colorPrimary: '#000000',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 64, de_nuke: 52, de_inferno: 58, de_dust2: 62, de_ancient: 56, de_anubis: 60, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  flamengo: {
    id: 'flamengo',
    name: 'Flamengo Esports',
    tag: 'FLA',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 4,
    points: 58,
    reputation: 64,
    budget: 180000,
    colorPrimary: '#c41c1c',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'mid_control',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 56, de_inferno: 60, de_dust2: 68, de_ancient: 58, de_anubis: 64, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  loud: {
    id: 'loud',
    name: 'LOUD',
    tag: 'LOUD',
    country: 'Brasil',
    region: 'América do Sul',
    tier: 3,
    points: 150,
    reputation: 76,
    budget: 300000,
    colorPrimary: '#00ff00',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 65, de_inferno: 68, de_dust2: 74, de_ancient: 70, de_anubis: 75, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },

  // INTERNACIONAIS (Obrigatórios)
  vitality: {
    id: 'vitality',
    name: 'Team Vitality',
    tag: 'Vitality',
    country: 'França',
    region: 'Europa',
    tier: 1,
    points: 980,
    reputation: 96,
    budget: 1500000,
    colorPrimary: '#f0e600',
    colorSecondary: '#0a0a0a',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 88, de_nuke: 92, de_inferno: 84, de_dust2: 85, de_ancient: 80, de_anubis: 90, de_overpass: 82
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  navi: {
    id: 'navi',
    name: 'Natus Vincere',
    tag: 'NAVI',
    country: 'Ucrânia',
    region: 'Europa',
    tier: 1,
    points: 990,
    reputation: 97,
    budget: 1600000,
    colorPrimary: '#fff200',
    colorSecondary: '#1a1a1a',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'map_control',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 92, de_nuke: 94, de_inferno: 80, de_dust2: 82, de_ancient: 88, de_anubis: 86, de_overpass: 90
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  faze: {
    id: 'faze',
    name: 'FaZe Clan',
    tag: 'FaZe',
    country: 'Estados Unidos',
    region: 'Europa',
    tier: 1,
    points: 920,
    reputation: 94,
    budget: 1400000,
    colorPrimary: '#ff0f0f',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'retake',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 85, de_nuke: 88, de_inferno: 90, de_dust2: 78, de_ancient: 82, de_anubis: 84, de_overpass: 86
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  spirit: {
    id: 'spirit',
    name: 'Team Spirit',
    tag: 'Spirit',
    country: 'Rússia',
    region: 'Europa',
    tier: 1,
    points: 950,
    reputation: 92,
    budget: 1100000,
    colorPrimary: '#ffffff',
    colorSecondary: '#0d1926',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 82, de_nuke: 85, de_inferno: 74, de_dust2: 92, de_ancient: 90, de_anubis: 88, de_overpass: 78
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  g2: {
    id: 'g2',
    name: 'G2 Esports',
    tag: 'G2',
    country: 'Alemanha',
    region: 'Europa',
    tier: 1,
    points: 940,
    reputation: 93,
    budget: 1300000,
    colorPrimary: '#1a1a1a',
    colorSecondary: '#737373',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 90, de_nuke: 82, de_inferno: 80, de_dust2: 88, de_ancient: 84, de_anubis: 86, de_overpass: 78
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  mouz: {
    id: 'mouz',
    name: 'MOUZ',
    tag: 'MOUZ',
    country: 'Alemanha',
    region: 'Europa',
    tier: 1,
    points: 910,
    reputation: 90,
    budget: 900000,
    colorPrimary: '#f6003c',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 86, de_nuke: 88, de_inferno: 78, de_dust2: 72, de_ancient: 85, de_anubis: 82, de_overpass: 84
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  falcons: {
    id: 'falcons',
    name: 'Team Falcons',
    tag: 'Falcons',
    country: 'Arábia Saudita',
    region: 'Europa',
    tier: 2,
    points: 580,
    reputation: 82,
    budget: 2000000,
    colorPrimary: '#00ff66',
    colorSecondary: '#021008',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 78, de_nuke: 80, de_inferno: 82, de_dust2: 70, de_ancient: 74, de_anubis: 72, de_overpass: 78
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  liquid: {
    id: 'liquid',
    name: 'Team Liquid',
    tag: 'Liquid',
    country: 'Estados Unidos',
    region: 'América do Norte',
    tier: 1,
    points: 780,
    reputation: 89,
    budget: 1200000,
    colorPrimary: '#091d3a',
    colorSecondary: '#c8a14d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'mid_control',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 80, de_nuke: 75, de_inferno: 78, de_dust2: 82, de_ancient: 84, de_anubis: 85, de_overpass: 80
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  complexity: {
    id: 'complexity',
    name: 'Complexity Gaming',
    tag: 'COL',
    country: 'Estados Unidos',
    region: 'América do Norte',
    tier: 2,
    points: 620,
    reputation: 84,
    budget: 800000,
    colorPrimary: '#002f6c',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 76, de_nuke: 78, de_inferno: 74, de_dust2: 80, de_ancient: 78, de_anubis: 82, de_overpass: 82
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  astralis: {
    id: 'astralis',
    name: 'Astralis',
    tag: 'Astralis',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 1,
    points: 740,
    reputation: 87,
    budget: 950000,
    colorPrimary: '#ef3842',
    colorSecondary: '#0e1d2c',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'map_control',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 78, de_nuke: 86, de_inferno: 82, de_dust2: 74, de_ancient: 80, de_anubis: 76, de_overpass: 88
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  virtus_pro: {
    id: 'virtus_pro',
    name: 'Virtus.pro',
    tag: 'VP',
    country: 'Armênia',
    region: 'Europa',
    tier: 1,
    points: 800,
    reputation: 88,
    budget: 850000,
    colorPrimary: '#ff5c00',
    colorSecondary: '#040d12',
    isUser: false,
    tactics: {
      playstyle: 'very_defensive',
      tempo: 'slow',
      focus: 'default',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 84, de_nuke: 76, de_inferno: 88, de_dust2: 80, de_ancient: 82, de_anubis: 78, de_overpass: 85
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  heroic: {
    id: 'heroic',
    name: 'HEROIC',
    tag: 'Heroic',
    country: 'Noruega',
    region: 'Europa',
    tier: 2,
    points: 600,
    reputation: 83,
    budget: 750000,
    colorPrimary: '#e60f2a',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 74, de_nuke: 82, de_inferno: 76, de_dust2: 78, de_ancient: 80, de_anubis: 84, de_overpass: 78
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  nip: {
    id: 'nip',
    name: 'Ninjas in Pyjamas',
    tag: 'NIP',
    country: 'Suécia',
    region: 'Europa',
    tier: 3,
    points: 320,
    reputation: 75,
    budget: 600000,
    colorPrimary: '#0c221c',
    colorSecondary: '#e4ff00',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 74, de_inferno: 70, de_dust2: 68, de_ancient: 72, de_anubis: 70, de_overpass: 74
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  fnatic: {
    id: 'fnatic',
    name: 'Fnatic',
    tag: 'Fnatic',
    country: 'Reino Unido',
    region: 'Europa',
    tier: 3,
    points: 340,
    reputation: 76,
    budget: 550000,
    colorPrimary: '#ff5900',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 76, de_nuke: 70, de_inferno: 74, de_dust2: 75, de_ancient: 70, de_anubis: 78, de_overpass: 68
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  big: {
    id: 'big',
    name: 'BIG',
    tag: 'BIG',
    country: 'Alemanha',
    region: 'Europa',
    tier: 3,
    points: 330,
    reputation: 74,
    budget: 450000,
    colorPrimary: '#ffffff',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'default',
      utilityUsage: 'very_high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 78, de_nuke: 72, de_inferno: 75, de_dust2: 82, de_ancient: 65, de_anubis: 70, de_overpass: 76
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  ence: {
    id: 'ence',
    name: 'ENCE',
    tag: 'ENCE',
    country: 'Finlândia',
    region: 'Europa',
    tier: 3,
    points: 290,
    reputation: 72,
    budget: 350000,
    colorPrimary: '#0b1625',
    colorSecondary: '#f42229',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 76, de_inferno: 68, de_dust2: 65, de_ancient: 72, de_anubis: 74, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  cloud9: {
    id: 'cloud9',
    name: 'Cloud9',
    tag: 'C9',
    country: 'Estados Unidos',
    region: 'Europa',
    tier: 2,
    points: 550,
    reputation: 83,
    budget: 1000000,
    colorPrimary: '#00a6e0',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'map_control',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 82, de_nuke: 78, de_inferno: 70, de_dust2: 84, de_ancient: 75, de_anubis: 80, de_overpass: 82
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  gamerlegion: {
    id: 'gamerlegion',
    name: 'GamerLegion',
    tag: 'GL',
    country: 'Alemanha',
    region: 'Europa',
    tier: 3,
    points: 260,
    reputation: 71,
    budget: 300000,
    colorPrimary: '#0b1326',
    colorSecondary: '#d92b3a',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 68, de_inferno: 70, de_dust2: 60, de_ancient: 74, de_anubis: 75, de_overpass: 68
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  saw: {
    id: 'saw',
    name: 'SAW',
    tag: 'SAW',
    country: 'Portugal',
    region: 'Europa',
    tier: 3,
    points: 240,
    reputation: 70,
    budget: 220000,
    colorPrimary: '#1a1a1a',
    colorSecondary: '#e0fb15',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 74, de_nuke: 72, de_inferno: 76, de_dust2: 58, de_ancient: 70, de_anubis: 68, de_overpass: 64
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  mongolz: {
    id: 'mongolz',
    name: 'The MongolZ',
    tag: 'MongolZ',
    country: 'Mongólia',
    region: 'Ásia',
    tier: 2,
    points: 680,
    reputation: 80,
    budget: 250000,
    colorPrimary: '#ffffff',
    colorSecondary: '#bfa15f',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 82, de_nuke: 78, de_inferno: 72, de_dust2: 85, de_ancient: 84, de_anubis: 80, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Gaming',
    tag: 'Aurora',
    country: 'Rússia',
    region: 'Europa',
    tier: 3,
    points: 230,
    reputation: 69,
    budget: 280000,
    colorPrimary: '#0d9b4c',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 65, de_inferno: 64, de_dust2: 72, de_ancient: 70, de_anubis: 72, de_overpass: 60
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  betboom: {
    id: 'betboom',
    name: 'BetBoom Team',
    tag: 'BetBoom',
    country: 'Rússia',
    region: 'Europa',
    tier: 3,
    points: 250,
    reputation: 70,
    budget: 500000,
    colorPrimary: '#e6ff00',
    colorSecondary: '#1c1c1c',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 74, de_nuke: 68, de_inferno: 70, de_dust2: 75, de_ancient: 72, de_anubis: 70, de_overpass: 72
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  '3dmax': {
    id: '3dmax',
    name: '3DMAX',
    tag: '3DMAX',
    country: 'França',
    region: 'Europa',
    tier: 3,
    points: 210,
    reputation: 68,
    budget: 180000,
    colorPrimary: '#e20025',
    colorSecondary: '#0d0d0d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 62, de_inferno: 74, de_dust2: 65, de_ancient: 66, de_anubis: 68, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  b8: {
    id: 'b8',
    name: 'B8',
    tag: 'B8',
    country: 'Ucrânia',
    region: 'Europa',
    tier: 3,
    points: 200,
    reputation: 67,
    budget: 160000,
    colorPrimary: '#0057b7',
    colorSecondary: '#ffd700',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 60, de_inferno: 62, de_dust2: 72, de_ancient: 68, de_anubis: 70, de_overpass: 60
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  eternal_fire: {
    id: 'eternal_fire',
    name: 'Eternal Fire',
    tag: 'EF',
    country: 'Turquia',
    region: 'Europa',
    tier: 2,
    points: 590,
    reputation: 82,
    budget: 400000,
    colorPrimary: '#d7a15c',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 82, de_nuke: 80, de_inferno: 76, de_dust2: 88, de_ancient: 80, de_anubis: 82, de_overpass: 74
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  monte: {
    id: 'monte',
    name: 'Monte',
    tag: 'Monte',
    country: 'Ucrânia',
    region: 'Europa',
    tier: 3,
    points: 220,
    reputation: 70,
    budget: 200000,
    colorPrimary: '#ffd700',
    colorSecondary: '#000000',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 70, de_inferno: 66, de_dust2: 68, de_ancient: 74, de_anubis: 75, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  apeks: {
    id: 'apeks',
    name: 'Apeks',
    tag: 'Apeks',
    country: 'Noruega',
    region: 'Europa',
    tier: 3,
    points: 210,
    reputation: 70,
    budget: 250000,
    colorPrimary: '#005aff',
    colorSecondary: '#0f172a',
    isUser: false,
    tactics: {
      playstyle: 'defensive',
      tempo: 'slow',
      focus: 'retake',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 74, de_nuke: 68, de_inferno: 72, de_dust2: 60, de_ancient: 70, de_anubis: 70, de_overpass: 72
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  og: {
    id: 'og',
    name: 'OG Esports',
    tag: 'OG',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 3,
    points: 230,
    reputation: 71,
    budget: 450000,
    colorPrimary: '#001a33',
    colorSecondary: '#e6b800',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 70, de_inferno: 74, de_dust2: 65, de_ancient: 68, de_anubis: 72, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  tsm: {
    id: 'tsm',
    name: 'TSM',
    tag: 'TSM',
    country: 'Estados Unidos',
    region: 'Europa',
    tier: 3,
    points: 190,
    reputation: 72,
    budget: 500000,
    colorPrimary: '#000000',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 64, de_inferno: 66, de_dust2: 70, de_ancient: 65, de_anubis: 68, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  parivision: {
    id: 'parivision',
    name: 'PARIVISION',
    tag: 'PARIVISION',
    country: 'Rússia',
    region: 'Europa',
    tier: 4,
    points: 110,
    reputation: 62,
    budget: 200000,
    colorPrimary: '#6a0dad',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 66, de_nuke: 58, de_inferno: 62, de_dust2: 70, de_ancient: 64, de_anubis: 66, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  sangal: {
    id: 'sangal',
    name: 'Sangal Esports',
    tag: 'Sangal',
    country: 'Turquia',
    region: 'Europa',
    tier: 3,
    points: 230,
    reputation: 70,
    budget: 180000,
    colorPrimary: '#0a84ff',
    colorSecondary: '#050505',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 65, de_inferno: 68, de_dust2: 70, de_ancient: 72, de_anubis: 75, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  m80: {
    id: 'm80',
    name: 'M80',
    tag: 'M80',
    country: 'Estados Unidos',
    region: 'América do Norte',
    tier: 2,
    points: 380,
    reputation: 76,
    budget: 400000,
    colorPrimary: '#eaff00',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 76, de_nuke: 70, de_inferno: 68, de_dust2: 78, de_ancient: 80, de_anubis: 82, de_overpass: 70
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  flyquest: {
    id: 'flyquest',
    name: 'FlyQuest',
    tag: 'FlyQuest',
    country: 'Austrália',
    region: 'Ásia-Pacífico',
    tier: 2,
    points: 400,
    reputation: 77,
    budget: 350000,
    colorPrimary: '#004c24',
    colorSecondary: '#bfa25f',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 78, de_nuke: 72, de_inferno: 74, de_dust2: 70, de_ancient: 76, de_anubis: 78, de_overpass: 75
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  lynn_vision: {
    id: 'lynn_vision',
    name: 'Lynn Vision Gaming',
    tag: 'LVG',
    country: 'China',
    region: 'Ásia',
    tier: 3,
    points: 210,
    reputation: 68,
    budget: 200000,
    colorPrimary: '#f30a2a',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'very_aggressive',
      tempo: 'explosive',
      focus: 'execute',
      utilityUsage: 'low',
      economyStyle: 'aggressive'
    },
    mapMastery: {
      de_mirage: 72, de_nuke: 60, de_inferno: 64, de_dust2: 76, de_ancient: 70, de_anubis: 72, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  tyloo: {
    id: 'tyloo',
    name: 'TYLOO',
    tag: 'TYLOO',
    country: 'China',
    region: 'Ásia',
    tier: 3,
    points: 180,
    reputation: 67,
    budget: 250000,
    colorPrimary: '#ff0000',
    colorSecondary: '#ffffff',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 58, de_inferno: 62, de_dust2: 72, de_ancient: 66, de_anubis: 68, de_overpass: 55
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  rare_atom: {
    id: 'rare_atom',
    name: 'Rare Atom',
    tag: 'RA',
    country: 'China',
    region: 'Ásia',
    tier: 4,
    points: 100,
    reputation: 61,
    budget: 150000,
    colorPrimary: '#0dffdd',
    colorSecondary: '#12121c',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 65, de_nuke: 56, de_inferno: 60, de_dust2: 70, de_ancient: 62, de_anubis: 65, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  grayhound: {
    id: 'grayhound',
    name: 'Grayhound',
    tag: 'GH',
    country: 'Austrália',
    region: 'Ásia-Pacífico',
    tier: 4,
    points: 80,
    reputation: 60,
    budget: 120000,
    colorPrimary: '#708090',
    colorSecondary: '#050505',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'pickoffs',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 66, de_nuke: 58, de_inferno: 60, de_dust2: 68, de_ancient: 60, de_anubis: 64, de_overpass: 56
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  nrg: {
    id: 'nrg',
    name: 'NRG Esports',
    tag: 'NRG',
    country: 'Estados Unidos',
    region: 'América do Norte',
    tier: 4,
    points: 120,
    reputation: 66,
    budget: 500000,
    colorPrimary: '#ffffff',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 70, de_nuke: 62, de_inferno: 65, de_dust2: 74, de_ancient: 68, de_anubis: 70, de_overpass: 66
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  wildcard: {
    id: 'wildcard',
    name: 'Wildcard Gaming',
    tag: 'WC',
    country: 'Estados Unidos',
    region: 'América do Norte',
    tier: 4,
    points: 130,
    reputation: 64,
    budget: 250000,
    colorPrimary: '#ff6c00',
    colorSecondary: '#050c14',
    isUser: false,
    tactics: {
      playstyle: 'aggressive',
      tempo: 'fast',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'force'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 62, de_inferno: 60, de_dust2: 72, de_ancient: 66, de_anubis: 70, de_overpass: 62
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  masonic: {
    id: 'masonic',
    name: 'MASONIC',
    tag: 'MASONIC',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 4,
    points: 50,
    reputation: 52,
    budget: 100000,
    colorPrimary: '#0d1f3d',
    colorSecondary: '#e3b13c',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 60, de_nuke: 58, de_inferno: 54, de_dust2: 60, de_ancient: 52, de_anubis: 58, de_overpass: 54
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  ecstatic: {
    id: 'ecstatic',
    name: 'ECSTATIC',
    tag: 'ECSTATIC',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 3,
    points: 200,
    reputation: 68,
    budget: 150000,
    colorPrimary: '#ffd700',
    colorSecondary: '#111111',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'high',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 68, de_nuke: 72, de_inferno: 65, de_dust2: 62, de_ancient: 70, de_anubis: 70, de_overpass: 68
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    tag: 'Sprout',
    country: 'Alemanha',
    region: 'Europa',
    tier: 4,
    points: 60,
    reputation: 56,
    budget: 120000,
    colorPrimary: '#00ab66',
    colorSecondary: '#1d1d1d',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'default',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 62, de_nuke: 58, de_inferno: 55, de_dust2: 65, de_ancient: 58, de_anubis: 60, de_overpass: 58
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  },
  cph_wolves: {
    id: 'cph_wolves',
    name: 'Copenhagen Wolves',
    tag: 'CPHW',
    country: 'Dinamarca',
    region: 'Europa',
    tier: 4,
    points: 70,
    reputation: 58,
    budget: 130000,
    colorPrimary: '#0a0d14',
    colorSecondary: '#b9935a',
    isUser: false,
    tactics: {
      playstyle: 'balanced',
      tempo: 'normal',
      focus: 'execute',
      utilityUsage: 'medium',
      economyStyle: 'balanced'
    },
    mapMastery: {
      de_mirage: 64, de_nuke: 60, de_inferno: 58, de_dust2: 66, de_ancient: 58, de_anubis: 62, de_overpass: 56
    },
    stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
    staff: {}
  }
};
