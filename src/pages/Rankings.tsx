import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { canonicalRegion } from '../store/useGameStore';
import { TrendingUp, Globe, Award } from 'lucide-react';

export const Rankings: React.FC = () => {
  const { teams, userTeamId } = useGameStore();

  // Ordena os times por pontos decrescente
  const rankedTeams = Object.values(teams).filter(t => t.id !== 'free_agents').sort((a, b) => b.points - a.points);

  // Posição do usuário na escada (global, na região e no tier) — feedback de progressão (F4).
  const userTeam = teams[userTeamId];
  const posGlobal = rankedTeams.findIndex(t => t.id === userTeamId) + 1;
  const posTier = userTeam ? rankedTeams.filter(t => t.tier === userTeam.tier).findIndex(t => t.id === userTeamId) + 1 : 0;
  const posRegiao = userTeam ? rankedTeams.filter(t => canonicalRegion(t.region) === canonicalRegion(userTeam.region)).findIndex(t => t.id === userTeamId) + 1 : 0;
  const regiaoTotal = userTeam ? rankedTeams.filter(t => canonicalRegion(t.region) === canonicalRegion(userTeam.region)).length : 0;
  const tierTotal = userTeam ? rankedTeams.filter(t => t.tier === userTeam.tier).length : 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-cyan" />
          <span>Classificação / Rankings Mundiais</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Vagas em campeonatos são por MÉRITO: os times de maior ranking são convidados; o Major respeita cotas regionais. Suba no ranking para destravar os torneios de elite.
        </p>
      </div>

      {/* MINHA CLASSIFICAÇÃO (feedback de progressão) */}
      {userTeam && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-brand-card border border-brand-cyan/30 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ranking Mundial</p>
            <p className="text-2xl font-black text-neon-cyan mt-1">#{posGlobal}</p>
            <p className="text-[10px] text-slate-500 font-semibold">de {rankedTeams.length} times</p>
          </div>
          <div className="bg-brand-card border border-brand-purple/30 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Região ({canonicalRegion(userTeam.region)})</p>
            <p className="text-2xl font-black text-neon-purple mt-1">#{posRegiao}</p>
            <p className="text-[10px] text-slate-500 font-semibold">de {regiaoTotal} na região</p>
          </div>
          <div className="bg-brand-card border border-brand-warning/30 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier {userTeam.tier}</p>
            <p className="text-2xl font-black text-brand-warning mt-1">#{posTier}</p>
            <p className="text-[10px] text-slate-500 font-semibold">de {tierTotal} no tier</p>
          </div>
        </div>
      )}

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
