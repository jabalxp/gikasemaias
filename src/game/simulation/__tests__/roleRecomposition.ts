/**
 * Teste de recomposição por role (F2): ao comprar um jogador de um time de IA, aquele time
 * deve repor a MESMA função (ex.: tirou o AWPer → entra outro AWPer) e manter 5 titulares.
 * Espelha o pedido: "comprei o FalleN da FURIA, a FURIA tem que repor a vaga".
 * Uso: ./node_modules/.bin/tsx src/game/simulation/__tests__/roleRecomposition.ts
 */
const lsStore: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in lsStore ? lsStore[k] : null),
  setItem: (k: string, v: string) => { lsStore[k] = String(v); },
  removeItem: (k: string) => { delete lsStore[k]; },
  clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
  key: () => null,
  length: 0,
} as Storage;

import { useGameStore } from '../../../store/useGameStore';
import { Player } from '../../../types';

const titularesDoTime = (players: Record<string, Player>, teamId: string): Player[] =>
  Object.values(players).filter((p) => p.teamId === teamId && p.status === 'titular');

useGameStore.getState().iniciarCarreira('Tester', 'Brasil', 'furia', 'normal');

// Caixa alto para garantir que a compra seja aprovada (foco do teste é a recomposição).
const st0 = useGameStore.getState();
useGameStore.setState({
  teams: { ...st0.teams, [st0.userTeamId]: { ...st0.teams[st0.userTeamId], budget: 50_000_000 } },
});

const ROLES_TESTADAS: Player['role'][] = ['AWPer', 'IGL', 'Entry Fragger', 'Support'];
const falhas: string[] = [];

for (const role of ROLES_TESTADAS) {
  const st = useGameStore.getState();
  // Acha um time de IA com um titular da role-alvo.
  let alvo: Player | undefined;
  let sellerId = '';
  for (const t of Object.values(st.teams)) {
    if (t.id === st.userTeamId || t.id === 'free_agents') continue;
    const cand = titularesDoTime(st.players, t.id).find((p) => p.role === role);
    if (cand) { alvo = cand; sellerId = t.id; break; }
  }
  if (!alvo) { falhas.push(`${role}: nenhum time de IA com a role para testar`); continue; }

  const awpersAntes = titularesDoTime(st.players, sellerId).filter((p) => p.role === role).length;
  const res = useGameStore.getState().fazerPropostaContratacao(alvo.id);
  if (!res.success) { falhas.push(`${role}: compra falhou (${res.message})`); continue; }

  const depois = titularesDoTime(useGameStore.getState().players, sellerId);
  const roleDepois = depois.filter((p) => p.role === role).length;
  if (depois.length !== 5) falhas.push(`${role}: seller ficou com ${depois.length} titulares (esperado 5)`);
  if (roleDepois < awpersAntes) falhas.push(`${role}: seller perdeu a role (antes ${awpersAntes}, depois ${roleDepois})`);
}

console.log('=== RECOMPOSIÇÃO POR ROLE (F2) ===');
if (falhas.length > 0) {
  console.log('FALHAS:', falhas.join(' | '));
  process.exit(1);
}
console.log(`OK: ${ROLES_TESTADAS.join(', ')} — ao perder um titular, o time de IA repôs a mesma role e manteve 5 titulares.`);
