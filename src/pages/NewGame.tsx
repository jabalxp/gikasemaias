import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { realTeams } from '../game/data/realTeams';
import { ArrowLeft, Play, ShieldAlert, Award } from 'lucide-react';

export const NewGame: React.FC = () => {
  const { iniciarCarreira, setScreen } = useGameStore();

  // Inputs básicas
  const [managerName, setManagerName] = useState('');
  const [managerNationality, setManagerNationality] = useState('Brasil');
  const [difficulty, setDifficulty] = useState<'facil' | 'normal' | 'dificil' | 'hardcore'>('normal');
  const [startMode, setStartMode] = useState<'real' | 'custom'>('real');

  // Time Real Selecionado
  const [selectedTeamId, setSelectedTeamId] = useState('furia');

  // Inputs de Organização Customizada
  const [orgName, setOrgName] = useState('');
  const [orgTag, setOrgTag] = useState('');
  const [colorPri, setColorPri] = useState('#00f0ff');
  const [colorSec, setColorSec] = useState('#8a2be2');

  const difficulties = [
    { id: 'facil', label: 'Fácil', cash: '$1.000.000', desc: 'Ideal para iniciantes. Orçamento farto para grandes contratações.' },
    { id: 'normal', label: 'Normal', cash: '$500.000', desc: 'A experiência equilibrada do manager profissional.' },
    { id: 'dificil', label: 'Difícil', cash: '$250.000', desc: 'Orçamento enxuto. Exige controle rígido da folha salarial.' },
    { id: 'hardcore', label: 'Hardcore', cash: '$100.000', desc: 'Desafio extremo. Venda de astros obrigatória para sobreviver.' }
  ];

  // Filtra times reais mais famosos de Tier 1 e 2 para escolher no início
  const availableTeams = Object.values(realTeams).filter(t => t.tier <= 2);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName.trim()) return alert('Insira seu nome de Manager.');

    if (startMode === 'custom') {
      if (!orgName.trim() || !orgTag.trim()) return alert('Preencha os dados da sua organização.');
      iniciarCarreira(managerName, managerNationality, 'custom', difficulty, {
        name: orgName,
        tag: orgTag.toUpperCase(),
        colorPrimary: colorPri,
        colorSecondary: colorSec
      });
    } else {
      iniciarCarreira(managerName, managerNationality, selectedTeamId, difficulty);
    }
  };

  return (
    <div className="min-h-screen bg-[#030306] text-white flex flex-col items-center p-8 select-none relative overflow-y-auto">
      <div className="w-full max-w-4xl flex items-center gap-4 mb-8 z-10">
        <button
          onClick={() => setScreen('home')}
          className="p-2 bg-zinc-900 border border-brand-border hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black">CRIAR NOVA CARREIRA</h1>
          <p className="text-xs text-slate-400 font-semibold">Configure os detalhes da sua jornada como manager</p>
        </div>
      </div>

      <form onSubmit={handleStart} className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10 mb-8">
        
        {/* COLUNA DA ESQUERDA: CADASTRO DO MANAGER E DIFICULDADE */}
        <div className="space-y-6 bg-brand-card border border-brand-border p-6 rounded-2xl">
          <h2 className="text-base font-extrabold text-brand-cyan uppercase tracking-wider border-b border-brand-border pb-3 text-neon-cyan">
            1. Perfil do Treinador
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Manager</label>
              <input
                type="text"
                required
                placeholder="Ex: Gabriel FalleN"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-3 focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nacionalidade</label>
              <select
                value={managerNationality}
                onChange={(e) => setManagerNationality(e.target.value)}
                className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-3 focus:outline-none focus:border-brand-cyan"
              >
                <option value="Brasil">Brasil</option>
                <option value="Argentina">Argentina</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="França">França</option>
                <option value="Ucrânia">Ucrânia</option>
                <option value="Rússia">Rússia</option>
                <option value="Dinamarca">Dinamarca</option>
              </select>
            </div>
          </div>

          <h2 className="text-base font-extrabold text-brand-purple uppercase tracking-wider border-b border-brand-border pb-3 pt-2 text-neon-purple">
            2. Nível de Dificuldade
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {difficulties.map((diff) => (
              <div
                key={diff.id}
                onClick={() => setDifficulty(diff.id as 'facil' | 'normal' | 'dificil' | 'hardcore')}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                  difficulty === diff.id
                    ? 'border-brand-purple bg-brand-purple/10'
                    : 'border-brand-border bg-zinc-950 hover:bg-zinc-900/50'
                }`}
              >
                <p className="text-sm font-bold text-white flex justify-between">
                  <span>{diff.label}</span>
                  <span className="text-[10px] text-brand-cyan uppercase font-extrabold tracking-wider">{diff.cash}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">{diff.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA DA DIREITA: ESCOLHA DO TIME */}
        <div className="space-y-6 bg-brand-card border border-brand-border p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-brand-success uppercase tracking-wider border-b border-brand-border pb-3">
              3. Modo de Organização
            </h2>

            {/* ABAS MODO REAL OU CUSTOM */}
            <div className="grid grid-cols-2 gap-2 mt-4 mb-5">
              <button
                type="button"
                onClick={() => setStartMode('real')}
                className={`py-2 rounded-lg text-xs font-extrabold tracking-wider transition-colors ${
                  startMode === 'real'
                    ? 'bg-brand-success text-brand-dark'
                    : 'bg-zinc-950 border border-brand-border text-slate-400 hover:text-white'
                }`}
              >
                TIME EXISTENTE (REAL)
              </button>
              <button
                type="button"
                onClick={() => setStartMode('custom')}
                className={`py-2 rounded-lg text-xs font-extrabold tracking-wider transition-colors ${
                  startMode === 'custom'
                    ? 'bg-brand-success text-brand-dark'
                    : 'bg-zinc-950 border border-brand-border text-slate-400 hover:text-white'
                }`}
              >
                CRIAR ORG. DO ZERO
              </button>
            </div>

            {/* RENDERIZAÇÃO CONFORME MODO */}
            {startMode === 'real' ? (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Selecione o Time Real</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 border border-brand-border rounded-lg bg-zinc-950/40 p-2">
                  {availableTeams.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedTeamId === t.id
                          ? 'border-brand-success bg-brand-success/15'
                          : 'border-brand-border bg-zinc-950 hover:bg-zinc-900/50'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center font-black text-xs text-brand-dark"
                        style={{ backgroundColor: t.colorPrimary, color: t.colorPrimary === '#ffffff' ? '#000' : '#fff' }}
                      >
                        {t.tag}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white truncate max-w-[100px]">{t.name}</p>
                        <span className="text-[10px] text-slate-500 font-bold uppercase truncate">{t.region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome da Organização</label>
                  <input
                    type="text"
                    placeholder="Ex: Imperial Dogs"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sigla / Tag</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Ex: IMPD"
                    value={orgTag}
                    onChange={(e) => setOrgTag(e.target.value)}
                    className="w-full bg-zinc-950 border border-brand-border text-white text-sm font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cor Primária</label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-brand-border p-2.5 rounded-lg">
                      <input
                        type="color"
                        value={colorPri}
                        onChange={(e) => setColorPri(e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-300 uppercase">{colorPri}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cor Secundária</label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-brand-border p-2.5 rounded-lg">
                      <input
                        type="color"
                        value={colorSec}
                        onChange={(e) => setColorSec(e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-300 uppercase">{colorSec}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTÃO CONFIRMAR E INICIAR */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 hover:shadow-lg hover:shadow-brand-cyan/20 active:scale-98 transition-all duration-300 mt-6"
          >
            <Play className="w-5 h-5 fill-brand-dark" />
            <span>INICIAR CARREIRA</span>
          </button>
        </div>

      </form>
    </div>
  );
};
