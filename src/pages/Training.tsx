import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Dumbbell, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

export const Training: React.FC = () => {
  const { userTeamId, teams, players, definirTreinoSemanal, trainingPlan, addToast } = useGameStore();
  const userTeam = teams[userTeamId];

  const [intensity, setIntensity] = useState<'leve' | 'normal' | 'pesada' | 'bootcamp'>(trainingPlan.intensity);
  const [focus, setFocus] = useState<string>(trainingPlan.focus);

  if (!userTeam) return null;

  const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');

  const intensities = [
    { id: 'leve', label: 'Treino Leve', desc: 'Foco na recuperação física e moral dos atletas. Evolução lenta, mas restaura Stamina (+15) e Moral (+5).', cost: 'Custo: Grátis' },
    { id: 'normal', label: 'Treino Padrão', desc: 'Plano moderado de treino. Equilibra evolução média de atributos com desgaste moderado de Stamina (-5).', cost: 'Custo: Grátis' },
    { id: 'pesada', label: 'Treino Pesado', desc: 'Rotina exaustiva de exercícios. Acelera evolução de Mira e Tática, mas gera desgaste massivo (-15 Stamina).', cost: 'Custo: Grátis' },
    { id: 'bootcamp', label: 'Bootcamp Intensivo', desc: 'Viagem de imersão tática internacional. Buff de +3 em Sinergia e +1 em todos os atributos, consome $50.000.', cost: 'Custo: $50.000' }
  ];

  const handleApplyTraining = () => {
    // Persiste o plano no store; o avanço de semana aplica os efeitos de verdade.
    const result = definirTreinoSemanal(intensity, focus);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">CENTRO DE TREINAMENTO</h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Planeje a rotina semanal de treinos dos seus jogadores. Cuidado com o esgotamento físico do elenco titular!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CONFIGURAÇÃO DO PLANO */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-brand-success" />
            <span>Configurar Plano Semanal</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Intensidade do Plano</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {intensities.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setIntensity(item.id as 'leve' | 'normal' | 'pesada' | 'bootcamp')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                      intensity === item.id
                        ? 'border-brand-success bg-brand-success/10'
                        : 'border-brand-border bg-zinc-950 hover:bg-zinc-900/50'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-white flex justify-between">
                      <span>{item.label}</span>
                      <span className="text-[9px] text-brand-cyan uppercase tracking-wider">{item.cost}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foco do Treino</label>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan"
                >
                  <option value="aim">Mira (Aim) & Mecânica</option>
                  <option value="spray">Controle de Recuo (Spray)</option>
                  <option value="gamesense">Leitura Tática & Gamesense</option>
                  <option value="utility">Uso de Utilitárias (Granadas)</option>
                  <option value="clutch">Calma em Clutches (1vX)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyTraining}
            className="w-full py-3 bg-brand-success hover:bg-brand-success/80 text-brand-dark text-xs font-extrabold rounded-xl transition-all duration-200 uppercase tracking-wider"
          >
            Confirmar Plano de Treinamento
          </button>
        </div>

        {/* STATUS DO ELENCO TITULAR */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-cyan" />
            <span>Fadiga do Elenco Titular</span>
          </h3>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {userSquad.map(p => (
              <div key={p.id} className="p-3 bg-zinc-950 border border-brand-border rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>{p.nickname}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{p.role}</span>
                  </p>
                  <span className="text-[9px] text-brand-cyan font-bold block mt-0.5">OVR {p.overall}</span>
                </div>
                <div className="text-right w-20">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 text-brand-warning" /> Stamina</span>
                    <span className="text-white font-black">{Math.round(p.energy)}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-warning h-full rounded-full" style={{ width: `${p.energy}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl flex gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-cyan shrink-0" />
            <p className="text-[10px] text-brand-cyan font-bold leading-normal">
              Jogadores com energia menor que 70% sofrem de estresse físico e cansaço, resultando em decréscimo temporário de seus atributos e mira nas partidas de campeonato!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
