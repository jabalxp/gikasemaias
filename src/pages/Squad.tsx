import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { UserCheck, UserMinus, Shield, Zap, Target, Star, Skull, User } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const Squad: React.FC = () => {
  const { players, userTeamId, definirTitular, definirPapelEspecial, venderJogador, setSelectedPlayerId, setScreen, addToast } = useGameStore();

  const [sellPlayerId, setSellPlayerId] = useState<string | null>(null);
  const sellPlayer = sellPlayerId ? players[sellPlayerId] : undefined;

  const userPlayers = Object.values(players).filter(p => p.teamId === userTeamId);

  const titulares = userPlayers.filter(p => p.status === 'titular');
  const reservas = userPlayers.filter(p => p.status === 'reserva');

  const handleStatusChange = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'titular' ? 'reserva' : 'titular';
    // Feedback explícito ao tentar escalar com o time já cheio (antes o store negava em silêncio)
    if (nextStatus === 'titular' && titulares.length >= 5) {
      addToast('Você já tem 5 titulares escalados. Reserve um jogador antes de escalar outro.', 'warning');
      return;
    }
    definirTitular(id, nextStatus);
  };

  const handleRoleChange = (id: string, role: 'IGL' | 'AWPer' | 'Rifler') => {
    definirPapelEspecial(id, role);
  };

  const handleSell = (id: string) => {
    setSellPlayerId(id);
  };

  const handleConfirmSell = () => {
    if (!sellPlayerId) return;
    const res = venderJogador(sellPlayerId);
    addToast(res.message, res.success ? 'success' : 'error');
    setSellPlayerId(null);
  };

  // Renderiza card do jogador
  const renderPlayerCard = (p: typeof userPlayers[0]) => {
    const isIGL = p.role === 'IGL';
    const isAWPer = p.role === 'AWPer';

    return (
      <div key={p.id} className="p-4 bg-zinc-950 border border-brand-border rounded-xl flex flex-col justify-between hover:border-brand-cyan/25 transition-all duration-300">
        <div>
          {/* HEADER CARD */}
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <p className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                <span>{p.nickname}</span>
                {isIGL && <span title="Capitão IGL"><Shield className="w-3.5 h-3.5 text-brand-purple fill-brand-purple/20" /></span>}
                {isAWPer && <span title="AWPer Principal"><Target className="w-3.5 h-3.5 text-brand-cyan" /></span>}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[130px]">{p.name}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-brand-cyan border border-brand-cyan/35 px-1.5 py-0.5 rounded bg-brand-cyan/5 text-neon-cyan">
                OVR {p.overall}
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                POT {p.potential}
              </span>
            </div>
          </div>

          {/* DETALHES DE ATRIBUTOS (Foco csmanager.md) */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-400 bg-zinc-900/50 p-2 rounded-lg border border-brand-border/40 mb-3.5">
            <div>Mira: <span className="text-white font-black">{p.attributes.aim}</span></div>
            <div>Gamesense: <span className="text-white font-black">{p.attributes.gamesense}</span></div>
            <div>Clutch: <span className="text-white font-black">{p.attributes.clutch}</span></div>
            <div>Utility: <span className="text-white font-black">{p.attributes.utility}</span></div>
            <div className="col-span-2">Liderança: <span className="text-brand-purple font-black">{p.attributes.igl}</span></div>
          </div>

          {/* STATUS VITAIS (STAMINA E MORAL) */}
          <div className="space-y-1.5 mb-3.5">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-brand-warning fill-brand-warning/10" /> Energia</span>
              <span className="text-white font-black">{Math.round(p.energy)}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-warning h-full rounded-full" style={{ width: `${p.energy}%` }} />
            </div>

            <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-brand-cyan fill-brand-cyan/10" /> Satisfação</span>
              <span className="text-white font-black">{p.moral}/100</span>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-brand-border/40">
          <button
            onClick={() => handleStatusChange(p.id, p.status)}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-colors uppercase ${
              p.status === 'titular'
                ? 'bg-zinc-900 text-brand-danger hover:bg-zinc-800 border border-brand-border'
                : 'bg-brand-success text-brand-dark hover:bg-brand-success/80'
            }`}
          >
            {p.status === 'titular' ? (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>Reservar</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Escalar</span>
              </>
            )}
          </button>

          {p.status === 'titular' ? (
            <select
              onChange={(e) => handleRoleChange(p.id, e.target.value as 'IGL' | 'AWPer' | 'Rifler')}
              value={p.role}
              className="bg-zinc-900 text-slate-300 text-[10px] font-extrabold rounded-lg px-2 py-1.5 border border-brand-border focus:outline-none uppercase"
            >
              <option value="Rifler">Rifler (Padrão)</option>
              <option value="IGL">Tornar IGL</option>
              <option value="AWPer">Tornar AWPer</option>
            </select>
          ) : (
            <button
              onClick={() => handleSell(p.id)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-extrabold bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/25"
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Vender</span>
            </button>
          )}
        </div>

        {/* VER PERFIL (drill-down) */}
        <button
          onClick={() => { setSelectedPlayerId(p.id); setScreen('playerProfile'); }}
          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-extrabold bg-zinc-900 text-slate-300 hover:text-brand-cyan border border-brand-border hover:border-brand-cyan/40 transition-colors uppercase"
        >
          <User className="w-3.5 h-3.5" />
          <span>Ver Perfil</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA PÁGINA */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">GERENCIAMENTO DE ELENCO</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Mantenha exatamente 5 jogadores titulares. Substitua jogadores fatigados para manter o rendimento tático.
          </p>
        </div>
        <div className="bg-zinc-950 px-4 py-2 border border-brand-border rounded-xl">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Titulares Escalados</span>
          <span className={`text-base font-black ${titulares.length === 5 ? 'text-brand-success' : 'text-brand-danger'}`}>
            {titulares.length} / 5
          </span>
        </div>
      </div>

      {/* SEÇÃO: TITULARES ATIVOS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan glow-cyan" />
          <span>Elenco Titular (Escalados)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {titulares.length > 0 ? (
            titulares.map(renderPlayerCard)
          ) : (
            <div className="col-span-5 text-center text-xs font-bold text-brand-danger py-10 bg-brand-card border border-brand-border rounded-xl">
              NENHUM JOGADOR ESCALADO. ADICIONE 5 TITULARES!
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO: RESERVAS DO BANCO */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Banco de Reservas</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {reservas.length > 0 ? (
            reservas.map(renderPlayerCard)
          ) : (
            <div className="col-span-5 text-center text-xs font-semibold text-slate-600 py-10 bg-brand-card border border-brand-border rounded-xl">
              Nenhum jogador na reserva do banco.
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!sellPlayer}
        danger
        title="Vender Jogador"
        message={sellPlayer ? `Confirmar a venda de ${sellPlayer.nickname}? Ele será colocado na lista de transferências e removido do seu elenco.` : ''}
        confirmLabel="Vender"
        onConfirm={handleConfirmSell}
        onCancel={() => setSellPlayerId(null)}
      />
    </div>
  );
};
