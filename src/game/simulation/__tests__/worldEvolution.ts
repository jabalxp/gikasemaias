/**
 * Teste de mundo vivo (F3): ao longo de temporadas, jovens de IA evoluem (overall sobe),
 * veteranos declinam e a reputação dos times se move — o mundo não fica estático.
 * Uso: ./node_modules/.bin/tsx src/game/simulation/__tests__/worldEvolution.ts
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

const SEASONS = 5;
useGameStore.getState().iniciarCarreira('Tester', 'Brasil', 'furia', 'normal');

const inicio = useGameStore.getState();
// Snapshot: overall de jovens (<=20) e reputação dos times.
const jovens = Object.values(inicio.players)
  .filter((p) => p.age <= 20 && (p.status === 'titular' || p.status === 'reserva'))
  .map((p) => ({ id: p.id, ovr: p.overall }));
const repInicial = new Map(Object.values(inicio.teams).map((t) => [t.id, t.reputation]));

let guard = 0;
while (useGameStore.getState().currentSeason <= SEASONS && guard < 5000) {
  guard += 1;
  useGameStore.getState().avancarSemana();
  if (useGameStore.getState().activeMatch) useGameStore.getState().finalizarPartidaAtiva();
}

const fim = useGameStore.getState();
let evoluiram = 0;
let aindaAtivos = 0;
for (const j of jovens) {
  const atual = fim.players[j.id];
  if (!atual || atual.status === 'aposentado') continue;
  aindaAtivos += 1;
  if (atual.overall > j.ovr) evoluiram += 1;
}
let repMudou = 0;
for (const [id, rep0] of repInicial) {
  const t = fim.teams[id];
  if (t && t.reputation !== rep0) repMudou += 1;
}

console.log(`=== MUNDO VIVO (F3) — após ${SEASONS} temporadas ===`);
console.log(`Jovens acompanhados: ${jovens.length} | ainda ativos: ${aindaAtivos} | que EVOLUÍRAM: ${evoluiram}`);
console.log(`Times com reputação alterada: ${repMudou}/${repInicial.size}`);

const okEvolucao = aindaAtivos > 0 && evoluiram / aindaAtivos >= 0.5; // maioria dos jovens deve crescer
const okReputacao = repMudou >= 10; // o ranking move a reputação de vários times
if (!okEvolucao) { console.log(`FALHA: poucos jovens evoluíram (${evoluiram}/${aindaAtivos}).`); process.exit(1); }
if (!okReputacao) { console.log(`FALHA: reputação quase estática (${repMudou} times mudaram).`); process.exit(1); }
console.log('OK: jovens evoluindo e reputações em movimento — mundo vivo.');
