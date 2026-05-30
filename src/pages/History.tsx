import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Crown, Calendar, History as HistoryIcon, Medal } from 'lucide-react';
import { SeasonHistoryEntry } from '../types';

/**
 * Tela de HISTÓRICO & TÍTULOS (Histórico & Títulos):
 * - Sala de troféus do time do usuário (todos os títulos conquistados ao longo das temporadas).
 * - Lista de temporadas passadas com seus respectivos campeões.
 * Lê `historicoTemporadas` (registro permanente, persistido no SaveGame), preenchido na
 * virada de temporada de `avancarSemana`.
 */
export const History: React.FC = () => {
  const { historicoTemporadas, userTeamId, teams } = useGameStore();
  const userTeam = teams[userTeamId];

  // Temporadas em ordem decrescente (mais recente primeiro) sem mutar o estado.
  const seasons: readonly SeasonHistoryEntry[] = [...historicoTemporadas].sort(
    (a, b) => b.season - a.season
  );

  // Sala de troféus: todos os títulos do time do usuário, achatados das temporadas.
  const userTrophies = seasons.flatMap(season =>
    season.champions
      .filter(c => c.championId === userTeamId)
      .map(c => ({ season: season.season, tournamentName: c.tournamentName }))
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-brand-cyan" />
          <span>Histórico &amp; Títulos</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          A sala de troféus da {userTeam?.name ?? 'sua organização'} e o registro de todos os
          campeões das temporadas encerradas.
        </p>
      </div>

      {/* SALA DE TROFÉUS DO USUÁRIO */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-brand-warning" /> Sala de Troféus
          <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-warning/15 text-brand-warning text-[10px] font-black">
            {userTrophies.length}
          </span>
        </h3>
        {userTrophies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userTrophies.map((trophy, idx) => (
              <div
                key={`${trophy.season}-${trophy.tournamentName}-${idx}`}
                className="bg-brand-card border border-brand-warning/40 glow-cyan rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-warning/15 flex items-center justify-center shrink-0">
                  <Medal className="w-6 h-6 text-brand-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Temporada {trophy.season}
                  </p>
                  <p className="text-sm font-black text-white truncate">{trophy.tournamentName}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center text-sm font-semibold text-slate-500">
            Nenhum título conquistado ainda. Vença um torneio para preencher sua sala de troféus.
          </div>
        )}
      </div>

      {/* TEMPORADAS PASSADAS */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-purple" /> Temporadas Passadas
        </h3>
        {seasons.length > 0 ? (
          <div className="space-y-4">
            {seasons.map(season => (
              <div
                key={season.season}
                className="bg-brand-card border border-brand-border rounded-2xl p-5"
              >
                {/* CABEÇALHO DA TEMPORADA */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border">
                  <h4 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">
                      Temporada {season.season}
                    </span>
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                    <span className="px-2.5 py-1 rounded-lg bg-brand-success/10 text-brand-success">
                      {season.userWins} V
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-brand-danger/10 text-brand-danger">
                      {season.userLosses} D
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-brand-warning/10 text-brand-warning flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {season.userTitles}
                    </span>
                  </div>
                </div>

                {/* CAMPEÕES DA TEMPORADA */}
                {season.champions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {season.champions.map(champion => {
                      const isUserChampion = champion.championId === userTeamId;
                      return (
                        <div
                          key={champion.tournamentId}
                          className={`rounded-xl p-3 flex items-center gap-3 border ${
                            isUserChampion
                              ? 'border-brand-warning/50 bg-brand-warning/5'
                              : 'border-brand-border bg-zinc-900/40'
                          }`}
                        >
                          <Crown
                            className={`w-5 h-5 shrink-0 ${
                              isUserChampion ? 'text-brand-warning' : 'text-slate-500'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                              {champion.tournamentName}
                            </p>
                            <p className="text-sm font-bold text-white truncate">
                              {champion.championName}{' '}
                              <span className="text-slate-600">[{champion.championTag}]</span>
                            </p>
                          </div>
                          {isUserChampion && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-warning shrink-0">
                              Você!
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-500">
                    Nenhum torneio teve campeão definido nesta temporada.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center text-sm font-semibold text-slate-500">
            Nenhuma temporada encerrada ainda. Avance pelas semanas até a virada de temporada para
            registrar o histórico.
          </div>
        )}
      </div>
    </div>
  );
};
