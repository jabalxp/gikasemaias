import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { defaultSponsors } from '../game/data/defaultSponsors';
import { DollarSign, Wallet, Calendar, ShieldCheck, ShoppingCart } from 'lucide-react';

export const Finances: React.FC = () => {
  const { userTeamId, teams, sponsors, assinarPatrocinio, financialHistory } = useGameStore();
  const userTeam = teams[userTeamId];

  if (!userTeam) return null;

  const handleSignSponsor = (id: string) => {
    const sp = defaultSponsors.find(s => s.id === id);
    if (!sp) return;

    if (userTeam.reputation < sp.minReputation) {
      alert(`Negado! Sua equipe precisa de pelo menos ${sp.minReputation} de Reputação para assinar com a ${sp.name}. Sua reputação atual é ${userTeam.reputation}.`);
      return;
    }

    if (confirm(`Deseja assinar contrato com o patrocinador ${sp.name}?\n\nDuração: ${sp.durationWeeks} semanas\nReceita Semanal: $${sp.weeklyIncome.toLocaleString()}\nBônus por Vitória: $${sp.winBonus.toLocaleString()}\n\nIsso substituirá seu patrocinador ativo.`)) {
      assinarPatrocinio(id);
      alert(`Contrato assinado com a ${sp.name}! Receita e bônus aplicados.`);
    }
  };

  const activeSponsor = defaultSponsors.find(s => s.id === userTeam.sponsorId);

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
            {defaultSponsors.map(sp => {
              const isCurrent = userTeam.sponsorId === sp.id;
              const hasRep = userTeam.reputation >= sp.minReputation;
              
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
                      <div>Duração: <span className="text-white font-extrabold">{sp.durationWeeks} sem</span></div>
                      <div>Exigência Rep: <span className={`font-black ${hasRep ? 'text-brand-success' : 'text-brand-danger'}`}>{sp.minReputation} pts</span></div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleSignSponsor(sp.id)}
                      disabled={!hasRep}
                      className={`w-full py-2 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                        hasRep 
                          ? 'bg-brand-purple hover:bg-brand-purple/80 text-white' 
                          : 'bg-zinc-900 text-slate-500 border border-brand-border cursor-not-allowed'
                      }`}
                    >
                      Assinar Patrocínio
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
