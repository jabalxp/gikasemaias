# Relatório de QA — ProStrike Manager (Gika & Maias)

> ## ✅ STATUS: CORRIGIDO (30/05/2026)
> Todos os 7 críticos, 5 altos e os médios/baixos prioritários foram corrigidos no React (decisão: **não migrar** — ver `vault/Decisões/nao-migrar-prostrike-react.md`). `tsc` limpo, validado via Playwright ponta a ponta.
> - **Críticos:** C1 (crash de hooks ✔), C2 (assistir round a round ✔), C3 (placar sem spoiler ✔), C4 (44→326 jogadores, 0 times vazios ✔), C5/C6 (guarda de simulação ✔), C7 (táticas persistem ✔).
> - **Altos:** A1 (partida imediata + torneio garantido ✔), A2 (adversário consistente ✔), A3 (treino real ✔), A4 (receita base + crise de moral ✔), A5 (bracket multi-rodada ✔).
> - **Balanceamento:** M1 (fórmula §26: overall/moral/forma/mapa/tática ✔), M2 (overtime ✔), M3 (economia por kills reais ✔), M5/M8/M9 ✔.
> - **Baixos:** B1 (Header sem botão duplicado ✔), B2 (IDs sem colisão ✔), B3 (reset não apaga todos os saves ✔).
> - **Pendências menores (polish):** B4 (weaponUsed em todos os eventos), B5 (alerts → toast in-app), M7 (retorno de iniciarCarreira). Sugestão futura: tuning fino dos pesos da simulação (lavadas ocasionais ainda ocorrem em mapa desfavorável).
> - **Novos arquivos:** `MatchPreview.tsx`, `MatchResult.tsx`. **Novas ações no store:** `definirTaticas`, `definirTreinoSemanal`, `iniciarPartidaContra`, `assistirPartida`, `fecharResultado`.

---

> **Data:** 30/05/2026
> **Método:** Estudo do código (workflow multi-agente, 23 agentes) + testes interativos reais no browser (Playwright) + validação de dados via `localStorage`.
> **Stack:** React 19 · TypeScript · Vite · Zustand · Tailwind v4 · framer-motion.
> **Status geral:** As 13 telas **renderizam** e o fluxo de criação de carreira funciona. Porém, **o núcleo do jogo (jogar partidas e progredir) está quebrado** por uma cadeia de bugs críticos. `tsc` compila sem erros e não há erro de console na navegação normal — os problemas são de **lógica e fluxo**, não de compilação.

---

## 🔴 CRÍTICOS — Quebram o jogo (corrigir primeiro)

### C1. Crash total (tela branca) ao finalizar QUALQUER partida — *provado no browser*
- **Arquivo:** `src/pages/MatchSim.tsx:19,28,42,46`
- **Sintoma:** Ao clicar em **"Ver Estatísticas & Resultados"**, o app inteiro vira uma tela 100% branca (sem sidebar, sem escape). Console: `Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.`
- **Causa-raiz:** Violação das **Rules of Hooks**. Os `return null` das linhas 19 (`if (!activeMatch)`) e 46 (`if (!currentRoundData)`) ficam **antes** dos `useEffect` (linhas 28 e 42). Quando `finalizarPartidaAtiva()` zera `activeMatch` e muda para `matchResult`, o componente re-renderiza com **menos hooks** → React derruba a árvore.
- **Agravante:** Não existe página de pós-jogo. `App.tsx:58-61` renderiza `MatchSim` para `matchResult`, mas `MatchSim` retorna `null` sem `activeMatch`. Mesmo sem o crash de hooks, o pós-jogo (MVP, K/D, premiação) **nunca aparece**.
- **Fix:** (1) Mover TODOS os hooks (`useState`, `useRef`, `useEffect`) para ANTES de qualquer `return` condicional. (2) Criar `MatchResult.tsx` dedicada com as estatísticas e botão "Voltar ao Dashboard"; mapear `case 'matchResult'` para ela em `App.tsx`.

### C2. Simulação round-a-round é inacessível pelo fluxo real — *provado no browser*
- **Arquivos:** `src/store/useGameStore.ts:261` · `MatchSim.tsx:281`
- **Sintoma:** Ao abrir a partida, a tela já mostra o botão final "Ver Estatísticas", **sem os controles de Auto-Play / Próximo Round**. Não dá para assistir os rounds (que são o coração do jogo — spec §25).
- **Causa-raiz:** `avancarSemana` abre a partida com `set({ activeMatch, currentScreen:'matchPreview' })` mas **não seta `isSimulatingMatch: true`**. A única função que faz isso (`iniciarPartidaAtiva`) **nunca é chamada em lugar nenhum** do app.
- **Fix:** Chamar `iniciarPartidaAtiva(match)` em vez do `set` manual, OU setar `isSimulatingMatch: true` ao abrir a partida.

### C3. Placar final vaza como spoiler antes de "assistir" — *provado no browser*
- **Arquivos:** `MatchSim.tsx:100-102` · `useGameStore.ts:258`
- **Sintoma:** A partida abre exibindo **0 × 13** (resultado final) enquanto o feed mostra apenas o "Round 1".
- **Causa-raiz:** `simulateWholeMatchQuick` calcula a partida inteira de uma vez e grava `scoreA/scoreB` finais; a tela mostra `activeMatch.scoreA/scoreB` (final) em vez do placar **acumulado até `activeMatchRoundIndex`**.
- **Fix:** Calcular o placar exibido somando os vencedores dos rounds `0..activeMatchRoundIndex`, não usar o `scoreA/scoreB` final.

### C4. 60 de 64 times não têm elenco (banco de jogadores 90% vazio) — *provado via dados*
- **Arquivos:** `src/game/data/realPlayers.ts` · `useGameStore.ts:103` (`iniciarCarreira`)
- **Sintoma:** Há **64 times mas só 44 jogadores**. Apenas FURIA, MIBR, Imperial e paiN têm 5 titulares. NAVI, Vitality, G2, FaZe, Spirit, MOUZ, Liquid… têm **0 a 2 jogadores**.
- **Impacto:** A spec (§6.1, §8) exige *"times incompletos preenchidos com jogadores gerados"* — **nunca implementado**. Jogar contra qualquer time fora dos 4 completos cai nos bugs C5/C6 (simulação com squad vazio).
- **Fix:** Em `iniciarCarreira`, após carregar `realTeams`, para cada time com < 5 titulares gerar jogadores via `generatePlayer` até completar 5.

### C5. `Math.max(...[])` → `-Infinity` quando o time não tem titulares
- **Arquivo:** `src/game/simulation/matchSimulator.ts:123-124`
- **Causa:** `getBuyType(Math.max(...livePlayersA.map(...)))` com `livePlayersA = []` retorna `-Infinity`, corrompendo a economia da partida. Combinado com C4, ocorre em quase todo confronto.
- **Fix:** `livePlayersA.length > 0 ? getBuyType(Math.max(...)) : 'eco'`.

### C6. `randomChoice([])` no MVP do round pode retornar `undefined`
- **Arquivo:** `src/game/simulation/matchSimulator.ts:453-455`
- **Causa:** Se o time vencedor não tem jogadores vivos, `randomChoice(arr)` acessa `arr[0]` de array vazio → `roundMvpId` undefined.
- **Fix:** Validar `length > 0` antes; fallback para o primeiro jogador do time.

### C7. "Aplicar Configurações Táticas" não salva nada — *provado no código*
- **Arquivo:** `src/pages/Tactics.tsx:26-36`
- **Sintoma:** O alert diz "salvas com sucesso", mas ao recarregar a tática volta ao anterior.
- **Causa:** `userTeam.tactics = {...}` **muta o objeto do store diretamente**, sem `set()` nem `salvarJogo()`. React não re-renderiza e o disco não é atualizado. Falta também o seletor de **economia** (spec §14.5).
- **Fix:** Criar ação `definirTaticas(tactics)` no store que faz `set` imutável + `salvarJogo()`.

---

## 🟠 ALTOS — Comprometem a experiência

### A1. Progressão inicial vazia: ~11 semanas sem nenhuma partida — *provado no browser*
- **Arquivos:** `defaultCompetitions.ts` · `useGameStore.ts:223`
- **Sintoma:** FURIA (tier 1) só tem o 1º torneio elegível na **semana 12**. O jogador clica "avançar" ~11 vezes vendo só salário sair, sem jogar. A "Liga Amadora" da semana 4 filtra `tier===4` e exclui times tier 1.
- **Fix:** Garantir partidas desde a semana 1 (amistosos ou liga compatível com o tier do time); preencher `matches` dos torneios ao iniciarem.

### A2. Adversário do Dashboard ≠ adversário que joga — *provado no browser*
- **Arquivos:** `Dashboard.tsx:23` vs `useGameStore.ts:248`
- **Sintoma:** O Dashboard mostra "Próxima Partida" contra `allOpponents[currentWeek % n]` (rotativo), mas `avancarSemana` joga contra `teamIds.find(id !== userTeamId)` do torneio. **Nunca é o mesmo time.** (Mostrava MIBR, jogou contra paiN.)
- **Fix:** Centralizar a definição do próximo confronto numa única fonte (store) e usá-la nas duas telas.

### A3. Treino é puramente decorativo — *confirmado*
- **Arquivo:** `src/pages/Training.tsx:23-30`
- **Sintoma:** Escolher intensidade/foco só mostra um alert. `avancarSemana` aplica evolução **aleatória fixa** (`if (random < 0.15) +1`), ignorando o plano. Não há ação de treino no store.
- **Fix:** `definirTreinoSemanal(intensity, focus)` no store; `avancarSemana` lê o plano e aplica buffs/custos/cansaço conforme spec §15.

### A4. Caixa fica negativo sem nenhuma consequência — *provado no browser*
- **Arquivos:** `useGameStore.ts:288-296` · spec §19
- **Sintoma:** Sem patrocínio (padrão), só sai salário (-$53k/sem). Em 11 semanas o caixa foi a **-$83.000** e o jogo seguiu normal. A spec pede moral caindo, contratações bloqueadas, pressão da diretoria, etc.
- **Fix:** Implementar consequências de caixa negativo e/ou receita base; bloquear contratações com saldo insuficiente já existe, mas o resto não.

### A5. Cada torneio acaba após 1 única partida (sem bracket/grupos)
- **Arquivo:** `useGameStore.ts:239,651`
- **Causa:** A detecção de partida usa um `// placeholder` (`t.matches.some(... 'Rodada ' + currentRound)`) que com `matches: []` é sempre `false`; e `finalizarPartidaAtiva` marca `tournaments[id].isFinished = true` após o primeiro jogo. Não há fases nem chaveamento reais (spec §22).
- **Fix:** Modelar bracket/grupos com múltiplas `TournamentMatch` e avançar `currentRound` a cada vitória.

---

## 🟡 MÉDIOS

| # | Arquivo | Problema | Fix |
|---|---------|----------|-----|
| M1 | `matchSimulator.ts:79-81` | Fórmula de poder ignora **overall, moral, forma, sinergia, tática** (só usa atributos brutos + RNG 1-40). FURIA perdeu 0×13 do paiN. | Implementar os pesos da spec §26. |
| M2 | `matchSimulator.ts:574-583` | Overtime exige `currentRound === 25`; se chegar a 12-12 antes, nunca dispara. | Disparar OT só com `12-12`, sem amarrar ao round. |
| M3 | `matchSimulator.ts:500` | Bônus econômico usa `killsInRound = randomRange(0,2)` em vez dos kills reais do round. | Usar kills reais registrados em `liveStats`. |
| M4 | `avancarRoundVisual` (`useGameStore.ts:591`) | No fim dos rounds não chama `finalizarPartidaAtiva` — se o usuário não clicar, a partida nunca registra stats. | Chamar `finalizarPartidaAtiva()` ao fim. |
| M5 | `Squad.tsx` | Escalar/Reservar sem feedback quando inválido (5/5 ou <5) — clique "não faz nada". | Retornar mensagem do store e exibir toast. |
| M6 | `Squad.tsx:152-171` | Listas de jogadores via `.map` sem `key` explícita. | Adicionar `key={p.id}`. |
| M7 | `NewGame.tsx:34-48` | `iniciarCarreira` não retorna sucesso/erro; sem validação de falha. | Retornar `{success,message}` e tratar. |
| M8 | `playerGenerator.ts:96` | `overall` calculado sem `Math.min(99,...)`. | Clampar o overall final. |
| M9 | `Dashboard.tsx:17` / `Squad.tsx` etc. | `if (!userTeam) return null` → tela branca sem feedback de carregamento. | Retornar um estado de "Carregando…". |

---

## 🟢 BAIXOS / Polimento

- **B1.** Header tem **dois botões idênticos** ("Jogar Partida / Avançar" e "Apenas Avançar") chamando a mesma `avancarSemana()` — confunde (`Header.tsx:54-70`).
- **B2.** Geração de IDs com `Math.random().toString(36)` em `playerGenerator.ts` e `newsGenerator.ts` — risco de colisão; extrair um `idGenerator` com contador/UUID.
- **B3.** `resetarDadosEditor` faz `localStorage.clear()` — **apaga todos os saves**, não só o atual (`useGameStore.ts:812`).
- **B4.** `weaponUsed` não preenchido em eventos de kill pós-plant (inconsistência no feed).
- **B5.** Uso de `alert()` bloqueante em Tactics/Training/DataEditor — trocar por toast in-app.
- **B6.** `de_train` foi removido do pool real do CS2; `mapMastery` só cobre 7 dos 11 mapas (cosmético).

---

## ✅ O que está funcionando bem
- Criação de carreira (nome, dificuldade, escolha de time real) → entra no Dashboard corretamente.
- **Simulador de veto de mapas** (ban/pick alternado + decider) — sólido e fiel ao formato.
- Navegação de todas as telas sem crash (exceto pós-partida).
- Save/load via `localStorage` com auto-load ao abrir (recupera até de crashes).
- Telas de Elenco, Mercado, Finanças, Rankings, Treino, Editor de Dados, Saves renderizam dados reais coerentes.

## 🎯 Ordem de correção sugerida
1. **C1** (crash de hooks) — desbloqueia jogar mais de uma partida.
2. **C4 + C5 + C6** (popular elencos + guardas de array vazio) — torna a simulação segura contra qualquer time.
3. **C2 + C3** (assistir round-a-round + placar correto).
4. **C7 + A3** (táticas e treino que realmente afetam o jogo).
5. **A1 + A2 + A5** (calendário, confronto consistente, campeonatos reais).
6. **M1** (rebalancear a fórmula de poder).
7. Demais médios/baixos.
