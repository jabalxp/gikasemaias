import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Crown, Calendar, ArrowRight } from 'lucide-react';
import { SeasonChampionSnapshot } from '../types';

/**
 * Tela de FIM DE TEMPORADA (spec §23): exibida automaticamente na virada de ano.
 * Lê o snapshot `seasonSummary` capturado ANTES do reset dos torneios e mostra:
 * título da temporada encerrada, campeões dos torneios, e o desempenho do time do usuário.
 * O botão "Iniciar Próxima Temporada" chama `iniciarProximaTemporada` (volta ao dashboard).
 */
export const SeasonSummary: React.FC = () => {
  const { seasonSummary, currentSeason, iniciarProximaTemporada } = useGameStore();

  if (!seasonSummary) return null;

  const { season, champions, userStats } = seasonSummary;

  const ChampionCard: React.FC<{ champion: SeasonChampionSnapshot }> = ({ champion }) => (
    <div
      className={`bg-brand-card border rounded-2xl p-4 flex items-center gap-4 ${
        champion.isUserChampion ? 'border-brand-warning/50 glow-cyan' : 'border-brand-border'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          champion.isUserChampion ? 'bg-brand-warning/15' : 'bg-zinc-900'
        }`}
      >
        <Crown className={`w-6 h-6 ${champion.isUserChampion ? 'text-brand-warning' : 'text-slate-500'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
          {champion.tournamentName}
        </p>
        <p className="text-base font-black text-white truncate">
          {champion.championName} <span className="text-slate-600">[{champion.championTag}]</span>
        </p>
        <p className="text-[11px] font-bold text-brand-success">
          ${champion.prizePool.toLocaleString()}
        </p>
      </div>
      {champion.isUserChampion && (
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-warning shrink-0">
          Você!
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-brand-border">
      {/* HERO HEADER */}
      <div className="text-center rounded-2xl p-8 border border-brand-purple/40 bg-gradient-to-b from-brand-purple/10 to-transparent">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-cyan flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" /> Fim de Temporada
        </span>
        <h1 className="text-4xl font-black mt-3 bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent uppercase tracking-wider">
          Temporada {season} Encerrada
        </h1>
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-2">
          Os torneios foram reiniciados para a Temporada {currentSeason}
        </p>
      </div>

      {/* CAMPEÕES DOS TORNEIOS */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-brand-warning" /> Campeões da Temporada
        </h2>
        {champions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {champions.map(c => (
              <ChampionCard key={c.tournamentId} champion={c} />
            ))}
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center text-sm font-semibold text-slate-500">
            Nenhum torneio teve campeão definido nesta temporada.
          </div>
        )}
      </div>

      {/* DESEMPENHO DO USUÁRIO */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Histórico da Carreira (acumulado)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-brand-card border border-brand-success/30 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-brand-success">{userStats.wins}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Vitórias</p>
          </div>
          <div className="bg-brand-card border border-brand-danger/30 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-brand-danger">{userStats.losses}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Derrotas</p>
          </div>
          <div className="bg-brand-card border border-brand-warning/30 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-brand-warning">{userStats.titles}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Títulos</p>
          </div>
        </div>
      </div>

      {/* BOTÃO INICIAR PRÓXIMA TEMPORADA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => iniciarProximaTemporada()}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 active:scale-98 transition-all duration-300 uppercase tracking-wider"
        >
          <span>Iniciar Próxima Temporada</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
