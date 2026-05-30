import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ArrowLeft, Shield, Target, TrendingUp, Award, Zap, Star } from 'lucide-react';
import { PlayerAttributes } from '../types';

/**
 * Perfil detalhado de um jogador (spec §13). Consome selectedPlayerId do store.
 * Acessado via "Ver Perfil" no Squad; volta para a tela de elenco.
 */
export const PlayerProfile: React.FC = () => {
  const { selectedPlayerId, players, teams, userTeamId, setScreen } = useGameStore();
  const player = selectedPlayerId ? players[selectedPlayerId] : undefined;

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm font-semibold text-slate-400">Nenhum jogador selecionado.</p>
        <button onClick={() => setScreen('squad')} className="px-5 py-2.5 rounded-lg text-xs font-extrabold bg-brand-cyan text-brand-dark uppercase tracking-wider">
          Voltar ao Elenco
        </button>
      </div>
    );
  }

  const team = teams[player.teamId];
  const attrLabels: Record<keyof PlayerAttributes, string> = {
    aim: 'Mira', gamesense: 'Noção de Jogo', clutch: 'Clutch / Calma', utility: 'Utilitárias', igl: 'Liderança (IGL)',
  };
  const attrKeys = Object.keys(attrLabels) as (keyof PlayerAttributes)[];

  // Pontos fortes (>=75) e fracos (<=55), thresholds absolutos
  const fortes = attrKeys.filter((k) => player.attributes[k] >= 75).map((k) => attrLabels[k]);
  const fracos = attrKeys.filter((k) => player.attributes[k] <= 55).map((k) => attrLabels[k]);

  const s = player.stats;
  const statItems: { label: string; value: string }[] = [
    { label: 'Rating', value: s.rating.toFixed(2) },
    { label: 'K / D', value: `${s.kills}/${s.deaths}` },
    { label: 'Assists', value: `${s.assists}` },
    { label: 'ADR', value: `${s.adr}` },
    { label: 'KAST', value: `${s.kast}%` },
    { label: 'HS%', value: `${s.hsPercentage}%` },
    { label: 'Clutches', value: `${s.clutchesWon}` },
    { label: 'First Kills', value: `${s.firstKills}` },
    { label: 'First Deaths', value: `${s.firstDeaths}` },
    { label: 'Mapas', value: `${s.mapsPlayed}` },
    { label: 'MVPs', value: `${s.mvps}` },
  ];

  return (
    <div className="space-y-6">
      {/* TOPO: VOLTAR */}
      <button onClick={() => setScreen('squad')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-cyan transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Elenco
      </button>

      {/* HERO CARD */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-brand-border rounded-2xl p-6 glow-cyan flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl border" style={{ backgroundColor: team?.colorPrimary ?? '#222', borderColor: team?.colorSecondary ?? '#444' }}>
            {player.nickname.slice(0, 2)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {player.nickname}
              {player.role === 'IGL' && <Shield className="w-5 h-5 text-brand-purple" />}
              {player.role === 'AWPer' && <Target className="w-5 h-5 text-brand-cyan" />}
            </h2>
            <p className="text-sm text-slate-400 font-semibold">{player.name}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              {player.role} • {player.nationality} • {player.age} anos • {team?.name ?? 'Sem time'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall / Potencial</p>
          <p className="text-3xl font-black text-brand-cyan text-neon-cyan">{player.overall} <span className="text-base text-slate-500">/ {player.potential}</span></p>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">{player.personality}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATRIBUTOS */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-cyan" /> Atributos</h3>
          <div className="space-y-3">
            {attrKeys.map((k) => {
              const v = player.attributes[k];
              return (
                <div key={k}>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-300">{attrLabels[k]}</span>
                    <span className="text-white font-black">{v}</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${v >= 80 ? 'bg-brand-success' : v >= 60 ? 'bg-brand-cyan' : v >= 45 ? 'bg-brand-warning' : 'bg-brand-danger'}`} style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATUS VITAIS + FORTE/FRACO */}
        <div className="space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 text-brand-warning" /> Condição</h3>
            <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-400">Moral</span><span className="text-white">{player.moral}/100</span></div>
            <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-400">Forma</span><span className="text-white">{player.form}/100</span></div>
            <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-400">Energia</span><span className="text-white">{Math.round(player.energy)}%</span></div>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star className="w-4 h-4 text-brand-success" /> Perfil Técnico</h3>
            <p className="text-[11px] font-bold text-brand-success">Fortes: <span className="text-slate-300 font-semibold">{fortes.length ? fortes.join(', ') : '—'}</span></p>
            <p className="text-[11px] font-bold text-brand-danger">Fracos: <span className="text-slate-300 font-semibold">{fracos.length ? fracos.join(', ') : '—'}</span></p>
          </div>
        </div>
      </div>

      {/* STATS DE CARREIRA */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Award className="w-4 h-4 text-brand-purple" /> Estatísticas de Carreira (acumuladas)</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {statItems.map((it) => (
            <div key={it.label} className="bg-zinc-950 border border-brand-border/50 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{it.label}</p>
              <p className="text-lg font-black text-white mt-0.5">{it.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTRATO */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
        <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Valor de Mercado</p><p className="text-base font-black text-brand-cyan">${player.value.toLocaleString()}</p></div>
        <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Salário Semanal</p><p className="text-base font-black text-white">${player.salary.toLocaleString()}</p></div>
        <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Contrato</p><p className="text-base font-black text-white">{player.contractMonths} meses</p></div>
      </div>
    </div>
  );
};
