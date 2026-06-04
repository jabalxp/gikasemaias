import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { realMaps } from '../game/data/realMaps';
import { Play, FastForward, Swords, Sparkles, TrendingUp } from 'lucide-react';
import { Player } from '../types';
import { TeamCrest } from '../components/ui/TeamCrest';

/**
 * Tela de PRÉ-JOGO (spec §25.1): mostra o confronto, odds e mapa, e deixa o usuário
 * escolher entre assistir round a round ou simular rápido (ir direto ao resultado).
 */
export const MatchPreview: React.FC = () => {
  const { activeMatch, activeSeries, teams, players, assistirPartida, finalizarPartidaAtiva } = useGameStore();

  if (!activeMatch) return null;

  const teamA = teams[activeMatch.teamAId];
  const teamB = teams[activeMatch.teamBId];
  if (!teamA || !teamB) return null;

  const squadOf = (teamId: string): Player[] =>
    Object.values(players).filter(p => p.teamId === teamId && p.status === 'titular');

  const avgOverall = (squad: Player[]): number =>
    squad.length > 0 ? Math.round(squad.reduce((acc, p) => acc + p.overall, 0) / squad.length) : 70;

  const ovrA = avgOverall(squadOf(teamA.id));
  const ovrB = avgOverall(squadOf(teamB.id));
  const probA = Math.round((ovrA / (ovrA + ovrB)) * 100);
  const probB = 100 - probA;
  const mapName = realMaps.find(m => m.id === activeMatch.mapId)?.name ?? activeMatch.mapId.replace('de_', '');
  const bestOf = activeSeries?.bestOf ?? 1;
  const mapsList = activeSeries?.mapIds.map(id => realMaps.find(m => m.id === id)?.name ?? id.replace('de_', '')).join(' · ') ?? mapName;

  const TeamBadge: React.FC<{ teamId: string; align: 'left' | 'right' }> = ({ teamId, align }) => {
    const t = teams[teamId];
    return (
      <div className={`flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/20 to-brand-purple/20 rounded-2xl blur group-hover:blur-md transition-all duration-300 pointer-events-none" />
          <TeamCrest team={t} size={90} shape="rounded" className="relative z-10 border-2 border-zinc-800 bg-zinc-950/80 p-2 shadow-xl" />
        </div>
        <div className="text-center">
          <p className="text-base font-black text-white drop-shadow tracking-wide">{t.name}</p>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-zinc-900/60 px-2 py-0.5 rounded-full border border-zinc-800 mt-1 inline-block">
            {t.region} • Rank #{t.points}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-zinc-950/30 backdrop-blur-md text-white p-8 rounded-3xl border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden select-none animate-fadeIn">
      {/* Glows Decorativos de Canto */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* CABEÇALHO */}
      <div className="text-center relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] bg-brand-cyan/10 border border-brand-cyan/15 px-3 py-1 rounded-full w-fit mx-auto shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Série MD{bestOf} • Sala de Preparação</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-3 text-neon-cyan">
          CONFRONTO DE HOJE
        </h2>
      </div>

      {/* PAINEL DE CONFRONTO PREMIUM */}
      <div className="bg-zinc-950/65 backdrop-blur border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/3 via-transparent to-brand-purple/3 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-around gap-6 md:gap-2">
          <TeamBadge teamId={teamA.id} align="left" />
          
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-cyan/15 to-brand-purple/15 border border-zinc-800 flex items-center justify-center shadow-lg animate-pulse">
              <Swords className="w-5 h-5 text-brand-purple fill-brand-purple/10" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">VS</span>
            
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800/80 shadow inline-block">
                Mapas da Série (MD{bestOf})
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                {activeSeries?.mapIds.map((mapId, idx) => {
                  const mapObj = realMaps.find(m => m.id === mapId);
                  const isPickA = activeSeries.vetoSteps.find(s => s.mapId === mapId && s.action === 'pick')?.teamId === activeSeries.teamAId;
                  const isPickB = activeSeries.vetoSteps.find(s => s.mapId === mapId && s.action === 'pick')?.teamId === activeSeries.teamBId;
                  
                  return (
                    <div 
                      key={idx} 
                      className="relative overflow-hidden w-20 h-14 rounded-lg border border-zinc-800 flex flex-col justify-end p-1.5 shadow-md group/item transition-all duration-300 hover:border-zinc-600 hover:scale-102"
                    >
                      {mapObj?.imageUrl && (
                        <img 
                          src={mapObj.imageUrl} 
                          alt={mapObj.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110 pointer-events-none"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
                      <span className="z-10 text-[9px] font-black text-white truncate drop-shadow-md">{mapObj?.name ?? mapId.replace('de_', '')}</span>
                      <span className={`z-10 text-[7px] font-black uppercase px-1 rounded-sm w-fit border drop-shadow-sm ${
                        isPickA ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/35' : 
                        isPickB ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/35' : 
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {isPickA ? teamA.tag : isPickB ? teamB.tag : 'Decider'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <TeamBadge teamId={teamB.id} align="right" />
        </div>

        {/* ANÁLISE TÉCNICA E ODDS NEON */}
        <div className="mt-10 max-w-lg mx-auto space-y-2 border-t border-zinc-800/50 pt-6">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-brand-cyan" /> Probabilidade {teamA.tag}: {probA}%</span>
            <span>Probabilidade {teamB.tag}: {probB}%</span>
          </div>
          
          <div className="w-full bg-zinc-950 border border-zinc-800/80 h-3 rounded-full overflow-hidden flex p-0.5 shadow-inner">
            <div className="bg-gradient-to-r from-brand-cyan to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-all duration-500" style={{ width: `${probA}%` }} />
            <div className="bg-gradient-to-r from-brand-purple to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(138,43,226,0.5)] flex-1 ml-1 transition-all duration-500" />
          </div>
          
          <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-wider pt-2">
            Média de Combat Skill — {teamA.tag}: <span className="text-white">{ovrA}</span> · {teamB.tag}: <span className="text-white">{ovrB}</span>
          </p>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO REESTILIZADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-4 relative z-10">
        <button
          onClick={() => assistirPartida()}
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-black bg-gradient-to-r from-brand-cyan via-cyan-400 to-brand-purple hover:scale-102 active:scale-98 shadow-lg shadow-brand-cyan/25 hover:shadow-brand-cyan/40 hover:scale-103 active:scale-98 transition-all duration-300 text-black uppercase tracking-widest transform"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Assistir Round a Round</span>
        </button>
        
        <button
          onClick={() => finalizarPartidaAtiva()}
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-black border border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-900/90 text-slate-200 hover:text-white hover:scale-102 active:scale-98 shadow-md hover:border-zinc-500 hover:scale-103 transition-all duration-300 uppercase tracking-widest transform"
        >
          <FastForward className="w-4 h-4" />
          <span>Simular Rápido</span>
        </button>
      </div>
    </div>
  );
};
