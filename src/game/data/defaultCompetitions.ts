import { Tournament } from '../../types';

export const defaultCompetitions: Tournament[] = [
  {
    id: 'major_mundial',
    name: 'PGL Major',
    tier: 1,
    prizePool: 1000000,
    teamIds: [], // Preenchido dinamicamente com base nos rankings
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 24 // Ocorre na semana 24 (metade do ano/fim de temporada)
  },
  {
    id: 'superliga_global',
    name: 'BLAST Premier World Final',
    tier: 1,
    prizePool: 500000,
    teamIds: [],
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 12
  },
  {
    id: 'champions_fps',
    name: 'IEM Cologne',
    tier: 1,
    prizePool: 250000,
    teamIds: [],
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 40
  },
  {
    id: 'pro_league_regional',
    name: 'ESL Pro League',
    tier: 2,
    prizePool: 120000,
    teamIds: [],
    format: 'groups',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 16
  },
  {
    id: 'masters_challenger',
    name: 'IEM Dallas',
    tier: 2,
    prizePool: 80000,
    teamIds: [],
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 32
  },
  {
    id: 'circuito_sa',
    name: 'ESL Challenger League SA',
    tier: 3,
    prizePool: 40000,
    teamIds: [],
    format: 'groups',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 8
  },
  {
    id: 'copa_semipro',
    name: 'CCT South America',
    tier: 3,
    prizePool: 20000,
    teamIds: [],
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 28
  },
  {
    id: 'liga_amadora',
    name: 'Gamers Club Master',
    tier: 4,
    prizePool: 5000,
    teamIds: [],
    format: 'bracket',
    isFinished: false,
    currentRound: 0,
    matches: [],
    weekScheduled: 4 // Ocorre logo no início
  }
];
