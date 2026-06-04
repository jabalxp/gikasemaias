import { Staff } from '../../types';

/**
 * Catálogo de comissão técnica disponível para contratação (Fase D — Staff).
 * Mesmo padrão estático de defaultSponsors.ts.
 *
 * Convenção de balanceamento:
 *  - salary  = level * 800 + 200 (custo semanal)
 *  - luvas de contratação = salary * 4 (debitadas em contratarStaff)
 *  - rescisão = salary * 2 (debitada em demitirStaff)
 *  - reputation = level * 15 + 20
 *
 * Efeitos mecânicos reais (aplicados em useGameStore.avancarSemana / matchSimulator):
 *  - coach        → multiplica gainChance do treino por (1 + level * 0.05)
 *  - analyst      → +level * 0.02 no masteryFactor da partida (computeTeamMod)
 *  - psychologist → +3 * level de moral por semana nos titulares
 *  - physio       → +2 * level de energia por semana nos titulares
 *  - scout        → reservado para a Fase E (Base / Scout)
 */
export const defaultStaff: readonly Staff[] = [
  // ===== COACH (treino) =====
  {
    id: 'coach_01',
    name: 'Ricardo "Treino" Alves',
    nationality: 'Brasil',
    role: 'coach',
    level: 2,
    salary: 1800,
    effectDescription: 'Acelera a evolução no treino semanal em +10% (gainChance × 1.10).',
    reputation: 50,
  },
  {
    id: 'coach_02',
    name: 'Marek Novak',
    nationality: 'Tchéquia',
    role: 'coach',
    level: 4,
    salary: 3400,
    effectDescription: 'Acelera a evolução no treino semanal em +20% (gainChance × 1.20).',
    reputation: 80,
  },
  {
    id: 'coach_03',
    name: 'Daniel "Mentor" Cruz',
    nationality: 'Portugal',
    role: 'coach',
    level: 5,
    salary: 4200,
    effectDescription: 'Acelera a evolução no treino semanal em +25% (gainChance × 1.25).',
    reputation: 95,
  },

  // ===== ANALYST (veto / preparação de mapa) =====
  {
    id: 'analyst_01',
    name: 'Sofia "Vods" Lima',
    nationality: 'Brasil',
    role: 'analyst',
    level: 2,
    salary: 1800,
    effectDescription: 'Estudo de veto: +0.04 no modificador de maestria nas partidas.',
    reputation: 50,
  },
  {
    id: 'analyst_02',
    name: 'Henrik Olsen',
    nationality: 'Dinamarca',
    role: 'analyst',
    level: 3,
    salary: 2600,
    effectDescription: 'Estudo de veto: +0.06 no modificador de maestria nas partidas.',
    reputation: 65,
  },
  {
    id: 'analyst_03',
    name: 'Yuki Tanaka',
    nationality: 'Japão',
    role: 'analyst',
    level: 5,
    salary: 4200,
    effectDescription: 'Estudo de veto: +0.10 no modificador de maestria nas partidas.',
    reputation: 95,
  },

  // ===== PSYCHOLOGIST (moral) =====
  {
    id: 'psychologist_01',
    name: 'Dra. Helena Souza',
    nationality: 'Brasil',
    role: 'psychologist',
    level: 1,
    salary: 1000,
    effectDescription: 'Recupera +3 de moral por semana em cada titular.',
    reputation: 35,
  },
  {
    id: 'psychologist_02',
    name: 'Dr. Arno Berger',
    nationality: 'Alemanha',
    role: 'psychologist',
    level: 3,
    salary: 2600,
    effectDescription: 'Recupera +9 de moral por semana em cada titular.',
    reputation: 65,
  },
  {
    id: 'psychologist_03',
    name: 'Dra. Klara Nyström',
    nationality: 'Suécia',
    role: 'psychologist',
    level: 5,
    salary: 4200,
    effectDescription: 'Recupera +15 de moral por semana em cada titular.',
    reputation: 95,
  },

  // ===== PHYSIO (energia) =====
  {
    id: 'physio_01',
    name: 'Bruno "Recovery" Dias',
    nationality: 'Brasil',
    role: 'physio',
    level: 1,
    salary: 1000,
    effectDescription: 'Recupera +2 de energia por semana em cada titular.',
    reputation: 35,
  },
  {
    id: 'physio_02',
    name: 'Anita Kovač',
    nationality: 'Croácia',
    role: 'physio',
    level: 3,
    salary: 2600,
    effectDescription: 'Recupera +6 de energia por semana em cada titular.',
    reputation: 65,
  },
  {
    id: 'physio_03',
    name: 'Tomás "Iron" Ferreira',
    nationality: 'Portugal',
    role: 'physio',
    level: 5,
    salary: 4200,
    effectDescription: 'Recupera +10 de energia por semana em cada titular.',
    reputation: 95,
  },
];
