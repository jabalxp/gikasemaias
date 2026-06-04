import { GameMap, Team } from '../../types';

export interface VetoStep {
  teamId: string;
  teamName: string;
  action: 'ban' | 'pick' | 'decider';
  mapId: string;
  mapName: string;
}

export interface VetoResult {
  selectedMapIds: string[];
  steps: VetoStep[];
}

export const simulateMapVeto = (
  teamA: Team,
  teamB: Team,
  allMaps: GameMap[],
  mode: 'MD1' | 'MD3' | 'MD5' = 'MD1'
): VetoResult => {
  const activeMaps = allMaps.filter(m => m.status === 'active');
  const availableMapIds = activeMaps.map(m => m.id);
  
  const steps: VetoStep[] = [];
  const selectedMapIds: string[] = [];

  const getMapName = (id: string) => activeMaps.find(m => m.id === id)?.name ?? id;

  // Função auxiliar para banir um mapa
  const banMap = (teamBan: Team, teamOpponent: Team) => {
    // Escolhe o pior mapa da equipe banidora que também seja aceitável,
    // ou bane o MELHOR mapa do oponente que o banidor não domine.
    let bestBanId = '';
    let highestOpponentScore = -999;

    availableMapIds.forEach(mapId => {
      const banMastery = teamBan.mapMastery[mapId] ?? 50;
      const opponentMastery = teamOpponent.mapMastery[mapId] ?? 50;
      
      // Peso do ban: bane se o oponente for muito forte e nós formos médios/fracos
      const banWeight = opponentMastery * 1.5 - banMastery;
      
      if (banWeight > highestOpponentScore) {
        highestOpponentScore = banWeight;
        bestBanId = mapId;
      }
    });

    // Se falhar por algum motivo, pega o primeiro disponível
    if (!bestBanId) bestBanId = availableMapIds[0];

    // Remove das opções
    const index = availableMapIds.indexOf(bestBanId);
    if (index > -1) availableMapIds.splice(index, 1);

    steps.push({
      teamId: teamBan.id,
      teamName: teamBan.name,
      action: 'ban',
      mapId: bestBanId,
      mapName: getMapName(bestBanId)
    });
  };

  // Função auxiliar para escolher um mapa
  const pickMap = (teamPick: Team) => {
    // Escolhe o seu mapa de maior maestria disponível
    let bestPickId = '';
    let highestMastery = -999;

    availableMapIds.forEach(mapId => {
      const mastery = teamPick.mapMastery[mapId] ?? 50;
      if (mastery > highestMastery) {
        highestMastery = mastery;
        bestPickId = mapId;
      }
    });

    if (!bestPickId) bestPickId = availableMapIds[0];

    // Remove das opções e adiciona nos selecionados
    const index = availableMapIds.indexOf(bestPickId);
    if (index > -1) availableMapIds.splice(index, 1);
    
    selectedMapIds.push(bestPickId);

    steps.push({
      teamId: teamPick.id,
      teamName: teamPick.name,
      action: 'pick',
      mapId: bestPickId,
      mapName: getMapName(bestPickId)
    });
  };

  // SIMULAÇÃO DO FLUXO CONFORME O FORMATO
  if (mode === 'MD1') {
    // Formato MD1:
    // 1. Team A bane
    // 2. Team B bane
    // 3. Team A bane
    // 4. Team B bane
    // 5. Team A bane
    // 6. Team B bane
    // Last Map left is Decider
    while (availableMapIds.length > 1) {
      banMap(teamA, teamB);
      if (availableMapIds.length === 1) break;
      banMap(teamB, teamA);
    }
    
    const deciderId = availableMapIds[0];
    selectedMapIds.push(deciderId);
    steps.push({
      teamId: 'system',
      teamName: 'Sistema',
      action: 'decider',
      mapId: deciderId,
      mapName: getMapName(deciderId)
    });

  } else if (mode === 'MD3') {
    // Formato MD3:
    // 1. Team A bane
    // 2. Team B bane
    // 3. Team A escolhe (Pick 1)
    // 4. Team B escolhe (Pick 2)
    // 5. Team A bane
    // 6. Team B bane
    // Last map left is Decider (Map 3)
    banMap(teamA, teamB);
    banMap(teamB, teamA);
    
    pickMap(teamA);
    pickMap(teamB);
    
    banMap(teamA, teamB);
    banMap(teamB, teamA);

    const deciderId = availableMapIds[0];
    selectedMapIds.push(deciderId);
    steps.push({
      teamId: 'system',
      teamName: 'Sistema',
      action: 'decider',
      mapId: deciderId,
      mapName: getMapName(deciderId)
    });

  } else if (mode === 'MD5') {
    // Formato MD5:
    // 1. Team A bane
    // 2. Team B bane
    // 3. Team A escolhe (Pick 1)
    // 4. Team B escolhe (Pick 2)
    // 5. Team A escolhe (Pick 3)
    // 6. Team B escolhe (Pick 4)
    // Last map left is Decider (Map 5)
    banMap(teamA, teamB);
    banMap(teamB, teamA);
    
    pickMap(teamA);
    pickMap(teamB);
    
    pickMap(teamA);
    pickMap(teamB);

    const deciderId = availableMapIds[0];
    selectedMapIds.push(deciderId);
    steps.push({
      teamId: 'system',
      teamName: 'Sistema',
      action: 'decider',
      mapId: deciderId,
      mapName: getMapName(deciderId)
    });
  }

  return {
    selectedMapIds,
    steps
  };
};
