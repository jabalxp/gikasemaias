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

// Bônus de arma ADITIVO ao poder de duelo (F0). Antes o peso da arma MULTIPLICAVA a mira
// (aim*weight), o que criava a "espiral da morte econômica": full-buy (1.8) vs eco (1.0) entre
// times de mesmo nível dava ~99,9% de vitória de duelo, e quem perdia 2-3 rounds nunca
// reconstruía a economia → 13x0. Tornando o bônus aditivo (eco 0 / force ~8 / buy 15 / awp ~22),
// a arma dá vantagem real mas limitada, sem dominar o skill. Convertido do peso existente para
// não tocar nos call sites: bônus = (weight - 1.0) * WEAPON_BONUS_FACTOR.
const WEAPON_BONUS_FACTOR = 18.75;
const weaponBonus = (weight: number): number => (weight - 1.0) * WEAPON_BONUS_FACTOR;

// Monta a escalação de 5 (guard-rail F1): titulares + melhores reservas se faltarem titular.
// Garante que nenhum time jogue com menos de 5 (a store já mantém o invariante; isto é defesa
// em profundidade caso um save antigo/bug deixe a squad incompleta).
const pickStarters = (players: Player[]): Player[] => {
  const titulares = players.filter(p => p.status === 'titular');
  if (titulares.length >= 5) return titulares;
  const reservas = players.filter(p => p.status === 'reserva').sort((a, b) => b.overall - a.overall);
  return [...titulares, ...reservas.slice(0, 5 - titulares.length)];
};

// Loss Bonus: $1400 -> $1900 -> $2400 -> $2900 -> $3400
const LOSS_BONUS = [1400, 1900, 2400, 2900, 3400];
const MAX_CASH = 16000;

// Helper para sortear número aleatório com distribuição normal ou simples
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Escolhe um elemento aleatório
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Probabilidade de um kill ter assistência (flash/smoke/dano combinado).
const ASSIST_CHANCE = 0.45;

/**
 * Credita (probabilisticamente) uma assistência a um COLEGA VIVO do killer.
 * Função pura quanto à lógica de seleção: a escolha é ponderada por `utility` (quem dá mais
 * flash/smoke tem mais chance de assistir). Muta apenas `liveStats[colega].assists` — coerente
 * com o padrão de mutação in-place do simulador (liveStats é o acumulador da partida).
 */
const maybeCreditAssist = (
  killerId: string,
  victimId: string,
  killerTeamPlayers: Player[],
  liveStats: Record<string, MatchLivePlayerStats>
): void => {
  if (Math.random() >= ASSIST_CHANCE) return;

  const candidates = killerTeamPlayers.filter(
    (p) => p.id !== killerId && p.id !== victimId && liveStats[p.id]?.alive
  );
  if (candidates.length === 0) return;

  // Ponderação por utility (piso 1 para todo candidato ter alguma chance).
  const weights = candidates.map((p) => Math.max(1, p.attributes.utility));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let roll = Math.random() * totalWeight;

  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      chosen = candidates[i];
      break;
    }
  }

  liveStats[chosen.id].assists++;
};

// Dano base creditado ao killer por kill confirmado (alimenta o ADR).
const creditKillDamage = (killerId: string, liveStats: Record<string, MatchLivePlayerStats>): void => {
  liveStats[killerId].damage += Math.round(randomRange(90, 110));
};

// Pesos de balanceamento da simulação (Fase F — calibrados via balanceHarness.ts)
const BALANCE_WEIGHTS = {
  // F0 — recalibrado para que o RNG DOMINE em gaps pequenos de skill (lutas competitivas) e só
  // ceda em gaps grandes. Antes (rng 68, aim 1.0, overall 0.15) o gap determinístico dominava o
  // ruído: 7 de overall já dava ~67% por round → placares 13-5 e blowouts frequentes.
  rngAmplitude: 98,      // amplitude da aleatoriedade (zebras); maior = mais imprevisível
  aimWeight: 0.72,       // mira pesa, mas não domina o duelo (era 1.0)
  overallWeight: 0.07,   // overall já deriva dos atributos; peso baixo evita contar skill em dobro (era 0.15)
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
  firstKills: 0,
  clutchesWon: 0,
  multiKills: 0,
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

  // Liderança (F2): o melhor IGL do time dá coordenação tática ao coletivo (calls, rotações,
  // controle econômico). Um IGL dedicado de alto nível pesa mais que um rifler liderando no improviso.
  // ~1.0 a ~1.035 — efeito de TIME (não de frag individual), por isso entra no mod coletivo.
  const iglRating = players.length > 0
    ? Math.max(...players.map(p => (p.role === 'IGL' ? p.attributes.igl : p.attributes.igl * 0.6)))
    : 50;
  const leadershipFactor = 1 + (iglRating / 100) * 0.035;

  return masteryFactor * formFactor * moralFactor * tacticFactor * leadershipFactor;
};

// Condição individual do jogador (moral, forma e energia/cansaço) → ~0.90 a ~1.10
const playerCondition = (p: Player): number =>
  0.90 + (p.moral / 100) * 0.07 + (p.form / 100) * 0.07 + (p.energy / 100) * 0.06;

// ============================================================================
// FASE 2 — ROLES COM PESO REAL
// ============================================================================
//
// Fase do duelo, usada para ativar bônus de role específicos:
//   'fb'        → abertura do round (first blood)
//   'postplant' → pós-plant / retake (clutch e lurk pesam)
//   'mid'       → trocas de defesa sem plant (mid-round)
type ClashPhase = 'fb' | 'postplant' | 'mid';

/**
 * ROLES-01 — Bônus ADITIVO (e PEQUENO, faixa ~0..~12) ao poder de duelo, derivado de
 * role + fase + atributos + mapa. Soma-se ao attPower/defPower ANTES de *condition *teamMod,
 * na mesma escala dos outros termos (weaponBonus, gamesense*0.08, etc.). Função PURA.
 *
 * Não cria atributos novos: usa apenas aim/gamesense/clutch (os 5 existentes) e map.awpImpact.
 * Support retorna 0 de propósito — seu valor é COLETIVO (ROLES-03, supportEdge).
 */
const roleClashBonus = (player: Player, phase: ClashPhase, map: GameMap, weaponName: string): number => {
  const { aim, gamesense, clutch } = player.attributes;

  switch (player.role) {
    case 'Entry Fragger':
      // Recompensa abrir o round: forte na abertura, neutro no resto.
      return phase === 'fb' ? aim * 0.0025 + gamesense * 0.001 : 0;

    case 'AWPer': {
      // Vale quando está de fato com a AWP; escala pelo impacto de AWP do mapa.
      if (weaponName === WEAPONS.awp.name) return aim * 0.006 * (map.awpImpact / 100);
      // Sem AWP e em mapa de baixo impacto de AWP, perde um pouco na abertura.
      return phase === 'fb' && map.awpImpact < 50 ? -4 : 0;
    }

    case 'Lurker':
      // Protagonista do meio/pós-plant: leitura + frieza.
      return phase === 'postplant' || phase === 'mid' ? clutch * 0.0025 + gamesense * 0.0015 : 0;

    case 'Clutcher':
      // Especialista em situações de pós-plant.
      return phase === 'postplant' ? clutch * 0.003 : 0;

    case 'IGL':
      // Pequeno ganho de coordenação em qualquer fase (o grosso do IGL é coletivo, no teamMod).
      return gamesense * 0.001;

    case 'Star Player':
      // Consistência acima da média em qualquer fase.
      return aim * 0.0015;

    case 'Support':
      // Sem bônus individual — valor vem do edge coletivo (ROLES-03).
      return 0;

    case 'Rifler':
    default:
      return 0;
  }
};

/**
 * ROLES-02 — Escolha ponderada genérica. Soma os pesos e sorteia proporcionalmente.
 * Pesos <= 0 são tratados como 0 (jamais escolhidos, a menos que todos sejam 0 → fallback uniforme).
 */
const weightedChoice = <T>(items: readonly T[], weightFn: (item: T) => number): T => {
  const weights = items.map((it) => Math.max(0, weightFn(it)));
  const total = weights.reduce((acc, w) => acc + w, 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];

  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
};

// Peso de seleção de duelista por role+fase (ROLES-02). Faz o Entry abrir e o Lurker/Clutcher
// protagonizar o pós-plant, sem nunca zerar a chance de qualquer um (piso 0.5/0.8).
const duelistWeight = (player: Player, phase: ClashPhase, map: GameMap): number => {
  switch (phase) {
    case 'fb':
      switch (player.role) {
        case 'Entry Fragger': return 3.0;
        case 'Star Player': return 2.0;
        case 'AWPer': return map.awpImpact > 70 ? 1.0 : 0.9;
        case 'Rifler': return 1.0;
        case 'Lurker': return 1.0;
        case 'Support':
        case 'IGL': return 0.5;
        default: return 1.0;
      }
    case 'postplant':
      switch (player.role) {
        case 'Lurker': return 2.5;
        case 'Clutcher': return 2.5;
        case 'Rifler': return 1.0;
        case 'Entry Fragger': return 1.0;
        case 'Support':
        case 'IGL': return 0.5;
        default: return 1.0;
      }
    case 'mid':
      switch (player.role) {
        case 'AWPer': return 1.0;
        case 'Star Player': return 1.5;
        case 'Rifler': return 1.0;
        default: return 0.8;
      }
  }
};

// Escolhe o duelista de uma fase ponderando por role (ROLES-02).
const pickDuelist = (players: readonly Player[], phase: ClashPhase, map: GameMap): Player =>
  weightedChoice(players, (p) => duelistWeight(p, phase, map));

// ROLES-04 — Prioridade de role no clutch (Clutcher > Lurker > resto), usada como desempate
// no 1vX. Maior número = preferido como último homem vivo.
const clutchRolePriority = (player: Player): number =>
  player.role === 'Clutcher' ? 2 : player.role === 'Lurker' ? 1 : 0;

// ROLES-04 — Último homem vivo: escolhe o de MAIOR clutch (com desempate por role de clutch),
// em vez de aleatório. Modela o "ace man" segurando o 1vX.
const pickLastManByClutch = (players: readonly Player[]): Player =>
  players.reduce((best, p) => {
    const score = p.attributes.clutch + clutchRolePriority(p) * 5;
    const bestScore = best.attributes.clutch + clutchRolePriority(best) * 5;
    return score > bestScore ? p : best;
  }, players[0]);

// ROLES-02/04 — No pós-plant, se um lado ficou em 1vX o último é o de maior clutch; caso
// contrário, escolha ponderada por role da fase 'postplant'.
const pickClutchOrDuelist = (players: readonly Player[], phase: ClashPhase, map: GameMap): Player =>
  players.length === 1 ? players[0] : pickDuelist(players, phase, map);

// ROLES-03 — Vantagem COLETIVA do Support: melhor utility entre os Supports do time → bônus
// aditivo pequeno (0..0.04*100 = ~4) a QUALQUER duelista do time nas fases de execução ('fb'/'mid').
const computeSupportEdge = (players: readonly Player[]): number => {
  const supports = players.filter((p) => p.role === 'Support');
  if (supports.length === 0) return 0;
  const bestUtility = Math.max(...supports.map((p) => p.attributes.utility));
  return (bestUtility / 100) * 0.002 * 100; // escala de poder (~0..0.2)
};

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
  defenderTeamMod: number,
  phase: ClashPhase,
  attackerWeaponName: string,
  defenderWeaponName: string,
  attackerSupportEdge = 0,
  defenderSupportEdge = 0
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

  // ROLES-01: bônus aditivo de role+fase (pequeno, ~0..12), na mesma escala dos demais termos.
  const attRoleBonus = roleClashBonus(a, phase, map, attackerWeaponName);
  const defRoleBonus = roleClashBonus(d, phase, map, defenderWeaponName);

  // ROLES-03: o smoke/flash do Support beneficia o TIME inteiro nas fases de execução ('fb'/'mid').
  const isExecutionPhase = phase === 'fb' || phase === 'mid';
  const attSupportBonus = isExecutionPhase ? attackerSupportEdge : 0;
  const defSupportBonus = isExecutionPhase ? defenderSupportEdge : 0;

  // Poder: mira (posição + skill) + BÔNUS DE ARMA ADITIVO + gamesense + OVERALL (peso reduzido)
  // + utilitárias + clutch + BÔNUS DE ROLE + EDGE DE SUPPORT, modulado pela CONDIÇÃO individual
  // (moral/forma/energia) e pelo MOD do TIME, com RNG ~normal. Tudo aditivo antes do *condition.
  let attPower = (a.attributes.aim * attackerPosFactor * BALANCE_WEIGHTS.aimWeight) + weaponBonus(attackerWeaponWeight)
    + (a.attributes.gamesense * BALANCE_WEIGHTS.gamesenseWeight) + (a.overall * BALANCE_WEIGHTS.overallWeight)
    + attUtilityBonus + attClutchBonus + attRoleBonus + attSupportBonus;
  attPower = attPower * playerCondition(a) * attackerTeamMod + gaussianRNG(BALANCE_WEIGHTS.rngAmplitude);

  let defPower = (d.attributes.aim * defenderPosFactor * BALANCE_WEIGHTS.aimWeight) + weaponBonus(defenderWeaponWeight)
    + (d.attributes.gamesense * BALANCE_WEIGHTS.gamesenseWeight) + (d.overall * BALANCE_WEIGHTS.overallWeight)
    + defUtilityBonus + defClutchBonus + defRoleBonus + defSupportBonus;
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
  
  // Identifica os 5 jogadores de cada time (guard-rail F1: completa com reservas se faltar).
  const livePlayersA = pickStarters(playersA);
  const livePlayersB = pickStarters(playersB);

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
    // Init defensivo: um reserva promovido pelo guard-rail pode não ter liveStats (caminho UI).
    if (!liveStats[p.id]) liveStats[p.id] = initLivePlayerStats(p, 800);
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

  // ROLES-03: edge coletivo do Support de cada lado (smoke/flash que beneficia o time inteiro).
  const supportEdgeTR = computeSupportEdge(playersTR);
  const supportEdgeCT = computeSupportEdge(playersCT);

  // Peso E nome da arma de um jogador conforme seu lado, role e o buy do round (ROLES-01 precisa
  // do nome para saber se o AWPer está de fato com AWP). AWPer só pega AWP em buy/em mapas relevantes.
  const weaponOf = (p: Player, side: 'CT' | 'TR', requireHighAwpMap: boolean): { weight: number; name: string } => {
    const buyType = side === 'TR' ? buyTypeTR(p) : buyTypeCT(p);
    const awpEligible = p.role === 'AWPer' && (!requireHighAwpMap || map.awpImpact > 70);
    if (awpEligible) return { weight: WEAPONS.awp.weight, name: WEAPONS.awp.name };
    if (buyType === 'buy') return { weight: WEAPONS.buy.weight, name: WEAPONS.buy.name };
    return { weight: WEAPONS.eco.weight, name: WEAPONS.eco.name };
  };

  // ROLES-05 (opcional): a C4 vai para o TR de MENOR peso de entry (Support/IGL preferidos),
  // liberando os fraggers para abrir o round em vez de carregar a bomba.
  const carrier = weightedChoice(playersTR, (p) => 1 / Math.max(0.5, duelistWeight(p, 'fb', map)));
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

  // ROLES-02: o abridor é ponderado por role (Entry/Star/AWP em mapa de AWP têm prioridade).
  const trFB = pickDuelist(playersTR, 'fb', map);
  const ctFB = pickDuelist(playersCT, 'fb', map);

  const trFBWeapon = weaponOf(trFB, 'TR', true);
  const ctFBWeapon = weaponOf(ctFB, 'CT', true);

  function buyTypeTR(p: Player) { return sides.teamA === 'TR' ? buyTypeA : buyTypeB; }
  function buyTypeCT(p: Player) { return sides.teamA === 'CT' ? buyTypeA : buyTypeB; }

  const fbDuelo = resolveClash(
    { player: trFB, stats: liveStats[trFB.id], side: 'TR' },
    { player: ctFB, stats: liveStats[ctFB.id], side: 'CT' },
    false,
    map,
    trFBWeapon.weight,
    ctFBWeapon.weight,
    modTR,
    modCT,
    'fb',
    trFBWeapon.name,
    ctFBWeapon.name,
    supportEdgeTR,
    supportEdgeCT
  );

  if (fbDuelo.winner === 'attacker') {
    // TR elimina CT (First Blood)
    liveStats[ctFB.id].alive = false;
    liveStats[ctFB.id].hp = 0;
    liveStats[trFB.id].kills++;
    liveStats[ctFB.id].deaths++;
    liveStats[trFB.id].firstKills++;
    creditKillDamage(trFB.id, liveStats);
    maybeCreditAssist(trFB.id, ctFB.id, playersTR, liveStats);
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
    liveStats[ctFB.id].firstKills++;
    creditKillDamage(ctFB.id, liveStats);
    maybeCreditAssist(ctFB.id, trFB.id, playersCT, liveStats);
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
  // ROLES-03: o Support do TR também facilita a tomada do site (pequeno empurrão na plantChance).
  const plantChance = Math.min(75, Math.max(5, plantBase + survivalRatio + utilityEdge + supportEdgeTR));
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

      // ROLES-02/04: pós-plant prioriza Lurker/Clutcher; no 1vX o último é o de maior clutch.
      const pTR = pickClutchOrDuelist(trAlive, 'postplant', map);
      const pCT = pickClutchOrDuelist(ctAlive, 'postplant', map);

      // Duelo focado em Clutch e Utilitárias no retake
      const wTR = weaponOf(pTR, 'TR', false);
      const wCT = weaponOf(pCT, 'CT', false);

      const duelo = resolveClash(
        { player: pTR, stats: liveStats[pTR.id], side: 'TR' },
        { player: pCT, stats: liveStats[pCT.id], side: 'CT' },
        true,
        map,
        wTR.weight,
        wCT.weight,
        modTR,
        modCT,
        'postplant',
        wTR.name,
        wCT.name,
        supportEdgeTR,
        supportEdgeCT
      );

      if (duelo.winner === 'attacker') {
        // TR mata CT
        liveStats[pCT.id].alive = false;
        liveStats[pCT.id].hp = 0;
        liveStats[pTR.id].kills++;
        liveStats[pCT.id].deaths++;
        creditKillDamage(pTR.id, liveStats);
        maybeCreditAssist(pTR.id, pCT.id, playersTR, liveStats);
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
        creditKillDamage(pCT.id, liveStats);
        maybeCreditAssist(pCT.id, pTR.id, playersCT, liveStats);
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

      // ROLES-02/04: defesa sem plant é 'mid' (AWPer/Star pesam); 1vX prioriza maior clutch
      // e usa 'postplant' para ativar o bônus de clutch do último homem.
      const trIs1vX = trAlive.length === 1;
      const ctIs1vX = ctAlive.length === 1;
      const pTR = trIs1vX ? pickLastManByClutch(trAlive) : pickDuelist(trAlive, 'mid', map);
      const pCT = ctIs1vX ? pickLastManByClutch(ctAlive) : pickDuelist(ctAlive, 'mid', map);
      const defPhase: ClashPhase = trIs1vX || ctIs1vX ? 'postplant' : 'mid';

      const wTR = weaponOf(pTR, 'TR', false);
      const wCT = weaponOf(pCT, 'CT', false);

      const duelo = resolveClash(
        { player: pTR, stats: liveStats[pTR.id], side: 'TR' },
        { player: pCT, stats: liveStats[pCT.id], side: 'CT' },
        false,
        map,
        wTR.weight,
        wCT.weight,
        modTR,
        modCT,
        defPhase,
        wTR.name,
        wCT.name,
        supportEdgeTR,
        supportEdgeCT
      );

      if (duelo.winner === 'attacker') {
        liveStats[pCT.id].alive = false;
        liveStats[pCT.id].hp = 0;
        liveStats[pTR.id].kills++;
        liveStats[pCT.id].deaths++;
        creditKillDamage(pTR.id, liveStats);
        maybeCreditAssist(pTR.id, pCT.id, playersTR, liveStats);
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
        creditKillDamage(pCT.id, liveStats);
        maybeCreditAssist(pCT.id, pTR.id, playersCT, liveStats);
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

  // Kills feitos por jogador NESTE round (diferença contra o snapshot do início do round).
  const killsInRoundOf = (id: string): number =>
    Math.max(0, liveStats[id].kills - (killsBeforeRound[id] ?? liveStats[id].kills));

  // MULTI-KILLS: jogador que fez 3+ kills no round.
  allLivePlayers.forEach(p => {
    if (killsInRoundOf(p.id) >= 3) liveStats[p.id].multiKills++;
  });

  // CLUTCH: o time VENCEDOR terminou com EXATAMENTE 1 vivo e esse jogador fez ≥1 kill no round.
  const winnerSurvivors = allLivePlayers.filter(p => p.teamId === roundWinnerId && liveStats[p.id].alive);
  let clutchHeroId = '';
  if (winnerSurvivors.length === 1 && killsInRoundOf(winnerSurvivors[0].id) >= 1) {
    clutchHeroId = winnerSurvivors[0].id;
    liveStats[clutchHeroId].clutchesWon++;
  }

  // Identificar MVP do Round: maior número de kills NO round dentre o time vencedor,
  // com bônus se foi um clutch decisivo. Substitui o critério estático (aim+clutch).
  let roundMvpId = '';
  let bestRoundImpact = -1;
  allLivePlayers.forEach(p => {
    if (p.teamId !== roundWinnerId) return;
    const impact = killsInRoundOf(p.id) + (p.id === clutchHeroId ? 2 : 0);
    if (impact > bestRoundImpact) {
      bestRoundImpact = impact;
      roundMvpId = p.id;
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

  // Guard-rail (F1): completa a escalação com reservas se faltar titular (ver pickStarters).
  const activePlayersA = pickStarters(playersA);
  const activePlayersB = pickStarters(playersB);

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

  // Eleger MVP Geral do Confronto por impactScore ponderado (kills + assists + clutches +
  // multi-kills + aberturas - mortes), com bônus multiplicativo para o time VENCEDOR. Um carry
  // do time perdedor só leva o MVP se o impacto bruto for bem superior.
  const matchWinnerId = scoreA > scoreB ? teamA.id : teamB.id;
  let mvpPlayerId = '';
  let highestScore = -Infinity;
  const allPlayers = [...activePlayersA, ...activePlayersB];
  allPlayers.forEach(p => {
    const s = liveStats[p.id];
    const baseImpact =
      s.kills * 1.0 +
      s.assists * 0.4 +
      s.clutchesWon * 2.0 +
      s.multiKills * 1.5 +
      s.firstKills * 0.5 -
      s.deaths * 0.3;
    const score = baseImpact * (p.teamId === matchWinnerId ? 1.15 : 1.0);
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
