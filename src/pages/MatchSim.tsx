import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Shield, Target, Play, FastForward, Skull, Award } from 'lucide-react';

export const MatchSim: React.FC = () => {
  const {
    activeMatch,
    activeMatchRoundIndex,
    isSimulatingMatch,
    avancarRoundVisual,
    finalizarPartidaAtiva,
    teams,
    players
  } = useGameStore();

  const [autoPlay, setAutoPlay] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // IMPORTANTE: todos os hooks devem rodar antes de qualquer early return, senão o React
  // crasha com "Rendered fewer hooks than expected" quando activeMatch passa a null.
  // Auto-play interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoPlay && isSimulatingMatch) {
      interval = setInterval(() => {
        const canAdvance = avancarRoundVisual();
        if (!canAdvance) {
          setAutoPlay(false);
        }
      }, 3500); // 3.5 segundos por round de simulação
    }
    return () => clearInterval(interval);
  }, [autoPlay, isSimulatingMatch, avancarRoundVisual]);

  // Rola o feed para baixo sempre que o round avança
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMatchRoundIndex]);

  if (!activeMatch) return null;

  const teamA = teams[activeMatch.teamAId];
  const teamB = teams[activeMatch.teamBId];

  // Round atual simulado
  const currentRoundData = activeMatch.rounds[activeMatchRoundIndex];

  if (!currentRoundData) return null;

  // Placar ACUMULADO até o round exibido — evita vazar o resultado final (spoiler) durante a transmissão
  const roundsAteAgora = activeMatch.rounds.slice(0, activeMatchRoundIndex + 1);
  const liveScoreA = roundsAteAgora.filter(r => r.winningTeamId === activeMatch.teamAId).length;
  const liveScoreB = roundsAteAgora.length - liveScoreA;
  const isLastRound = activeMatchRoundIndex >= activeMatch.rounds.length - 1;

  // Mapeia jogadores dos times
  const teamAPlayers = Object.values(players).filter(p => p.teamId === activeMatch.teamAId && p.status === 'titular');
  const teamBPlayers = Object.values(players).filter(p => p.teamId === activeMatch.teamBId && p.status === 'titular');

  // Retorna HP/Status fictício da simulação no round para os jogadores
  // Para fins visuais, se o jogador foi citado como vítima em algum log de morte, ele está morto.
  const getPlayerLiveStatus = (playerId: string) => {
    const isVictim = currentRoundData.events.some(e => e.type === 'kill' && e.victimId === playerId);
    const killerEvents = currentRoundData.events.filter(e => e.type === 'kill' && e.killerId === playerId);
    
    // Armas e status
    const isTR = teamAPlayers.some(p => p.id === playerId) 
      ? activeMatch.rounds[activeMatchRoundIndex].winningTeamSide === 'TR' // simplificado
      : false;

    return {
      alive: !isVictim,
      hp: isVictim ? 0 : 100,
      kills: killerEvents.length
    };
  };

  return (
    <div className="space-y-6 select-none bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-brand-border">
      
      {/* PLACAR PLENÁRIO SUPERIOR */}
      <div className="bg-zinc-950 border border-brand-border/60 rounded-2xl p-5 flex items-center justify-between glow-cyan relative overflow-hidden">
        {/* Background com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-transparent to-brand-purple/5 pointer-events-none" />

        {/* TIME A */}
        <div className="flex items-center gap-4 w-1/3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-brand-dark"
            style={{ backgroundColor: teamA.colorPrimary, color: teamA.colorPrimary === '#ffffff' ? '#000' : '#fff' }}
          >
            {teamA.tag}
          </div>
          <div>
            <h3 className="text-sm font-black text-white">{teamA.name}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {teamA.region} • Rank #{teamA.points}
            </span>
          </div>
        </div>

        {/* SCORE CENTRAL */}
        <div className="text-center w-1/3 z-10">
          <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest text-neon-cyan block mb-1">
            PARTIDA AO VIVO
          </span>
          <div className="flex items-center justify-center gap-6">
            <span className="text-4xl font-black text-white text-neon-cyan">{liveScoreA}</span>
            <span className="text-slate-600 text-sm font-bold">X</span>
            <span className="text-4xl font-black text-white text-neon-purple">{liveScoreB}</span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 bg-zinc-900 px-3 py-1 rounded border border-brand-border mt-2.5 inline-block">
            Mapa: de_{activeMatch.mapId.replace('de_', '')} • Round {currentRoundData.roundNumber}
          </span>
        </div>

        {/* TIME B */}
        <div className="flex items-center gap-4 w-1/3 justify-end text-right">
          <div>
            <h3 className="text-sm font-black text-white">{teamB.name}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {teamB.region} • Rank #{teamB.points}
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-brand-dark"
            style={{ backgroundColor: teamB.colorPrimary, color: teamB.colorPrimary === '#ffffff' ? '#000' : '#fff' }}
          >
            {teamB.tag}
          </div>
        </div>
      </div>

      {/* SEÇÃO CENTRAL: TIME A VS TIME B ( HP DOS JOGADORES ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TIME A PLAYERS */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-2xl space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-brand-border/40 pb-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan" />
            <span>Elenco do {teamA.tag}</span>
          </h4>

          <div className="space-y-2.5">
            {teamAPlayers.map(p => {
              const live = getPlayerLiveStatus(p.id);
              const isUserIGL = p.role === 'IGL';
              
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    live.alive 
                      ? 'bg-zinc-950 border-brand-border' 
                      : 'bg-zinc-950/40 border-brand-border/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {!live.alive ? (
                        <div className="w-8 h-8 rounded bg-brand-danger/10 flex items-center justify-center border border-brand-danger/35">
                          <Skull className="w-4 h-4 text-brand-danger" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-brand-border">
                          {isUserIGL ? <Shield className="w-4 h-4 text-brand-purple" /> : <Shield className="w-4 h-4 text-slate-500" />}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{p.nickname}</span>
                      </p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{p.role}</span>
                    </div>
                  </div>

                  <div className="text-right w-28">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                      <span>HP {live.hp}/100</span>
                      <span className="text-white font-extrabold">{live.kills} Round Kills</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          live.hp > 40 ? 'bg-brand-success' : 'bg-brand-danger'
                        }`}
                        style={{ width: `${live.hp}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME B PLAYERS */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-2xl space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end border-b border-brand-border/40 pb-2">
            <span>Elenco do {teamB.tag}</span>
            <span className="w-2 h-2 rounded-full bg-brand-purple" />
          </h4>

          <div className="space-y-2.5">
            {teamBPlayers.map(p => {
              const live = getPlayerLiveStatus(p.id);
              const isUserIGL = p.role === 'IGL';

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    live.alive 
                      ? 'bg-zinc-950 border-brand-border' 
                      : 'bg-zinc-950/40 border-brand-border/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {!live.alive ? (
                        <div className="w-8 h-8 rounded bg-brand-danger/10 flex items-center justify-center border border-brand-danger/35">
                          <Skull className="w-4 h-4 text-brand-danger" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-brand-border">
                          {isUserIGL ? <Shield className="w-4 h-4 text-brand-purple" /> : <Shield className="w-4 h-4 text-slate-500" />}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{p.nickname}</span>
                      </p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{p.role}</span>
                    </div>
                  </div>

                  <div className="text-right w-28">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                      <span>HP {live.hp}/100</span>
                      <span className="text-white font-extrabold">{live.kills} Round Kills</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          live.hp > 40 ? 'bg-brand-success' : 'bg-brand-danger'
                        }`}
                        style={{ width: `${live.hp}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SEÇÃO INFERIOR: FEED NARRATIVO DO ROUND */}
      <div className="bg-zinc-950 border border-brand-border/60 p-5 rounded-2xl">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-brand-border/40 pb-2">
          <span>Feed de Abates & Ocorrências</span>
        </h4>

        <div className="h-44 overflow-y-auto space-y-2.5 font-mono text-xs text-slate-300 pr-2">
          {currentRoundData.events.map((event, idx) => {
            let typeColor = 'text-slate-400';
            if (event.type === 'kill') typeColor = 'text-brand-danger';
            else if (event.type === 'plant') typeColor = 'text-brand-warning';
            else if (event.type === 'defuse') typeColor = 'text-brand-success';
            else if (event.type === 'economy') typeColor = 'text-brand-cyan';

            return (
              <div key={idx} className="flex gap-4 items-start py-1 border-b border-zinc-900/40">
                <span className="text-slate-600 font-extrabold shrink-0">[{event.time}]</span>
                <p className={`${typeColor} font-semibold leading-relaxed`}>{event.description}</p>
              </div>
            );
          })}
          <div ref={feedEndRef} />
        </div>
      </div>

      {/* CONTROLES DE SIMULAÇÃO */}
      <div className="flex items-center justify-between border-t border-brand-border/60 pt-4">
        <div className="flex gap-3">
          {isSimulatingMatch ? (
            <>
              {/* BOTÃO AUTO-PLAY */}
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 ${
                  autoPlay 
                    ? 'bg-brand-cyan text-brand-dark glow-cyan' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white border border-brand-border'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{autoPlay ? 'Pausar Transmissão' : 'Iniciar Auto-Play'}</span>
              </button>

              {/* BOTÃO ROUND MANUAL */}
              {!autoPlay && (
                <button
                  onClick={() => avancarRoundVisual()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase bg-brand-purple text-white hover:bg-brand-purple/80 transition-colors duration-200 glow-purple"
                >
                  <FastForward className="w-4 h-4" />
                  <span>Próximo Round</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => finalizarPartidaAtiva()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple hover:scale-102 hover:shadow-lg hover:shadow-brand-cyan/20 transition-all duration-300 text-brand-dark uppercase tracking-wider"
            >
              <Award className="w-4.5 h-4.5" />
              <span>Ver Estatísticas & Resultados</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
