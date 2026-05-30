import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { defaultStaff } from '../game/data/defaultStaff';
import { Staff as StaffType } from '../types';
import { UserCog, Star, Brain, ClipboardList, HeartPulse, Search, UserMinus, UserPlus } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type ManagedRole = 'coach' | 'analyst' | 'psychologist' | 'physio';

interface RoleMeta {
  readonly slot: keyof import('../types').Team['staff'];
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly accent: string;
}

const ROLE_META: Record<ManagedRole, RoleMeta> = {
  coach: { slot: 'coachId', label: 'Coach (Treino)', icon: ClipboardList, accent: 'text-brand-cyan' },
  analyst: { slot: 'analystId', label: 'Analista (Veto)', icon: Search, accent: 'text-brand-purple' },
  psychologist: { slot: 'psychologistId', label: 'Psicólogo (Moral)', icon: Brain, accent: 'text-brand-success' },
  physio: { slot: 'physioId', label: 'Fisioterapeuta (Energia)', icon: HeartPulse, accent: 'text-brand-warning' },
};

const MANAGED_ROLES: readonly ManagedRole[] = ['coach', 'analyst', 'psychologist', 'physio'];

const StarRating: React.FC<{ level: number }> = ({ level }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < level ? 'text-brand-warning fill-brand-warning' : 'text-zinc-700'}`}
      />
    ))}
  </span>
);

export const Staff: React.FC = () => {
  const { userTeamId, teams, staffList, contratarStaff, demitirStaff, addToast } = useGameStore();
  const userTeam = teams[userTeamId];

  const [fireRole, setFireRole] = useState<ManagedRole | null>(null);

  if (!userTeam) return null;

  const handleHire = (member: StaffType): void => {
    const result = contratarStaff(member);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  const handleFire = (role: ManagedRole): void => {
    setFireRole(role);
  };

  const handleConfirmFire = (): void => {
    if (!fireRole) return;
    const result = demitirStaff(fireRole);
    addToast(result.message, result.success ? 'success' : 'error');
    setFireRole(null);
  };

  // Membros atualmente contratados, indexados por role gerenciado
  const hiredByRole: Record<ManagedRole, StaffType | undefined> = {
    coach: userTeam.staff.coachId ? staffList[userTeam.staff.coachId] : undefined,
    analyst: userTeam.staff.analystId ? staffList[userTeam.staff.analystId] : undefined,
    psychologist: userTeam.staff.psychologistId ? staffList[userTeam.staff.psychologistId] : undefined,
    physio: userTeam.staff.physioId ? staffList[userTeam.staff.physioId] : undefined,
  };

  // Catálogo disponível: apenas membros gerenciados aqui (exclui scout — Fase E) e ainda não contratados
  const hiredIds = new Set(Object.values(hiredByRole).filter((m): m is StaffType => !!m).map(m => m.id));
  const availableStaff = defaultStaff.filter(
    m => m.role !== 'scout' && !hiredIds.has(m.id)
  );

  const totalWeeklySalary = Object.values(hiredByRole).reduce(
    (acc, m) => acc + (m ? m.salary : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-brand-cyan" />
            <span>Comissão Técnica</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Contrate especialistas para potencializar treino, veto, moral e recuperação física do elenco.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-zinc-950 px-4 py-2 border border-brand-border rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Folha Semanal Staff</span>
            <span className="text-base font-black text-brand-warning">${totalWeeklySalary.toLocaleString()}</span>
          </div>
          <div className="bg-zinc-950 px-4 py-2 border border-brand-border rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Seu Caixa</span>
            <span className="text-base font-black text-brand-cyan text-neon-cyan">${userTeam.budget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAINEL ESQUERDO: STAFF CONTRATADO POR SLOT */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-brand-border/40 pb-2">
            <UserCog className="w-4 h-4 text-brand-cyan" />
            <span>Equipe Técnica Atual</span>
          </h3>

          {MANAGED_ROLES.map(role => {
            const meta = ROLE_META[role];
            const member = hiredByRole[role];
            const Icon = meta.icon;

            return (
              <div
                key={role}
                className={`p-4 rounded-xl border ${member ? 'border-brand-cyan/30 bg-zinc-950/60' : 'border-brand-border bg-zinc-950/30'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${meta.accent}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{meta.label}</span>
                </div>

                {member ? (
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate">{member.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating level={member.level} />
                        <span className="text-[9px] font-bold text-slate-500">{member.nationality}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5 leading-snug">{member.effectDescription}</p>
                      <p className="text-[9px] font-bold text-brand-warning mt-1">Salário: ${member.salary.toLocaleString()}/sem</p>
                    </div>
                    <button
                      onClick={() => handleFire(role)}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase bg-brand-danger/15 text-brand-danger border border-brand-danger/40 hover:bg-brand-danger/25 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Demitir</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-600 py-2">Nenhum profissional contratado.</p>
                )}
              </div>
            );
          })}
        </div>

        {/* PAINEL DIREITO: CATÁLOGO DISPONÍVEL */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl space-y-4 max-h-[640px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-brand-border/40 pb-2">
            <UserPlus className="w-4 h-4 text-brand-purple" />
            <span>Profissionais Disponíveis</span>
          </h3>

          {availableStaff.length === 0 ? (
            <p className="text-center text-xs font-semibold text-slate-600 py-10">
              Todos os profissionais disponíveis já foram contratados.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {availableStaff.map(member => {
                const role = member.role as ManagedRole;
                const meta = ROLE_META[role];
                const Icon = meta.icon;
                const signingCost = member.salary * 4;
                const slotOccupied = !!hiredByRole[role];
                const canAfford = userTeam.budget >= signingCost;
                const canHire = canAfford && !slotOccupied;

                return (
                  <div key={member.id} className="p-4 rounded-xl border border-brand-border bg-zinc-950/40">
                    <div className="flex justify-between items-start mb-2 border-b border-brand-border/40 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${meta.accent}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{member.name}</p>
                          <span className="text-[9px] font-bold text-slate-500">{meta.label} • {member.nationality}</span>
                        </div>
                      </div>
                      <StarRating level={member.level} />
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-snug mb-3">{member.effectDescription}</p>

                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-slate-500 bg-zinc-950 p-2.5 rounded-lg border border-brand-border mb-3">
                      <div>Salário/Sem: <span className="text-white font-extrabold">${member.salary.toLocaleString()}</span></div>
                      <div>Luvas: <span className="text-brand-warning font-extrabold">${signingCost.toLocaleString()}</span></div>
                      <div>Reputação: <span className="text-brand-cyan font-extrabold">{member.reputation}</span></div>
                    </div>

                    <button
                      onClick={() => handleHire(member)}
                      disabled={!canHire}
                      className={`w-full py-2 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                        canHire
                          ? 'bg-brand-purple hover:bg-brand-purple/80 text-white'
                          : 'bg-zinc-900 text-slate-500 border border-brand-border cursor-not-allowed'
                      }`}
                      title={slotOccupied ? 'Cargo já ocupado — demita o atual primeiro' : (!canAfford ? 'Saldo insuficiente' : 'Contratar')}
                    >
                      {slotOccupied ? 'Cargo Ocupado' : (!canAfford ? 'Saldo Insuficiente' : 'Contratar')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!fireRole}
        danger
        title="Demitir Profissional"
        message={
          fireRole && hiredByRole[fireRole]
            ? `Confirmar a demissão de ${hiredByRole[fireRole]!.name} (${ROLE_META[fireRole].label})? Você perderá os bônus deste cargo imediatamente.`
            : ''
        }
        confirmLabel="Demitir"
        onConfirm={handleConfirmFire}
        onCancel={() => setFireRole(null)}
      />
    </div>
  );
};
