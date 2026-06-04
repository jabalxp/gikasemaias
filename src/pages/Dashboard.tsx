import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Newspaper, Trophy, Play, Users, Sliders, DollarSign, Dumbbell, Target, FastForward, ShieldAlert } from 'lucide-react';
import { Team, Tournament } from '../types';
import { TeamCrest } from '../components/ui/TeamCrest';

/** Nome legível de cada tier (espelha o comentário em types/index.ts). */
const TIER_NAMES: Readonly<Record<Team['tier'], string>> = {
  1: 'Elite Mundial',
  2: 'Challenger',
  3: 'Semi-Pro',
  4: 'Amador'
} as const;

/** Formata a premiação de forma compacta (ex.: $1.2M, $250K). Espelha Calendar.tsx. */
function formatPrize(prizePool: number): string {
  if (prizePool >= 1_000_000) return `$${(prizePool / 1_000_000).toFixed(1)}M`;
  if (prizePool >= 1_000) return `$${Math.round(prizePool / 1_000)}K`;
  return `$${prizePool}`;
}

/**
 * Deriva um rótulo de fase do bracket a partir do nº de times restantes na rodada atual.
 * teamIds começa com N participantes; a cada rodada o bracket "halva". Se não casar com um
 * estágio nomeado conhecido, cai no genérico "Rodada X".
 */
function describeRound(teamCount: number, currentRound: number): string {
  const remaining = Math.max(2, Math.round(teamCount / Math.pow(2, currentRound)));
  const stageByRemaining: Readonly<Record<number, string>> = {
    2: 'Grande Final',
    4: 'Semifinal',
    8: 'Quartas de Final',
    16: 'Oitavas de Final'
  };
  return stageByRemaining[remaining] ?? `Rodada ${currentRound + 1}`;
}

/** Objetivo da temporada derivado do tier atual do time do usuário. */
function describeSeasonGoal(tier: Team['tier']): { title: string; detail: string; isSurvival: boolean } {
  if (tier === 1) {
    return {
      title: 'Defender o topo e evitar o rebaixamento',
      detail: `Você está no Tier 1 (${TIER_NAMES[1]}), o teto da pirâmide — não há divisão acima. Vença um Major para cimentar o legado e evite campanhas fracas, que abrem brecha para o rebaixamento ao Tier 2.`,
      isSurvival: true
    };
  }
  if (tier === 4) {
    return {
      title: `Subir do Tier 4 (${TIER_NAMES[4]})`,
      detail: `Conquiste um título do Tier 4 ou feche a temporada com saldo positivo de vitórias para ser promovido ao Tier 3 (${TIER_NAMES[3]}).`,
      isSurvival: false
    };
  }
  return {
    title: `Subir do Tier ${tier} para o Tier ${tier - 1} (${TIER_NAMES[(tier - 1) as Team['tier']]})`,
    detail: `Vença um torneio do Tier ${tier} (${TIER_NAMES[tier]}) ou termine a temporada com saldo de vitórias sólido para ser promovido — e evite o rebaixamento ao Tier ${tier + 1}.`,
    isSurvival: false
  };
}

export const Dashboard: React.FC = () => {
  const {
    managerName,
    userTeamId,
    teams,
    players,
    tournaments,
    historyNews,
    currentWeek,
    setScreen,
    avancarSemana,
    avancarAtePartida,
    iniciarPartidaContra,
    addToast,
    invitations,
    isFixedTeam,
    encerrarTemporada,
    obterProximoAdversario
  } = useGameStore();

  const userTeam = teams[userTeamId];

  if (!userTeam) {
    return (
      <div className="flex items-center justify-center h-64 text-sm font-semibold text-slate-400">
        Carregando carreira…
      </div>
    );
  }

  // PRÓXIMO CONFRONTO DE TORNEIO REAL: torneio não-finalizado em que o usuário está inscrito,
  // agendado para esta semana ou semanas futuras, com a MENOR weekScheduled. (Espelha o critério
  // de "próximo evento" do Calendar e a seleção de adversário de `avancarSemana`.)
  const nextTournament: Tournament | undefined = Object.values(tournaments)
    .filter(t => !t.isFinished && t.teamIds.includes(userTeamId) && t.weekScheduled >= currentWeek && !t.userEliminated)
    .sort((a, b) => a.weekScheduled - b.weekScheduled)[0];

  // Adversário da rodada: mesma fórmula unificada da store (CHAMP-03: SEEDING REAL)
  // que garante 100% de consistência entre o Dashboard e o simulador de partidas.
  const nextOpponent: Team | undefined = nextTournament
    ? obterProximoAdversario(nextTournament.id)
    : undefined;

  const isMatchThisWeek = nextTournament?.weekScheduled === currentWeek;
  const weeksUntilMatch = nextTournament ? nextTournament.weekScheduled - currentWeek : 0;

  // Odds fictícias baseadas nos overalls (só quando há adversário definido).
  const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
  const oppSquad = nextOpponent
    ? Object.values(players).filter(p => p.teamId === nextOpponent.id && p.status === 'titular')
    : [];
  const avgUserOverall = userSquad.length > 0 ? Math.round(userSquad.reduce((acc, p) => acc + p.overall, 0) / userSquad.length) : 70;
  const avgOppOverall = oppSquad.length > 0 ? Math.round(oppSquad.reduce((acc, p) => acc + p.overall, 0) / oppSquad.length) : 70;
  const userProb = Math.round((avgUserOverall / (avgUserOverall + avgOppOverall)) * 100);
  const oppProb = 100 - userProb;

  const seasonGoal = describeSeasonGoal(userTeam.tier);

  // Handler do botão principal: dispara/avança rumo ao confronto de torneio que importa.
  const handlePrimaryAction = (): void => {
    if (userSquad.length < 5) {
      addToast('⚠️ Escalação Incompleta! Redirecionando para a página de Elenco para escalar seus 5 titulares.', 'error');
      setScreen('squad');
      return;
    }
    if (!nextTournament) return;
    if (isMatchThisWeek) {
      avancarSemana(); // já abre o matchPreview do torneio (mesmo caminho do tick semanal)
      return;
    }
    addToast(`Avançando ${weeksUntilMatch} semana(s) até ${nextTournament.name}…`, 'info');
    avancarAtePartida();
  };

  // Pega as últimas 3 notícias
  const recentNews = historyNews.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* BOAS-VINDAS E INTRODUÇÃO */}
      <div className="flex justify-between items-center bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-brand-border glow-cyan">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">PAINEL DO MANAGER</h2>
          <p className="text-xs font-semibold text-brand-cyan uppercase tracking-widest text-neon-cyan mt-1">
            Manager ativo: {managerName} • Semana {currentWeek}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Orçamento Operacional</p>
          <span className={`text-xl font-black ${userTeam.budget < 0 ? 'text-brand-danger' : 'text-brand-cyan text-neon-cyan'}`}>
            ${userTeam.budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* GRID DO MEIO: PRÓXIMO CONFRONTO E NOTÍCIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BLOCO: PRÓXIMA PARTIDA DE TORNEIO (real, com pontos/prêmio/progressão) */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col justify-between h-80 lg:col-span-1">
          {nextTournament ? (
            <>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-brand-purple" />
                  <span>Próxima Partida</span>
                </h3>

                {/* CONTEXTO DO TORNEIO */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-brand-cyan truncate">{nextTournament.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Tier {nextTournament.tier} • {describeRound(nextTournament.teamIds.length, nextTournament.currentRound)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-brand-success">{formatPrize(nextTournament.prizePool)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isMatchThisWeek ? 'Esta semana' : `em ${weeksUntilMatch} sem.`}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <div className="text-center w-24">
                    <TeamCrest team={userTeam} size={44} className="mx-auto" />
                    <p className="text-[10px] font-extrabold text-white mt-1.5 truncate">{userTeam.name}</p>
                  </div>

                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">VS</span>

                  <div className="text-center w-24">
                    {nextOpponent ? (
                      <>
                        <TeamCrest team={nextOpponent} size={44} className="mx-auto" />
                        <p className="text-[10px] font-extrabold text-white mt-1.5 truncate">{nextOpponent.name}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-slate-500 mx-auto border border-brand-border bg-zinc-950">
                          ?
                        </div>
                        <p className="text-[10px] font-extrabold text-slate-500 mt-1.5">A definir</p>
                      </>
                    )}
                  </div>
                </div>

                {/* AVISO CRÍTICO DE ESCALAÇÃO INCOMPLETA */}
                {userSquad.length < 5 && (
                  <div className="mt-4 p-3 rounded-xl border border-brand-danger/30 bg-brand-danger/5 text-[10px] text-brand-danger font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-brand-danger animate-pulse" />
                    <span>⚠️ Elenco Incompleto! Escale 5 titulares na aba de Elenco para disputar partidas.</span>
                  </div>
                )}

                {/* ODDS (só quando há adversário definido) */}
                {nextOpponent && userSquad.length >= 5 && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Vitória {userTeam.tag}: {userProb}%</span>
                      <span>Vitória {nextOpponent.tag}: {oppProb}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-brand-cyan h-full" style={{ width: `${userProb}%` }} />
                      <div className="bg-brand-purple h-full flex-1" />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handlePrimaryAction}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                  userSquad.length < 5
                    ? 'bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/30 hover:scale-102 active:scale-98'
                    : 'bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 hover:shadow-md hover:shadow-brand-cyan/20 active:scale-98'
                }`}
              >
                {userSquad.length < 5 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-brand-danger animate-pulse" />
                    <span>⚠️ CORRIGIR ESCALAÇÃO (ELENCO)</span>
                  </>
                ) : isMatchThisWeek ? (
                  <>
                    <Play className="w-4 h-4 fill-brand-dark" />
                    <span>DISPUTAR PARTIDA AGORA</span>
                  </>
                ) : (
                  <>
                    <FastForward className="w-4 h-4 fill-brand-dark" />
                    <span>AVANÇAR ATÉ A PARTIDA ({weeksUntilMatch} SEM.)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            // SEM torneio agendado: todos os torneios disputados terminaram. Oferece o botão para virada de temporada!
            <>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-brand-purple" />
                  <span>Temporada Finalizada</span>
                </h3>
                <div className="text-center text-xs font-bold text-slate-300 py-6 px-3 bg-zinc-950/60 rounded-xl border border-brand-border/40">
                  🎉 Seus campeonatos desta temporada acabaram! Agora simule as partidas restantes do ano e encerre a temporada.
                </div>
              </div>
              <button
                onClick={() => {
                  addToast("Simulando rodadas finais e gerando estatísticas de virada...", "success");
                  encerrarTemporada();
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-brand-purple to-brand-cyan text-white hover:scale-102 hover:shadow-lg hover:shadow-brand-purple/20 active:scale-98 transition-all duration-300 animate-pulse"
              >
                <Trophy className="w-4 h-4 fill-white" />
                <span>⚡ ENCERRAR TEMPORADA</span>
              </button>
            </>
          )}
        </div>

        {/* BLOCO: FEED DE NOTÍCIAS COMPACTADO */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl h-80 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-brand-cyan" />
              <span>Notícias de e-Sports</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {recentNews.length > 0 ? (
                recentNews.map((news) => (
                  <div key={news.id} className="p-2.5 bg-zinc-950 border border-brand-border hover:border-brand-cyan/35 rounded-xl transition-all duration-200 cursor-pointer">
                    <h4 className="text-[10px] font-bold text-white flex justify-between gap-1">
                      <span className="truncate">{news.title}</span>
                      <span className="text-[8px] text-slate-500 shrink-0 uppercase tracking-wider">{news.dateStr}</span>
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium leading-relaxed truncate">
                      {news.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs font-semibold text-slate-600 py-10">
                  Nenhuma notícia recente no feed.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOVO BLOCO: CONVITES & PRESTÍGIO DO CLUBE */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl h-80 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-brand-cyan" />
              <span>Convites & Prestígio</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {isFixedTeam && (
                <div className="p-3 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-brand-purple/10 flex items-start gap-2.5">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <h4 className="text-[10px] font-black text-yellow-400 tracking-wider uppercase">Organização Fixed Slot</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed font-semibold">
                      Sua excelente reputação mundial (Reputação 80+) garante sua vaga definitiva em todos os torneios do circuito Elite!
                    </p>
                  </div>
                </div>
              )}

              {invitations && invitations.length > 0 ? (
                invitations.map((inv, idx) => (
                  <div key={idx} className="p-2.5 bg-zinc-950 border border-brand-border hover:border-brand-cyan/35 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-white truncate">{inv.tournamentName}</h4>
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                        Tier {inv.tier}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                      Motivo: {inv.reason === 'champion' ? 'Conquistado por Título 🏆' : inv.reason === 'fixed_slot' ? 'Vaga Fixa da Organização 🛡️' : 'Convidado por Reputação ⭐'}
                    </p>
                  </div>
                ))
              ) : (
                !isFixedTeam && (
                  <div className="text-center text-[10px] font-bold text-slate-500 py-10 px-2 leading-relaxed">
                    Nenhum convite pendente.<br />Vença torneios do seu tier para ser convidado para as grandes ligas na próxima temporada!
                  </div>
                )
              )}
            </div>
          </div>
        </div>

      </div>

      {/* BLOCO: OBJETIVO DA TEMPORADA (derivado do tier atual) */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-wrap items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${seasonGoal.isSurvival ? 'bg-brand-danger/15' : 'bg-brand-purple/15'}`}>
          {seasonGoal.isSurvival
            ? <ShieldAlert className="w-6 h-6 text-brand-danger" />
            : <Target className="w-6 h-6 text-brand-purple" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Objetivo da Temporada</p>
          <p className="text-base font-black text-white">{seasonGoal.title}</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">{seasonGoal.detail}</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-brand-purple/50 text-brand-purple shrink-0">
          Tier {userTeam.tier} • {TIER_NAMES[userTeam.tier]}
        </span>
      </div>

      {/* BLOCO: ATALHOS RÁPIDOS */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setScreen('squad')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-cyan/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Users className="w-6 h-6 text-brand-cyan mb-2" />
            <span className="text-xs font-bold text-white">Escalação / Elenco</span>
          </button>

          <button
            onClick={() => setScreen('tactics')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-purple/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Sliders className="w-6 h-6 text-brand-purple mb-2" />
            <span className="text-xs font-bold text-white">Táticas de Jogo</span>
          </button>

          <button
            onClick={() => setScreen('training')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-success/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Dumbbell className="w-6 h-6 text-brand-success mb-2" />
            <span className="text-xs font-bold text-white">Treino Semanal</span>
          </button>

          <button
            onClick={() => setScreen('market')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-warning/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Sliders className="w-6 h-6 text-brand-warning mb-2" />
            <span className="text-xs font-bold text-white">Mercado de Passes</span>
          </button>

          <button
            onClick={() => setScreen('finances')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-info/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <DollarSign className="w-6 h-6 text-brand-info mb-2" />
            <span className="text-xs font-bold text-white">Sponsor & Caixa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
