/**
 * Teste de invariante (F1): após várias temporadas (com aposentadorias e transferências),
 * TODO time deve manter exatamente 5 titulares — nunca jogar 4v5.
 * Roda a store real no Node mockando localStorage. Uso: npx tsx (ou ./node_modules/.bin/tsx)
 *   src/game/simulation/__tests__/squadInvariant.ts
 */

// Mock mínimo de localStorage para a store rodar fora do browser.
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

const SEASONS = 4;

useGameStore.getState().iniciarCarreira('Tester', 'Brasil', 'furia', 'normal');

let guard = 0;
while (useGameStore.getState().currentSeason <= SEASONS && guard < 4000) {
  guard += 1;
  useGameStore.getState().avancarSemana();
  // Se uma partida do usuário abriu, "joga" para o calendário poder seguir.
  if (useGameStore.getState().activeMatch) {
    useGameStore.getState().finalizarPartidaAtiva();
  }
}

const { teams, players } = useGameStore.getState();
const ativos = Object.values(teams).filter((t) => t.id !== 'free_agents');
const violacoes: string[] = [];
for (const t of ativos) {
  const titulares = Object.values(players).filter((p) => p.teamId === t.id && p.status === 'titular').length;
  if (titulares !== 5) violacoes.push(`${t.name} (tier ${t.tier}): ${titulares} titulares`);
}

console.log(`=== INVARIANTE DE ELENCO (F1) — após ${SEASONS} temporadas (${guard} ticks) ===`);
console.log(`Times ativos: ${ativos.length} | com elenco != 5 titulares: ${violacoes.length}`);
if (violacoes.length > 0) {
  console.log('VIOLAÇÕES:', violacoes.slice(0, 15).join(' | '));
  process.exit(1);
}
console.log('OK: todos os times mantêm exatamente 5 titulares.');
