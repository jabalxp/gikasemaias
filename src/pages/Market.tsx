import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Search, ShoppingCart, User, Award, Globe } from 'lucide-react';

export const Market: React.FC = () => {
  const { players, teams, userTeamId, fazerPropostaContratacao } = useGameStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [minOverall, setMinOverall] = useState(0);

  const userTeam = teams[userTeamId];

  // Filtra jogadores de outros times ou free agents
  const availablePlayers = Object.values(players).filter(p => {
    if (p.teamId === userTeamId) return false; // oculta os do próprio usuário
    if (p.status === 'aposentado') return false;

    const matchesSearch = p.nickname.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === '' || p.role === roleFilter;
    const matchesOverall = p.overall >= minOverall;

    return matchesSearch && matchesRole && matchesOverall;
  });

  const handleBuy = (id: string) => {
    const p = players[id];
    if (!p) return;

    const luvas = Math.round(p.value * 0.1);
    const cost = p.value + luvas;

    if (confirm(`Deseja mesmo contratar [${p.role}] ${p.nickname}?\n\nCusto do Passe: $${p.value.toLocaleString()}\nLuvas (10%): $${luvas.toLocaleString()}\nCusto Total: $${cost.toLocaleString()}\n\nSeu Caixa Atual: $${userTeam.budget.toLocaleString()}`)) {
      const res = fazerPropostaContratacao(id);
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">MERCADO DE CONTRATAÇÕES</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Negocie e assine passes com os melhores atletas do mundo. Certifique-se de ter fundos para pagar o passe e as luvas de assinatura (10%).
          </p>
        </div>
        <div className="bg-zinc-950 px-4 py-2 border border-brand-border rounded-xl">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Seu Saldo</span>
          <span className="text-base font-black text-brand-cyan text-neon-cyan">${userTeam?.budget.toLocaleString()}</span>
        </div>
      </div>

      {/* SEÇÃO DE FILTROS */}
      <div className="bg-brand-card border border-brand-border p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* BUSCA POR TEXTO */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Buscar Nick/Nome</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Ex: FalleN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        {/* FILTRO POR FUNÇÃO */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filtrar por Função</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-brand-border text-slate-300 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-cyan"
          >
            <option value="">Todas as Funções</option>
            <option value="AWPer">AWPer</option>
            <option value="IGL">IGL</option>
            <option value="Rifler">Rifler</option>
            <option value="Entry Fragger">Entry Fragger</option>
            <option value="Lurker">Lurker</option>
            <option value="Support">Support</option>
            <option value="Star Player">Star Player</option>
          </select>
        </div>

        {/* OVERALL MÍNIMO */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Overall Mínimo</label>
          <select
            value={minOverall}
            onChange={(e) => setMinOverall(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-brand-border text-slate-300 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-cyan"
          >
            <option value={0}>Qualquer Geral</option>
            <option value={85}>OVR 85+</option>
            <option value={80}>OVR 80+</option>
            <option value={75}>OVR 75+</option>
            <option value={70}>OVR 70+</option>
          </select>
        </div>

        <button
          onClick={() => { setSearch(''); setRoleFilter(''); setMinOverall(0); }}
          className="py-2.5 bg-zinc-950 border border-brand-border hover:bg-zinc-900 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      {/* GRID DE JOGADORES DISPONÍVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlayers.length > 0 ? (
          availablePlayers.map(p => {
            const currentOwnerTeamName = p.teamId === 'free_agents' ? 'Agente Livre' : (teams[p.teamId]?.name ?? 'IA Team');
            const signingBonus = Math.round(p.value * 0.1);
            const totalCost = p.value + signingBonus;
            
            return (
              <div key={p.id} className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col justify-between hover:border-brand-purple/25 transition-all duration-300">
                <div>
                  {/* HEADER CARD */}
                  <div className="flex justify-between items-start mb-3 border-b border-brand-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-brand-border">
                        <User className="w-4.5 h-4.5 text-brand-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">{p.nickname}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">{p.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-brand-purple border border-brand-purple/35 px-2 py-0.5 rounded bg-brand-purple/5">
                      OVR {p.overall}
                    </span>
                  </div>

                  {/* INFO PRINCIPAIS */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 mb-4 bg-zinc-950/40 p-3 rounded-xl border border-brand-border/40">
                    <div className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-500" /> {p.nationality}</div>
                    <div className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-slate-500" /> {p.role}</div>
                    <div className="col-span-2 pt-1.5 border-t border-brand-border/40 text-[9px] text-slate-500 uppercase tracking-wider truncate">
                      Equipe Atual: <span className="text-white font-extrabold">{currentOwnerTeamName}</span>
                    </div>
                  </div>

                  {/* CUSTOS DE CONTRATAÇÃO */}
                  <div className="space-y-1.5 border-t border-brand-border/40 pt-3.5 mb-4 text-[10px] font-bold text-slate-400">
                    <div className="flex justify-between">
                      <span>Valor do Passe:</span>
                      <span className="text-white">${p.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Luvas / Assinatura (10%):</span>
                      <span className="text-white">${signingBonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-brand-border/20 pt-1.5 text-xs text-brand-cyan">
                      <span>Custo Total de Caixa:</span>
                      <span className="font-extrabold text-neon-cyan">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(p.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold bg-brand-purple hover:bg-brand-purple/80 text-white transition-all duration-200 uppercase tracking-wider glow-purple"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Propor Contratação</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 text-center text-xs font-semibold text-slate-600 py-20 bg-brand-card border border-brand-border rounded-2xl">
            Nenhum jogador correspondente aos filtros encontrado no mercado global.
          </div>
        )}
      </div>
    </div>
  );
};
