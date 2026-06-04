import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { simulateMapVeto, VetoStep } from '../game/simulation/mapVetoSimulator';
import { realMaps } from '../game/data/realMaps';
import { TeamTactics } from '../types';
import { Sliders, Award, Map, Settings, Play } from 'lucide-react';

export const Tactics: React.FC = () => {
  const { userTeamId, teams, definirTaticas, addToast } = useGameStore();
  const userTeam = teams[userTeamId];

  // Configurações táticas locais
  const [playstyle, setPlaystyle] = useState(userTeam?.tactics.playstyle ?? 'balanced');
  const [tempo, setTempo] = useState(userTeam?.tactics.tempo ?? 'normal');
  const [focus, setFocus] = useState(userTeam?.tactics.focus ?? 'default');
  const [utilityUsage, setUtilityUsage] = useState(userTeam?.tactics.utilityUsage ?? 'high');
  const [economyStyle, setEconomyStyle] = useState(userTeam?.tactics.economyStyle ?? 'balanced');

  // Estado do simulador de veto
  const [vetoMode, setVetoMode] = useState<'MD1' | 'MD3' | 'MD5'>('MD1');
  const [opponentId, setOpponentId] = useState('pain');
  const [vetoSteps, setVetoSteps] = useState<VetoStep[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [showVetoResult, setShowVetoResult] = useState(false);

  if (!userTeam) return null;

  const handleSaveTactics = () => {
    // Persiste via ação do store (set imutável + salvarJogo). Antes mutava o objeto direto
    // e nada era salvo no disco.
    definirTaticas({ playstyle, tempo, focus, utilityUsage, economyStyle });
    addToast('Configurações táticas aplicadas e salvas com sucesso!', 'success');
  };

  const handleRunVeto = () => {
    const opponent = teams[opponentId];
    if (!opponent) return;

    const result = simulateMapVeto(userTeam, opponent, realMaps, vetoMode);
    setVetoSteps(result.steps);
    setSelectedMaps(result.selectedMapIds);
    setShowVetoResult(true);
  };

  const opponents = Object.values(teams).filter(t => t.id !== userTeamId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">SISTEMA TÁTICO & VETOS</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Defina o estilo de jogo e simule o ban/pick de mapas baseado na sua maestria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA 1: AJUSTES TÁTICOS */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-cyan" />
            <span>Configurações Táticas</span>
          </h3>

          <div className="space-y-4">
            {/* ESTILO DE JOGO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estilo de Jogo</label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value as TeamTactics['playstyle'])}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan uppercase"
              >
                <option value="very_aggressive">Muito Agressivo</option>
                <option value="aggressive">Agressivo</option>
                <option value="balanced">Equilibrado / Flexível</option>
                <option value="defensive">Defensivo</option>
                <option value="very_defensive">Muito Defensivo</option>
              </select>
            </div>

            {/* RITMO / TEMPO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ritmo de Jogo</label>
              <select
                value={tempo}
                onChange={(e) => setTempo(e.target.value as TeamTactics['tempo'])}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan uppercase"
              >
                <option value="explosive">Explosivo (Rápido / Entrada Seca)</option>
                <option value="fast">Rápido (Avanço / Busca Pickoff)</option>
                <option value="normal">Normal (Default)</option>
                <option value="slow">Lento (Trabalho de Round / Execuções de Fim)</option>
              </select>
            </div>

            {/* FOCO TÁTICO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foco Tático Principal</label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value as TeamTactics['focus'])}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan uppercase"
              >
                <option value="default">Default / Controle de Mapa Neutro</option>
                <option value="map_control">Domínio Territorial e Avanços</option>
                <option value="execute">Execução Completa nos Bombs</option>
                <option value="pickoffs">Picks de AWP e Isolamento</option>
                <option value="retake">Retake de C4 Coordenado</option>
                <option value="mid_control">Controle Rígido do Meio</option>
              </select>
            </div>

            {/* USO DE UTILITÁRIAS */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uso de Utilitários</label>
              <select
                value={utilityUsage}
                onChange={(e) => setUtilityUsage(e.target.value as TeamTactics['utilityUsage'])}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan uppercase"
              >
                <option value="low">Baixo (Duelos Físicos)</option>
                <option value="medium">Médio (Flashs de Entrada)</option>
                <option value="high">Alto (Esmolas, Smokes & Molotovs)</option>
                <option value="very_high">Muito Alto (Execuções Milimétricas)</option>
              </select>
            </div>

            {/* ESTILO ECONÔMICO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gestão Econômica</label>
              <select
                value={economyStyle}
                onChange={(e) => setEconomyStyle(e.target.value as TeamTactics['economyStyle'])}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan uppercase"
              >
                <option value="eco">Econômica (Poupa para Full Buys)</option>
                <option value="balanced">Equilibrada (Default)</option>
                <option value="force">Forçada (Pressão Constante)</option>
                <option value="aggressive">Agressiva (Compra Sempre)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveTactics}
            className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan/80 text-brand-dark text-xs font-extrabold rounded-xl transition-all duration-200 uppercase tracking-wider glow-cyan"
          >
            Aplicar Configurações Táticas
          </button>
        </div>

        {/* COLUNA 2: SIMULADOR DE VETO DE MAPAS */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Map className="w-4 h-4 text-brand-purple" />
            <span>Simulador de Vetos (Beto)</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* FORMATO */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Formato</label>
                <select
                  value={vetoMode}
                  onChange={(e) => setVetoMode(e.target.value as 'MD1' | 'MD3' | 'MD5')}
                  className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan"
                >
                  <option value="MD1">MD1 (1 Mapa)</option>
                  <option value="MD3">MD3 (3 Mapas)</option>
                  <option value="MD5">MD5 (5 Mapas)</option>
                </select>
              </div>

              {/* OPONENTE */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Oponente</label>
                <select
                  value={opponentId}
                  onChange={(e) => setOpponentId(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan"
                >
                  {opponents.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunVeto}
              className="w-full py-3 bg-brand-purple hover:bg-brand-purple/80 text-white text-xs font-extrabold rounded-xl transition-all duration-200 uppercase tracking-wider glow-purple"
            >
              Simular Veto de Mapas
            </button>
          </div>

          {/* FLUXO DO VETO SIMULADO */}
          {showVetoResult && (
            <div className="bg-zinc-950 border border-brand-border p-4 rounded-xl space-y-3.5 max-h-52 overflow-y-auto">
              <h4 className="text-xs font-black text-brand-cyan uppercase tracking-wider border-b border-brand-border/40 pb-2">
                Linha do Tempo de Vetos
              </h4>
              
              <div className="space-y-1.5">
                {vetoSteps.map((step, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">
                      [{step.teamName}]
                    </span>
                    <span className={`uppercase font-black px-1.5 py-0.5 rounded text-[8px] ${
                      step.action === 'ban' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-success/10 text-brand-success'
                    }`}>
                      {step.action}
                    </span>
                    <span className="text-white font-extrabold">{step.mapName}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-border/40 pt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mr-1">Map Pool Escolhido:</span>
                {selectedMaps.map(id => {
                  const name = realMaps.find(m => m.id === id)?.name ?? id;
                  return (
                    <span key={id} className="text-[9px] font-extrabold text-brand-cyan border border-brand-cyan/25 px-2 py-0.5 rounded bg-brand-cyan/5">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
