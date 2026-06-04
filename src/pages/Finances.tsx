import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { DollarSign, Wallet, Calendar, ShieldCheck, Trophy, Repeat, XCircle } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const Finances: React.FC = () => {
  const {
    userTeamId,
    teams,
    sponsors,
    assinarPatrocinio,
    rescindirPatrocinio,
    renegociarPatrocinio,
    financialHistory,
    addToast,
  } = useGameStore();
  const userTeam = teams[userTeamId];

  const [confirmRescind, setConfirmRescind] = useState(false);

  if (!userTeam) return null;

  const sponsorList = Object.values(sponsors);
  const activeSponsor = userTeam.sponsorId ? sponsors[userTeam.sponsorId] : undefined;
  const weeksRemaining = userTeam.sponsorWeeksRemaining ?? 0;
  const canRenegotiate = !!activeSponsor && weeksRemaining <= 4;
  const progressPct = activeSponsor
    ? Math.max(0, Math.min(100, (weeksRemaining / activeSponsor.durationWeeks) * 100))
    : 0;
  const estimatedPenalty = activeSponsor
    ? Math.max(0, Math.round(activeSponsor.weeklyIncome * weeksRemaining * 0.2))
    : 0;

  const handleSignSponsor = (id: string): void => {
    const sp = sponsors[id];
    if (!sp) return;
    const result = assinarPatrocinio(id);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  const handleRenegotiate = (): void => {
    const result = renegociarPatrocinio();
    addToast(result.message, result.success ? 'success' : 'error');
  };

  const handleRescind = (): void => {
    if (!activeSponsor) return;
    setConfirmRescind(true);
  };

  const handleConfirmRescind = (): void => {
    const result = rescindirPatrocinio();
    addToast(result.message, result.success ? 'success' : 'error');
    setConfirmRescind(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-cyan" />
            <span>Finanças & Quadro de Patrocínios</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Acompanhe a folha salarial da comissão técnica e assine contratos lucrativos de patrocínio com base na reputação do seu time.
          </p>
        </div>
        <div className="bg-zinc-950 px-4 py-2 border border-brand-border rounded-xl">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Seu Caixa</span>
          <span className="text-base font-black text-brand-cyan text-neon-cyan">${userTeam.budget.toLocaleString()}</span>
        </div>
      </div>

      {/* PAINEL DO PATROCINADOR ATIVO */}
      {activeSponsor && (
        <div className="bg-brand-card border border-brand-success/40 p-5 rounded-2xl glow-cyan">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-success" />
                <span>Patrocinador Ativo</span>
              </h3>
              <p className="text-lg font-black text-white mt-1">{activeSponsor.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Semanas Restantes</span>
              <span className="text-2xl font-black text-brand-cyan text-neon-cyan flex items-center justify-end gap-1.5">
                <Calendar className="w-4 h-4" />
                {weeksRemaining}
              </span>
            </div>
          </div>

          {/* Barra de progresso do contrato */}
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-brand-border mb-1.5">
            <div
              className="h-full bg-brand-success transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[9px] font-bold text-slate-500 mb-4 text-right">
            {weeksRemaining} de {activeSponsor.durationWeeks} semanas
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-[10px] font-bold text-slate-500 bg-zinc-950 p-3 rounded-lg border border-brand-border mb-4">
            <div>Receita Semanal: <span className="text-white font-extrabold block mt-0.5">${activeSponsor.weeklyIncome.toLocaleString()}</span></div>
            <div>Bônus Vitória: <span className="text-brand-cyan font-extrabold block mt-0.5">${activeSponsor.winBonus.toLocaleString()}</span></div>
            <div>Bônus Título: <span className="text-brand-purple font-extrabold block mt-0.5">${activeSponsor.titleBonus.toLocaleString()}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRenegotiate}
              disabled={!canRenegotiate}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                canRenegotiate
                  ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-zinc-950'
                  : 'bg-zinc-900 text-slate-500 border border-brand-border cursor-not-allowed'
              }`}
              title={canRenegotiate ? 'Renovar contrato' : 'Disponível apenas nas últimas 4 semanas'}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Renegociar</span>
            </button>
            <button
              onClick={handleRescind}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-extrabold uppercase transition-colors bg-brand-danger/15 hover:bg-brand-danger/25 text-brand-danger border border-brand-danger/40"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rescindir (Multa ${estimatedPenalty.toLocaleString()})</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA DA ESQUERDA: EXTRATO / HISTÓRICO FINANCEIRO */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl lg:col-span-1 space-y-4 flex flex-col justify-between h-[450px]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-brand-border/40 pb-2 mb-3.5">
              <Wallet className="w-4 h-4 text-brand-cyan" />
              <span>Extrato de Transações</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {financialHistory.length > 0 ? (
                financialHistory.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950 border border-brand-border rounded-xl flex justify-between items-center text-[10px] font-bold">
                    <div>
                      <p className="text-white truncate max-w-[130px]">{entry.description}</p>
                      <span className="text-[8px] text-slate-500 block mt-0.5">Semana {entry.week}</span>
                    </div>
                    <span className={`font-black ${entry.amount < 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
                      {entry.amount < 0 ? '-' : '+'}${Math.abs(entry.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs font-semibold text-slate-600 py-10">
                  Nenhuma transação financeira registrada.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DA DIREITA: LISTA DE PATROCÍNIOS */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl lg:col-span-2 space-y-4 h-[450px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-brand-border/40 pb-2 mb-3.5">
            <ShieldCheck className="w-4 h-4 text-brand-purple" />
            <span>Patrocinadores Disponíveis</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsorList.map(sp => {
              const isCurrent = userTeam.sponsorId === sp.id;
              const hasRep = userTeam.reputation >= sp.minReputation;
              const hasActiveContract = !!activeSponsor;
              const canSign = hasRep && !hasActiveContract;

              return (
                <div key={sp.id} className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                  isCurrent
                    ? 'border-brand-success bg-brand-success/5'
                    : 'border-brand-border bg-zinc-950/40'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-2 border-b border-brand-border/40 pb-2">
                      <p className="text-xs font-black text-white">{sp.name}</p>
                      {isCurrent && (
                        <span className="text-[8px] bg-brand-success/15 text-brand-success font-black uppercase px-2 py-0.5 rounded tracking-wider border border-brand-success/35">
                          Ativo
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-normal mb-3.5 h-10 overflow-hidden">
                      {sp.requirements}
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-slate-500 bg-zinc-950 p-2.5 rounded-lg border border-brand-border mb-3.5">
                      <div>Ganho Semanal: <span className="text-white font-extrabold">${sp.weeklyIncome.toLocaleString()}</span></div>
                      <div>Bônus Vitória: <span className="text-brand-cyan font-extrabold">${sp.winBonus.toLocaleString()}</span></div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5 text-brand-purple" />
                        Bônus Título: <span className="text-brand-purple font-extrabold">${sp.titleBonus.toLocaleString()}</span>
                      </div>
                      <div>Duração: <span className="text-white font-extrabold">{sp.durationWeeks} sem</span></div>
                      <div>Exigência Rep: <span className={`font-black ${hasRep ? 'text-brand-success' : 'text-brand-danger'}`}>{sp.minReputation} pts</span></div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleSignSponsor(sp.id)}
                      disabled={!canSign}
                      className={`w-full py-2 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                        canSign
                          ? 'bg-brand-purple hover:bg-brand-purple/80 text-white'
                          : 'bg-zinc-900 text-slate-500 border border-brand-border cursor-not-allowed'
                      }`}
                      title={hasActiveContract ? 'Rescinda o contrato ativo antes de assinar outro' : (!hasRep ? 'Reputação insuficiente' : 'Assinar')}
                    >
                      {hasActiveContract ? 'Contrato Ativo' : 'Assinar Patrocínio'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <ConfirmModal
        open={confirmRescind && !!activeSponsor}
        danger
        title="Rescindir Patrocínio"
        message={
          activeSponsor
            ? `Confirmar a rescisão do contrato com ${activeSponsor.name}? Você pagará uma multa de $${estimatedPenalty.toLocaleString()} e perderá a receita semanal restante.`
            : ''
        }
        confirmLabel="Rescindir"
        onConfirm={handleConfirmRescind}
        onCancel={() => setConfirmRescind(false)}
      />
    </div>
  );
};
