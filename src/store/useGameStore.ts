import { create } from 'zustand';
import { Match, Player, SaveGame, Sponsor, Staff, Team, Tournament, GameMap } from '../types';
import { realPlayers } from '../game/data/realPlayers';
import { realTeams } from '../game/data/realTeams';
import { realMaps } from '../game/data/realMaps';
import { defaultSponsors } from '../game/data/defaultSponsors';
import { defaultCompetitions } from '../game/data/defaultCompetitions';
import { generatePlayer } from '../game/generators/playerGenerator';
import { generateMatchNews, generateTransferNews } from '../game/generators/newsGenerator';
import { simulateMapVeto } from '../game/simulation/mapVetoSimulator';
import { simulateWholeMatchQuick } from '../game/simulation/matchSimulator';

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

  // Estados locais UI / Sessão
  currentScreen: string;
  selectedPlayerId: string | null;
  selectedTeamId: string | null;
  activeTournamentId: string | null;
  activeMatch: Match | null;
  activeMatchRoundIndex: number;
  isSimulatingMatch: boolean;
  gameLoaded: boolean;

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
  fazerPropostaContratacao: (playerId: string) => { success: boolean; message: string };
  venderJogador: (playerId: string) => { success: boolean; message: string };
  renovarContrato: (playerId: string) => { success: boolean; message: string };
  dispensarJogador: (playerId: string) => { success: boolean; message: string };
  assinarPatrocinio: (sponsorId: string) => void;
  contratarStaff: (staff: Staff) => void;
  demitirStaff: (role: Staff['role']) => void;
  setScreen: (screen: string) => void;
  setSelectedPlayerId: (id: string | null) => void;
  setSelectedTeamId: (id: string | null) => void;
  setActiveTournamentId: (id: string | null) => void;
  
  // Ações de Partida
  iniciarPartidaAtiva: (match: Match) => void;
  avancarRoundVisual: () => boolean; // Avança o round visual na simulação interativa
  finalizarPartidaAtiva: () => void;
  simularPartidaRapida: (matchId: string) => void;

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

  currentScreen: 'home',
  selectedPlayerId: null,
  selectedTeamId: null,
  activeTournamentId: null,
  activeMatch: null,
  activeMatchRoundIndex: 0,
  isSimulatingMatch: false,
  gameLoaded: false,

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
      currentScreen: 'dashboard',
      gameLoaded: true,
    });

    get().salvarJogo();
  },

  avancarSemana: () => {
    const { currentWeek, userTeamId, teams, players, tournaments, historyNews, financialHistory, currentSeason } = get();

    // 1. Verifica se há partida pendente jogável do usuário nesta semana
    const activeTournamentsThisWeek = Object.values(tournaments).filter(
      t => t.weekScheduled === currentWeek && !t.isFinished && t.teamIds.includes(userTeamId)
    );

    // Se o usuário tem campeonato rolando nessa semana e não jogou a partida dele ainda,
    // devemos simular ou forçar a jogabilidade na tela.
    // Para simplificar: se houver jogo agendado, ele será disputado.
    // Caso não queira travar, rodaremos a simulação de fundo da partida dele.
    let userHasMatchThisWeek = false;
    let matchToPlay: Match | null = null;
    let tournamentTarget: Tournament | null = null;

    activeTournamentsThisWeek.forEach(t => {
      // Procura se tem algum confronto dele nesse torneio
      // No MVP, as rodadas de playoff ou chaveamento ocorrem sequencialmente.
      // Se ainda não simulamos a rodada do time do usuário:
      const userPlayed = t.matches.some(m => m.roundName === `Rodada ${t.currentRound}` && m.matchId); // placeholder
      if (!userPlayed) {
        userHasMatchThisWeek = true;
        tournamentTarget = t;
      }
    });

    if (userHasMatchThisWeek && tournamentTarget) {
      // Procura adversário
      const oppId = (tournamentTarget as Tournament).teamIds.find((id: string) => id !== userTeamId) ?? 'furia';
      const userTeam = teams[userTeamId];
      const oppTeam = teams[oppId];

      const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
      const oppSquad = Object.values(players).filter(p => p.teamId === oppId && p.status === 'titular');
      
      const mapSelected = realMaps.find(m => m.status === 'active') ?? realMaps[0];

      // Gera partida
      const match = simulateWholeMatchQuick(userTeam, oppTeam, userSquad, oppSquad, mapSelected, (tournamentTarget as Tournament).id);
      
      // Abre a tela de pré-jogo e partida
      set({ activeMatch: match, currentScreen: 'matchPreview', activeMatchRoundIndex: 0 });
      return;
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

    // Despesa de salários de jogadores ativos e staff
    const userPlayers = Object.values(players).filter(p => p.teamId === userTeamId);
    userPlayers.forEach(p => {
      expense += p.salary;
    });

    // Despesa do Staff
    const staffSalary = 2000; // Custo estimado fixo de staff ativo
    if (userTeam.staff.coachId) expense += staffSalary;
    if (userTeam.staff.analystId) expense += staffSalary;
    if (userTeam.staff.psychologistId) expense += staffSalary;

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
      { week: currentWeek, description: 'Patrocínio Semanal', amount: income },
      { week: currentWeek, description: 'Folha Salarial de Jogadores e Staff', amount: -expense }
    ];

    // 3. EVOLUÇÃO DE TREINO E RECUPERAÇÃO DE ENERGIA/CANSAÇO
    const updatedPlayers = { ...players };
    Object.values(updatedPlayers).forEach(p => {
      if (p.teamId === userTeamId && p.status === 'titular') {
        // Buff de atributos com base no treino
        // Treino médio: mira +0.2, cansaço aumenta um pouco, moral sobe se vencer
        const aimGain = Math.random() < 0.15 ? 1 : 0;
        const gsGain = Math.random() < 0.15 ? 1 : 0;
        p.attributes.aim = Math.min(99, p.attributes.aim + aimGain);
        p.attributes.gamesense = Math.min(99, p.attributes.gamesense + gsGain);
        
        // Cansaço regenera se for reserva, consome se for titular
        p.energy = Math.max(50, p.energy - (Math.random() * 6 + 2));
        p.overall = Math.round((p.attributes.aim + p.attributes.gamesense + p.attributes.clutch + p.attributes.utility + p.attributes.igl) / 5);
      } else if (p.teamId === userTeamId && p.status === 'reserva') {
        p.energy = Math.min(100, p.energy + 10);
      }
    });

    // 4. SIMULAR PARTIDAS DE OUTRAS EQUIPES DE TORNEIOS DE FUNDO
    // (Simulações simplificadas para alimentar o ranking e notícias)

    // Avança a semana
    const nextWeek = currentWeek + 1;
    let nextSeason = currentSeason;
    let finalWeek = nextWeek;

    if (nextWeek > 48) {
      finalWeek = 1;
      nextSeason = currentSeason + 1;
      // Envelhecer jogadores na virada do ano
      Object.values(updatedPlayers).forEach(p => {
        p.age++;
        if (p.age > 35 && Math.random() < 0.4) {
          p.status = 'aposentado';
          p.teamId = 'free_agents';
        }
      });
    }

    set({
      currentWeek: finalWeek,
      currentSeason: nextSeason,
      teams: updatedTeams,
      players: updatedPlayers,
      financialHistory: newFinEntry,
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

    if (updatedPlayers[playerId]) {
      updatedPlayers[playerId].status = status;
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
  },

  definirPapelEspecial: (playerId, roleType) => {
    const { players } = get();
    const updatedPlayers = { ...players };
    
    if (updatedPlayers[playerId]) {
      // Remove a função antiga de outros titulares
      Object.values(updatedPlayers).forEach(p => {
        if (p.teamId === updatedPlayers[playerId].teamId && p.id !== playerId) {
          if (roleType === 'IGL' && p.role === 'IGL') {
            p.role = 'Rifler'; // Reseta para rifler padrão
          } else if (roleType === 'AWPer' && p.role === 'AWPer') {
            p.role = 'Rifler';
          }
        }
      });

      updatedPlayers[playerId].role = roleType;
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
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

    // Atualiza saldos econômicos
    updatedTeams[userTeamId].budget -= totalCost;
    
    // Se pertencer a um time real, paga o passe ao time vendedor
    const oldTeamId = player.teamId;
    let oldTeamName = 'Agente Livre';
    if (oldTeamId !== 'free_agents' && updatedTeams[oldTeamId]) {
      updatedTeams[oldTeamId].budget += player.value;
      oldTeamName = updatedTeams[oldTeamId].name;
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

    // Adiciona o valor do passe ao orçamento do usuário
    updatedTeams[userTeamId].budget += player.value;

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
    if (updatedPlayers[playerId]) {
      updatedPlayers[playerId].contractMonths += 12; // adiciona 1 ano
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

    if (updatedPlayers[playerId]) {
      updatedPlayers[playerId].teamId = 'free_agents';
      updatedPlayers[playerId].status = 'free_agent';
      updatedPlayers[playerId].contractMonths = 0;
    }

    set({ players: updatedPlayers });
    get().salvarJogo();
    return { success: true, message: 'Jogador dispensado com sucesso.' };
  },

  assinarPatrocinio: (sponsorId) => {
    const { userTeamId, teams, sponsors } = get();
    const sp = sponsors[sponsorId];
    if (!sp) return;

    const updatedTeams = { ...teams };
    updatedTeams[userTeamId].sponsorId = sponsorId;
    updatedTeams[userTeamId].sponsorWeeksRemaining = sp.durationWeeks;

    set({ teams: updatedTeams });
    get().salvarJogo();
  },

  contratarStaff: (staff) => {
    const { userTeamId, teams } = get();
    const updatedTeams = { ...teams };
    const t = updatedTeams[userTeamId];
    
    if (staff.role === 'coach') t.staff.coachId = staff.id;
    else if (staff.role === 'analyst') t.staff.analystId = staff.id;
    else if (staff.role === 'psychologist') t.staff.psychologistId = staff.id;
    else if (staff.role === 'scout') t.staff.scoutId = staff.id;
    else if (staff.role === 'physio') t.staff.physioId = staff.id;

    set({ teams: updatedTeams });
    get().salvarJogo();
  },

  demitirStaff: (role) => {
    const { userTeamId, teams } = get();
    const updatedTeams = { ...teams };
    const t = updatedTeams[userTeamId];

    if (role === 'coach') delete t.staff.coachId;
    else if (role === 'analyst') delete t.staff.analystId;
    else if (role === 'psychologist') delete t.staff.psychologistId;
    else if (role === 'scout') delete t.staff.scoutId;
    else if (role === 'physio') delete t.staff.physioId;

    set({ teams: updatedTeams });
    get().salvarJogo();
  },

  setScreen: (screen) => set({ currentScreen: screen }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),
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

  avancarRoundVisual: () => {
    const { activeMatch, activeMatchRoundIndex } = get();
    if (!activeMatch) return false;

    const nextIndex = activeMatchRoundIndex + 1;
    if (nextIndex >= activeMatch.rounds.length) {
      // Fim da partida
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
      updatedTeams[userTeamId].stats.wins++;
      updatedTeams[userTeamId].points += 50; // bônus de ranking
      // Paga premiação e bônus de patrocínio
      let prize = 5000; // estimativa por vitória comum
      if (userTeam.sponsorId && get().sponsors[userTeam.sponsorId]) {
        prize += get().sponsors[userTeam.sponsorId].winBonus;
      }
      updatedTeams[userTeamId].budget += prize;

      set({
        financialHistory: [
          ...get().financialHistory,
          { week: currentWeek, description: 'Bônus por Vitória em Partida', amount: prize }
        ]
      });
    } else {
      updatedTeams[userTeamId].stats.losses++;
      updatedTeams[userTeamId].points = Math.max(10, updatedTeams[userTeamId].points - 20);
    }

    // Registra notícia sobre a partida
    const winnerTeam = activeMatch.winnerId === userTeamId ? userTeam : teams[activeMatch.teamAId === userTeamId ? activeMatch.teamBId : activeMatch.teamAId];
    const loserTeam = activeMatch.winnerId === userTeamId ? teams[activeMatch.teamAId === userTeamId ? activeMatch.teamBId : activeMatch.teamAId] : userTeam;
    
    const wScore = activeMatch.winnerId === activeMatch.teamAId ? activeMatch.scoreA : activeMatch.scoreB;
    const lScore = activeMatch.winnerId === activeMatch.teamAId ? activeMatch.scoreB : activeMatch.scoreA;

    const mvpPlayer = get().players[activeMatch.mvpPlayerId ?? ''] ?? Object.values(get().players)[0];
    const mapObj = realMaps.find(m => m.id === activeMatch.mapId) ?? realMaps[0];

    const news = generateMatchNews(winnerTeam, loserTeam, wScore, lScore, mvpPlayer, mapObj.name, currentWeek);

    // Marca campeonato associado como jogado
    const updatedTournaments = { ...tournaments };
    if (updatedTournaments[activeMatch.competitionId]) {
      updatedTournaments[activeMatch.competitionId].isFinished = true;
    }

    set({
      teams: updatedTeams,
      tournaments: updatedTournaments,
      activeMatch: null,
      currentScreen: 'matchResult',
      historyNews: [news, ...get().historyNews]
    });

    get().salvarJogo();
  },

  simularPartidaRapida: (matchId) => {
    // Roda direto sem feedback de visualização
    // (Não implementado no MVP mas pronto para integração)
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
      financialHistory
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
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory
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
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: saveObj.tournaments,
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
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
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory
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
      teams,
      players,
      maps,
      sponsors,
      staffList,
      tournaments,
      historyNews,
      financialHistory
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
        teams: saveObj.teams,
        players: saveObj.players,
        maps: saveObj.maps,
        sponsors: saveObj.sponsors,
        staffList: saveObj.staffList,
        tournaments: saveObj.tournaments,
        historyNews: saveObj.historyNews,
        financialHistory: saveObj.financialHistory,
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
    // Reseta todo o estado para o padrão
    localStorage.clear();
    window.location.reload();
  }
}));

