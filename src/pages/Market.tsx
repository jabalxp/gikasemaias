import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { Search, ShoppingCart, User, Award, Globe, Handshake, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { NegotiationResult, Player } from '../types';

// Estado do painel de negociação aberto (jogador-alvo + última resposta do clube/jogador).
interface NegotiationPanel {
  readonly player: Player;
  valor: number;
  salario: number;
  result: NegotiationResult | null;
}

export const Market: React.FC = () => {
  const players = useGameStore((s) => s.players);
  const teams = useGameStore((s) => s.teams);
  const userTeamId = useGameStore((s) => s.userTeamId);
  const negociarContratacao = useGameStore((s) => s.negociarContratacao);
  const addToast = useGameStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [minOverall, setMinOverall] = useState(0);
  const [panel, setPanel] = useState<NegotiationPanel | null>(null);

  const userTeam = teams[userTeamId];

  // Filtra jogadores de outros times ou free agents
  const availablePlayers = useMemo(
    () =>
      Object.values(players).filter((p) => {
        if (p.teamId === userTeamId) return false; // oculta os do próprio usuário
        if (p.status === 'aposentado') return false;

        const matchesSearch =
          p.nickname.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === '' || p.role === roleFilter;
        const matchesOverall = p.overall >= minOverall;

        return matchesSearch && matchesRole && matchesOverall;
      }),
    [players, userTeamId, search, roleFilter, minOverall]
  );

  // Abre o painel de negociação com oferta inicial sugerida (valor de mercado + salário atual).
  const openNegotiation = (player: Player): void => {
    setPanel({
      player,
      valor: player.value,
      salario: Math.max(player.salary, 1),
      result: null,
    });
  };

  const closeNegotiation = (): void => setPanel(null);

  const submitOffer = (): void => {
    if (!panel) return;
    const result = negociarContratacao(panel.player.id, panel.valor, panel.salario);

    if (result.status === 'aceita') {
      addToast(result.message, 'success');
      setPanel(null);
      return;
    }

    if (result.status === 'recusada') {
      addToast(result.message, result.success ? 'info' : 'error');
    }

    // Mantém o painel aberto para contraproposta/recusa, exibindo a resposta.
    setPanel({ ...panel, result });
  };

  // Aceita a contraproposta: fecha o acordo nos termos do clube (forcarAceite=true), sem reavaliar
  // o interesse — o store só valida o caixa. Evita o loop de gerar nova contraproposta.
  const acceptCounter = (): void => {
    if (!panel || !panel.result?.contraproposta) return;
    const { valor, salario } = panel.result.contraproposta;
    const result = negociarContratacao(panel.player.id, valor, salario, true);
    if (result.success) {
      addToast(result.message, 'success');
      setPanel(null);
      return;
    }
    addToast(result.message, 'error');
    setPanel({ ...panel, valor, salario, result });
  };

  const luvas = panel ? Math.round(panel.valor * 0.1) : 0;
  const custoTotal = panel ? panel.valor + luvas : 0;
  const caixaInsuficiente = panel ? (userTeam?.budget ?? 0) < custoTotal : false;

  // Custo (passe + luvas) da contraproposta vigente, para validar o caixa ao aceitá-la.
  const contraVal = panel?.result?.contraproposta?.valor ?? 0;
  const custoContraproposta = contraVal + Math.round(contraVal * 0.1);
  const caixaInsuficienteContra = panel ? (userTeam?.budget ?? 0) < custoContraproposta : false;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">MERCADO DE CONTRATAÇÕES</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Negocie passe e salário com clubes e jogadores. O clube vendedor avalia o valor ofertado, sua reputação e o
            salário proposto — pode aceitar, recusar ou fazer uma contraproposta.
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
          onClick={() => {
            setSearch('');
            setRoleFilter('');
            setMinOverall(0);
          }}
          className="py-2.5 bg-zinc-950 border border-brand-border hover:bg-zinc-900 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      {/* GRID DE JOGADORES DISPONÍVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlayers.length > 0 ? (
          availablePlayers.map((p) => {
            const currentOwnerTeamName = p.teamId === 'free_agents' ? 'Agente Livre' : (teams[p.teamId]?.name ?? 'IA Team');
            const signingBonus = Math.round(p.value * 0.1);
            const totalCost = p.value + signingBonus;

            return (
              <div
                key={p.id}
                className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col justify-between hover:border-brand-purple/25 transition-all duration-300"
              >
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
                      <span>Salário Atual:</span>
                      <span className="text-white">${p.salary.toLocaleString()}/sem</span>
                    </div>
                    <div className="flex justify-between border-t border-brand-border/20 pt-1.5 text-xs text-brand-cyan">
                      <span>Estimativa de Caixa:</span>
                      <span className="font-extrabold text-neon-cyan">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openNegotiation(p)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold bg-brand-purple hover:bg-brand-purple/80 text-white transition-all duration-200 uppercase tracking-wider glow-purple"
                >
                  <Handshake className="w-4 h-4" />
                  <span>Negociar Contratação</span>
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

      {/* MODAL DE NEGOCIAÇÃO */}
      <AnimatePresence>
        {panel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Negociar contratação de ${panel.player.nickname}`}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeNegotiation} />

            <motion.div
              className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-5 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              {/* CABEÇALHO */}
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border bg-brand-purple/10 border-brand-purple/30 text-brand-purple glow-purple">
                  <Handshake className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    Negociar {panel.player.nickname}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-snug">
                    {panel.player.teamId === 'free_agents'
                      ? 'Agente Livre'
                      : (teams[panel.player.teamId]?.name ?? 'IA Team')}{' '}
                    · OVR {panel.player.overall} · Valor de mercado ${panel.player.value.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* INPUTS DA OFERTA */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Valor do Passe ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={panel.valor}
                    onChange={(e) => setPanel({ ...panel, valor: Math.max(0, Number(e.target.value)), result: null })}
                    className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Salário Semanal ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={panel.salario}
                    onChange={(e) => setPanel({ ...panel, salario: Math.max(0, Number(e.target.value)), result: null })}
                    className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                {/* RESUMO DE CUSTO DE CAIXA */}
                <div className="space-y-1.5 bg-zinc-950/50 p-3 rounded-xl border border-brand-border/40 text-[10px] font-bold text-slate-400">
                  <div className="flex justify-between">
                    <span>Luvas / Assinatura (10%):</span>
                    <span className="text-white">${luvas.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-border/20 pt-1.5 text-xs">
                    <span className="text-brand-cyan">Custo Total de Caixa:</span>
                    <span className={`font-extrabold ${caixaInsuficiente ? 'text-brand-danger' : 'text-neon-cyan text-brand-cyan'}`}>
                      ${custoTotal.toLocaleString()}
                    </span>
                  </div>
                  {caixaInsuficiente && (
                    <p className="text-[10px] text-brand-danger font-bold pt-0.5">Saldo insuficiente para esta oferta.</p>
                  )}
                </div>
              </div>

              {/* RESPOSTA DA NEGOCIAÇÃO */}
              {panel.result && panel.result.status !== 'aceita' && (
                <div
                  className={`mb-4 p-3 rounded-xl border text-[11px] font-semibold leading-snug flex items-start gap-2 ${
                    panel.result.status === 'contraproposta'
                      ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning'
                      : 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger'
                  }`}
                >
                  {panel.result.status === 'contraproposta' ? (
                    <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{panel.result.message}</span>
                </div>
              )}

              {/* AÇÕES */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={closeNegotiation}
                  className="py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-zinc-900 text-slate-300 border border-brand-border hover:border-brand-cyan/40 hover:text-brand-cyan transition-colors"
                >
                  Cancelar
                </button>

                {panel.result?.status === 'contraproposta' && panel.result.contraproposta ? (
                  <button
                    type="button"
                    onClick={acceptCounter}
                    disabled={caixaInsuficienteContra}
                    className="py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-brand-success text-zinc-950 hover:bg-brand-success/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aceitar Contraproposta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitOffer}
                    disabled={caixaInsuficiente}
                    className="py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-brand-cyan text-zinc-950 hover:bg-brand-cyan/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Enviar Oferta
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
