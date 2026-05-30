import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Calendar, Wallet, Award, FastForward, Play } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentWeek, currentSeason, userTeamId, teams, avancarSemana, setScreen } = useGameStore();
  const userTeam = teams[userTeamId];

  if (!userTeam) return null;

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
      </div>

      {/* SEÇÃO DA DIREITA: AÇÕES DE CARREIRA */}
      <div className="flex items-center gap-4">
        {/* BOTÃO JOGAR PRÓXIMA PARTIDA */}
        <button
          onClick={() => avancarSemana()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple hover:scale-102 hover:shadow-lg hover:shadow-brand-cyan/20 active:scale-98 transition-all duration-300 text-brand-dark"
        >
          <Play className="w-4.5 h-4.5 fill-brand-dark" />
          <span>Jogar Partida / Avançar</span>
        </button>

        {/* BOTÃO AVANÇAR SEMANA RÁPIDO */}
        <button
          onClick={() => avancarSemana()}
          title="Avança um ciclo de semana na carreira"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border border-brand-border bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white transition-all duration-300"
        >
          <FastForward className="w-4.5 h-4.5" />
          <span>Apenas Avançar</span>
        </button>
      </div>
    </header>
  );
};
