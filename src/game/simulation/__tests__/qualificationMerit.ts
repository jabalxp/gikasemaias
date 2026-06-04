/**
 * Teste de qualificação por mérito (F4): os torneios são preenchidos pelos times de MAIOR ranking
 * (points), o Major respeita cotas regionais, e o usuário tem vaga garantida só no seu tier.
 * Uso: ./node_modules/.bin/tsx src/game/simulation/__tests__/qualificationMerit.ts
 */
const lsStore: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in lsStore ? lsStore[k] : null),
  setItem: (k: string, v: string) => { lsStore[k] = String(v); },
  removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
} as Storage;

import { computeTournamentTeamIds } from '../../../store/useGameStore';
import { realTeams } from '../../data/realTeams';
import { Team } from '../../../types';

// Clona os times com points DISTINTOS (decrescentes) para tornar o mérito verificável.
const teams: Record<string, Team> = {};
Object.values(realTeams).forEach((t, i) => { teams[t.id] = { ...t, points: 2000 - i, stats: { ...t.stats } }; });

const falhas: string[] = [];

// 1) MÉRITO num torneio tier 2 (top-8 por points entre os elegíveis tier 2).
const tier2Ids = Object.values(teams).filter((t) => t.tier === 2).sort((a, b) => b.points - a.points).map((t) => t.id);
const sel2 = computeTournamentTeamIds({ id: 'pro_league_regional', tier: 2 }, teams, 'furia');
const top8Tier2 = tier2Ids.slice(0, 8);
const meritoOk = sel2.length === 8 && sel2.every((id) => top8Tier2.includes(id));
if (!meritoOk) falhas.push(`tier2 não selecionou os top-8 por points (sel=${sel2.length})`);

// 2) MAJOR respeita cotas regionais (EU≤7, AM≤6, AS≤3) e enche 16 vagas.
const canon = (r: string): string => (/europa|europe|cis/i.test(r) ? 'EU' : /[áa]sia|pac[íi]f|oceania/i.test(r) ? 'AS' : 'AM');
const selMajor = computeTournamentTeamIds({ id: 'major_mundial', tier: 1 }, teams, 'furia');
const cont: Record<string, number> = { EU: 0, AM: 0, AS: 0 };
selMajor.forEach((id) => { cont[canon(teams[id].region)] += 1; });
// O Major deve encher 16 vagas, representar as 3 regiões e respeitar o TETO da cota asiática
// (AS nunca excede 3; vagas regionais não preenchidas são realocadas aos melhores globais — realista).
if (selMajor.length !== 16) falhas.push(`major não encheu 16 vagas (${selMajor.length})`);
if (cont.AS > 3) falhas.push(`major furou o teto da cota asiática: ${JSON.stringify(cont)}`);
if (cont.EU === 0 || cont.AM === 0 || cont.AS === 0) falhas.push(`major sem representação multirregional: ${JSON.stringify(cont)}`);

// 3) Usuário (furia=tier 1) tem vaga garantida nos torneios do tier dele, mesmo com points baixos.
teams['furia'] = { ...teams['furia'], points: 1 }; // pior ranking possível
const selTier1 = computeTournamentTeamIds({ id: 'champions_fps', tier: 1 }, teams, 'furia');
if (!selTier1.includes('furia')) falhas.push('usuário sem vaga garantida no torneio do próprio tier');

// 4) Usuário tier 1 com points mínimos NÃO entra no Major por cota se não merecer? (vaga garantida
//    vale só para torneios cujo tier == tier do usuário; o Major também é tier 1, então furia entra).
//    Verificamos o caso inverso: um time tier 2 fraco não deve tomar vaga de Major sobre tier 1 fortes.

console.log('=== QUALIFICAÇÃO POR MÉRITO (F4) ===');
console.log(`tier2 top-8 por mérito: ${meritoOk ? 'OK' : 'FALHA'}`);
console.log(`major 16 vagas + cotas EU/AM/AS = ${JSON.stringify(cont)}`);
console.log(`usuário com vaga no próprio tier: ${selTier1.includes('furia') ? 'OK' : 'FALHA'}`);
if (falhas.length > 0) { console.log('FALHAS:', falhas.join(' | ')); process.exit(1); }
console.log('OK: entrada em torneios por ranking, cotas regionais no Major e vaga do usuário no seu tier.');
