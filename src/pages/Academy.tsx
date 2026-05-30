import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { GraduationCap, Sparkles, TrendingUp, Wallet, UserPlus, Target, Brain } from 'lucide-react';
import type { Player } from '../types';

// Custo de cada investimento na base — espelha INVESTIMENTO_BASE_CUSTO do store.
const INVESTIMENTO_BASE_CUSTO = 30000;

export const Academy: React.FC = () => {
  const { userTeamId, teams, youthProspects, investirNaBase, promoverJovem, addToast } = useGameStore();
  const userTeam = teams[userTeamId];

  if (!userTeam) return null;

  const canInvest = userTeam.budget >= INVESTIMENTO_BASE_CUSTO;

  const handleInvestir = (): void => {
    const result = investirNaBase();
    addToast(result.message, result.success ? 'success' : 'error');
  };

  const handlePromover = (id: string): void => {
    const result = promoverJovem(id);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  const renderProspectCard = (p: Player): React.ReactElement => (
    <div
      key={p.id}
      className="p-4 bg-zinc-950 border border-brand-border rounded-xl flex flex-col justify-between hover:border-brand-purple/30 transition-all duration-300"
    >
      <div>
        {/* HEADER */}
        <div className="flex justify-between items-start mb-2.5">
          <div className="overflow-hidden">
            <p className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
              <span>{p.nickname}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]">
              {p.name} • {p.age} anos • {p.nationality}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-black text-brand-cyan border border-brand-cyan/35 px-1.5 py-0.5 rounded bg-brand-cyan/5 text-neon-cyan">
              OVR {p.overall}
            </span>
          </div>
        </div>

        {/* ROLE + POTENCIAL */}
        <div className="flex items-center justify-between mb-3 text-[10px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">{p.role}</span>
          <span className="flex items-center gap-1 text-brand-warning">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>POT {p.potential}</span>
          </span>
        </div>

        {/* ATRIBUTOS PARCIAIS */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-400 bg-zinc-900/50 p-2 rounded-lg border border-brand-border/40 mb-3.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-brand-cyan" />
            <span>Mira: {p.attributes.aim}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-brand-purple" />
            <span>Noção: {p.attributes.gamesense}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Clutch:</span>
            <span>{p.attributes.clutch}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Util.:</span>
            <span>{p.attributes.utility}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => handlePromover(p.id)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-extrabold bg-brand-success/15 text-brand-success border border-brand-success/40 hover:bg-brand-success/25 transition-colors uppercase tracking-wide"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Promover ao Elenco</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER + INVESTIMENTO */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-purple" />
            <span>Academia & Base</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Invista na base para revelar jovens talentos observados pelos olheiros.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Caixa</p>
            <p className="text-sm font-black text-white flex items-center gap-1 justify-end">
              <Wallet className="w-3.5 h-3.5 text-brand-cyan" />
              ${userTeam.budget.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleInvestir}
            disabled={!canInvest}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-colors ${
              canInvest
                ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/45 hover:bg-brand-purple/30 glow-cyan'
                : 'bg-zinc-900 text-slate-600 border border-brand-border cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Investir (${INVESTIMENTO_BASE_CUSTO.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* JOVENS OBSERVADOS */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-warning" />
            <span>Jovens Observados</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {youthProspects.length} talento(s)
          </span>
        </div>

        {youthProspects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Nenhum jovem observado ainda.</p>
            <p className="text-xs mt-1">Invista na base para que seus olheiros revelem novas promessas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {youthProspects.map(renderProspectCard)}
          </div>
        )}
      </div>
    </div>
  );
};
