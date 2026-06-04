import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { realMaps } from '../game/data/realMaps';
import { Trophy, Award, ArrowRight, BarChart2, Check, Map } from 'lucide-react';
import { Player } from '../types';
import { TeamCrest } from '../components/ui/TeamCrest';

export const MatchResult: React.FC = () => {
  const { finishedMatch, activeSeries, teams, players, userTeamId, avancarAposPartida } = useGameStore();

  const [activeTab, setActiveTab] = useState<'geral' | number>('geral');

  // Fallback seguro para saves antigos sem activeSeries
  const series = activeSeries || (finishedMatch ? {
    tournamentId: finishedMatch.competitionId,
    teamAId: finishedMatch.teamAId,
    teamBId: finishedMatch.teamBId,
    bestOf: 1 as const,
    vetoSteps: [],
    mapIds: [finishedMatch.mapId],
    currentMapIndex: 0,
    matches: [finishedMatch],
    scoreA: finishedMatch.winnerId === finishedMatch.teamAId ? 1 : 0,
    scoreB: finishedMatch.winnerId === finishedMatch.teamBId ? 1 : 0,
    isFinished: true,
    winnerId: finishedMatch.winnerId
  } : null);

  if (!series) return null;

  const teamA = teams[series.teamAId];
  const teamB = teams[series.teamBId];
  if (!teamA || !teamB) return null;

  const userWon = series.winnerId === userTeamId;

  const squadOf = (teamId: string): Player[] =>
    Object.values(players).filter(p => p.teamId === teamId && (p.status === 'titular' || p.status === 'reserva'));

  // Helper para computar Rating HLTV 2.0
  const computeRating = (kills: number, deaths: number, assists: number, damage: number, rounds: number) => {
    const safeRounds = Math.max(1, rounds);
    const kpr = kills / safeRounds;
    const dpr = deaths / safeRounds;
    const adrMatch = damage / safeRounds;
    const kast = Math.max(
      40,
      Math.min(100, Math.round(70 + (kills - deaths) * 2 + assists * 1.5))
    );
    const impact = 2.13 * kpr + 0.42 * (assists / safeRounds) - 0.41;
    const ratingMatch = Math.max(
      0,
      0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adrMatch + 0.1587
    );
    return ratingMatch;
  };

  // Consolidação de estatísticas
  const getPlayerStatsForTab = (playerId: string) => {
    if (activeTab === 'geral') {
      let totalK = 0;
      let totalD = 0;
      let totalA = 0;
      let totalDmg = 0;
      let totalRounds = 0;
      let ratings: number[] = [];

      series.matches.forEach(m => {
        const s = m.liveStats[playerId];
        if (s) {
          totalK += s.kills;
          totalD += s.deaths;
          totalA += s.assists;
          totalDmg += s.damage;
          const rounds = m.scoreA + m.scoreB;
          totalRounds += rounds;
          ratings.push(computeRating(s.kills, s.deaths, s.assists, s.damage, rounds));
        }
      });

      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 1.0;

      return {
        kills: totalK,
        deaths: totalD,
        assists: totalA,
        damage: totalDmg,
        rating: avgRating,
        adr: totalRounds > 0 ? Math.round(totalDmg / totalRounds) : 0
      };
    } else {
      const match = series.matches[activeTab];
      const s = match?.liveStats[playerId];
      const rounds = match ? match.scoreA + match.scoreB : 30;
      
      return {
        kills: s?.kills ?? 0,
        deaths: s?.deaths ?? 0,
        assists: s?.assists ?? 0,
        damage: s?.damage ?? 0,
        rating: s ? computeRating(s.kills, s.deaths, s.assists, s.damage, rounds) : 1.0,
        adr: s ? Math.round(s.damage / rounds) : 0
      };
    }
  };

  // Encontra o MVP da série
  const getSeriesMVP = () => {
    let bestPlayerId = '';
    let bestRating = -1;

    Object.keys(players).forEach(playerId => {
      let totalK = 0;
      let totalD = 0;
      let totalA = 0;
      let totalDmg = 0;
      let totalRounds = 0;
      let ratings: number[] = [];

      series.matches.forEach(m => {
        const s = m.liveStats[playerId];
        if (s) {
          totalK += s.kills;
          totalD += s.deaths;
          totalA += s.assists;
          totalDmg += s.damage;
          const rounds = m.scoreA + m.scoreB;
          totalRounds += rounds;
          ratings.push(computeRating(s.kills, s.deaths, s.assists, s.damage, rounds));
        }
      });

      if (ratings.length > 0) {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        if (avgRating > bestRating) {
          bestRating = avgRating;
          bestPlayerId = playerId;
        }
      }
    });

    return {
      player: players[bestPlayerId],
      rating: bestRating,
      stats: getPlayerStatsForTab(bestPlayerId)
    };
  };

  const mvpData = getSeriesMVP();

  const StatTable: React.FC<{ teamId: string }> = ({ teamId }) => {
    const t = teams[teamId];
    const squad = squadOf(teamId).filter(p => {
      return series.matches.some(m => m.liveStats[p.id]);
    }).sort((a, b) => getPlayerStatsForTab(b.id).rating - getPlayerStatsForTab(a.id).rating);

    return (
      <div className="bg-zinc-900/45 backdrop-blur border border-zinc-800/80 rounded-3xl p-5 shadow-xl">
        <h4 className="text-sm font-black uppercase tracking-wider mb-4 pb-2 border-b border-zinc-800/60 flex items-center justify-between" style={{ color: t.colorPrimary }}>
          <span className="drop-shadow">{t.name}</span>
          <span className="text-[10px] font-black uppercase bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80 text-slate-400">
            {t.tag}
          </span>
        </h4>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_45px_45px_45px_55px] gap-2 text-[9px] font-black text-slate-500 uppercase px-2 pb-1">
            <span>Jogador</span>
            <span className="text-center">K</span>
            <span className="text-center">D</span>
            <span className="text-center">A</span>
            <span className="text-center font-black">Rating</span>
          </div>
          {squad.map(p => {
            const stats = getPlayerStatsForTab(p.id);
            const isMVP = mvpData.player?.id === p.id;
            
            return (
              <div key={p.id} className="grid grid-cols-[1fr_45px_45px_45px_55px] gap-2 text-xs font-bold items-center px-2 py-2 rounded-xl bg-zinc-950/50 border border-zinc-900/80 hover:border-zinc-800 transition-colors">
                <span className="text-white truncate flex items-center gap-1.5 font-semibold">
                  {p.nickname}
                  {isMVP && <Award className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />}
                </span>
                <span className="text-emerald-400 text-center font-mono font-black">{stats.kills}</span>
                <span className="text-rose-400 text-center font-mono font-black">{stats.deaths}</span>
                <span className="text-slate-400 text-center font-mono font-semibold">{stats.assists}</span>
                <span className={`text-center font-mono font-black rounded px-1.5 py-0.5 shadow-sm ${
                  stats.rating >= 1.20 ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/15 text-neon-yellow' : 
                  stats.rating >= 1.05 ? 'text-emerald-400 bg-emerald-500/10' : 
                  stats.rating >= 0.85 ? 'text-slate-300 bg-slate-500/5' : 
                  'text-rose-400 bg-rose-500/10'
                }`}>
                  {stats.rating.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-zinc-950/30 backdrop-blur-md text-white p-6 rounded-3xl border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden select-none animate-fadeIn">
      {/* Glows Decorativos de Canto */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* RESULTADO GERAL DE MAPAS */}
      <div className={`text-center rounded-3xl p-6 border relative overflow-hidden shadow-2xl ${
        userWon 
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]' 
          : 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.05)]'
      }`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3.5 py-1.5 rounded-full border shadow ${
          userWon 
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        }`}>
          {userWon ? 'Vitória na Série' : 'Derrota na Série'}
        </span>
        
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="flex items-center gap-3 w-44 justify-end">
            <span className="text-xl font-black text-white text-right truncate drop-shadow">{teamA.name}</span>
            <TeamCrest team={teamA} size={48} className="border border-zinc-800 bg-zinc-900/60 p-1 rounded-xl shadow" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-white text-neon-cyan drop-shadow">{series.scoreA}</span>
            <span className="text-slate-600 text-lg font-black">X</span>
            <span className="text-5xl font-black text-white text-neon-purple drop-shadow">{series.scoreB}</span>
          </div>
          <div className="flex items-center gap-3 w-44 justify-start">
            <TeamCrest team={teamB} size={48} className="border border-zinc-800 bg-zinc-900/60 p-1 rounded-xl shadow" />
            <span className="text-xl font-black text-white text-left truncate drop-shadow">{teamB.name}</span>
          </div>
        </div>

        {/* LISTAGEM DOS MAPAS E SEUS ROUNDS */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-zinc-800/40">
          {series.matches.map((match, idx) => {
            const mapObj = realMaps.find(m => m.id === match.mapId);
            const winner = match.winnerId === teamA.id ? teamA : teamB;
            
            return (
              <div 
                key={idx} 
                className="relative overflow-hidden w-40 h-20 rounded-2xl border border-zinc-800 flex flex-col justify-between p-3 shadow-md group/map transition-all duration-300 hover:border-zinc-700"
              >
                {mapObj?.imageUrl && (
                  <img 
                    src={mapObj.imageUrl} 
                    alt={mapObj.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/map:scale-105 pointer-events-none"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/70 pointer-events-none" />
                
                <div className="z-10 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <span>de_{mapObj?.id.replace('de_', '')}</span>
                  <span 
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border drop-shadow-sm"
                    style={{ backgroundColor: `${winner.colorPrimary}20`, color: winner.colorPrimary, borderColor: `${winner.colorPrimary}35` }}
                  >
                    Venceu
                  </span>
                </div>
                
                <div className="z-10 flex items-center justify-between mt-auto">
                  <span className="text-lg font-black text-white drop-shadow-md">
                    {match.scoreA} <span className="text-slate-500 text-xs font-black">x</span> {match.scoreB}
                  </span>
                  <span className="text-[10px] font-black text-slate-300 drop-shadow">
                    {winner.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MVP DA SÉRIE */}
      {mvpData.player && (
        <div className="flex items-center justify-center gap-4 bg-zinc-950/70 border border-yellow-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
          <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-400/10 animate-pulse shrink-0" />
          <div className="text-center">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/15 px-3.5 py-1 rounded-full inline-block">
              MVP da Série
            </p>
            <p className="text-lg font-black text-white mt-1.5 drop-shadow">{mvpData.player.nickname}</p>
            <p className="text-xs text-slate-400 font-bold mt-1">
              <span className="text-emerald-400 font-black">{mvpData.stats.kills}</span> Kills • <span className="text-rose-400 font-black">{mvpData.stats.deaths}</span> Deaths • <span className="text-slate-400 font-bold">{mvpData.stats.assists}</span> Assists
              {' • '}
              <span className="text-yellow-400 font-black">Rating HLTV {mvpData.rating.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}

      {/* SELETOR DE ABAS HLTV STYLE */}
      <div className="flex border-b border-zinc-800 gap-1.5 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-black uppercase border-b-2 transition-all shrink-0 ${
            activeTab === 'geral' 
              ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/5 text-neon-cyan' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Série Geral
        </button>
        {series.matches.map((m, idx) => {
          const name = realMaps.find(map => map.id === m.mapId)?.name ?? m.mapId.replace('de_', '');
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-3.5 text-xs font-black uppercase border-b-2 transition-all shrink-0 ${
                activeTab === idx 
                  ? 'border-brand-purple text-brand-purple bg-brand-purple/5 text-neon-purple' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Mapa {idx + 1}: {name}
            </button>
          );
        })}
      </div>

      {/* TABELAS DE STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatTable teamId={teamA.id} />
        <StatTable teamId={teamB.id} />
      </div>

      {/* VOLTAR */}
      <div className="flex justify-center pt-4 relative z-10">
        <button
          onClick={() => avancarAposPartida()}
          className="flex items-center gap-2 px-10 py-4 rounded-2xl text-xs font-black bg-gradient-to-r from-brand-cyan via-cyan-400 to-brand-purple text-black hover:scale-102 active:scale-98 shadow-lg shadow-brand-cyan/25 hover:shadow-brand-cyan/40 hover:scale-103 transition-all duration-300 uppercase tracking-widest transform"
        >
          <span>Avançar Semana</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
