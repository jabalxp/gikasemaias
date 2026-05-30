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
  },
  // Torneios adicionais (F4): densificam o calendário para que cada tier tenha eventos
  // espalhados pelo ano — elimina as "semanas mortas" em que o jogador não tinha o que disputar.
  { id: 'iem_katowice', name: 'IEM Katowice', tier: 1, prizePool: 400000, teamIds: [], format: 'bracket', isFinished: false, currentRound: 0, matches: [], weekScheduled: 6 },
  { id: 'blast_spring', name: 'BLAST Premier Spring Final', tier: 1, prizePool: 425000, teamIds: [], format: 'bracket', isFinished: false, currentRound: 0, matches: [], weekScheduled: 20 },
  { id: 'esl_challenger', name: 'ESL Challenger', tier: 2, prizePool: 100000, teamIds: [], format: 'bracket', isFinished: false, currentRound: 0, matches: [], weekScheduled: 6 },
  { id: 'yalla_compass', name: 'YaLLa Compass', tier: 2, prizePool: 90000, teamIds: [], format: 'groups', isFinished: false, currentRound: 0, matches: [], weekScheduled: 44 },
  { id: 'cct_europe', name: 'CCT Europe Series', tier: 3, prizePool: 30000, teamIds: [], format: 'groups', isFinished: false, currentRound: 0, matches: [], weekScheduled: 20 },
  { id: 'elisa_masters', name: 'Elisa Masters', tier: 3, prizePool: 35000, teamIds: [], format: 'bracket', isFinished: false, currentRound: 0, matches: [], weekScheduled: 44 },
  { id: 'esea_advanced', name: 'ESEA Advanced', tier: 4, prizePool: 8000, teamIds: [], format: 'groups', isFinished: false, currentRound: 0, matches: [], weekScheduled: 20 },
  { id: 'dust2_ligaen', name: 'Dust2.dk Ligaen', tier: 4, prizePool: 7000, teamIds: [], format: 'bracket', isFinished: false, currentRound: 0, matches: [], weekScheduled: 36 }
];
