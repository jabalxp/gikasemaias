import { Tournament } from '../../types';

export const defaultCompetitions: Tournament[] = [
  {
    id: 'major_mundial',
    name: 'Major Mundial ProStrike',
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
    name: 'Superliga Global Elite',
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
    name: 'Champions FPS Cup',
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
    name: 'Pro League Regional SA/NA',
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
    name: 'Masters Challenger Europe/Americas',
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
    name: 'Circuito Sul-Americano',
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
    name: 'Copa Semi-Pro Latam',
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
    name: 'Liga Amadora Regional',
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
