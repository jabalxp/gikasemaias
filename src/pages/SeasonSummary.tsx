import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Crown, Calendar, ArrowRight, Star, Mail, Award, CheckCircle } from 'lucide-react';
import { SeasonChampionSnapshot, UserTournamentResult, TournamentInvitation } from '../types';

/**
 * Tela de FIM DE TEMPORADA (spec §23): exibida automaticamente na virada de ano.
 * Lê o snapshot `seasonSummary` capturado ANTES do reset dos torneios e mostra:
 * título da temporada encerrada, campeões dos torneios, e o desempenho do time do usuário.
 * O botão "Iniciar Próxima Temporada" chama `iniciarProximaTemporada` (volta ao dashboard).
 */
export const SeasonSummary: React.FC = () => {
  const { seasonSummary, currentSeason, iniciarProximaTemporada, players, userTeamId } = useGameStore();

  if (!seasonSummary) return null;

  const { season, champions, userStats, tournamentResults, invitationsGenerated } = seasonSummary;

  // Filtra e ordena os jogadores do elenco do usuário por rating
  const userPlayers = Object.values(players)
    .filter(p => p.teamId === userTeamId && (p.status === 'titular' || p.status === 'reserva'))
    .sort((a, b) => b.stats.rating - a.stats.rating)
    .slice(0, 5);

  const ChampionCard: React.FC<{ champion: SeasonChampionSnapshot }> = ({ champion }) => (
    <div
      className={`bg-brand-card border rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:scale-102 ${
        champion.isUserChampion 
          ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/5 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.07)]' 
          : 'border-brand-border hover:border-brand-cyan/30'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          champion.isUserChampion ? 'bg-yellow-500/15' : 'bg-zinc-900 border border-brand-border/40'
        }`}
      >
        <Crown className={`w-5 h-5 ${champion.isUserChampion ? 'text-yellow-400' : 'text-slate-500'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
          {champion.tournamentName}
        </p>
        <p className="text-sm font-black text-white truncate mt-0.5">
          {champion.championName} <span className="text-xs text-slate-600 font-bold">[{champion.championTag}]</span>
        </p>
        <p className="text-[10px] font-bold text-brand-success mt-0.5">
          Prêmio: ${champion.prizePool.toLocaleString()}
        </p>
      </div>
      {champion.isUserChampion && (
        <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/35 shrink-0">
          Você! 🏆
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-brand-border">
      {/* HERO HEADER */}
      <div className="text-center rounded-2xl p-8 border border-brand-purple/30 bg-gradient-to-b from-brand-purple/10 via-zinc-950/40 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(112,0,255,0.05)_0%,transparent_70%)] pointer-events-none" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-cyan flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 animate-bounce" /> Fim de Temporada Realizado
        </span>
        <h1 className="text-4xl font-black mt-3 bg-gradient-to-r from-brand-cyan via-brand-purple to-pink-500 bg-clip-text text-transparent uppercase tracking-wider">
          Resumo da Temporada {season}
        </h1>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-2">
          A engrenagem do e-Sports girou! Preparando o circuito para a Temporada {currentSeason}
        </p>
      </div>

      {/* GRID COM DOIS BLOCOS DE DESTAQUE: CAMPEÕES DO ANO E ESTATÍSTICAS DO CLUBE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOCO 1: CAMPEÕES DA TEMPORADA */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-400" /> Campeões da Temporada
          </h2>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {champions.length > 0 ? (
              champions.map(c => (
                <ChampionCard key={c.tournamentId} champion={c} />
              ))
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center text-xs font-bold text-slate-500">
                Nenhum torneio foi concluído nesta temporada.
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 2: CONVITES PARA A PRÓXIMA TEMPORADA */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-brand-cyan" /> Convites & Slots Conquistados
          </h2>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {invitationsGenerated && invitationsGenerated.length > 0 ? (
              invitationsGenerated.map((inv, idx) => (
                <div 
                  key={idx} 
                  className="bg-brand-card border border-brand-cyan/25 bg-gradient-to-r from-brand-cyan/5 to-transparent rounded-2xl p-4 flex items-center gap-4 hover:border-brand-cyan/40 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/25 flex items-center justify-center shrink-0 text-brand-cyan">
                    ✉️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-white truncate">{inv.tournamentName}</p>
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                        Tier {inv.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                      Razão: {inv.reason === 'champion' ? 'Conquistado por Título na Divisão Inferior! 🏆' : inv.reason === 'fixed_slot' ? 'Vaga Fixa Permanente da Organização! 🛡️' : 'Classificação por Reputação de Prestígio! ⭐'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center text-xs font-bold text-slate-500">
                Nenhum convite especial gerado. Continue disputando os campeonatos no seu tier!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SEÇÃO 3: DESEMPENHO EM CAMPEONATOS DA TEMPORADA E TOP JOGADORES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1 & 2: HISTÓRICO DE TORNEIOS DISPUTADOS */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-success" /> Campanhas da Temporada
          </h2>
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-brand-border/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4">Campeonato</th>
                  <th className="p-4 text-center">Colocação</th>
                  <th className="p-4 text-center">Vitórias</th>
                  <th className="p-4 text-center">Derrotas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20 text-xs font-bold text-slate-300">
                {tournamentResults && tournamentResults.length > 0 ? (
                  tournamentResults.map((res, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4 flex flex-col">
                        <span className="text-white font-extrabold">{res.tournamentName}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Tier {res.tier}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                          res.placement.includes('Campeão') 
                            ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' 
                            : 'bg-zinc-900 text-slate-400 border border-brand-border/40'
                        }`}>
                          {res.placement}
                        </span>
                      </td>
                      <td className="p-4 text-center text-brand-success font-black text-sm">{res.wins}</td>
                      <td className="p-4 text-center text-brand-danger font-black text-sm">{res.losses}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold">
                      Nenhum campeonato oficial disputado nesta temporada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA 3: RATING DE DESEMPENHO DOS JOGADORES (TOP 5) */}
        <div className="space-y-3 lg:col-span-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-warning" /> Top Players do Elenco
          </h2>
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-3">
            {userPlayers.length > 0 ? (
              userPlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3 p-2 bg-zinc-950/60 rounded-xl border border-brand-border/30 hover:border-brand-cyan/20 transition-all duration-200">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center font-black text-xs text-slate-400 border border-brand-border/40">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-extrabold text-white truncate">{player.nickname}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{player.role}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-brand-cyan" />
                    <span className="text-xs font-black text-brand-cyan text-neon-cyan">
                      {player.stats.rating.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs font-bold text-slate-500 py-10">
                Nenhum jogador titular/reserva no elenco.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* HISTÓRICO DE CARREIRA ACUMULADO */}
      <div className="bg-brand-card border border-brand-border/40 rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-center">
          Histórico da Carreira de Manager (Acumulado)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-950 border border-brand-border/50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-brand-success">{userStats.wins}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Vitórias</p>
          </div>
          <div className="bg-zinc-950 border border-brand-border/50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-brand-danger">{userStats.losses}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Derrotas</p>
          </div>
          <div className="bg-zinc-950 border border-brand-border/50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">{userStats.titles}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Títulos 🏆</p>
          </div>
        </div>
      </div>

      {/* BOTÃO INICIAR PRÓXIMA TEMPORADA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => iniciarProximaTemporada()}
          className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 hover:shadow-lg hover:shadow-brand-cyan/20 active:scale-98 transition-all duration-300 uppercase tracking-wider"
        >
          <span>Iniciar Próxima Temporada ({currentSeason})</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
