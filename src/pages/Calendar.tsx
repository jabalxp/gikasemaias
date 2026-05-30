import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { CalendarDays, Trophy, Star, DollarSign, MapPin } from 'lucide-react';
import { Tournament } from '../types';

/** Total de semanas por temporada (espelha o limite usado em `avancarSemana`). */
const WEEKS_PER_SEASON = 48;

/** Cor de borda/destaque por tier do torneio, reutilizando tokens de design. */
const TIER_ACCENT: Readonly<Record<Tournament['tier'], string>> = {
  1: 'border-brand-cyan/50 text-brand-cyan',
  2: 'border-brand-purple/50 text-brand-purple',
  3: 'border-brand-success/40 text-brand-success',
  4: 'border-brand-border text-slate-400'
} as const;

/** Formata a premiação de forma compacta (ex.: $1.2M, $250K). */
function formatPrize(prizePool: number): string {
  if (prizePool >= 1_000_000) return `$${(prizePool / 1_000_000).toFixed(1)}M`;
  if (prizePool >= 1_000) return `$${Math.round(prizePool / 1_000)}K`;
  return `$${prizePool}`;
}

/**
 * Tela de CALENDÁRIO (read-only):
 * Linha do tempo das semanas (1..48) da temporada atual, destacando a semana
 * corrente, os torneios agendados em cada semana e quais deles o time do
 * usuário participa. Lê apenas `currentWeek`, `currentSeason` e `tournaments`.
 */
export const Calendar: React.FC = () => {
  const { tournaments, currentWeek, currentSeason, userTeamId } = useGameStore();

  // Indexa torneios por semana agendada (O(n)), apenas os ainda não finalizados.
  const tournamentsByWeek = new Map<number, Tournament[]>();
  for (const tournament of Object.values(tournaments)) {
    if (tournament.isFinished) continue;
    const list = tournamentsByWeek.get(tournament.weekScheduled) ?? [];
    list.push(tournament);
    tournamentsByWeek.set(tournament.weekScheduled, list);
  }

  // Próximo evento do usuário: torneio futuro/atual mais próximo do qual participa.
  const userTournaments = Object.values(tournaments)
    .filter(t => !t.isFinished && t.teamIds.includes(userTeamId) && t.weekScheduled >= currentWeek)
    .sort((a, b) => a.weekScheduled - b.weekScheduled);
  const nextEvent = userTournaments[0];

  const weeks = Array.from({ length: WEEKS_PER_SEASON }, (_, idx) => idx + 1);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-cyan" />
          <span>Calendário da Temporada {currentSeason}</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Linha do tempo das {WEEKS_PER_SEASON} semanas da temporada. Torneios destacados em
          ciano indicam que a sua organização está inscrita.
        </p>
      </div>

      {/* PRÓXIMO EVENTO DO USUÁRIO */}
      {nextEvent ? (
        <div className="bg-brand-card border border-brand-cyan/40 glow-cyan rounded-2xl p-5 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-cyan/15 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-brand-cyan" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Próximo Evento
            </p>
            <p className="text-base font-black text-white truncate">{nextEvent.name}</p>
            <p className="text-xs font-semibold text-slate-400">
              Semana {nextEvent.weekScheduled}
              {nextEvent.weekScheduled === currentWeek
                ? ' (esta semana)'
                : ` (em ${nextEvent.weekScheduled - currentWeek} semana(s))`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${TIER_ACCENT[nextEvent.tier]}`}>
              Tier {nextEvent.tier}
            </span>
            <span className="text-sm font-black text-brand-success flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {formatPrize(nextEvent.prizePool)}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center text-sm font-semibold text-slate-500">
          Sua organização não tem torneios agendados no restante desta temporada.
        </div>
      )}

      {/* LINHA DO TEMPO DE SEMANAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {weeks.map(week => {
          const isCurrent = week === currentWeek;
          const isPast = week < currentWeek;
          const weekTournaments = tournamentsByWeek.get(week) ?? [];

          return (
            <div
              key={week}
              className={`rounded-2xl p-4 border transition-colors flex flex-col gap-3 ${
                isCurrent
                  ? 'border-brand-cyan glow-cyan bg-brand-cyan/5'
                  : isPast
                    ? 'border-brand-border bg-zinc-900/30 opacity-60'
                    : 'border-brand-border bg-brand-card'
              }`}
            >
              {/* CABEÇALHO DA SEMANA */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase tracking-widest ${isCurrent ? 'text-brand-cyan' : 'text-slate-400'}`}>
                  Semana {week}
                </span>
                {isCurrent && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark bg-brand-cyan px-2 py-0.5 rounded">
                    Agora
                  </span>
                )}
                {isPast && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                    Concluída
                  </span>
                )}
              </div>

              {/* TORNEIOS DA SEMANA */}
              {weekTournaments.length > 0 ? (
                <div className="space-y-2">
                  {weekTournaments.map(tournament => {
                    const isUserIn = tournament.teamIds.includes(userTeamId);
                    return (
                      <div
                        key={tournament.id}
                        className={`rounded-xl p-2.5 border ${
                          isUserIn ? 'border-brand-cyan/50 bg-brand-cyan/5' : 'border-brand-border bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-black truncate ${isUserIn ? 'text-brand-cyan' : 'text-white'}`}>
                            {tournament.name}
                          </p>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${TIER_ACCENT[tournament.tier]}`}>
                            T{tournament.tier}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] font-bold text-brand-success flex items-center gap-0.5">
                            <Trophy className="w-3 h-3" />
                            {formatPrize(tournament.prizePool)}
                          </span>
                          {isUserIn && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-cyan flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> Inscrito
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-slate-600 italic">
                  Sem torneios agendados.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
