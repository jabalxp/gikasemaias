import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Calendar, Wallet, Award, Trophy } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentWeek, currentSeason, userTeamId, teams } = useGameStore();
  const userTeam = teams[userTeamId];

  if (!userTeam) return null;

  /** Nome legível de cada tier. */
  const tierLabel: Record<1 | 2 | 3 | 4, string> = { 1: 'Elite', 2: 'Challenger', 3: 'Semi-Pro', 4: 'Amador' };

  return (
    <header className="bg-brand-card border-b border-brand-border px-8 py-4 flex items-center justify-between sticky top-0 z-30 glow-purple">
      {/* SEÇÃO DA ESQUERDA: ESTATÍSTICAS VITAIS */}
      <div className="flex items-center gap-8">
        {/* CALENDÁRIO */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-brand-border">
            <Calendar className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Calendário</p>
            <p className="text-sm font-bold text-white">Temporada {currentSeason} <span className="text-brand-purple">•</span> Sem {currentWeek}</p>
          </div>
        </div>

        {/* ORÇAMENTO / CAIXA */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-brand-border">
            <Wallet className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest font-sans">Caixa / Saldo</p>
            <p className={`text-sm font-bold ${userTeam.budget < 0 ? 'text-brand-danger' : 'text-brand-cyan text-neon-cyan'}`}>
              ${userTeam.budget.toLocaleString()}
            </p>
          </div>
        </div>

        {/* REPUTAÇÃO DO TIME */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-brand-border">
            <Award className="w-5 h-5 text-brand-success" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Reputação</p>
            <p className="text-sm font-bold text-white">{userTeam.reputation}/100</p>
          </div>
        </div>

        {/* TIER DO TIME */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-brand-border">
            <Trophy className="w-5 h-5 text-brand-warning" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Divisão</p>
            <p className="text-sm font-bold text-white">Tier {userTeam.tier} <span className="text-slate-500">•</span> <span className="text-brand-warning">{tierLabel[userTeam.tier]}</span></p>
          </div>
        </div>
      </div>
    </header>
  );
};
