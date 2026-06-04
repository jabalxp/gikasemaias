import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Ban, Check, Map, Swords, Play } from 'lucide-react';
import { TeamCrest } from '../components/ui/TeamCrest';
import { realMaps } from '../game/data/realMaps';

export const MapVeto: React.FC = () => {
  const { activeSeries, setScreen, teams } = useGameStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1500); // 1.5s por decisão
  const [isPlaying, setIsPlaying] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSeries) return;
    
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && currentStepIndex < activeSeries.vetoSteps.length) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, animationSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStepIndex, activeSeries, animationSpeed]);

  const isFinished = activeSeries ? currentStepIndex >= activeSeries.vetoSteps.length : false;

  useEffect(() => {
    if (isFinished && countdown === null) {
      setCountdown(3); // Inicia contagem regressiva de 3 segundos para auto-start
    }
  }, [isFinished, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setScreen('matchSim');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, setScreen]);

  if (!activeSeries) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Map className="w-12 h-12 mb-4 text-brand-purple animate-pulse" />
        <p className="text-lg font-semibold">Nenhuma série de mapas ativa encontrada.</p>
      </div>
    );
  }

  const teamA = teams[activeSeries.teamAId];
  const teamB = teams[activeSeries.teamBId];

  if (!teamA || !teamB) return null;

  // Filtra apenas os mapas competitivos
  const mapsPool = realMaps.filter(m => m.status === 'active' || m.status === 'reserve');

  // Mapeia o estado de cada mapa de acordo com os passos simulados até o currentStepIndex
  const getMapState = (mapId: string) => {
    const stepsUntilNow = activeSeries.vetoSteps.slice(0, currentStepIndex);
    
    // Procura se o mapa foi banido ou escolhido
    const foundStep = stepsUntilNow.find(s => s.mapId === mapId);
    if (foundStep) {
      return {
        action: foundStep.action,
        teamId: foundStep.teamId,
        teamName: foundStep.teamName,
      };
    }
    
    // Se a simulação de veto acabou, verifica se é um decider
    if (currentStepIndex >= activeSeries.vetoSteps.length) {
      const deciderStep = activeSeries.vetoSteps.find(s => s.action === 'decider' && s.mapId === mapId);
      if (deciderStep) {
        return {
          action: 'decider' as const,
          teamId: '',
          teamName: 'Decider',
        };
      }
    }
    
    return null;
  };

  // Cores de gradientes neon para cada mapa
  const getMapGradient = (mapId: string) => {
    switch (mapId) {
      case 'de_dust2':
        return 'from-amber-500/20 via-orange-600/10 to-transparent border-amber-500/30';
      case 'de_mirage':
        return 'from-blue-500/20 via-cyan-600/10 to-transparent border-blue-500/30';
      case 'de_inferno':
        return 'from-red-500/20 via-rose-600/10 to-transparent border-red-500/30';
      case 'de_nuke':
        return 'from-cyan-500/20 via-emerald-600/10 to-transparent border-cyan-500/30';
      case 'de_ancient':
        return 'from-emerald-500/20 via-green-600/10 to-transparent border-emerald-500/30';
      case 'de_anubis':
        return 'from-yellow-500/20 via-amber-600/10 to-transparent border-yellow-500/30';
      case 'de_overpass':
        return 'from-indigo-500/20 via-purple-600/10 to-transparent border-indigo-500/30';
      case 'de_vertigo':
        return 'from-zinc-500/20 via-slate-600/10 to-transparent border-zinc-400/30';
      default:
        return 'from-slate-600/20 to-transparent border-slate-500/30';
    }
  };

  // Passo ativo atual
  const activeStep = currentStepIndex < activeSeries.vetoSteps.length 
    ? activeSeries.vetoSteps[currentStepIndex] 
    : null;

  // return se move adiante
  return (
    <div className="space-y-6 select-none bg-[#030306] min-h-screen text-white p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Luzes de Fundo em Neon */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* CABEÇALHO DO VETO */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <Swords className="w-6 h-6 text-brand-cyan animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-white">
              Veto de Mapas
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase">
              Formato: Série MD{activeSeries.bestOf}
            </p>
          </div>
        </div>

        {/* CONTROLES DE ANIMAÇÃO */}
        <div className="flex items-center gap-2">
          {!isFinished && (
            <button
              onClick={() => {
                // Pula direto para o final da simulação
                setCurrentStepIndex(activeSeries.vetoSteps.length);
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-black uppercase text-slate-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 transition"
            >
              Pular Veto
            </button>
          )}

          {isFinished && (
            <button
              onClick={() => setScreen('matchSim')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-emerald-500/20 hover:scale-102 active:scale-98 transition transform duration-150 relative overflow-hidden"
            >
              <Play className="w-4 h-4 fill-black animate-pulse" />
              <span>Entrar no Servidor {countdown !== null && countdown > 0 ? `(${countdown}s)` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* HUD DE DISPUTA / PASSO ATIVO */}
      <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800/60 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
        {/* TIME A */}
        <div className={`flex items-center gap-4 w-5/12 transition-opacity duration-300 ${activeStep?.teamId === activeSeries.teamBId ? 'opacity-40' : 'opacity-100'}`}>
          <TeamCrest team={teamA} size={48} />
          <div>
            <h3 className="text-sm font-black text-white">{teamA.name}</h3>
            <span className="text-[10px] text-brand-cyan font-black uppercase tracking-widest bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/10">
              {activeSeries.teamAId === teamA.id ? 'Pick Principal' : 'Adversário'}
            </span>
          </div>
        </div>

        {/* STATUS CENTRAL */}
        <div className="text-center w-2/12 flex flex-col items-center justify-center z-10 px-4">
          {activeStep ? (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest bg-brand-purple/10 border border-brand-purple/15 px-3 py-1 rounded-full animate-pulse block">
                Escolhendo
              </span>
              <p className="text-xs font-bold text-slate-400">
                Passo {currentStepIndex + 1} de {activeSeries.vetoSteps.length}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/15 px-3 py-1 rounded-full block">
                Veto Concluído
              </span>
              <p className="text-xs font-black text-slate-500 uppercase">Fim</p>
            </div>
          )}
        </div>

        {/* TIME B */}
        <div className={`flex items-center justify-end gap-4 w-5/12 transition-opacity duration-300 ${activeStep?.teamId === activeSeries.teamAId ? 'opacity-40' : 'opacity-100'}`}>
          <div className="text-right">
            <h3 className="text-sm font-black text-white">{teamB.name}</h3>
            <span className="text-[10px] text-brand-purple font-black uppercase tracking-widest bg-brand-purple/10 px-2 py-0.5 rounded-full border border-brand-purple/10">
              {activeSeries.teamAId === teamB.id ? 'Pick Principal' : 'Adversário'}
            </span>
          </div>
          <TeamCrest team={teamB} size={48} />
        </div>
      </div>

      {/* GRID DE MAPAS DA POOL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mapsPool.map((map) => {
          const state = getMapState(map.id);
          const gradientClass = getMapGradient(map.id);
          
          let cardBorderColor = 'border-zinc-800/40 bg-zinc-950/20';
          let actionBadge = null;
          let statusText = 'Em aberto';
          let opacityClass = 'opacity-100';

          if (state) {
            if (state.action === 'ban') {
              cardBorderColor = 'border-red-950 bg-red-950/5';
              opacityClass = 'opacity-30 filter grayscale';
              statusText = 'Banido';
              actionBadge = (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500/15 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-500/20 shadow">
                  <Ban className="w-2.5 h-2.5" />
                  BAN
                </div>
              );
            } else if (state.action === 'pick') {
              const isTeamA = state.teamId === teamA.id;
              cardBorderColor = isTeamA 
                ? 'border-brand-cyan bg-brand-cyan/5 shadow-[0_0_15px_rgba(0,240,255,0.08)]' 
                : 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(112,0,255,0.08)]';
              statusText = `Selecionado por ${state.teamName}`;
              actionBadge = (
                <div className={`absolute top-3 right-3 flex items-center gap-1 ${isTeamA ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/35' : 'bg-brand-purple/20 text-brand-purple border-brand-purple/35'} text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow`}>
                  <Check className="w-2.5 h-2.5" />
                  PICK
                </div>
              );
            } else if (state.action === 'decider') {
              cardBorderColor = 'border-yellow-500/70 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.08)]';
              statusText = 'Mapa Decisivo';
              actionBadge = (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-yellow-500/30 shadow">
                  <Map className="w-2.5 h-2.5 animate-pulse" />
                  DECIDER
                </div>
              );
            }
          }

          return (
            <div
              key={map.id}
              className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-500 flex flex-col justify-between min-h-[175px] ${cardBorderColor} ${opacityClass} group/card`}
            >
              {/* Foto Real de Fundo do Mapa com Zoom no Hover */}
              {map.imageUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover/card:scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${map.imageUrl})` }}
                />
              )}
              {/* Overlays de Vidro & Gradientes Cyberpunk */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/85 backdrop-blur-[1.5px] pointer-events-none" />
              <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-30 pointer-events-none transition-opacity duration-300`} />
              
              {/* Informações Básicas do Mapa (z-index para ficar por cima do bg) */}
              <div className="z-10 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block opacity-80">
                  {map.id.toUpperCase()}
                </span>
                <h4 className="text-lg font-black tracking-wide text-white drop-shadow-md">
                  {map.name}
                </h4>
                {actionBadge}
              </div>

              {/* Estatísticas e Status (z-index para ficar por cima do bg) */}
              <div className="z-10 pt-4 space-y-2 mt-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 border-t border-white/5 pt-2">
                  <span>Ritmo: <strong className="text-white capitalize">{map.pace}</strong></span>
                  <span>Lado: <strong className="text-white uppercase">{map.sideBias === 'balanced' ? 'BAL' : map.sideBias}</strong></span>
                </div>
                
                {/* Status customizado do Veto */}
                <div className={`text-[10px] font-black uppercase tracking-wider text-right drop-shadow ${state?.action === 'ban' ? 'text-red-400' : state?.action === 'pick' ? 'text-brand-cyan' : state?.action === 'decider' ? 'text-yellow-400' : 'text-slate-400 opacity-60'}`}>
                  {statusText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TIMELINE DE PASSOS DE VETO EM TEMPO REAL */}
      <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/40 p-5 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Timeline de Decisões
        </h4>
        <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
          {activeSeries.vetoSteps.slice(0, currentStepIndex).map((step, idx) => {
            const isBan = step.action === 'ban';
            const isDecider = step.action === 'decider';
            
            return (
              <div 
                key={idx} 
                className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-900/40 rounded-lg border border-zinc-800/50 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-600">#{idx + 1}</span>
                  <span className="font-bold text-slate-200">{step.teamName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isBan ? 'bg-red-500/10 text-red-400 border border-red-500/20' : isDecider ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'}`}>
                    {step.action}
                  </span>
                  <span className="font-black text-white">{step.mapName}</span>
                </div>
              </div>
            );
          })}
          
          {currentStepIndex === 0 && (
            <div className="text-xs text-slate-500 font-bold py-2 text-center">
              Aguardando primeira decisão de veto...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
