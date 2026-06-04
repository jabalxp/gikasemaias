import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Shield, Target, Play, FastForward, Skull, Award, Map, Radio } from 'lucide-react';
import { TeamCrest } from '../components/ui/TeamCrest';

export const MatchSim: React.FC = () => {
  const {
    activeMatch,
    activeMatchRoundIndex,
    isSimulatingMatch,
    avancarRoundVisual,
    finalizarPartidaAtiva,
    activeSeries,
    teams,
    players
  } = useGameStore();

  const [autoPlay, setAutoPlay] = useState(true);
  const [nextMapCountdown, setNextMapCountdown] = useState<number | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

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

  // Efeito para iniciar contagem regressiva quando o mapa/série acaba no autoplay
  useEffect(() => {
    if (!isSimulatingMatch && autoPlay) {
      if (nextMapCountdown === null) {
        setNextMapCountdown(5);
      }
    } else {
      setNextMapCountdown(null);
    }
  }, [isSimulatingMatch, autoPlay, nextMapCountdown]);

  // Efeito de tick e execução do auto-avanço ao zerar a contagem
  useEffect(() => {
    if (nextMapCountdown === null || !activeSeries) return;
    if (nextMapCountdown <= 0) {
      if (!activeSeries.isFinished) {
        // Inicia automaticamente o próximo mapa no servidor
        useGameStore.setState({
          activeMatch: activeSeries.matches[activeSeries.currentMapIndex],
          activeMatchRoundIndex: 0,
          isSimulatingMatch: true
        });
        setAutoPlay(true);
      } else {
        // Finaliza a partida e abre a tela de resultados
        finalizarPartidaAtiva();
      }
      setNextMapCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setNextMapCountdown(nextMapCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [nextMapCountdown, activeSeries, finalizarPartidaAtiva]);

  // Rola o feed para baixo sempre que o round avança
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMatchRoundIndex]);

  if (!activeMatch || !activeSeries) return null;

  const teamA = teams[activeMatch.teamAId];
  const teamB = teams[activeMatch.teamBId];

  // Round atual simulado
  const currentRoundData = activeMatch.rounds[activeMatchRoundIndex];

  if (!currentRoundData) return null;

  // Placar ACUMULADO até o round exibido — evita vazar o resultado final (spoiler) durante a transmissão
  const roundsAteAgora = activeMatch.rounds.slice(0, activeMatchRoundIndex + 1);
  const liveScoreA = roundsAteAgora.filter(r => r.winningTeamId === activeMatch.teamAId).length;
  const liveScoreB = roundsAteAgora.length - liveScoreA;
  
  // Mapeia jogadores dos times
  const teamAPlayers = Object.values(players).filter(p => p.teamId === activeMatch.teamAId && (p.status === 'titular' || p.status === 'reserva'));
  const teamBPlayers = Object.values(players).filter(p => p.teamId === activeMatch.teamBId && (p.status === 'titular' || p.status === 'reserva'));

  // Retorna HP/Status fictício da simulação no round para os jogadores
  const getPlayerLiveStatus = (playerId: string) => {
    const isVictim = currentRoundData.events.some(e => e.type === 'kill' && e.victimId === playerId);
    const killerEvents = currentRoundData.events.filter(e => e.type === 'kill' && e.killerId === playerId);
    
    return {
      alive: !isVictim,
      hp: isVictim ? 0 : 100,
      kills: killerEvents.length
    };
  };

  return (
    <div className="space-y-6 select-none bg-zinc-950/30 backdrop-blur-md text-white p-6 rounded-3xl border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden animate-fadeIn">
      {/* Luzes decorativas de fundo */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* PLACAR PLENÁRIO SUPERIOR (HUD) */}
      <div className="bg-zinc-950/85 backdrop-blur border border-zinc-800 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-transparent to-brand-purple/5 pointer-events-none" />

        {/* TIME A */}
        <div className="flex items-center gap-4 w-1/3 transition-transform duration-300 hover:scale-102">
          <TeamCrest team={teamA} size={48} className="border border-zinc-800 bg-zinc-900/60 p-1 rounded-xl shadow" />
          <div>
            <h3 className="text-sm font-black text-white drop-shadow">{teamA.name}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {teamA.region} • Rank #{teamA.points}
            </span>
          </div>
        </div>

        {/* SCORE CENTRAL */}
        <div className="text-center w-1/3 z-10 flex flex-col items-center">
          <span className="flex items-center gap-1 text-[9px] font-black text-brand-cyan uppercase tracking-widest text-neon-cyan mb-1.5 bg-brand-cyan/10 border border-brand-cyan/15 px-2.5 py-0.5 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" /> Transmissão ao Vivo
          </span>
          <div className="flex items-center justify-center gap-6">
            <span className="text-4xl font-black text-white text-neon-cyan drop-shadow">{liveScoreA}</span>
            <span className="text-slate-600 text-sm font-black">X</span>
            <span className="text-4xl font-black text-white text-neon-purple drop-shadow">{liveScoreB}</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg mt-2.5 inline-block shadow">
            Mapa: <span className="text-white uppercase">de_{activeMatch.mapId.replace('de_', '')}</span> • Round {currentRoundData.roundNumber}
          </span>
        </div>

        {/* TIME B */}
        <div className="flex items-center gap-4 w-1/3 justify-end text-right transition-transform duration-300 hover:scale-102">
          <div>
            <h3 className="text-sm font-black text-white drop-shadow">{teamB.name}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {teamB.region} • Rank #{teamB.points}
            </span>
          </div>
          <TeamCrest team={teamB} size={48} className="border border-zinc-800 bg-zinc-900/60 p-1 rounded-xl shadow" />
        </div>
      </div>

      {/* SEÇÃO CENTRAL: HP DOS JOGADORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TIME A PLAYERS */}
        <div className="bg-zinc-900/45 backdrop-blur border border-zinc-800/80 p-5 rounded-2xl space-y-4 shadow-md">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/50 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            <span>Elenco do {teamA.tag}</span>
          </h4>

          <div className="space-y-3">
            {teamAPlayers.filter(p => activeMatch.liveStats[p.id]).map(p => {
              const live = getPlayerLiveStatus(p.id);
              const isUserIGL = p.role === 'IGL';
              
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    live.alive 
                      ? 'bg-zinc-950/60 border-zinc-800/70 shadow' 
                      : 'bg-zinc-950/20 border-zinc-900/40 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {!live.alive ? (
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/25">
                          <Skull className="w-4 h-4 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          {isUserIGL ? <Shield className="w-4 h-4 text-brand-purple" /> : <Shield className="w-4 h-4 text-slate-500" />}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white tracking-wide">{p.nickname}</p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{p.role}</span>
                    </div>
                  </div>

                  <div className="text-right w-32">
                    <div className="flex justify-between text-[9px] font-black mb-1">
                      <span className={live.alive ? 'text-emerald-400' : 'text-rose-500'}>HP {live.hp}/100</span>
                      <span className="text-slate-300 font-black">{live.kills} Round Kills</span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-zinc-900 h-2 rounded-full overflow-hidden p-px">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          live.hp > 40 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
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
        <div className="bg-zinc-900/45 backdrop-blur border border-zinc-800/80 p-5 rounded-2xl space-y-4 shadow-md">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-end border-b border-zinc-800/50 pb-2">
            <span>Elenco do {teamB.tag}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse shadow-[0_0_8px_rgba(138,43,226,0.6)]" />
          </h4>

          <div className="space-y-3">
            {teamBPlayers.filter(p => activeMatch.liveStats[p.id]).map(p => {
              const live = getPlayerLiveStatus(p.id);
              const isUserIGL = p.role === 'IGL';

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    live.alive 
                      ? 'bg-zinc-950/60 border-zinc-800/70 shadow' 
                      : 'bg-zinc-950/20 border-zinc-900/40 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {!live.alive ? (
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/25">
                          <Skull className="w-4 h-4 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          {isUserIGL ? <Shield className="w-4 h-4 text-brand-purple" /> : <Shield className="w-4 h-4 text-slate-500" />}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white tracking-wide">{p.nickname}</p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{p.role}</span>
                    </div>
                  </div>

                  <div className="text-right w-32">
                    <div className="flex justify-between text-[9px] font-black mb-1">
                      <span className={live.alive ? 'text-emerald-400' : 'text-rose-500'}>HP {live.hp}/100</span>
                      <span className="text-slate-300 font-black">{live.kills} Round Kills</span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-zinc-900 h-2 rounded-full overflow-hidden p-px">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          live.hp > 40 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
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

      {/* SEÇÃO INFERIOR: FEED NARRATIVO / TRANSIÇÃO HOLOGRÁFICA */}
      <div className="bg-zinc-950/85 backdrop-blur border border-zinc-800/80 p-5 rounded-2xl min-h-[16rem] flex flex-col justify-between shadow-inner">
        {isSimulatingMatch ? (
          <>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-zinc-800/50 pb-2">
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
                  <div key={idx} className="flex gap-4 items-start py-1.5 border-b border-zinc-900/20">
                    <span className="text-slate-600 font-extrabold shrink-0">[{event.time}]</span>
                    <p className={`${typeColor} font-semibold leading-relaxed`}>{event.description}</p>
                  </div>
                );
              })}
              <div ref={feedEndRef} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6 px-4 space-y-4 animate-fadeIn">
            {activeSeries.isFinished ? (
              <>
                <Award className="w-16 h-16 text-brand-purple fill-brand-purple/10 animate-bounce" />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple uppercase tracking-wider drop-shadow">
                    SÉRIE CONCLUÍDA!
                  </h3>
                  <p className="text-sm font-bold text-slate-300">
                    O time <strong className="text-white">{teams[activeSeries.winnerId!].name}</strong> conquistou a vitória na série MD{activeSeries.bestOf}!
                  </p>
                  <p className="text-2xl font-black text-white mt-2">
                    PLACAR FINAL: {activeSeries.scoreA} x {activeSeries.scoreB}
                  </p>
                </div>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  O confronto foi finalizado no servidor. Clique abaixo para ver o frag geral do confronto e as estatísticas detalhadas de cada mapa na HLTV.
                </p>
                {nextMapCountdown !== null && (
                  <p className="text-xs text-brand-purple font-black uppercase tracking-wider animate-pulse mt-2 bg-brand-purple/10 border border-brand-purple/20 px-4 py-2 rounded-xl w-fit mx-auto shadow-md">
                    🏆 Redirecionando para estatísticas finais em {nextMapCountdown}s...
                  </p>
                )}
              </>
            ) : (
              <>
                <Map className="w-16 h-16 text-brand-cyan animate-pulse" />
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-brand-cyan uppercase tracking-wider drop-shadow">
                    MAPA CONCLUÍDO!
                  </h3>
                  <p className="text-sm font-bold text-slate-300">
                    O time <strong className="text-white">{teams[activeMatch.winnerId!].name}</strong> venceu o mapa <span className="text-white uppercase font-black">de_{activeMatch.mapId.replace('de_', '')}</span>!
                  </p>
                  <p className="text-xl font-black text-white mt-1">
                    Placar do Mapa: {activeMatch.scoreA} x {activeMatch.scoreB}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Placar Geral da Série: <span className="text-brand-cyan font-black">{activeSeries.scoreA}</span> x <span className="text-brand-purple font-black">{activeSeries.scoreB}</span> (MD{activeSeries.bestOf})
                  </p>
                </div>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  Os jogadores estão descansando e limpando o servidor. Clique no botão de avançar para ir para o próximo mapa selecionado no veto: <strong className="text-white uppercase font-black">de_{activeSeries.matches[activeSeries.currentMapIndex].mapId.replace('de_', '')}</strong>.
                </p>
                {nextMapCountdown !== null && (
                  <p className="text-xs text-brand-cyan font-black uppercase tracking-wider animate-pulse mt-2 bg-brand-cyan/10 border border-brand-cyan/20 px-4 py-2 rounded-xl w-fit mx-auto shadow-md">
                    ⚡ Carregando próximo mapa em {nextMapCountdown}s...
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTROLES DE SIMULAÇÃO REESTILIZADOS */}
      <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
        <div className="flex gap-3 w-full">
          {isSimulatingMatch ? (
            <div className="flex items-center gap-3 w-full justify-start">
              {/* BOTÃO AUTO-PLAY */}
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 ${
                  autoPlay 
                    ? 'bg-gradient-to-r from-brand-cyan to-cyan-400 text-black shadow-lg shadow-brand-cyan/20 hover:scale-102' 
                    : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-slate-300 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{autoPlay ? 'Pausar Transmissão' : 'Iniciar Auto-Play'}</span>
              </button>

              {/* BOTÃO ROUND MANUAL */}
              {!autoPlay && (
                <button
                  onClick={() => avancarRoundVisual()}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-brand-purple text-white hover:bg-brand-purple/80 hover:scale-102 active:scale-95 transition-all duration-200 shadow-lg shadow-brand-purple/20 glow-purple transform"
                >
                  <FastForward className="w-4 h-4 fill-current" />
                  <span>Próximo Round</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex w-full justify-center">
              {!activeSeries.isFinished ? (
                <button
                  onClick={() => {
                    useGameStore.setState({
                      activeMatch: activeSeries.matches[activeSeries.currentMapIndex],
                      activeMatchRoundIndex: 0,
                      isSimulatingMatch: true
                    });
                    setAutoPlay(true);
                  }}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-cyan to-emerald-500 hover:scale-103 hover:shadow-lg hover:shadow-brand-cyan/25 transition-all duration-300 text-black uppercase tracking-widest transform"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Próximo Mapa (de_{activeSeries.matches[activeSeries.currentMapIndex].mapId.replace('de_', '')})</span>
                </button>
              ) : (
                <button
                  onClick={() => finalizarPartidaAtiva()}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-cyan via-cyan-400 to-brand-purple hover:scale-103 hover:shadow-lg hover:shadow-brand-cyan/25 transition-all duration-300 text-black uppercase tracking-widest transform"
                >
                  <Award className="w-4 h-4 fill-current" />
                  <span>Ver Estatísticas & Resultados</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
