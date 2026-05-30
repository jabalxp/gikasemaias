import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Player } from '../types';
import { Search, Save, Edit3, Trash2, UserPlus, RotateCcw } from 'lucide-react';

export const DataEditor: React.FC = () => {
  const { players, teams, resetarDadosEditor, addToast, editarJogador } = useGameStore();

  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Estados locais do editor do jogador selecionado
  const [nick, setNick] = useState('');
  const [realName, setRealName] = useState('');
  const [role, setRole] = useState<Player['role']>('Rifler');
  const [aim, setAim] = useState(50);
  const [gamesense, setGamesense] = useState(50);
  const [clutch, setClutch] = useState(50);
  const [utility, setUtility] = useState(50);
  const [igl, setIgl] = useState(50);

  const filteredPlayers = Object.values(players).filter(p => 
    p.nickname.toLowerCase().includes(search.toLowerCase()) || 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectPlayer = (p: Player) => {
    setSelectedPlayer(p);
    setNick(p.nickname);
    setRealName(p.name);
    setRole(p.role);
    setAim(p.attributes.aim);
    setGamesense(p.attributes.gamesense);
    setClutch(p.attributes.clutch);
    setUtility(p.attributes.utility);
    setIgl(p.attributes.igl);
  };

  const handleSavePlayer = () => {
    if (!selectedPlayer) return;

    // Atualização IMUTÁVEL via ação do store (antes mutava o objeto direto, sem set/re-render)
    const patch: Partial<Player> = {
      nickname: nick,
      name: realName,
      role,
      attributes: { aim, gamesense, clutch, utility, igl },
      overall: Math.round((aim + gamesense + clutch + utility + igl) / 5),
    };
    editarJogador(selectedPlayer.id, patch);
    setSelectedPlayer({ ...selectedPlayer, ...patch });
    addToast(`Dados do jogador ${nick} salvos e atualizados com sucesso no banco de dados!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-brand-cyan" />
            <span>Editor de Banco de Dados</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Personalize nomes, nicknames, overalls e atributos individuais dos astros do e-sports.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Tem certeza de que deseja resetar TODOS os dados e saves locais de volta para os padrões reais originais?')) {
              resetarDadosEditor();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/25 rounded-lg text-xs font-bold transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resetar Base Padrão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1 E 2: BUSCA E LISTA DE JOGADORES */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl lg:col-span-2 space-y-4 flex flex-col justify-between h-[450px]">
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar nickname ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredPlayers.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedPlayer?.id === p.id 
                      ? 'border-brand-cyan bg-brand-cyan/5' 
                      : 'border-brand-border bg-zinc-950/40 hover:bg-zinc-900/30'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{p.nickname}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{p.role}</span>
                    </p>
                    <span className="text-[9px] text-slate-500 font-semibold truncate block mt-0.5">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-brand-cyan border border-brand-cyan/25 px-1.5 py-0.5 rounded bg-brand-cyan/5">
                    OVR {p.overall}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 3: PAINEL DE EDIÇÃO DO SELECIONADO */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl lg:col-span-1 h-[450px] overflow-y-auto flex flex-col justify-between">
          {selectedPlayer ? (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-brand-border pb-2 flex justify-between items-center">
                  <span>Edição: {selectedPlayer.nickname}</span>
                  <span className="text-[9px] text-brand-cyan border border-brand-cyan/35 px-1.5 py-0.5 rounded bg-brand-cyan/5">
                    OVR {Math.round((aim + gamesense + clutch + utility + igl) / 5)}
                  </span>
                </h3>

                <div className="space-y-3 pt-3">
                  {/* NICKNAME */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nickname</label>
                    <input
                      type="text"
                      value={nick}
                      onChange={(e) => setNick(e.target.value)}
                      className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  {/* NOME REAL */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  {/* FUNÇÃO */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Função</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Player['role'])}
                      className="w-full bg-zinc-950 border border-brand-border text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-cyan"
                    >
                      <option value="Rifler">Rifler</option>
                      <option value="IGL">IGL</option>
                      <option value="AWPer">AWPer</option>
                      <option value="Entry Fragger">Entry Fragger</option>
                      <option value="Lurker">Lurker</option>
                      <option value="Support">Support</option>
                      <option value="Star Player">Star Player</option>
                    </select>
                  </div>

                  {/* SLIDERS DE ATRIBUTOS (Foco csmanager.md) */}
                  <div className="space-y-2 border-t border-brand-border/40 pt-3">
                    <div className="text-[10px] font-bold text-slate-400">
                      <div className="flex justify-between mb-1"><span>Mira (Aim):</span> <span className="text-white font-extrabold">{aim}</span></div>
                      <input type="range" min={1} max={99} value={aim} onChange={(e) => setAim(Number(e.target.value))} className="w-full h-1 bg-zinc-950 rounded-lg cursor-pointer accent-brand-cyan" />
                    </div>

                    <div className="text-[10px] font-bold text-slate-400">
                      <div className="flex justify-between mb-1"><span>Gamesense:</span> <span className="text-white font-extrabold">{gamesense}</span></div>
                      <input type="range" min={1} max={99} value={gamesense} onChange={(e) => setGamesense(Number(e.target.value))} className="w-full h-1 bg-zinc-950 rounded-lg cursor-pointer accent-brand-cyan" />
                    </div>

                    <div className="text-[10px] font-bold text-slate-400">
                      <div className="flex justify-between mb-1"><span>Calma (Clutch):</span> <span className="text-white font-extrabold">{clutch}</span></div>
                      <input type="range" min={1} max={99} value={clutch} onChange={(e) => setClutch(Number(e.target.value))} className="w-full h-1 bg-zinc-950 rounded-lg cursor-pointer accent-brand-cyan" />
                    </div>

                    <div className="text-[10px] font-bold text-slate-400">
                      <div className="flex justify-between mb-1"><span>Utilitárias (Utility):</span> <span className="text-white font-extrabold">{utility}</span></div>
                      <input type="range" min={1} max={99} value={utility} onChange={(e) => setUtility(Number(e.target.value))} className="w-full h-1 bg-zinc-950 rounded-lg cursor-pointer accent-brand-cyan" />
                    </div>

                    <div className="text-[10px] font-bold text-slate-400">
                      <div className="flex justify-between mb-1"><span>Liderança (IGL):</span> <span className="text-brand-purple font-extrabold">{igl}</span></div>
                      <input type="range" min={1} max={99} value={igl} onChange={(e) => setIgl(Number(e.target.value))} className="w-full h-1 bg-zinc-950 rounded-lg cursor-pointer accent-brand-purple" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePlayer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold bg-brand-cyan text-brand-dark hover:bg-brand-cyan/85 transition-colors uppercase tracking-wider mt-4"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs font-semibold text-slate-600 py-20 uppercase tracking-widest">
              Selecione um jogador ao lado para editá-lo
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
