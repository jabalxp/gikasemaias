# ProStrike Manager — Guia para devs (e para o Claude)

Manager de e-sports de CS em React 19 + TS + Vite + Zustand + Tailwind v4. **Sem backend** (estado em `localStorage`). Leia o **`ARCHITECTURE.md`** para a visão completa.

## Comandos
```bash
npm install
npm run dev      # localhost:5173
npm run build    # tsc -b && vite build -> dist/
npm run preview  # testa o build
npx tsx src/game/simulation/__tests__/balanceHarness.ts 2000   # calibrar simulação
```

## Regras de ouro (não negociáveis)
1. **Imutabilidade Zustand.** `{ ...teams }`/`{ ...players }` é cópia RASA. Ao alterar um Team/Player, copie também o objeto e os aninhados:
   ```ts
   updatedTeams[id] = { ...t, budget: t.budget + x, stats: { ...t.stats, wins: t.stats.wins + 1 } };
   updatedPlayers[id] = { ...p, attributes: { ...p.attributes, aim: novoAim } };
   ```
   Nunca `updatedTeams[id].stats.wins++`. Sempre `set(...)` + `get().salvarJogo()` no fim de ações que mudam dados salvos.
2. **Zero `any`.** Use os tipos de `src/types/index.ts`. Em `<select onChange>`, `e.target.value as TeamTactics['playstyle']`.
3. **Hooks antes de qualquer `return`** condicional (React quebra com "Rendered fewer hooks than expected").
4. **Feedback**: `addToast(...)` (nunca `alert()`); ações destrutivas via `<ConfirmModal>`.
5. **Persistência**: estado novo salvável → adicione a `SaveGame` (types) e a `salvarJogo`/`carregarJogo`/`exportarSave`/`importarSave`, com fallback (`?? default`) p/ saves antigos.

## Como adicionar uma tela nova
1. Criar `src/pages/MinhaTela.tsx` (use tokens `brand-*`, `addToast`).
2. `App.tsx`: importar + `case 'minhaTela': return <MinhaTela />;` no switch. Se for imersiva (sem sidebar), adicionar a `isMatchScreen`.
3. `Sidebar.tsx`: adicionar item ao `menuItems` (se for destino de navegação).

## Como adicionar uma ação de jogo
1. Declarar a assinatura na `interface GameState` (`useGameStore.ts`).
2. Implementar com `set(...)` imutável + `get().salvarJogo()`.
3. Retornar `{ success, message }` quando a UI precisar de feedback.

## Balanceamento
Pesos da simulação em `BALANCE_WEIGHTS` (`matchSimulator.ts`). Ao mexer, rode o `balanceHarness` e cheque os alvos (ver ARCHITECTURE.md). Não deixe o `overall` decidir tudo — moral/forma/mapa/tática importam (spec §26).

## Deploy (Cloudflare Pages)
Build command `npm run build`, output `dist`. Nunca servir a raiz (erro de MIME `octet-stream`). Ver `wrangler.toml`.

## Pendências conhecidas (TODO)
- Caixa negativo não tem freio (sem falência/game-over) — afunda indefinidamente.
- Bundle > 500 kB: considerar code-splitting (lazy-load das páginas).
- Negociação de mercado merece testes end-to-end de UI.
- Stats de carreira do jogador são cumulativos (sem série temporal para gráficos).
