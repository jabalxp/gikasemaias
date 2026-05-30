import { GameMap, Match, MatchLivePlayerStats, Player, RoundSim, RoundSimEvent, Team } from '../../types';

// Configurações econômicas reais de CS
const COST_ECO = 0;
const COST_FORCE = 1800;
const COST_FULL_BUY = 3700;

const WEAPONS = {
  eco: { name: 'Pistola', weight: 1.0 },
  force: { name: 'SMG/Famas/Galil', weight: 1.4 },
  buy: { name: 'Rifle AK-47/M4', weight: 1.8 },
  awp: { name: 'AWP', weight: 2.2 }
};

// Loss Bonus: $1400 -> $1900 -> $2400 -> $2900 -> $3400
const LOSS_BONUS = [1400, 1900, 2400, 2900, 3400];
const MAX_CASH = 16000;

// Helper para sortear número aleatório com distribuição normal ou simples
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Escolhe um elemento aleatório
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Pesos de balanceamento da simulação (Fase F — calibrados via balanceHarness.ts)
const BALANCE_WEIGHTS = {
  rngAmplitude: 68,      // amplitude da aleatoriedade (zebras); maior = mais imprevisível
  aimWeight: 1.0,
  overallWeight: 0.15,   // overall pesa, mas não decide tudo (spec §26)
  gamesenseWeight: 0.08,
  utilityWeight: 0.08,
  clutchWeight: 0.10,
} as const;

// RNG com distribuição ~normal (soma de 6 uniformes), centrada em 0. Cauda mais espessa que
// uniforme → permite zebras controladas sem inflar a variância média.
const gaussianRNG = (amplitude: number): number => {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += Math.random();
  return (sum - 3) * (amplitude / 3);
};

// Inicializa estatísticas ao vivo de partida para um jogador
export const initLivePlayerStats = (player: Player, startingCash: number = 800): MatchLivePlayerStats => ({
  kills: 0,
  deaths: 0,
  assists: 0,
  damage: 0,
  mvps: 0,
  alive: true,
  hp: 100,
  weapon: 'Pistola',
  helmet: startingCash >= 650,
  hasC4: false,
  cash: startingCash
});

// Decisão de compra de IA com base nas faixas de saldo
export const getBuyType = (cash: number): 'eco' | 'force' | 'buy' => {
  if (cash < 2000) return 'eco';
  if (cash < 3500) return 'force';
  return 'buy';
};

/**
 * Modificador de poder do TIME para a partida (spec §26): combina maestria no mapa,
 * forma recente, moral média e afinidade tática com o mapa. Aplicado como multiplicador
 * no poder de cada jogador, de modo que mapa/moral/forma/tática importem — sem que o
 * overall sozinho decida tudo. Faixa típica ~0.85 a ~1.30.
 */
export const computeTeamMod = (team: Team, players: Player[], map: GameMap, analystLevel = 0): number => {
  // Maestria no mapa (0-100) → 0.92 a 1.08 (amplitude reduzida para não dominar o resultado)
  // Analista de mapas (Staff role 'analyst') melhora o estudo de veto: +0.02 por nível.
  const mastery = team.mapMastery[map.id] ?? 50;
  const masteryFactor = 0.92 + (mastery / 100) * 0.16 + (analystLevel > 0 ? analystLevel * 0.02 : 0);

  // Forma recente (últimos 5 resultados) → ~0.96 a ~1.04
  const recent = team.stats.recentForm.slice(-5);
  const wins = recent.filter(r => r === 'W').length;
  const formFactor = recent.length > 0 ? 1 + ((wins / recent.length) - 0.5) * 0.08 : 1;

  // Moral média do elenco titular → 0.97 a 1.05
  const avgMoral = players.length > 0 ? players.reduce((acc, p) => acc + p.moral, 0) / players.length : 75;
  const moralFactor = 0.97 + (avgMoral / 100) * 0.08;

  // Afinidade tática com o ritmo do mapa (leve): agressivo brilha em mapas rápidos; defensivo em lentos
  let tacticFactor = 1.0;
  const ps = team.tactics.playstyle;
  if ((ps === 'aggressive' || ps === 'very_aggressive') && map.pace === 'fast') tacticFactor = 1.03;
  else if ((ps === 'defensive' || ps === 'very_defensive') && map.pace === 'slow') tacticFactor = 1.03;

  return masteryFactor * formFactor * moralFactor * tacticFactor;
};

// Condição individual do jogador (moral, forma e energia/cansaço) → ~0.90 a ~1.10
const playerCondition = (p: Player): number =>
  0.90 + (p.moral / 100) * 0.07 + (p.form / 100) * 0.07 + (p.energy / 100) * 0.06;

// CLASH ENGINE: Resolve um duelo entre atacante e defensor
// Fórmula Base: Vitória = (Mira do Atacante * Peso da Arma) + Fator Posicional + Bônus de Utilitária + Clutch + RNG
const resolveClash = (
  attacker: { player: Player; stats: MatchLivePlayerStats; side: 'CT' | 'TR' },
  defender: { player: Player; stats: MatchLivePlayerStats; side: 'CT' | 'TR' },
  isPostPlant: boolean,
  map: GameMap,
  attackerWeaponWeight: number,
  defenderWeaponWeight: number,
  attackerTeamMod: number,
  defenderTeamMod: number
): { winner: 'attacker' | 'defender'; damage: number } => {

  const a = attacker.player;
  const d = defender.player;

  // Vantagem posicional do CT modulada pelo viés de lado do mapa (antes era fixa e ignorava o mapa):
  // mapas CT-sided dão mais vantagem à defesa; TR-sided reduzem.
  const ctEdge = map.sideBias === 'CT' ? 1.05 : map.sideBias === 'TR' ? 0.98 : 1.02;
  const attackerPosFactor = attacker.side === 'CT' ? ctEdge : 1.0;
  const defenderPosFactor = defender.side === 'CT' ? ctEdge : 1.0;

  // Bônus de utilitária e clutch (clutch só no pós-plant), com pesos normalizados
  const attUtilityBonus = a.attributes.utility * BALANCE_WEIGHTS.utilityWeight + (map.utilityRequirement * 0.03);
  const defUtilityBonus = d.attributes.utility * BALANCE_WEIGHTS.utilityWeight + (map.utilityRequirement * 0.03);
  const attClutchBonus = isPostPlant ? a.attributes.clutch * BALANCE_WEIGHTS.clutchWeight : 0;
  const defClutchBonus = isPostPlant ? d.attributes.clutch * BALANCE_WEIGHTS.clutchWeight : 0;

  // Poder: mira (peso de arma e posição) + gamesense + OVERALL (peso reduzido) + utilitárias + clutch,
  // modulado pela CONDIÇÃO individual (moral/forma/energia) e pelo MOD do TIME, com RNG ~normal.
  let attPower = (a.attributes.aim * attackerWeaponWeight * attackerPosFactor * BALANCE_WEIGHTS.aimWeight)
    + (a.attributes.gamesense * BALANCE_WEIGHTS.gamesenseWeight) + (a.overall * BALANCE_WEIGHTS.overallWeight)
    + attUtilityBonus + attClutchBonus;
  attPower = attPower * playerCondition(a) * attackerTeamMod + gaussianRNG(BALANCE_WEIGHTS.rngAmplitude);

  let defPower = (d.attributes.aim * defenderWeaponWeight * defenderPosFactor * BALANCE_WEIGHTS.aimWeight)
    + (d.attributes.gamesense * BALANCE_WEIGHTS.gamesenseWeight) + (d.overall * BALANCE_WEIGHTS.overallWeight)
    + defUtilityBonus + defClutchBonus;
  defPower = defPower * playerCondition(d) * defenderTeamMod + gaussianRNG(BALANCE_WEIGHTS.rngAmplitude);

  const winner = attPower >= defPower ? 'attacker' : 'defender';
  return {
    winner,
    damage: Math.round(randomRange(40, 100))
  };
};

// SIMULADOR DE ROUND DETALHADO (4 etapas sequenciais)
export const simulateRound = (
  roundNumber: number,
  map: GameMap,
  teamA: Team,
  teamB: Team,
  playersA: Player[],
  playersB: Player[],
  liveStats: Record<string, MatchLivePlayerStats>,
  sides: { teamA: 'CT' | 'TR'; teamB: 'CT' | 'TR' },
  economyState: {
    lossStreakA: number;
    lossStreakB: number;
  },
  analystLevels: { a?: number; b?: number } = {}
): RoundSim => {
  const events: RoundSimEvent[] = [];
  
  // Identifica jogadores titulares vivos de cada time
  const livePlayersA = playersA.filter(p => p.status === 'titular');
  const livePlayersB = playersB.filter(p => p.status === 'titular');

  // Fail-safe: se um dos times não tem titulares, o round é concedido ao outro.
  // Evita crashes de Math.max(...[]) (-Infinity) e randomChoice([]) (undefined) — cobre os
  // cenários em que um adversário não foi preenchido com elenco.
  if (livePlayersA.length === 0 || livePlayersB.length === 0) {
    const winnerId = livePlayersA.length === 0 ? teamB.id : teamA.id;
    const winningSide = winnerId === teamA.id ? sides.teamA : sides.teamB;
    return {
      roundNumber,
      winningTeamSide: winningSide,
      winningTeamId: winnerId,
      winReason: 'elimination',
      events: [{ time: '0:00', description: 'Time sem jogadores suficientes — round concedido por W.O.', type: 'tactical' }],
      economyBefore: { teamA: 'eco', teamB: 'eco' },
      cashAft: {},
    };
  }

  // Reset do HP e status de sobrevivência no início do round
  const allLivePlayers = [...livePlayersA, ...livePlayersB];
  allLivePlayers.forEach(p => {
    const stats = liveStats[p.id];
    stats.alive = true;
    stats.hp = 100;
    stats.hasC4 = false;
  });

  // Snapshot de kills antes do round, para pagar o bônus econômico pelos kills REAIS do round
  const killsBeforeRound: Record<string, number> = {};
  allLivePlayers.forEach(p => { killsBeforeRound[p.id] = liveStats[p.id].kills; });

  // 1. FASE DE COMPRA (Freeze Time)
  const buyTypeA = getBuyType(Math.max(...livePlayersA.map(p => liveStats[p.id].cash)));
  const buyTypeB = getBuyType(Math.max(...livePlayersB.map(p => liveStats[p.id].cash)));

  // Deduz custos e equipa armas
  const applyBuy = (players: Player[], type: 'eco' | 'force' | 'buy') => {
    players.forEach(p => {
      const stats = liveStats[p.id];
      let cost = COST_ECO;
      let weaponName = WEAPONS.eco.name;
      
      if (type === 'force') {
        cost = COST_FORCE;
        weaponName = WEAPONS.force.name;
      } else if (type === 'buy') {
        // Verifica se o jogador pode comprar AWP (AWPer principal com saldo)
        if (p.role === 'AWPer' && stats.cash >= 4750) {
          cost = 4750;
          weaponName = WEAPONS.awp.name;
        } else {
          cost = COST_FULL_BUY;
          weaponName = WEAPONS.buy.name;
        }
      }
      
      stats.cash = Math.max(0, stats.cash - cost);
      stats.weapon = weaponName;
      stats.helmet = type !== 'eco';
    });
  };

  applyBuy(livePlayersA, buyTypeA);
  applyBuy(livePlayersB, buyTypeB);

  // Registra economia de round
  events.push({
    time: '1:55',
    description: `Fase de Compra finalizada. ${teamA.tag} comprou ${buyTypeA.toUpperCase()} | ${teamB.tag} comprou ${buyTypeB.toUpperCase()}.`,
    type: 'economy'
  });

  // Decide qual time é TR e CT
  const teamTR = sides.teamA === 'TR' ? teamA : teamB;
  const teamCT = sides.teamA === 'CT' ? teamA : teamB;
  const playersTR = sides.teamA === 'TR' ? livePlayersA : livePlayersB;
  const playersCT = sides.teamA === 'CT' ? livePlayersA : livePlayersB;

  // Modificadores de time (mapMastery/forma/moral/tática) aplicados em cada duelo (spec §26)
  const modA = computeTeamMod(teamA, livePlayersA, map, analystLevels.a ?? 0);
  const modB = computeTeamMod(teamB, livePlayersB, map, analystLevels.b ?? 0);
  const modTR = sides.teamA === 'TR' ? modA : modB;
  const modCT = sides.teamA === 'CT' ? modA : modB;

  // Equipar C4 no TR de maior Utility/Gamesense
  const carrier = randomChoice(playersTR);
  liveStats[carrier.id].hasC4 = true;

  // 2. EVENTOS INICIAIS (First Blood / Controle de Mapa)
  events.push({
    time: '1:45',
    description: `Round iniciado! Ambos os times disputam as principais zonas de controle da de_${map.id.replace('de_', '')}.`,
    type: 'tactical'
  });

  // Simulação de duelo de First Blood
  let firstBloodOccurred = false;
  let timeStr = '1:30';

  const trFB = randomChoice(playersTR);
  const ctFB = randomChoice(playersCT);

  const trWWeight = trFB.role === 'AWPer' && map.awpImpact > 70 ? WEAPONS.awp.weight : (buyTypeTR(trFB) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);
  const ctWWeight = ctFB.role === 'AWPer' && map.awpImpact > 70 ? WEAPONS.awp.weight : (buyTypeCT(ctFB) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);

  function buyTypeTR(p: Player) { return sides.teamA === 'TR' ? buyTypeA : buyTypeB; }
  function buyTypeCT(p: Player) { return sides.teamA === 'CT' ? buyTypeA : buyTypeB; }

  const fbDuelo = resolveClash(
    { player: trFB, stats: liveStats[trFB.id], side: 'TR' },
    { player: ctFB, stats: liveStats[ctFB.id], side: 'CT' },
    false,
    map,
    trWWeight,
    ctWWeight,
    modTR,
    modCT
  );

  if (fbDuelo.winner === 'attacker') {
    // TR elimina CT (First Blood)
    liveStats[ctFB.id].alive = false;
    liveStats[ctFB.id].hp = 0;
    liveStats[trFB.id].kills++;
    liveStats[ctFB.id].deaths++;
    events.push({
      time: timeStr,
      description: `[TR] ${trFB.nickname} obteve a PRIMEIRA ELIMINAÇÃO em cima de [CT] ${ctFB.nickname} usando ${liveStats[trFB.id].weapon}.`,
      type: 'kill',
      killerId: trFB.id,
      victimId: ctFB.id,
      weaponUsed: liveStats[trFB.id].weapon
    });
  } else {
    // CT elimina TR (First Blood)
    liveStats[trFB.id].alive = false;
    liveStats[trFB.id].hp = 0;
    liveStats[ctFB.id].kills++;
    liveStats[trFB.id].deaths++;
    events.push({
      time: timeStr,
      description: `[CT] ${ctFB.nickname} garantiu a PRIMEIRA ELIMINAÇÃO derrubando [TR] ${trFB.nickname} com ${liveStats[ctFB.id].weapon}.`,
      type: 'kill',
      killerId: ctFB.id,
      victimId: trFB.id,
      weaponUsed: liveStats[ctFB.id].weapon
    });
  }

  // 3. EXECUÇÃO / AVANÇO AO BOMB (Decisão de Plant)
  events.push({
    time: '1:00',
    description: `Os atacantes do ${teamTR.tag} iniciam uma execução coordenada de utilitárias em direção ao Bombsite.`,
    type: 'tactical'
  });

  // Calcula chances de plant da C4
  const aliveTRCount = playersTR.filter(p => liveStats[p.id].alive).length;
  const aliveCTCount = playersCT.filter(p => liveStats[p.id].alive).length;

  const avgTRUtility = playersTR.reduce((acc, p) => acc + p.attributes.utility, 0) / playersTR.length;
  const avgCTUtility = playersCT.reduce((acc, p) => acc + p.attributes.utility, 0) / playersCT.length;

  // Probabilidade do TR plantar a C4 (com tetos: nunca >75% nem <5%) — antes o piso +20 inflava o plant
  const plantBase = 24;
  const survivalRatio = (aliveTRCount / (aliveTRCount + aliveCTCount + 0.001)) * 50;
  const utilityEdge = (avgTRUtility - avgCTUtility) * 0.2;
  const plantChance = Math.min(75, Math.max(5, plantBase + survivalRatio + utilityEdge));
  const isC4Planted = Math.random() * 100 < plantChance && aliveTRCount > 0;

  let roundWinnerId = '';
  let winReason: RoundSim['winReason'] = 'elimination';

  if (isC4Planted) {
    events.push({
      time: '0:45',
      description: `A C4 FOI PLANTADA! ${teamTR.tag} estabelece o pós-plant enquanto ${teamCT.tag} se reagrupa para o Retake.`,
      type: 'plant'
    });

    // 4. PÓS-PLANT / RETAKE
    // Roda duelos rápidos entre sobreviventes
    let maxRetakeDuelos = 4;
    while (maxRetakeDuelos > 0) {
      const trAlive = playersTR.filter(p => liveStats[p.id].alive);
      const ctAlive = playersCT.filter(p => liveStats[p.id].alive);

      if (trAlive.length === 0 || ctAlive.length === 0) break;

      const pTR = randomChoice(trAlive);
      const pCT = randomChoice(ctAlive);

      // Duelo focado em Clutch e Utilitárias no retake
      const dWeightTR = pTR.role === 'AWPer' ? WEAPONS.awp.weight : (buyTypeTR(pTR) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);
      const dWeightCT = pCT.role === 'AWPer' ? WEAPONS.awp.weight : (buyTypeCT(pCT) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);

      const duelo = resolveClash(
        { player: pTR, stats: liveStats[pTR.id], side: 'TR' },
        { player: pCT, stats: liveStats[pCT.id], side: 'CT' },
        true,
        map,
        dWeightTR,
        dWeightCT,
        modTR,
        modCT
      );

      if (duelo.winner === 'attacker') {
        // TR mata CT
        liveStats[pCT.id].alive = false;
        liveStats[pCT.id].hp = 0;
        liveStats[pTR.id].kills++;
        liveStats[pCT.id].deaths++;
        events.push({
          time: '0:30',
          description: `[TR] ${pTR.nickname} segurou o avanço e eliminou [CT] ${pCT.nickname} (${liveStats[pTR.id].weapon}).`,
          type: 'kill',
          killerId: pTR.id,
          victimId: pCT.id,
          weaponUsed: liveStats[pTR.id].weapon
        });
      } else {
        // CT mata TR
        liveStats[pTR.id].alive = false;
        liveStats[pTR.id].hp = 0;
        liveStats[pCT.id].kills++;
        liveStats[pTR.id].deaths++;
        events.push({
          time: '0:25',
          description: `[CT] ${pCT.nickname} ganhou o espaço e abateu [TR] ${pTR.nickname} com maestria.`,
          type: 'kill',
          killerId: pCT.id,
          victimId: pTR.id,
          weaponUsed: liveStats[pCT.id].weapon
        });
      }

      maxRetakeDuelos--;
    }

    const trAliveFinal = playersTR.filter(p => liveStats[p.id].alive).length;
    const ctAliveFinal = playersCT.filter(p => liveStats[p.id].alive).length;

    if (ctAliveFinal > 0 && trAliveFinal === 0) {
      // CTs mataram todos e defusam
      roundWinnerId = teamCT.id;
      winReason = 'defuse';
      const defuser = randomChoice(playersCT.filter(p => liveStats[p.id].alive));
      events.push({
        time: '0:05',
        description: `[CT] ${defuser.nickname} realizou o DESARME da C4 sob proteção de sua equipe!`,
        type: 'defuse'
      });
    } else if (trAliveFinal > 0 && ctAliveFinal === 0) {
      // TRs mataram todos
      roundWinnerId = teamTR.id;
      winReason = 'elimination';
      events.push({
        time: '0:01',
        description: `Todos os defensores foram eliminados. A C4 está protegida.`,
        type: 'tactical'
      });
    } else {
      // Sobreviventes de ambos os lados, mas C4 explode (TR vence por explosão)
      roundWinnerId = teamTR.id;
      winReason = 'c4_explosion';
      events.push({
        time: '0:00',
        description: `BUM! A C4 EXPLODIU de forma devastadora no Bombsite!`,
        type: 'save'
      });
    }

  } else {
    // Sem plant, CTs tentam apenas eliminar ou segurar por tempo
    events.push({
      time: '0:35',
      description: `A defesa do ${teamCT.tag} estabelece uma barreira sólida impedindo a entrada TR.`,
      type: 'tactical'
    });

    let maxDefesaDuelos = 4;
    while (maxDefesaDuelos > 0) {
      const trAlive = playersTR.filter(p => liveStats[p.id].alive);
      const ctAlive = playersCT.filter(p => liveStats[p.id].alive);

      if (trAlive.length === 0 || ctAlive.length === 0) break;

      const pTR = randomChoice(trAlive);
      const pCT = randomChoice(ctAlive);

      const dWeightTR = pTR.role === 'AWPer' ? WEAPONS.awp.weight : (buyTypeTR(pTR) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);
      const dWeightCT = pCT.role === 'AWPer' ? WEAPONS.awp.weight : (buyTypeCT(pCT) === 'buy' ? WEAPONS.buy.weight : WEAPONS.eco.weight);

      const duelo = resolveClash(
        { player: pTR, stats: liveStats[pTR.id], side: 'TR' },
        { player: pCT, stats: liveStats[pCT.id], side: 'CT' },
        false,
        map,
        dWeightTR,
        dWeightCT,
        modTR,
        modCT
      );

      if (duelo.winner === 'attacker') {
        liveStats[pCT.id].alive = false;
        liveStats[pCT.id].hp = 0;
        liveStats[pTR.id].kills++;
        liveStats[pCT.id].deaths++;
        events.push({
          time: '0:20',
          description: `[TR] ${pTR.nickname} venceu o duelo direto e eliminou [CT] ${pCT.nickname}.`,
          type: 'kill',
          killerId: pTR.id,
          victimId: pCT.id,
          weaponUsed: liveStats[pTR.id].weapon
        });
      } else {
        liveStats[pTR.id].alive = false;
        liveStats[pTR.id].hp = 0;
        liveStats[pCT.id].kills++;
        liveStats[pTR.id].deaths++;
        events.push({
          time: '0:18',
          description: `[CT] ${pCT.nickname} segurou a entrada eliminando [TR] ${pTR.nickname}.`,
          type: 'kill',
          killerId: pCT.id,
          victimId: pTR.id,
          weaponUsed: liveStats[pCT.id].weapon
        });
      }
      maxDefesaDuelos--;
    }

    const trAliveFinal = playersTR.filter(p => liveStats[p.id].alive).length;
    const ctAliveFinal = playersCT.filter(p => liveStats[p.id].alive).length;

    if (trAliveFinal === 0) {
      roundWinnerId = teamCT.id;
      winReason = 'elimination';
      events.push({
        time: '0:05',
        description: `Todos os atacantes foram neutralizados com sucesso!`,
        type: 'tactical'
      });
    } else if (ctAliveFinal === 0) {
      roundWinnerId = teamTR.id;
      winReason = 'elimination';
      events.push({
        time: '0:05',
        description: `A equipe de ataque conseguiu eliminar todos os defensores!`,
        type: 'tactical'
      });
    } else {
      // Tempo acabou (CT vence por tempo)
      roundWinnerId = teamCT.id;
      winReason = 'time_ran_out';
      events.push({
        time: '0:00',
        description: `Tempo esgotado! A defesa segurou o bombsite e garantiu o round.`,
        type: 'save'
      });
    }
  }

  // Identificar MVP do Round (Quem fez mais kills no round, ou clutch decisivo)
  let roundMvpId = '';
  let highestKills = -1;
  allLivePlayers.forEach(p => {
    // Como a contagem é cumulativa, vamos verificar quem causou mais impacto
    // Simplificando: o jogador vivo do time vencedor com melhor mira/clutch
    const stats = liveStats[p.id];
    if (p.teamId === roundWinnerId && stats.alive) {
      const impact = p.attributes.aim + p.attributes.clutch;
      if (impact > highestKills) {
        highestKills = impact;
        roundMvpId = p.id;
      }
    }
  });
  if (!roundMvpId) {
    const winners = allLivePlayers.filter(p => p.teamId === roundWinnerId);
    roundMvpId = winners.length > 0 ? randomChoice(winners).id : (allLivePlayers[0]?.id ?? '');
  }

  const mvpNick = allLivePlayers.find(p => p.id === roundMvpId)?.nickname ?? 'Jogador';
  events.push({
    time: '0:00',
    description: `Round finalizado. Vencedor: ${roundWinnerId === teamA.id ? teamA.tag : teamB.tag}. MVP do Round: ${mvpNick}.`,
    type: 'tactical'
  });

  // APLICAÇÃO DA ECONOMIA FINAL DE ROUND E LOSS BONUS
  const teamAWon = roundWinnerId === teamA.id;

  // Atualiza sequências de derrotas (Loss Streak)
  if (teamAWon) {
    economyState.lossStreakA = Math.max(0, economyState.lossStreakA - 1);
    economyState.lossStreakB = Math.min(5, economyState.lossStreakB + 1);
  } else {
    economyState.lossStreakB = Math.max(0, economyState.lossStreakB - 1);
    economyState.lossStreakA = Math.min(5, economyState.lossStreakA + 1);
  }

  // Pagamento de recompensas econômicas
  const payReward = (players: Player[], isWinner: boolean, side: 'CT' | 'TR', streak: number, reason: RoundSim['winReason']) => {
    players.forEach(p => {
      const stats = liveStats[p.id];
      let bonus = 0;
      
      if (isWinner) {
        // Vitória por eliminação/tempo ($3250), por defuse/explosão ($3500)
        if (reason === 'defuse' || reason === 'c4_explosion') {
          bonus = 3500;
        } else {
          bonus = 3250;
        }
      } else {
        // Derrota paga Loss Bonus correspondente ($1400 -> $1900 -> $2400 -> $2900 -> $3400)
        const streakIndex = Math.max(0, Math.min(4, streak - 1));
        bonus = LOSS_BONUS[streakIndex];

        // Bônus adicional de $800 para TR se plantou a C4 mas perdeu o round
        if (side === 'TR' && isC4Planted) {
          bonus += 800;
        }
      }

      // Bônus individual de $300 por kill REAL feito neste round (coerente com o feed de eventos)
      const killsInRound = Math.max(0, stats.kills - (killsBeforeRound[p.id] ?? stats.kills));
      bonus += killsInRound * 300;

      stats.cash = Math.min(MAX_CASH, stats.cash + bonus);
    });
  };

  payReward(livePlayersA, teamAWon, sides.teamA, economyState.lossStreakA, winReason);
  payReward(livePlayersB, !teamAWon, sides.teamB, economyState.lossStreakB, winReason);

  // Retorna o round simulado
  const cashAft: Record<string, number> = {};
  allLivePlayers.forEach(p => {
    cashAft[p.id] = liveStats[p.id].cash;
  });

  return {
    roundNumber,
    winningTeamSide: teamAWon ? sides.teamA : sides.teamB,
    winningTeamId: roundWinnerId,
    winReason,
    events,
    economyBefore: {
      teamA: buyTypeA,
      teamB: buyTypeB
    },
    cashAft
  };
};

// SIMULA UMA PARTIDA INTEIRA DE FORMA RÁPIDA (Útil para simulação de fundo)
export const simulateWholeMatchQuick = (
  teamA: Team,
  teamB: Team,
  playersA: Player[],
  playersB: Player[],
  map: GameMap,
  competitionId: string,
  analystLevels: { a?: number; b?: number } = {}
): Match => {
  const liveStats: Record<string, MatchLivePlayerStats> = {};
  
  const activePlayersA = playersA.filter(p => p.status === 'titular');
  const activePlayersB = playersB.filter(p => p.status === 'titular');

  activePlayersA.forEach(p => { liveStats[p.id] = initLivePlayerStats(p, 800); });
  activePlayersB.forEach(p => { liveStats[p.id] = initLivePlayerStats(p, 800); });

  let scoreA = 0;
  let scoreB = 0;
  const halfScores: Match['halfScores'] = [];
  const rounds: RoundSim[] = [];

  let lossStreakA = 0;
  let lossStreakB = 0;

  // Lados iniciais
  let sides = { teamA: 'CT' as 'CT' | 'TR', teamB: 'TR' as 'CT' | 'TR' };

  let currentRound = 1;
  let isFinished = false;

  // Rodar rounds até atingir critérios de vitória
  while (!isFinished) {
    // Mudança de lado no Round 13 (após 12 rounds)
    if (currentRound === 13) {
      halfScores.push({ scoreA, scoreB });
      sides = { teamA: 'TR', teamB: 'CT' };
      // Reseta economia para $800
      activePlayersA.forEach(p => { liveStats[p.id].cash = 800; });
      activePlayersB.forEach(p => { liveStats[p.id].cash = 800; });
      lossStreakA = 0;
      lossStreakB = 0;
    }

    // Início de CADA período de overtime (rounds 25, 31, 37...): MR3 com pistola "rica" ($10k).
    // Antes só o 1º OT resetava a economia; empates sucessivos (15-15, 18-18) ficavam sem reset.
    if (currentRound >= 25 && (currentRound - 25) % 6 === 0) {
      if (currentRound === 25) halfScores.push({ scoreA, scoreB });
      activePlayersA.forEach(p => { liveStats[p.id].cash = 10000; });
      activePlayersB.forEach(p => { liveStats[p.id].cash = 10000; });
      sides = { teamA: 'CT', teamB: 'TR' };
      lossStreakA = 0;
      lossStreakB = 0;
    }

    const roundResult = simulateRound(
      currentRound,
      map,
      teamA,
      teamB,
      playersA,
      playersB,
      liveStats,
      sides,
      { lossStreakA, lossStreakB },
      analystLevels
    );

    rounds.push(roundResult);

    if (roundResult.winningTeamId === teamA.id) {
      scoreA++;
    } else {
      scoreB++;
    }

    // Verifica fim de jogo
    // Tempo normal (primeiro a 13)
    if (currentRound <= 24) {
      if (scoreA === 13) {
        isFinished = true;
      } else if (scoreB === 13) {
        isFinished = true;
      }
    } else {
      // Lógica de Overtime (MR3): joga-se 6 rounds, quem fizer 4 ganha (ou seja, 16 rounds)
      // Em caso de novo empate (15-15), roda outro overtime.
      const otRoundNum = currentRound - 24;
      const otNum = Math.floor((otRoundNum - 1) / 6) + 1;
      const targetScore = 12 + otNum * 3 + 1; // 16, 19, 22...
      
      if (scoreA === targetScore) {
        isFinished = true;
      } else if (scoreB === targetScore) {
        isFinished = true;
      }

      // Troca de lados a cada 3 rounds de overtime
      if (otRoundNum % 3 === 0 && !isFinished) {
        sides = {
          teamA: sides.teamA === 'CT' ? 'TR' : 'CT',
          teamB: sides.teamB === 'CT' ? 'TR' : 'CT'
        };
      }
    }

    currentRound++;
  }

  // Eleger MVP Geral do Confronto. Favorece o time VENCEDOR (bônus de impacto): um carry
  // do time perdedor só leva o MVP se tiver kills bem superiores.
  const matchWinnerId = scoreA > scoreB ? teamA.id : teamB.id;
  let mvpPlayerId = '';
  let highestScore = -1;
  const allPlayers = [...activePlayersA, ...activePlayersB];
  allPlayers.forEach(p => {
    const score = liveStats[p.id].kills + (p.teamId === matchWinnerId ? 6 : 0);
    if (score > highestScore) {
      highestScore = score;
      mvpPlayerId = p.id;
    }
  });

  return {
    id: `match_${Math.random().toString(36).slice(2, 11)}`,
    teamAId: teamA.id,
    teamBId: teamB.id,
    competitionId,
    mapId: map.id,
    scoreA,
    scoreB,
    halfScores,
    rounds,
    isFinished: true,
    winnerId: scoreA > scoreB ? teamA.id : teamB.id,
    mvpPlayerId,
    liveStats
  };
};

// ============================================================================
// RESOLUÇÃO RÁPIDA DE BRACKET DE IA (campeonatos sem participação do usuário)
// ============================================================================
//
// Para confrontos IA vs IA não precisamos do feed round-a-round nem das liveStats:
// basta um vencedor. Usamos uma resolução PROBABILÍSTICA baseada no poder do time
// (overall médio dos titulares modulado por computeTeamMod), com uma cauda de RNG
// que preserva zebras. Complexidade O(n) por confronto vs. O(rounds * duelos) do
// simulador completo — adequado para resolver um bracket inteiro de fundo por semana.

export interface BracketTeamEntry {
  readonly team: Team;
  readonly players: readonly Player[];
}

// Poder de combate do time: overall médio dos titulares × modificador de time (mapa/forma/moral).
const computeTeamPower = (entry: BracketTeamEntry, map: GameMap): number => {
  const starters = entry.players.filter(p => p.status === 'titular');
  if (starters.length === 0) return 0;
  const avgOverall = starters.reduce((acc, p) => acc + p.overall, 0) / starters.length;
  return avgOverall * computeTeamMod(entry.team, [...starters], map);
};

/**
 * Resolve um confronto IA vs IA de forma rápida e probabilística.
 * Retorna o ID do time vencedor. A chance de vitória é proporcional ao poder relativo
 * dos times, com um piso/teto (5%–95%) que garante imprevisibilidade (zebras).
 */
export const resolveQuickClash = (
  entryA: BracketTeamEntry,
  entryB: BracketTeamEntry,
  map: GameMap
): string => {
  const powerA = computeTeamPower(entryA, map);
  const powerB = computeTeamPower(entryB, map);

  // Fail-safe: time sem titulares perde por W.O.
  if (powerA <= 0 && powerB <= 0) return Math.random() < 0.5 ? entryA.team.id : entryB.team.id;
  if (powerA <= 0) return entryB.team.id;
  if (powerB <= 0) return entryA.team.id;

  // Probabilidade logística suave: diferença de poder → chance de A vencer, com teto 5%–95%.
  const winChanceA = Math.min(0.95, Math.max(0.05, powerA / (powerA + powerB)));
  return Math.random() < winChanceA ? entryA.team.id : entryB.team.id;
};

/**
 * Resolve um bracket de eliminação simples entre os times informados e retorna o
 * championId. Embaralha os participantes, pareia-os por rodada e avança os vencedores
 * até sobrar um único time. Times com bye (rodada ímpar) avançam automaticamente.
 *
 * @param entries Times participantes (mínimo 1). Se vazio, retorna null.
 * @param map     Mapa usado para modular o poder dos confrontos.
 */
export const simulateAiBracketChampion = (
  entries: readonly BracketTeamEntry[],
  map: GameMap
): string | null => {
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0].team.id;

  // Embaralha (Fisher-Yates) para que o chaveamento não seja determinístico.
  const pool: BracketTeamEntry[] = [...entries];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let remaining: BracketTeamEntry[] = pool;
  // Cada iteração resolve uma rodada inteira; O(n) confrontos no total (n + n/2 + ...).
  while (remaining.length > 1) {
    const winners: BracketTeamEntry[] = [];
    for (let i = 0; i < remaining.length; i += 2) {
      const home = remaining[i];
      const away = remaining[i + 1];
      if (!away) {
        // Bye: número ímpar de times nesta rodada — o último avança direto.
        winners.push(home);
        continue;
      }
      const winnerId = resolveQuickClash(home, away, map);
      winners.push(winnerId === home.team.id ? home : away);
    }
    remaining = winners;
  }

  return remaining[0].team.id;
};
