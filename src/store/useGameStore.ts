import { create } from 'zustand';
import { Match, Player, SaveGame, Sponsor, Staff, Team, Tournament, GameMap, NewsItem, SeasonSummary, SeasonChampionSnapshot, Toast, ToastType } from '../types';
import { realPlayers } from '../game/data/realPlayers';
import { realTeams } from '../game/data/realTeams';
import { realMaps } from '../game/data/realMaps';
import { defaultSponsors } from '../game/data/defaultSponsors';
import { defaultCompetitions } from '../game/data/defaultCompetitions';
import { generatePlayer } from '../game/generators/playerGenerator';
import { generateMatchNews, generateTransferNews } from '../game/generators/newsGenerator';
import { simulateMapVeto } from '../game/simulation/mapVetoSimulator';
import { simulateWholeMatchQuick } from '../game/simulation/matchSimulator';

// Base/Scout: custo de cada rodada de investimento na base (observação de jovens talentos).
const INVESTIMENTO_BASE_CUSTO = 30000;

interface GameState {
  // Dados salváveis
  managerName: string;
  managerNationality: string;
  currentWeek: number;
  currentSeason: number;
  userTeamId: string;
  difficulty: 'facil' | 'normal' | 'dificil' | 'hardcore';
  teams: Record<string, Team>;
  players: Record<string, Player>;
  maps: Record<string, GameMap>;
  sponsors: Record<string, Sponsor>;
  staffList: Record<string, Staff>;
  tournaments: Record<string, Tournament>;
  historyNews: import('../types').NewsItem[];
  financialHistory: SaveGame['financialHistory'];
  trainingPlan: { intensity: 'leve' | 'normal' | 'pesada' | 'bootcamp'; focus: string };
  youthProspects: Player[]; // Base/Scout: jovens observados aguardando promoção

  // Estados locais UI / Sessão
  currentScreen: string;
  selectedPlayerId: string | null;
  selectedTeamId: string | null;
  activeTournamentId: string | null;
  activeMatch: Match | null;
  finishedMatch: Match | null; // Partida recém-concluída, exibida na tela de resultado
  activeMatchRoundIndex: number;
  isSimulatingMatch: boolean;
  gameLoaded: boolean;
  seasonSummary: SeasonSummary | null; // Snapshot da temporada encerrada (UI transiente, não salvo)
  toasts: Toast[]; // Notificações in-app (UI transiente, não salvo)

  // Ações
  iniciarCarreira: (
    managerName: string,
    managerNationality: string,
    teamId: string,
    difficulty: 'facil' | 'normal' | 'dificil' | 'hardcore',
    customTeamData?: { name: string; tag: string; colorPrimary: string; colorSecondary: string }
  ) => void;
  avancarSemana: () => void;
  definirTitular: (playerId: string, status: 'titular' | 'reserva') => void;
  definirPapelEspecial: (playerId: string, roleType: 'IGL' | 'AWPer') => void;
  definirTaticas: (tactics: Team['tactics']) => void;
  definirTreinoSemanal: (intensity: 'leve' | 'normal' | 'pesada' | 'bootcamp', focus: string) => { success: boolean; message: string };
  fazerPropostaContratacao: (playerId: string) => { success: boolean; message: string };
  venderJogador: (playerId: string) => { success: boolean; message: string };
  renovarContrato: (playerId: string) => { success: boolean; message: string };
  dispensarJogador: (playerId: string) => { success: boolean; message: string };
  assinarPatrocinio: (sponsorId: string) => { success: boolean; message: string };
  rescindirPatrocinio: () => { success: boolean; message: string };
  renegociarPatrocinio: () => { success: boolean; message: string };
  contratarStaff: (staff: Staff) => { success: boolean; message: string };
  demitirStaff: (role: Staff['role']) => { success: boolean; message: string };
  investirNaBase: () => { success: boolean; message: string };
  promoverJovem: (playerId: string) => { success: boolean; message: string };
  editarJogador: (playerId: string, patch: Partial<Player>) => void;
  setScreen: (screen: string) => void;
  setSelectedPlayerId: (id: string | null) => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setSelectedTeamId: (id: string | null) => void;
  setActiveTournamentId: (id: string | null) => void;
  
  // Ações de Partida
  iniciarPartidaAtiva: (match: Match) => void;
  iniciarPartidaContra: (opponentId: string, competitionId?: string) => void; // Gera partida e abre o pré-jogo
  assistirPartida: () => void;       // Do pré-jogo: assiste round a round
  avancarRoundVisual: () => boolean; // Avança o round visual na simulação interativa
  finalizarPartidaAtiva: () => void;
  fecharResultado: () => void;       // Fecha a tela de resultado e volta ao painel
  iniciarProximaTemporada: () => void; // Fecha o resumo de temporada e volta ao painel

  // Persistência
  salvarJogo: (slot?: string) => void;
  carregarJogo: (slot?: string) => boolean;
  exportarSave: () => string;
  importarSave: (jsonStr: string) => boolean;
  excluirSave: (slot?: string) => void;
  resetarDadosEditor: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  managerName: '',
  managerNationality: '',
  currentWeek: 1,
  currentSeason: 1,
  userTeamId: '',
  difficulty: 'normal',
  teams: {},
  players: {},
  maps: {},
  sponsors: {},
  staffList: {},
  tournaments: {},
  historyNews: [],
  financialHistory: [],
  trainingPlan: { intensity: 'normal', focus: 'aim' },
  youthProspects: [],

  currentScreen: 'home',
  selectedPlayerId: null,
  selectedTeamId: null,
  activeTournamentId: null,
  activeMatch: null,
  finishedMatch: null,
  activeMatchRoundIndex: 0,
  isSimulatingMatch: false,
  gameLoaded: false,
  seasonSummary: null,
  toasts: [],

  iniciarCarreira: (managerName, managerNationality, teamId, difficulty, customTeamData) => {
    // Carrega dados iniciais novos
    const teamsData = JSON.parse(JSON.stringify(realTeams)) as Record<string, Team>;
    const playersData = {} as Record<string, Player>;

    // Mapeia jogadores reais
    realPlayers.forEach((p) => {
      playersData[p.id] = JSON.parse(JSON.stringify(p));
    });

    let finalUserTeamId = teamId;

    // Se o jogador estiver criando uma organização própria
    if (teamId === 'custom' && customTeamData) {
      finalUserTeamId = 'custom_team';
      teamsData[finalUserTeamId] = {
        id: finalUserTeamId,
        name: customTeamData.name,
        tag: customTeamData.tag,
        country: 'Brasil',
        region: 'América do Sul',
        tier: 4,
        points: 50,
        reputation: 50,
        budget: 0, // Será ajustado pela dificuldade
        colorPrimary: customTeamData.colorPrimary,
        colorSecondary: customTeamData.colorSecondary,
        isUser: true,
        tactics: {
          playstyle: 'balanced',
          tempo: 'normal',
          focus: 'default',
          utilityUsage: 'medium',
          economyStyle: 'balanced',
        },
        mapMastery: {
          de_mirage: 50, de_nuke: 50, de_inferno: 50, de_dust2: 50, de_ancient: 50, de_anubis: 50, de_overpass: 50
        },
        stats: { wins: 0, losses: 0, titles: 0, recentForm: [] },
        staff: {},
      };

      // Gera 5 jogadores iniciais aleatórios para o time customizado
      for (let i = 0; i < 5; i++) {
        const newP = generatePlayer({ minOverall: 60, maxOverall: 70, teamId: finalUserTeamId, forceNationality: 'Brasil' });
        newP.status = 'titular';
        playersData[newP.id] = newP;
      }
    } else {
      // Marca o time existente escolhido como controlado pelo usuário
      if (teamsData[teamId]) {
        teamsData[teamId].isUser = true;
      }
    }

    // Ajusta o orçamento inicial do time do usuário baseado na dificuldade
    let startingBudget = 500000;
    if (difficulty === 'facil') startingBudget = 1000000;
    else if (difficulty === 'dificil') startingBudget = 250000;
    else if (difficulty === 'hardcore') startingBudget = 100000;

    if (teamsData[finalUserTeamId]) {
      teamsData[finalUserTeamId].budget = startingBudget;
    }

    // Garante que TODO time tenha pelo menos 5 titulares (spec §6.1/§8: times incompletos
    // são preenchidos com jogadores gerados). Sem isso, ~60 times ficam sem elenco e a
    // simulação quebra (Math.max de array vazio / MVP indefinido).
    const overallRangeByTier: Record<Team['tier'], { min: number; max: number }> = {
      1: { min: 76, max: 88 },
      2: { min: 70, max: 80 },
      3: { min: 63, max: 74 },
      4: { min: 55, max: 67 },
    };
    Object.values(teamsData).forEach((team) => {
      const titulares = Object.values(playersData).filter(
        (p) => p.teamId === team.id && p.status === 'titular'
      );
      let faltam = 5 - titulares.length;
      if (faltam <= 0) return;

      // Primeiro, promove reservas já existentes do próprio time
      const reservas = Object.values(playersData).filter(
        (p) => p.teamId === team.id && p.status === 'reserva'
      );
      for (const reserva of reservas) {
        if (faltam <= 0) break;
        reserva.status = 'titular';
        faltam--;
      }

      // Gera o restante com overall coerente ao tier do time
      const range = overallRangeByTier[team.tier];
      while (faltam > 0) {
        const generated = generatePlayer({
          minOverall: range.min,
          maxOverall: range.max,
          teamId: team.id,
        });
        generated.status = 'titular';
        playersData[generated.id] = generated;
        faltam--;
      }
    });

    // Configura patrocinadores
    const sponsorsData = {} as Record<string, Sponsor>;
    defaultSponsors.forEach((s) => { sponsorsData[s.id] = s; });

    // Configura campeonatos
    const tournamentsData = {} as Record<string, Tournament>;
    defaultCompetitions.forEach((t) => {
      const copyT = JSON.parse(JSON.stringify(t)) as Tournament;
      // Preenche os times participantes baseados no tier do torneio
      const eligibleTeams = Object.values(teamsData)
        .filter((team) => team.tier === t.tier || (t.tier === 1 && team.tier <= 2))
        .map((team) => team.id);
      
      // Limita quantidade de times conforme o tier
      copyT.teamIds = eligibleTeams.slice(0, t.id === 'major_mundial' ? 16 : 8);
      // Garante a vaga do time do usuário no torneio do seu tier (senão ele nunca jogaria)
      if (eligibleTeams.includes(finalUserTeamId) && !copyT.teamIds.includes(finalUserTeamId)) {
        copyT.teamIds[copyT.teamIds.length - 1] = finalUserTeamId;
      }
      tournamentsData[t.id] = copyT;
    });

    const mapsData = {} as Record<string, typeof realMaps[0]>;
    realMaps.forEach(m => { mapsData[m.id] = m; });

    set({
      managerName,
      managerNationality,
      currentWeek: 1,
      currentSeason: 1,
      userTeamId: finalUserTeamId,
      difficulty,
      teams: teamsData,
      players: playersData,
      maps: mapsData,
      sponsors: sponsorsData,
      tournaments: tournamentsData,
      historyNews: [
        {
          id: 'welcome',
          title: `BEM-VINDO AO PROSTRIKE: ${managerName} assume o comando técnico do ${teamsData[finalUserTeamId]?.name}!`,
          content: `Foi anunciado oficialmente hoje que ${managerName} é o novo manager e coach do ${teamsData[finalUserTeamId]?.name}. Com o objetivo ambicioso de reestruturar a economia, treinar os novos jogadores e subir de divisão rumo aos Majors de Elite, o novo treinador assinou um contrato e já inicia as atividades de treino nesta semana. A torcida expressa grande expectativa de mudança!`,
          category: 'general',
          week: 1,
          dateStr: 'Semana 1',
        },
      ],
      financialHistory: [{ week: 1, description: 'Orçamento Inicial', amount: startingBudget }],
      youthProspects: [],
      currentScreen: 'dashboard',
      gameLoaded: true,
    });

    get().salvarJogo();
  },

  avancarSemana: () => {
    const { currentWeek, userTeamId, teams, players, tournaments, historyNews, financialHistory, currentSeason, trainingPlan } = get();

    // 1. Há partida de campeonato do usuário nesta semana? (bracket por rodadas — A5)
    // O adversário varia por rodada; o avanço/eliminação é tratado em finalizarPartidaAtiva.
    const tournamentThisWeek = Object.values(tournaments).find(
      t => t.weekScheduled === currentWeek && !t.isFinished && t.teamIds.includes(userTeamId)
    );

    if (tournamentThisWeek) {
      const opponents = tournamentThisWeek.teamIds.filter(id => id !== userTeamId && teams[id]);
      if (opponents.length > 0) {
        const oppId = opponents[tournamentThisWeek.currentRound % opponents.length];
        const userTeam = teams[userTeamId];
        const oppTeam = teams[oppId];
        const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
        const oppSquad = Object.values(players).filter(p => p.teamId === oppId && p.status === 'titular');
        const mapSelected = realMaps.find(m => m.status === 'active') ?? realMaps[0];

        // Efeito do Analista (Fase D): bônus de veto aplicado ao time do usuário (teamA).
        const analystId = userTeam.staff.analystId;
        const userAnalystLevel = analystId ? get().staffList[analystId]?.level ?? 0 : 0;

        const match = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapSelected, tournamentThisWeek.id, { a: userAnalystLevel });
        set({ activeMatch: match, currentScreen: 'matchPreview', activeMatchRoundIndex: 0, isSimulatingMatch: false });
        return;
      }
    }

    // 2. ECONOMIA SEMANAL:
    const userTeam = teams[userTeamId];
    let income = 0;
    let expense = 0;

    // Receita de patrocinador
    if (userTeam.sponsorId && get().sponsors[userTeam.sponsorId]) {
      const sp = get().sponsors[userTeam.sponsorId];
      income += sp.weeklyIncome;
    }

    // Receita operacional base (bilheteria/conteúdo/loja), proporcional à reputação —
    // dá sustentabilidade ao time mesmo sem patrocínio assinado (objetivo: jogo sustentável).
    const baseIncome = Math.round(userTeam.reputation * 300);
    income += baseIncome;

    // Despesa de salários de jogadores ativos e staff
    const userPlayers = Object.values(players).filter(p => p.teamId === userTeamId);
    userPlayers.forEach(p => {
      expense += p.salary;
    });

    // Despesa do Staff — salário real de cada membro contratado (Fase D).
    // Saves antigos têm staffList vazio: o optional chaining zera o custo com segurança.
    const staffList = get().staffList;
    const staffSlots: (keyof Team['staff'])[] = ['coachId', 'analystId', 'psychologistId', 'scoutId', 'physioId'];
    staffSlots.forEach((slot) => {
      const staffId = userTeam.staff[slot];
      if (staffId && staffList[staffId]) expense += staffList[staffId].salary;
    });

    // Níveis dos membros relevantes para os efeitos semanais e de partida
    const coachLevel = userTeam.staff.coachId ? staffList[userTeam.staff.coachId]?.level ?? 0 : 0;
    const psychologistLevel = userTeam.staff.psychologistId ? staffList[userTeam.staff.psychologistId]?.level ?? 0 : 0;
    const physioLevel = userTeam.staff.physioId ? staffList[userTeam.staff.physioId]?.level ?? 0 : 0;

    // Custo do Bootcamp (quando o plano de treino da semana for bootcamp e houver caixa)
    let bootcampCost = 0;
    if (trainingPlan.intensity === 'bootcamp' && userTeam.budget >= 50000) {
      bootcampCost = 50000;
      expense += bootcampCost;
    }

    const netAmount = income - expense;
    const newBudget = userTeam.budget + netAmount;

    // Atualiza caixa do time do usuário
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: newBudget
    };

    // Histórico financeiro
    const newFinEntry = [
      ...financialHistory,
      { week: currentWeek, description: 'Receita Operacional + Patrocínio', amount: income },
      { week: currentWeek, description: 'Folha Salarial, Staff e Custos', amount: -expense }
    ];

    // CICLO DE PATROCÍNIO: decrementa o contador semanal e expira o contrato ao zerar.
    // Reatribui updatedTeams[userTeamId] de forma imutável (após o budget já calculado).
    const sponsorExpiryNews: NewsItem[] = [];
    if (updatedTeams[userTeamId].sponsorId && get().sponsors[updatedTeams[userTeamId].sponsorId as string]) {
      const activeSp = get().sponsors[updatedTeams[userTeamId].sponsorId as string];
      const weeksLeft = (updatedTeams[userTeamId].sponsorWeeksRemaining ?? 0) - 1;
      if (weeksLeft <= 0) {
        // Contrato encerrado: remove sponsorId/sponsorWeeksRemaining preservando o tipo opcional
        const { sponsorId: _sid, sponsorWeeksRemaining: _swr, ...teamWithoutSponsor } = updatedTeams[userTeamId];
        updatedTeams[userTeamId] = teamWithoutSponsor;
        sponsorExpiryNews.push({
          id: `sponsor_end_${currentSeason}_${currentWeek}`,
          title: `Contrato de patrocínio com ${activeSp.name} chega ao fim`,
          content: `O contrato de patrocínio entre o ${userTeam.name} e a ${activeSp.name} expirou nesta semana. A receita semanal de $${activeSp.weeklyIncome.toLocaleString()} foi interrompida. Negocie um novo patrocínio na aba de Finanças para manter as contas equilibradas.`,
          category: 'general',
          week: currentWeek,
          dateStr: `Semana ${currentWeek}`,
        });
        newFinEntry.push({ week: currentWeek, description: `Contrato de patrocínio encerrado: ${activeSp.name}`, amount: 0 });
      } else {
        updatedTeams[userTeamId] = { ...updatedTeams[userTeamId], sponsorWeeksRemaining: weeksLeft };
      }
    }

    // 3. EVOLUÇÃO POR TREINO (aplica o plano semanal definido pelo usuário) + ENERGIA/MORAL.
    // Parâmetros por intensidade: chance de evoluir atributo, variação de energia e de moral.
    const intensityParams: Record<typeof trainingPlan.intensity, { gainChance: number; energy: number; moral: number; allAttrs: number }> = {
      leve:     { gainChance: 0.05, energy: 15,  moral: 5,  allAttrs: 0 },
      normal:   { gainChance: 0.15, energy: -5,  moral: 0,  allAttrs: 0 },
      pesada:   { gainChance: 0.30, energy: -15, moral: -2, allAttrs: 0 },
      bootcamp: { gainChance: 0.40, energy: -10, moral: 3,  allAttrs: bootcampCost > 0 ? 1 : 0 },
    };
    const baseParams = intensityParams[trainingPlan.intensity];
    // Efeito do Coach (Fase D): escala a chance de evolução por nível (1 + level*0.05).
    const coachMultiplier = coachLevel > 0 ? 1 + coachLevel * 0.05 : 1;
    const params = { ...baseParams, gainChance: baseParams.gainChance * coachMultiplier };
    // Mapeia o foco escolhido para o atributo correspondente (aim e spray treinam mira)
    const focusAttr: keyof Player['attributes'] =
      trainingPlan.focus === 'gamesense' ? 'gamesense'
      : trainingPlan.focus === 'utility' ? 'utility'
      : trainingPlan.focus === 'clutch' ? 'clutch'
      : 'aim';

    const caixaNegativo = newBudget < 0;
    const updatedPlayers = { ...players };
    Object.values(players).forEach(p => {
      if (p.teamId !== userTeamId) return;

      if (p.status === 'titular') {
        const youthBonus = p.age <= 22 ? 1.6 : 1.0; // jovens evoluem mais (spec §15)
        // Constrói um novo objeto de atributos (sem mutar o do estado anterior)
        const updatedAttrs: Player['attributes'] = { ...p.attributes };
        (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
          const chance = (k === focusAttr ? params.gainChance * 2 : params.gainChance) * youthBonus;
          let gain = params.allAttrs; // bootcamp dá +1 base em todos os atributos
          if (Math.random() < chance) gain += 1;
          if (gain > 0) updatedAttrs[k] = Math.min(99, updatedAttrs[k] + gain);
        });

        // Físio (Fase D): recupera +2*level de energia/semana nos titulares.
        const physioBonus = physioLevel > 0 ? physioLevel * 2 : 0;
        const updatedEnergy = Math.max(0, Math.min(100, p.energy + params.energy + physioBonus));

        // Psicólogo (Fase D): recupera +3*level de moral/semana nos titulares.
        const psychologistBonus = psychologistLevel > 0 ? psychologistLevel * 3 : 0;
        let moralDelta = params.moral + psychologistBonus;
        if (caixaNegativo) moralDelta -= 4; // A4: crise financeira derruba a moral
        const updatedMoral = Math.max(0, Math.min(100, p.moral + moralDelta));

        const updatedOverall = Math.min(99, Math.round((updatedAttrs.aim + updatedAttrs.gamesense + updatedAttrs.clutch + updatedAttrs.utility + updatedAttrs.igl) / 5));

        updatedPlayers[p.id] = {
          ...p,
          attributes: updatedAttrs,
          energy: updatedEnergy,
          moral: updatedMoral,
          overall: updatedOverall,
        };
      } else if (p.status === 'reserva') {
        updatedPlayers[p.id] = {
          ...p,
          energy: Math.min(100, p.energy + 12), // reservas descansam
          moral: caixaNegativo ? Math.max(0, p.moral - 4) : p.moral,
        };
      }
    });

    // A4: notícia de pressão da diretoria quando o caixa fecha no vermelho
    const newsAfterWeek = caixaNegativo
      ? [...sponsorExpiryNews, {
          id: `fin_${currentSeason}_${currentWeek}`,
          title: `Diretoria do ${userTeam.name} cobra equilíbrio financeiro!`,
          content: `O caixa do ${userTeam.name} fechou a semana no vermelho ($${newBudget.toLocaleString()}). A diretoria pressiona por cortes e a moral do elenco caiu. Assine um patrocínio ou venda jogadores para reequilibrar as contas.`,
          category: 'general' as const,
          week: currentWeek,
          dateStr: `Semana ${currentWeek}`,
        }, ...historyNews]
      : [...sponsorExpiryNews, ...historyNews];

    // 4. SIMULAR PARTIDAS DE OUTRAS EQUIPES DE TORNEIOS DE FUNDO
    // (Simulações simplificadas para alimentar o ranking e notícias)

    // Avança a semana
    const nextWeek = currentWeek + 1;

    // ===== VIRADA DE TEMPORADA (spec §23) =====
    if (nextWeek > 48) {
      const nextSeason = currentSeason + 1;

      // 1. SNAPSHOT DOS CAMPEÕES — capturado ANTES de qualquer reset de torneio.
      const champions: SeasonChampionSnapshot[] = Object.values(tournaments)
        .filter(t => t.isFinished && t.championId && updatedTeams[t.championId])
        .map(t => {
          const champTeam = updatedTeams[t.championId as string];
          return {
            tournamentId: t.id,
            tournamentName: t.name,
            championId: champTeam.id,
            championName: champTeam.name,
            championTag: champTeam.tag,
            prizePool: t.prizePool,
            isUserChampion: champTeam.id === userTeamId,
          };
        });

      // 2. ENVELHECIMENTO + APOSENTADORIA + EVOLUÇÃO DE POTENCIAL.
      // Jovens (<=22) evoluem mais forte rumo ao potencial; veteranos podem se aposentar.
      Object.values(updatedPlayers).forEach(prev => {
        const newAge = prev.age + 1;

        // Aposentadoria por idade (obrigatória acima de 38, probabilística acima de 35)
        if (newAge > 38 || (newAge > 35 && Math.random() < 0.4)) {
          updatedPlayers[prev.id] = {
            ...prev,
            age: newAge,
            status: 'aposentado',
            teamId: 'free_agents',
          };
          return;
        }

        // Evolução de potencial: jovens evoluem mais (spec §15). Só evolui quem ainda
        // não atingiu o potencial e está ativo (titular/reserva).
        if ((prev.status === 'titular' || prev.status === 'reserva') && prev.overall < prev.potential) {
          const evolBoost = newAge <= 22 ? 2 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
          if (evolBoost > 0) {
            const updatedAttrs: Player['attributes'] = { ...prev.attributes };
            (['aim', 'gamesense', 'clutch', 'utility', 'igl'] as (keyof Player['attributes'])[]).forEach((k) => {
              if (Math.random() < (newAge <= 22 ? 0.6 : 0.3)) {
                updatedAttrs[k] = Math.min(99, updatedAttrs[k] + evolBoost);
              }
            });
            updatedPlayers[prev.id] = {
              ...prev,
              age: newAge,
              attributes: updatedAttrs,
              overall: Math.min(
                prev.potential,
                Math.round((updatedAttrs.aim + updatedAttrs.gamesense + updatedAttrs.clutch + updatedAttrs.utility + updatedAttrs.igl) / 5)
              ),
            };
            return;
          }
        }

        // Sem evolução nem aposentadoria: apenas envelhece (cópia imutável)
        updatedPlayers[prev.id] = { ...prev, age: newAge };
      });

      // 3. RESET DOS TORNEIOS — volta ao estado inicial mantendo os participantes.
      const competitionDefaults: Record<string, Tournament> = {};
      defaultCompetitions.forEach(c => { competitionDefaults[c.id] = c; });
      const resetTournaments: Record<string, Tournament> = {};
      Object.values(tournaments).forEach(t => {
        const baseline = competitionDefaults[t.id];
        const { championId: _champ, mvpPlayerId: _mvp, ...rest } = t;
        resetTournaments[t.id] = {
          ...rest,
          isFinished: false,
          currentRound: 0,
          weekScheduled: baseline ? baseline.weekScheduled : t.weekScheduled,
        };
      });

      // 4. NOTÍCIA DE FIM DE TEMPORADA com os campeões da temporada encerrada.
      const championsLine = champions.length > 0
        ? champions.map(c => `${c.tournamentName}: ${c.championName}`).join(' · ')
        : 'Nenhum torneio teve campeão definido nesta temporada.';
      const seasonEndNews: NewsItem = {
        id: `season_end_${currentSeason}`,
        title: `Temporada ${currentSeason} encerrada! Confira os campeões da temporada.`,
        content: `A Temporada ${currentSeason} chegou ao fim. ${championsLine}. Uma nova temporada começa agora — recalibre seu elenco, renove patrocínios e mire nos títulos da Temporada ${nextSeason}.`,
        category: 'results',
        week: currentWeek,
        dateStr: `Semana ${currentWeek}`,
      };

      // 5. SNAPSHOT DO RESUMO para a tela SeasonSummary (UI transiente).
      const seasonSummary: SeasonSummary = {
        season: currentSeason,
        champions,
        userStats: {
          wins: updatedTeams[userTeamId]?.stats.wins ?? 0,
          losses: updatedTeams[userTeamId]?.stats.losses ?? 0,
          titles: updatedTeams[userTeamId]?.stats.titles ?? 0,
        },
      };

      set({
        currentWeek: 1,
        currentSeason: nextSeason,
        teams: updatedTeams,
        players: updatedPlayers,
        tournaments: resetTournaments,
        financialHistory: newFinEntry,
        historyNews: [seasonEndNews, ...newsAfterWeek],
        seasonSummary,
        currentScreen: 'seasonSummary',
      });

      get().salvarJogo();
      return;
    }

    set({
      currentWeek: nextWeek,
      currentSeason,
      teams: updatedTeams,
      players: updatedPlayers,
      financialHistory: newFinEntry,
      historyNews: newsAfterWeek,
    });

    // Auto-save no avanço
    get().salvarJogo();
  },

  definirTitular: (playerId, status) => {
    const { players, userTeamId } = get();
    const updatedPlayers = { ...players };
    
    // Conta quantos titulares ativos o time do usuário tem
    const userTitulares = Object.values(updatedPlayers).filter(
      p => p.teamId === userTeamId && p.status === 'titular' && p.id !== playerId
    );

    if (status === 'titular' && userTitulares.length >= 5) {
      // Nega se já houver 5 titulares escalados
      return;
    }

    if (players[playerId]) {
      updatedPlayers[playerId] = { ...players[playerId], status };
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
  },

  definirPapelEspecial: (playerId, roleType) => {
    const { players } = get();
    const target = players[playerId];
    if (!target) {
      return;
    }

    const updatedPlayers = { ...players };

    // Remove a função antiga de outros titulares (cópia imutável de cada afetado)
    Object.values(players).forEach(p => {
      if (p.teamId === target.teamId && p.id !== playerId) {
        if ((roleType === 'IGL' && p.role === 'IGL') || (roleType === 'AWPer' && p.role === 'AWPer')) {
          updatedPlayers[p.id] = { ...p, role: 'Rifler' }; // Reseta para rifler padrão
        }
      }
    });

    updatedPlayers[playerId] = { ...target, role: roleType };

    set({ players: updatedPlayers });
    get().salvarJogo();
  },

  definirTaticas: (tactics) => {
    const { userTeamId, teams } = get();
    if (!teams[userTeamId]) return;
    // Atualização IMUTÁVEL do store (antes mutava o objeto direto e não persistia)
    const updatedTeams = {
      ...teams,
      [userTeamId]: { ...teams[userTeamId], tactics: { ...tactics } },
    };
    set({ teams: updatedTeams });
    get().salvarJogo();
  },

  definirTreinoSemanal: (intensity, focus) => {
    const { userTeamId, teams } = get();
    if (intensity === 'bootcamp' && (teams[userTeamId]?.budget ?? 0) < 50000) {
      return { success: false, message: 'Caixa insuficiente para bancar um Bootcamp ($50.000).' };
    }
    set({ trainingPlan: { intensity, focus } });
    get().salvarJogo();
    return { success: true, message: `Plano de treino (${intensity}) com foco em ${focus} definido para as próximas semanas.` };
  },

  fazerPropostaContratacao: (playerId) => {
    const { players, teams, userTeamId, currentWeek } = get();
    const player = players[playerId];
    const userTeam = teams[userTeamId];

    if (!player) return { success: false, message: 'Jogador não encontrado.' };
    if (player.teamId === userTeamId) return { success: false, message: 'Jogador já faz parte da sua equipe.' };

    // Luvas estimadas em 10% do valor do passe
    const signingBonus = Math.round(player.value * 0.1);
    const totalCost = player.value + signingBonus;

    // Regra Rígida de Saldo: Contrata se tiver Saldo >= Passe + Luvas
    if (userTeam.budget < totalCost) {
      return {
        success: false,
        message: `Saldo insuficiente! Você precisa de pelo menos $${totalCost.toLocaleString()} (Passe: $${player.value.toLocaleString()} + Luvas: $${signingBonus.toLocaleString()}).`
      };
    }

    const updatedTeams = { ...teams };
    const updatedPlayers = { ...players };

    // Atualiza saldos econômicos (cópia imutável do time do usuário)
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget - totalCost };

    // Se pertencer a um time real, paga o passe ao time vendedor
    const oldTeamId = player.teamId;
    let oldTeamName = 'Agente Livre';
    if (oldTeamId !== 'free_agents' && teams[oldTeamId]) {
      updatedTeams[oldTeamId] = { ...teams[oldTeamId], budget: teams[oldTeamId].budget + player.value };
      oldTeamName = teams[oldTeamId].name;
    }

    // Vincula jogador ao time do usuário
    updatedPlayers[playerId] = {
      ...player,
      teamId: userTeamId,
      status: 'reserva', // entra como reserva para o usuário escalar
      contractMonths: 18 // contrato inicial de 18 meses
    };

    // Gera notícia dinamicamente
    const news = generateTransferNews(player, oldTeamName, userTeam.name, currentWeek);

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contratação de ${player.nickname}`, amount: -totalCost }
      ]
    });

    get().salvarJogo();
    return { success: true, message: `Contratação de ${player.nickname} concluída com sucesso!` };
  },

  venderJogador: (playerId) => {
    const { players, teams, userTeamId, currentWeek } = get();
    const player = players[playerId];
    const userTeam = teams[userTeamId];

    if (!player || player.teamId !== userTeamId) {
      return { success: false, message: 'Jogador não faz parte da sua equipe.' };
    }

    // Regra: Não pode vender se o time ficar com menos de 5 jogadores totais
    const userTotalPlayers = Object.values(players).filter(p => p.teamId === userTeamId).length;
    if (userTotalPlayers <= 5) {
      return { success: false, message: 'Negado! Sua equipe precisa de no mínimo 5 jogadores no elenco.' };
    }

    const updatedTeams = { ...teams };
    const updatedPlayers = { ...players };

    // Adiciona o valor do passe ao orçamento do usuário (cópia imutável)
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget + player.value };

    // Remove jogador do time do usuário
    updatedPlayers[playerId] = {
      ...player,
      teamId: 'free_agents',
      status: 'free_agent',
      contractMonths: 0
    };

    set({
      teams: updatedTeams,
      players: updatedPlayers,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Venda de ${player.nickname}`, amount: player.value }
      ]
    });

    get().salvarJogo();
    return { success: true, message: `Vendido! ${player.nickname} foi colocado na lista de agentes livres e o valor de $${player.value.toLocaleString()} foi creditado no seu caixa.` };
  },

  renovarContrato: (playerId) => {
    const { players } = get();
    const updatedPlayers = { ...players };
    if (players[playerId]) {
      updatedPlayers[playerId] = { ...players[playerId], contractMonths: players[playerId].contractMonths + 12 }; // adiciona 1 ano
    }
    set({ players: updatedPlayers });
    get().salvarJogo();
    return { success: true, message: 'Contrato renovado por mais 12 meses!' };
  },

  dispensarJogador: (playerId) => {
    const { players, userTeamId } = get();
    const updatedPlayers = { ...players };

    const userTotalPlayers = Object.values(players).filter(p => p.teamId === userTeamId).length;
    if (userTotalPlayers <= 5) {
      return { success: false, message: 'Você precisa manter no mínimo 5 jogadores no elenco.' };
    }

    if (players[playerId]) {
      updatedPlayers[playerId] = {
        ...players[playerId],
        teamId: 'free_agents',
        status: 'free_agent',
        contractMonths: 0,
      };
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
    return { success: true, message: 'Jogador dispensado com sucesso.' };
  },

  assinarPatrocinio: (sponsorId) => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const sp = sponsors[sponsorId];
    if (!sp) return { success: false, message: 'Patrocinador não encontrado.' };

    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (userTeam.reputation < sp.minReputation) {
      return {
        success: false,
        message: `Negado! A ${sp.name} exige reputação mínima de ${sp.minReputation}. A reputação atual do seu time é ${userTeam.reputation}.`,
      };
    }

    if (userTeam.sponsorId && (userTeam.sponsorWeeksRemaining ?? 0) > 0) {
      const activeName = sponsors[userTeam.sponsorId]?.name ?? 'patrocinador atual';
      return {
        success: false,
        message: `Já existe um contrato ativo com ${activeName}. Rescinda o contrato atual ou aguarde sua expiração antes de assinar um novo.`,
      };
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, sponsorId, sponsorWeeksRemaining: sp.durationWeeks };

    set({
      teams: updatedTeams,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contrato assinado: ${sp.name}`, amount: 0 },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato assinado com a ${sp.name}! Receita semanal de $${sp.weeklyIncome.toLocaleString()} por ${sp.durationWeeks} semanas.`,
    };
  },

  rescindirPatrocinio: () => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (!userTeam.sponsorId || !sponsors[userTeam.sponsorId]) {
      return { success: false, message: 'Não há contrato de patrocínio ativo para rescindir.' };
    }

    const sp = sponsors[userTeam.sponsorId];
    const weeksRemaining = userTeam.sponsorWeeksRemaining ?? 0;
    const penalty = Math.max(0, Math.round(sp.weeklyIncome * weeksRemaining * 0.2));

    if (userTeam.budget < penalty) {
      return {
        success: false,
        message: `Saldo insuficiente para pagar a multa rescisória de $${penalty.toLocaleString()}.`,
      };
    }

    const updatedTeams = { ...teams };
    const { sponsorId: _sid, sponsorWeeksRemaining: _swr, ...teamWithoutSponsor } = userTeam;
    updatedTeams[userTeamId] = { ...teamWithoutSponsor, budget: userTeam.budget - penalty };

    const news: NewsItem = {
      id: `sponsor_rescind_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} rescinde contrato com ${sp.name}`,
      content: `O ${userTeam.name} rescindiu antecipadamente o contrato de patrocínio com a ${sp.name}, pagando uma multa rescisória de $${penalty.toLocaleString()}. A receita semanal foi encerrada.`,
      category: 'general',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Multa rescisória: ${sp.name}`, amount: -penalty },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato com a ${sp.name} rescindido. Multa de $${penalty.toLocaleString()} debitada do caixa.`,
    };
  },

  renegociarPatrocinio: () => {
    const { userTeamId, teams, sponsors, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (!userTeam.sponsorId || !sponsors[userTeam.sponsorId]) {
      return { success: false, message: 'Não há contrato de patrocínio ativo para renegociar.' };
    }

    const weeksRemaining = userTeam.sponsorWeeksRemaining ?? 0;
    if (weeksRemaining > 4) {
      return {
        success: false,
        message: `A renegociação só é permitida nas últimas 4 semanas do contrato. Restam ${weeksRemaining} semanas.`,
      };
    }

    const sp = sponsors[userTeam.sponsorId];
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, sponsorWeeksRemaining: sp.durationWeeks };

    const news: NewsItem = {
      id: `sponsor_renew_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} renova patrocínio com ${sp.name}`,
      content: `O ${userTeam.name} renovou o acordo de patrocínio com a ${sp.name} por mais ${sp.durationWeeks} semanas, mantendo a receita semanal de $${sp.weeklyIncome.toLocaleString()}.`,
      category: 'general',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contrato renegociado: ${sp.name}`, amount: 0 },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Contrato renovado por mais ${sp.durationWeeks} semanas com a ${sp.name}.`,
    };
  },

  // Mapeia cada role do Staff ao seu slot correspondente em Team.staff (DRY entre contratar/demitir)
  // (definido inline nas ações abaixo)

  contratarStaff: (staff) => {
    const { userTeamId, teams, staffList, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    const slotByRole: Record<Staff['role'], keyof Team['staff']> = {
      coach: 'coachId',
      analyst: 'analystId',
      psychologist: 'psychologistId',
      scout: 'scoutId',
      physio: 'physioId',
    };
    const slot = slotByRole[staff.role];

    // Custo de luvas de entrada = 4 semanas de salário
    const signingCost = staff.salary * 4;
    if (userTeam.budget < signingCost) {
      return {
        success: false,
        message: `Saldo insuficiente! A contratação de ${staff.name} custa $${signingCost.toLocaleString()} (4 semanas de salário).`,
      };
    }

    // Se já houver um membro no slot, devolve mensagem orientando a demissão primeiro
    if (userTeam.staff[slot]) {
      return {
        success: false,
        message: `Já existe um(a) ${staff.role} contratado(a). Demita o atual antes de contratar ${staff.name}.`,
      };
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: userTeam.budget - signingCost,
      staff: { ...userTeam.staff, [slot]: staff.id },
    };

    const updatedStaffList = { ...staffList, [staff.id]: staff };

    set({
      teams: updatedTeams,
      staffList: updatedStaffList,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Contratação: ${staff.name}`, amount: -signingCost },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `${staff.name} foi contratado(a) por $${signingCost.toLocaleString()} (salário semanal de $${staff.salary.toLocaleString()}).`,
    };
  },

  demitirStaff: (role) => {
    const { userTeamId, teams, staffList, currentWeek } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    const slotByRole: Record<Staff['role'], keyof Team['staff']> = {
      coach: 'coachId',
      analyst: 'analystId',
      psychologist: 'psychologistId',
      scout: 'scoutId',
      physio: 'physioId',
    };
    const slot = slotByRole[role];
    const staffId = userTeam.staff[slot];
    if (!staffId) {
      return { success: false, message: 'Nenhum membro contratado neste cargo.' };
    }

    const member = staffList[staffId];
    const severance = member ? member.salary * 2 : 0;
    if (userTeam.budget < severance) {
      return {
        success: false,
        message: `Saldo insuficiente para pagar a rescisão de $${severance.toLocaleString()}.`,
      };
    }

    // Remove o slot do staff de forma imutável
    const { [slot]: _removedSlot, ...staffWithoutRole } = userTeam.staff;
    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = {
      ...userTeam,
      budget: userTeam.budget - severance,
      staff: staffWithoutRole,
    };

    // Remove do staffList global
    const { [staffId]: _removedMember, ...staffListWithout } = staffList;

    set({
      teams: updatedTeams,
      staffList: staffListWithout,
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: `Rescisão: ${member ? member.name : 'Staff'}`, amount: -severance },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: member
        ? `${member.name} foi demitido(a). Rescisão de $${severance.toLocaleString()} debitada do caixa.`
        : 'Cargo de comissão técnica liberado.',
    };
  },

  // BASE / SCOUT (spec §18): investe na base para observar 1-2 jovens talentos.
  investirNaBase: () => {
    const { userTeamId, teams, currentWeek, youthProspects } = get();
    const userTeam = teams[userTeamId];
    if (!userTeam) return { success: false, message: 'Time do usuário não encontrado.' };

    if (userTeam.budget < INVESTIMENTO_BASE_CUSTO) {
      return {
        success: false,
        message: `Saldo insuficiente! O investimento na base custa $${INVESTIMENTO_BASE_CUSTO.toLocaleString()}.`,
      };
    }

    // Gera 1-2 jovens observados (não entram no elenco — ficam na lista de prospects)
    const quantidade = 1 + Math.floor(Math.random() * 2);
    const novosJovens: Player[] = [];
    for (let i = 0; i < quantidade; i++) {
      const jovem = generatePlayer({ isYouth: true });
      jovem.teamId = 'free_agents'; // ainda não pertence ao elenco
      jovem.status = 'free_agent';
      novosJovens.push(jovem);
    }

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId] = { ...userTeam, budget: userTeam.budget - INVESTIMENTO_BASE_CUSTO };

    const news: NewsItem = {
      id: `base_scout_${currentWeek}_${Date.now()}`,
      title: `${userTeam.name} investe na base e revela ${quantidade} jovem(ns) talento(s)`,
      content: `O departamento de scout do ${userTeam.name} mapeou ${quantidade} nova(s) promessa(s) após um novo aporte na infraestrutura da base. Avalie os jovens observados na Academia e promova quem merecer uma chance no elenco principal.`,
      category: 'base',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      teams: updatedTeams,
      youthProspects: [...youthProspects, ...novosJovens],
      historyNews: [news, ...get().historyNews],
      financialHistory: [
        ...get().financialHistory,
        { week: currentWeek, description: 'Investimento na Base', amount: -INVESTIMENTO_BASE_CUSTO },
      ],
    });
    get().salvarJogo();
    return {
      success: true,
      message: `Investimento concluído! ${quantidade} jovem(ns) talento(s) sendo observado(s) na base.`,
    };
  },

  // Promove um jovem observado ao elenco principal como reserva.
  promoverJovem: (playerId) => {
    const { userTeamId, players, youthProspects, currentWeek } = get();
    const jovem = youthProspects.find((p) => p.id === playerId);
    if (!jovem) {
      return { success: false, message: 'Jovem não encontrado na lista de observados.' };
    }

    // Teto de elenco: o time do usuário não pode passar de 12 jogadores (titulares + reservas).
    const elencoAtual = Object.values(players).filter(
      (p) => p.teamId === userTeamId && (p.status === 'titular' || p.status === 'reserva')
    ).length;
    if (elencoAtual >= 12) {
      return { success: false, message: 'Elenco cheio! O limite é de 12 jogadores (titulares + reservas). Dispense ou venda alguém antes de promover.' };
    }

    const promovido: Player = {
      ...jovem,
      teamId: userTeamId,
      status: 'reserva',
      contractMonths: 24, // contrato júnior padrão
    };

    const news: NewsItem = {
      id: `base_promote_${promovido.id}_${currentWeek}`,
      title: `${promovido.nickname} é promovido da base ao elenco do ${get().teams[userTeamId]?.name ?? ''}`,
      content: `A joia da base ${promovido.nickname} (${promovido.age} anos, overall ${promovido.overall}, potencial ${promovido.potential}) assinou seu primeiro contrato profissional e foi integrado(a) ao elenco como reserva. Os olheiros enxergam um futuro promissor.`,
      category: 'base',
      week: currentWeek,
      dateStr: `Semana ${currentWeek}`,
    };

    set({
      players: { ...players, [promovido.id]: promovido },
      youthProspects: youthProspects.filter((p) => p.id !== playerId),
      historyNews: [news, ...get().historyNews],
    });
    get().salvarJogo();
    return { success: true, message: `${promovido.nickname} foi promovido(a) ao elenco como reserva!` };
  },

  // Edição (editor) de jogador — atualização imutável aplicando o patch parcial.
  editarJogador: (playerId, patch) => {
    const { players } = get();
    const existing = players[playerId];
    if (!existing) return;
    set({ players: { ...players, [playerId]: { ...existing, ...patch } } });
    get().salvarJogo();
  },

  setScreen: (screen) => set({ currentScreen: screen }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  // Toasts in-app: estado UI transiente (não persistido no save). Atualização imutável via spread.
  addToast: (message, type = 'info') => {
    const toast: Toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setSelectedTeamId: (id) => set({ selectedTeamId: id }),
  setActiveTournamentId: (id) => set({ activeTournamentId: id }),

  iniciarPartidaAtiva: (match) => {
    set({
      activeMatch: match,
      activeMatchRoundIndex: 0,
      isSimulatingMatch: true,
      currentScreen: 'matchSim'
    });
  },

  // Gera uma partida contra um adversário e abre o pré-jogo.
  // Centraliza a criação do confronto para que Dashboard e simulação usem a MESMA partida.
  iniciarPartidaContra: (opponentId, competitionId = 'amistoso') => {
    const { userTeamId, teams, players } = get();
    const userTeam = teams[userTeamId];
    const oppTeam = teams[opponentId];
    if (!userTeam || !oppTeam) return;

    const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
    const oppSquad = Object.values(players).filter(p => p.teamId === opponentId && p.status === 'titular');
    const mapSelected = realMaps.find(m => m.status === 'active') ?? realMaps[0];

    // Efeito do Analista (Fase D): bônus de veto aplicado ao time do usuário (teamA).
    const analystId = userTeam.staff.analystId;
    const userAnalystLevel = analystId ? get().staffList[analystId]?.level ?? 0 : 0;

    const match = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapSelected, competitionId, { a: userAnalystLevel });
    set({ activeMatch: match, currentScreen: 'matchPreview', activeMatchRoundIndex: 0, isSimulatingMatch: false });
  },

  // Do pré-jogo: assiste a partida round a round (ativa os controles de simulação visual).
  assistirPartida: () => {
    if (!get().activeMatch) return;
    set({ isSimulatingMatch: true, currentScreen: 'matchSim', activeMatchRoundIndex: 0 });
  },

  avancarRoundVisual: () => {
    const { activeMatch, activeMatchRoundIndex } = get();
    if (!activeMatch) return false;

    const nextIndex = activeMatchRoundIndex + 1;
    if (nextIndex >= activeMatch.rounds.length) {
      // Chegou ao último round: encerra a simulação visual (o usuário então vê o resultado)
      set({ isSimulatingMatch: false });
      return false;
    }

    set({ activeMatchRoundIndex: nextIndex });
    return true;
  },

  finalizarPartidaAtiva: () => {
    const { activeMatch, userTeamId, teams, currentWeek, tournaments } = get();
    if (!activeMatch) return;

    // Atualiza pontuações de vitórias/derrotas nos rankings e campeonatos
    const userTeam = teams[userTeamId];
    const isUserWinner = activeMatch.winnerId === userTeamId;

    const updatedTeams = { ...teams };
    if (isUserWinner) {
      // Premiação base por vitória + bônus do patrocinador (entradas separadas no extrato)
      const basePrize = 5000;
      const activeSponsor = userTeam.sponsorId ? get().sponsors[userTeam.sponsorId] : undefined;
      const winBonus = activeSponsor ? activeSponsor.winBonus : 0;

      // Cópia imutável do time do usuário (inclusive stats aninhado)
      updatedTeams[userTeamId] = {
        ...userTeam,
        points: userTeam.points + 50, // bônus de ranking
        budget: userTeam.budget + basePrize + winBonus,
        stats: { ...userTeam.stats, wins: userTeam.stats.wins + 1 },
      };

      const winEntries = [
        { week: currentWeek, description: 'Premiação por Vitória', amount: basePrize },
      ];
      if (activeSponsor && winBonus > 0) {
        winEntries.push({ week: currentWeek, description: `Bônus de Vitória: ${activeSponsor.name}`, amount: winBonus });
      }

      set({
        financialHistory: [
          ...get().financialHistory,
          ...winEntries,
        ]
      });
    } else {
      updatedTeams[userTeamId] = {
        ...userTeam,
        points: Math.max(10, userTeam.points - 20),
        stats: { ...userTeam.stats, losses: userTeam.stats.losses + 1 },
      };
    }

    // Registra notícia sobre a partida
    const winnerTeam = activeMatch.winnerId === userTeamId ? userTeam : teams[activeMatch.teamAId === userTeamId ? activeMatch.teamBId : activeMatch.teamAId];
    const loserTeam = activeMatch.winnerId === userTeamId ? teams[activeMatch.teamAId === userTeamId ? activeMatch.teamBId : activeMatch.teamAId] : userTeam;
    
    const wScore = activeMatch.winnerId === activeMatch.teamAId ? activeMatch.scoreA : activeMatch.scoreB;
    const lScore = activeMatch.winnerId === activeMatch.teamAId ? activeMatch.scoreB : activeMatch.scoreA;

    const mvpPlayer = get().players[activeMatch.mvpPlayerId ?? ''] ?? Object.values(get().players)[0];
    const mapObj = realMaps.find(m => m.id === activeMatch.mapId) ?? realMaps[0];

    const news = generateMatchNews(winnerTeam, loserTeam, wScore, lScore, mvpPlayer, mapObj.name, currentWeek);

    // Progresso de campeonato — bracket por rodadas (A5). Partidas amistosas (competitionId
    // 'amistoso') não têm torneio associado e não entram aqui.
    const updatedTournaments = { ...tournaments };
    const tourney = updatedTournaments[activeMatch.competitionId];
    let championNews: NewsItem | null = null;
    if (tourney && !tourney.isFinished) {
      const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, tourney.teamIds.length))));
      const updatedT: Tournament = { ...tourney };
      if (isUserWinner) {
        updatedT.currentRound = tourney.currentRound + 1;
        if (updatedT.currentRound >= totalRounds) {
          // CAMPEÃO: encerra o torneio, paga a premiação e contabiliza o título
          updatedT.isFinished = true;
          updatedT.championId = userTeamId;

          // Bônus de título do patrocinador, quando houver contrato ativo
          const titleSponsor = userTeam.sponsorId ? get().sponsors[userTeam.sponsorId] : undefined;
          const titleBonus = titleSponsor && titleSponsor.titleBonus > 0 ? titleSponsor.titleBonus : 0;

          // Cópia imutável a partir do estado já atualizado pela vitória (stats aninhado incluso)
          const champTeam = updatedTeams[userTeamId];
          updatedTeams[userTeamId] = {
            ...champTeam,
            budget: champTeam.budget + tourney.prizePool + titleBonus,
            points: champTeam.points + 150,
            stats: { ...champTeam.stats, titles: champTeam.stats.titles + 1 },
          };

          const titleEntries = [
            { week: currentWeek, description: `Premiação: Campeão do ${tourney.name}`, amount: tourney.prizePool },
          ];
          if (titleSponsor && titleBonus > 0) {
            titleEntries.push({ week: currentWeek, description: `Bônus de Título: ${titleSponsor.name}`, amount: titleBonus });
          }

          set({
            financialHistory: [
              ...get().financialHistory,
              ...titleEntries,
            ]
          });
          championNews = {
            id: `champ_${tourney.id}_${currentWeek}`,
            title: `${userTeam.name} é CAMPEÃO do ${tourney.name}!`,
            content: `Em uma campanha de tirar o fôlego, o ${userTeam.name} conquistou o título do ${tourney.name} e faturou $${tourney.prizePool.toLocaleString()} em premiação. A torcida faz a festa!`,
            category: 'results',
            week: currentWeek,
            dateStr: `Semana ${currentWeek}`,
          };
        } else {
          // Avança de fase: a próxima rodada ocorre na semana seguinte
          updatedT.weekScheduled = currentWeek + 1;
        }
      } else {
        // Eliminado do campeonato
        updatedT.isFinished = true;
      }
      updatedTournaments[activeMatch.competitionId] = updatedT;
    }

    set({
      teams: updatedTeams,
      tournaments: updatedTournaments,
      finishedMatch: activeMatch, // Preserva a partida para a tela de resultado (MVP, stats)
      activeMatch: null,
      isSimulatingMatch: false,
      currentScreen: 'matchResult',
      historyNews: championNews ? [championNews, news, ...get().historyNews] : [news, ...get().historyNews]
    });

    get().salvarJogo();
  },

  fecharResultado: () => {
    // Encerra a tela de resultado e retorna ao painel principal
    set({
      finishedMatch: null,
      activeMatch: null,
      isSimulatingMatch: false,
      activeMatchRoundIndex: 0,
      currentScreen: 'dashboard'
    });
  },

  iniciarProximaTemporada: () => {
    // Fecha o resumo de fim de temporada e retorna ao painel para iniciar a nova temporada
    set({ seasonSummary: null, currentScreen: 'dashboard' });
    get().salvarJogo();
  },

  salvarJogo: (slot = 'prostrike_save') => {
    const {
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects
    } = get();

    const saveObj: SaveGame = {
      id: slot,
      saveName: `Carreira ${managerName} - Ano ${currentSeason} (Semana ${currentWeek})`,
      createdAt: new Date().toISOString(),
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects
    };

    localStorage.setItem(slot, JSON.stringify(saveObj));
  },

  carregarJogo: (slot = 'prostrike_save') => {
    const saveStr = localStorage.getItem(slot);
    if (!saveStr) return false;

    try {
      const saveObj = JSON.parse(saveStr) as SaveGame;
      set({
        managerName: saveObj.managerName,
        managerNationality: saveObj.managerNationality,
        currentWeek: saveObj.currentWeek,
        currentSeason: saveObj.currentSeason,
        userTeamId: saveObj.userTeamId,
        difficulty: saveObj.difficulty ?? 'normal',
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: saveObj.tournaments,
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
        trainingPlan: saveObj.trainingPlan ?? { intensity: 'normal', focus: 'aim' },
        youthProspects: saveObj.youthProspects ?? [],
        currentScreen: 'dashboard',
        gameLoaded: true
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  exportarSave: () => {
    const {
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects
    } = get();

    const saveObj: SaveGame = {
      id: 'export',
      saveName: `Exportado - ${managerName}`,
      createdAt: new Date().toISOString(),
      managerName,
      managerNationality,
      currentWeek,
      currentSeason,
      userTeamId,
      difficulty,
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory,
      trainingPlan,
      youthProspects
    };

    return btoa(JSON.stringify(saveObj));
  },

  importarSave: (jsonStr) => {
    try {
      const decoded = atob(jsonStr);
      const saveObj = JSON.parse(decoded) as SaveGame;
      set({
        managerName: saveObj.managerName,
        managerNationality: saveObj.managerNationality,
        currentWeek: saveObj.currentWeek,
        currentSeason: saveObj.currentSeason,
        userTeamId: saveObj.userTeamId,
        difficulty: saveObj.difficulty ?? 'normal',
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: saveObj.tournaments,
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
        trainingPlan: saveObj.trainingPlan ?? { intensity: 'normal', focus: 'aim' },
        youthProspects: saveObj.youthProspects ?? [],
        currentScreen: 'dashboard',
        gameLoaded: true
      });
      get().salvarJogo();
      return true;
    } catch (e) {
      return false;
    }
  },

  excluirSave: (slot = 'prostrike_save') => {
    localStorage.removeItem(slot);
  },

  resetarDadosEditor: () => {
    // Remove apenas o save principal (antes apagava TODOS os dados do localStorage do site)
    localStorage.removeItem('prostrike_save');
    window.location.reload();
  }
}));

