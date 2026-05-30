import { GameMap } from '../../types';

export const realMaps: GameMap[] = [
  {
    id: 'de_dust2',
    name: 'Dust2',
    status: 'active',
    aimRequirement: 85,
    tacticalRequirement: 40,
    utilityRequirement: 50,
    awpImpact: 90,
    sideBias: 'balanced',
    pace: 'fast',
    description: 'Mapa clássico com foco total em duelos de mira, controle das portas do meio e picks agressivos de AWP no fundo.'
  },
  {
    id: 'de_mirage',
    name: 'Mirage',
    status: 'active',
    aimRequirement: 70,
    tacticalRequirement: 65,
    utilityRequirement: 65,
    awpImpact: 75,
    sideBias: 'CT',
    pace: 'medium',
    description: 'Mapa balanceado e padrão para execuções no Bombsite A e disputas estratégicas de domínio pelo Meio.'
  },
  {
    id: 'de_inferno',
    name: 'Inferno',
    status: 'active',
    aimRequirement: 55,
    tacticalRequirement: 80,
    utilityRequirement: 85,
    awpImpact: 45,
    sideBias: 'CT',
    pace: 'slow',
    description: 'Exige coordenação perfeita de utilitárias na Banana e no Meio. Retakes são frequentes e difíceis.'
  },
  {
    id: 'de_nuke',
    name: 'Nuke',
    status: 'active',
    aimRequirement: 60,
    tacticalRequirement: 90,
    utilityRequirement: 75,
    awpImpact: 60,
    sideBias: 'CT',
    pace: 'fast',
    description: 'Mapa com dois níveis (A e B). A rotação rápida, comunicação impecável de IGL e leitura tática são fundamentais.'
  },
  {
    id: 'de_ancient',
    name: 'Ancient',
    status: 'active',
    aimRequirement: 75,
    tacticalRequirement: 70,
    utilityRequirement: 70,
    awpImpact: 70,
    sideBias: 'CT',
    pace: 'medium',
    description: 'Mapa em floresta tropical. Exige domínio territorial rápido do Meio e do Templo do bombsite A, favorecendo riflers agressivos.'
  },
  {
    id: 'de_anubis',
    name: 'Anubis',
    status: 'active',
    aimRequirement: 80,
    tacticalRequirement: 60,
    utilityRequirement: 65,
    awpImpact: 65,
    sideBias: 'TR',
    pace: 'fast',
    description: 'Mapa extremamente dinâmico, focado em controle de água/canal e avanços rápidos dos atacantes.'
  },
  {
    id: 'de_overpass',
    name: 'Overpass',
    status: 'active',
    aimRequirement: 65,
    tacticalRequirement: 85,
    utilityRequirement: 80,
    awpImpact: 80,
    sideBias: 'CT',
    pace: 'medium',
    description: 'Mapa com vastas áreas externas e bueiros. Exige rotações de longo alcance e excelente coordenação de utilitárias de retake.'
  },
  {
    id: 'de_vertigo',
    name: 'Vertigo',
    status: 'reserve',
    aimRequirement: 70,
    tacticalRequirement: 75,
    utilityRequirement: 80,
    awpImpact: 50,
    sideBias: 'TR',
    pace: 'medium',
    description: 'Partidas disputadas no topo de um arranha-céu. Foco total em utilitárias pesadas na rampa do Bomb A.'
  },
  {
    id: 'de_train',
    name: 'Train',
    status: 'historical',
    aimRequirement: 75,
    tacticalRequirement: 70,
    utilityRequirement: 70,
    awpImpact: 85,
    sideBias: 'CT',
    pace: 'slow',
    description: 'Pátio ferroviário com trens estreitos. Linhas de visão longas favorecem disparos certeiros de AWP de ambos os lados.'
  },
  {
    id: 'de_cache',
    name: 'Cache',
    status: 'historical',
    aimRequirement: 80,
    tacticalRequirement: 55,
    utilityRequirement: 60,
    awpImpact: 70,
    sideBias: 'balanced',
    pace: 'fast',
    description: 'Mapa industrial clássico, com estrutura de três vias bem definida, ideal para duelos rápidos de mira no meio.'
  },
  {
    id: 'de_cobblestone',
    name: 'Cobblestone',
    status: 'historical',
    aimRequirement: 65,
    tacticalRequirement: 70,
    utilityRequirement: 75,
    awpImpact: 80,
    sideBias: 'TR',
    pace: 'slow',
    description: 'Mapa com castelo medieval e bombsite B de proporções colossais, ideal para táticas de execução cadenciada e pickoffs.'
  }
];
