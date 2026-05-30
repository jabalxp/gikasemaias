import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { TrendingUp, Globe, Award } from 'lucide-react';

export const Rankings: React.FC = () => {
  const { teams, userTeamId } = useGameStore();

  // Ordena os times por pontos decrescente
  const rankedTeams = Object.values(teams).sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-cyan" />
          <span>Classificação / Rankings Mundiais</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Lista das principais organizações competitivas mundiais. Pontuações de ranking aumentam com vitórias em campeonatos oficiais e sofrem decréscimo em derrotas.
        </p>
      </div>

      {/* TABELA DE RANKING */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-slate-500 text-[10px] font-bold uppercase tracking-wider pb-3">
              <th className="py-3 px-2 w-16">Posição</th>
              <th className="py-3 px-2 w-24">Tag</th>
              <th className="py-3 px-4">Organização</th>
              <th className="py-3 px-4">Região</th>
              <th className="py-3 px-4">Tier / Divisão</th>
              <th className="py-3 px-4 text-right pr-6">Pontos Competitive</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs font-semibold">
            {rankedTeams.map((team, idx) => {
              const isUser = team.id === userTeamId;
              const pos = idx + 1;
              
              return (
                <tr
                  key={team.id}
                  className={`hover:bg-zinc-900/40 transition-colors ${
                    isUser ? 'bg-brand-cyan/5 text-brand-cyan font-bold border-l-4 border-brand-cyan' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3 px-2 text-slate-500 font-bold">
                    #{pos}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-extrabold text-brand-dark"
                      style={{
                        backgroundColor: team.colorPrimary,
                        color: team.colorPrimary === '#ffffff' ? '#000' : '#fff'
                      }}
                    >
                      {team.tag}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5 truncate">
                    <span>{team.name}</span>
                    {isUser && <span className="text-[8px] bg-brand-cyan/20 text-brand-cyan uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded">Seu Time</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-600" />
                      <span>{team.region} ({team.country})</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-extrabold uppercase">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-brand-purple" />
                      <span>Tier {team.tier}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-white pr-6 text-neon-cyan">
                    {team.points.toLocaleString()} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
