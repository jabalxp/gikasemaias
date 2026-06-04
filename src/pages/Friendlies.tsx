import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { TeamCrest } from '../components/ui/TeamCrest';
import { Swords, Search, ShieldAlert } from 'lucide-react';

/**
 * Amistosos sob demanda (F5): permite DESAFIAR qualquer time a qualquer momento, com filtro por
 * tier e busca por nome. O amistoso é neutro (não mexe em ranking/reputação/caixa — ver
 * finalizarPartidaAtiva): serve para testar táticas e o elenco contra adversários à escolha.
 */
type TierFiltro = 'todos' | 1 | 2 | 3 | 4;

export const Friendlies: React.FC = () => {
  const { teams, userTeamId, iniciarPartidaContra, addToast, players, setScreen } = useGameStore();
  const userTeam = teams[userTeamId];
  const [busca, setBusca] = useState('');
  const [tierFiltro, setTierFiltro] = useState<TierFiltro>('todos');

  const userSquad = Object.values(players).filter((p) => p.teamId === userTeamId && p.status === 'titular');

  const lista = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return Object.values(teams)
      .filter((t) => t.id !== userTeamId && t.id !== 'free_agents')
      .filter((t) => tierFiltro === 'todos' || t.tier === tierFiltro)
      .filter((t) => t.name.toLowerCase().includes(termo) || t.tag.toLowerCase().includes(termo))
      .sort((a, b) => b.points - a.points);
  }, [teams, userTeamId, tierFiltro, busca]);

  if (!userTeam) return null;

  const desafiar = (id: string, nome: string): void => {
    const success = iniciarPartidaContra(id, 'amistoso');
    if (success) {
      addToast(`Amistoso contra ${nome} iniciado!`, 'success');
    }
  };

  const tiers: TierFiltro[] = ['todos', 1, 2, 3, 4];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Swords className="w-5 h-5 text-brand-cyan" />
          <span>Amistosos</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Desafie qualquer organização para um treino. Amistosos NÃO afetam ranking, reputação ou caixa —
          são para testar táticas, mapas e a forma do elenco sem riscos.
        </p>

        {/* AVISO CRÍTICO DE ESCALAÇÃO INCOMPLETA */}
        {userSquad.length < 5 && (
          <div className="mt-4 p-3.5 rounded-xl border border-brand-danger/30 bg-brand-danger/5 text-xs text-brand-danger font-bold uppercase tracking-wider flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-brand-danger animate-pulse" />
              <span>⚠️ Elenco Incompleto! Você precisa de exatamente 5 titulares escalados para jogar amistosos.</span>
            </div>
            <button
              onClick={() => setScreen('squad')}
              className="px-3.5 py-1.5 rounded-lg bg-brand-danger text-white text-[10px] font-black hover:bg-brand-danger/80 transition-colors uppercase self-start sm:self-auto"
            >
              Escalar Agora
            </button>
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar time por nome ou tag..."
            className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan"
          />
        </div>
        <div className="flex gap-1.5">
          {tiers.map((t) => (
            <button
              key={String(t)}
              onClick={() => setTierFiltro(t)}
              className={`px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                tierFiltro === t ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40' : 'text-slate-400 border border-brand-border hover:text-white'
              }`}
            >
              {t === 'todos' ? 'Todos' : `Tier ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE TIMES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lista.map((team) => (
          <div key={team.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-center gap-3 hover:border-brand-cyan/30 transition-colors">
            <TeamCrest team={team} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{team.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Tier {team.tier} • {team.region} • {team.points.toLocaleString()} pts
              </p>
            </div>
            <button
              disabled={userSquad.length < 5}
              onClick={() => desafiar(team.id, team.name)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                userSquad.length < 5
                  ? 'bg-zinc-800 text-slate-500 border border-brand-border cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-105 active:scale-95 transition-transform'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Desafiar</span>
            </button>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="text-sm text-slate-500 font-semibold col-span-full text-center py-8">Nenhum time encontrado com esses filtros.</p>
        )}
      </div>
    </div>
  );
};
