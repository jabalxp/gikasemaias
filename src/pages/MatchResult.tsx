import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { realMaps } from '../game/data/realMaps';
import { Trophy, Award, ArrowRight } from 'lucide-react';
import { Player } from '../types';
import { TeamCrest } from '../components/ui/TeamCrest';

/**
 * Tela de PÓS-JOGO (spec §25.3): placar final, MVP e estatísticas por jogador.
 * Lê `finishedMatch` (preservado pelo store) e volta ao painel via `fecharResultado`.
 */
export const MatchResult: React.FC = () => {
  const { finishedMatch, teams, players, userTeamId, fecharResultado } = useGameStore();

  if (!finishedMatch) return null;

  const teamA = teams[finishedMatch.teamAId];
  const teamB = teams[finishedMatch.teamBId];
  if (!teamA || !teamB) return null;

  const winnerId = finishedMatch.winnerId;
  const userWon = winnerId === userTeamId;
  const mvp = finishedMatch.mvpPlayerId ? players[finishedMatch.mvpPlayerId] : undefined;
  const mapName = realMaps.find(m => m.id === finishedMatch.mapId)?.name ?? finishedMatch.mapId.replace('de_', '');

  const squadOf = (teamId: string): Player[] =>
    Object.values(players).filter(p => p.teamId === teamId && p.status === 'titular');

  const StatTable: React.FC<{ teamId: string }> = ({ teamId }) => {
    const t = teams[teamId];
    const squad = squadOf(teamId);
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <h4 className="text-xs font-black uppercase tracking-widest mb-3 pb-2 border-b border-brand-border/40" style={{ color: t.colorPrimary }}>
          {t.name}
        </h4>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[9px] font-black text-slate-600 uppercase px-2">
            <span>Jogador</span><span>K</span><span>D</span><span>A</span>
          </div>
          {squad.map(p => {
            const s = finishedMatch.liveStats[p.id];
            return (
              <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-xs font-bold items-center px-2 py-1.5 rounded bg-zinc-950/60">
                <span className="text-white truncate flex items-center gap-1.5">
                  {p.nickname}
                  {p.id === finishedMatch.mvpPlayerId && <Award className="w-3 h-3 text-brand-warning" />}
                </span>
                <span className="text-brand-success w-5 text-center">{s?.kills ?? 0}</span>
                <span className="text-brand-danger w-5 text-center">{s?.deaths ?? 0}</span>
                <span className="text-slate-400 w-5 text-center">{s?.assists ?? 0}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-brand-border">
      {/* RESULTADO */}
      <div className={`text-center rounded-2xl p-6 border ${userWon ? 'border-brand-success/40 bg-brand-success/5' : 'border-brand-danger/40 bg-brand-danger/5'}`}>
        <span className={`text-xs font-black uppercase tracking-[0.3em] ${userWon ? 'text-brand-success' : 'text-brand-danger'}`}>
          {userWon ? 'Vitória' : 'Derrota'}
        </span>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-3 w-40 justify-end">
            <span className="text-lg font-black text-white text-right truncate">{teamA.name}</span>
            <TeamCrest team={teamA} size={44} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-neon-cyan">{finishedMatch.scoreA}</span>
            <span className="text-slate-600 font-bold">X</span>
            <span className="text-5xl font-black text-neon-purple">{finishedMatch.scoreB}</span>
          </div>
          <div className="flex items-center gap-3 w-40 justify-start">
            <TeamCrest team={teamB} size={44} />
            <span className="text-lg font-black text-white text-left truncate">{teamB.name}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-3">Mapa: {mapName}</p>
      </div>

      {/* MVP */}
      {mvp && (
        <div className="flex items-center justify-center gap-3 bg-zinc-950 border border-brand-warning/30 rounded-2xl p-4">
          <Trophy className="w-6 h-6 text-brand-warning" />
          <div className="text-center">
            <p className="text-[10px] font-black text-brand-warning uppercase tracking-widest">MVP da Partida</p>
            <p className="text-lg font-black text-white">{mvp.nickname}</p>
            <p className="text-[10px] text-slate-500 font-semibold">
              {finishedMatch.liveStats[mvp.id]?.kills ?? 0} kills · {finishedMatch.liveStats[mvp.id]?.deaths ?? 0} deaths · {finishedMatch.liveStats[mvp.id]?.assists ?? 0} assists
              {' · '}
              <span className="text-brand-warning">Rating {mvp.stats.rating.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}

      {/* TABELAS DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatTable teamId={teamA.id} />
        <StatTable teamId={teamB.id} />
      </div>

      {/* VOLTAR */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => fecharResultado()}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 active:scale-98 transition-all duration-300 uppercase tracking-wider"
        >
          <span>Voltar ao Painel</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
