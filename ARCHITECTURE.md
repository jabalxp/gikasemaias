# Arquitetura — ProStrike Manager

Manager de e-sports de Counter-Strike (inspirado no Brassfoot/Football Manager). Single-page app, **sem backend** — todo o estado vive no cliente e é persistido em `localStorage`.

## Stack
- **React 19** + **TypeScript** (estrito, `any` proibido)
- **Vite 8** (dev server + build)
- **Zustand 5** (estado global — um único store)
- **Tailwind CSS v4** (design tokens custom: `brand-*`)
- **framer-motion** (transições) · **lucide-react** (ícones)

## Estrutura de pastas
```
src/
  store/useGameStore.ts      # CÉREBRO: todo o estado + ações + persistência (~1800 linhas)
  types/index.ts             # Todas as interfaces (Player, Team, Match, SaveGame, ...)
  game/
    data/                    # Dados seed: realTeams, realPlayers, realMaps, defaultSponsors,
                             #   defaultCompetitions, defaultStaff
    generators/              # playerGenerator (jovens/preenchimento), newsGenerator
    simulation/
      matchSimulator.ts      # Coração do jogo: simula partida round-a-round + bracket de IA
      mapVetoSimulator.ts    # Veto de mapas (ban/pick)
      __tests__/balanceHarness.ts  # Ferramenta de calibração (npx tsx ...)
  pages/                     # Uma tela por arquivo (Dashboard, Squad, MatchSim, ...)
  components/layout/         # Sidebar, Header, PageTransition, ToastContainer
  components/ui/             # ConfirmModal
  App.tsx                    # Roteamento por `currentScreen` (switch) + layout
```

## O Store (`useGameStore.ts`)
Tudo passa por aqui. Dividido em:
- **Estado salvável** (vai para o `SaveGame`): `managerName`, `currentWeek/Season`, `difficulty`, `teams`, `players`, `maps`, `sponsors`, `staffList`, `tournaments`, `historyNews`, `financialHistory`, `trainingPlan`, `historicoTemporadas`, `youthProspects`.
- **Estado de UI/sessão** (NÃO persistido): `currentScreen`, `activeMatch`, `finishedMatch`, `seasonSummary`, `isSimulatingMatch`, `toasts`, etc.
- **Ações**: `iniciarCarreira`, `avancarSemana` (o "tick" do jogo), `finalizarPartidaAtiva`, `definirTitular/Taticas/TreinoSemanal`, `fazerPropostaContratacao/negociarContratacao`, `contratarStaff`, `investirNaBase/promoverJovem`, `assinarPatrocinio/rescindir/renegociar`, `salvar/carregar/exportar/importarSave`, `addToast`, etc.

### Persistência
`salvarJogo()` serializa o estado salvável em `localStorage['prostrike_save']`. É chamado ao fim de TODA ação que muda dados. `carregarJogo()` restaura (auto-load no `App`). Campos novos persistidos **devem** entrar em `SaveGame` (em `types/index.ts`) e nos 4 pontos: `salvarJogo`, `carregarJogo`, `exportarSave`, `importarSave` — sempre com fallback (`?? default`) para saves antigos.

## Simulação de partidas (`matchSimulator.ts`)
- `simulateWholeMatchQuick(teamA, teamB, playersA, playersB, map, competitionId)` → `Match` completo (rounds, placar, MVP, liveStats). Roda MR12 (vence quem chega a 13) + overtime.
- `resolveClash(...)` resolve cada duelo. **Fórmula** (spec §26): mira×arma×posição + gamesense + overall + utilitárias + clutch, modulado por `playerCondition` (moral/forma/energia) e `computeTeamMod` (mapMastery/forma/moral/tática), + `gaussianRNG` (zebras controladas). Pesos em `BALANCE_WEIGHTS`.
- `computeTeamMod` aplica o viés de lado do mapa (`sideBias`) — CT-sided dá vantagem à defesa.
- **Bracket de IA**: `simulateAiBracketChampion` / `crownAiChampion` resolvem os confrontos entre times de IA e coroam um `championId` em todo torneio.

### Calibração de balanceamento
`balanceHarness.ts` roda N simulações entre fixtures e imprime winrate, zebra, CT-winrate e distribuição de placar. Use ao mexer nos pesos:
```bash
npx tsx src/game/simulation/__tests__/balanceHarness.ts 2000
```
Alvos: winrate ~50% entre times parelhos; CT-winrate ~54% (CT-bias) e ~48% (TR-bias); favorito vence mais sem lavadas 13-0 dominantes.

## Fluxos principais
- **Nova carreira**: `Home` → `NewGame` → `iniciarCarreira` (carrega seeds, **preenche elencos faltantes** até 5 titulares por time, ajusta orçamento por dificuldade, garante vaga do usuário nos torneios) → `dashboard`.
- **Tick semanal** (`avancarSemana`): se há torneio do usuário na semana → abre `matchPreview`; senão processa economia (receita base + patrocínio − salários), treino (aplica `trainingPlan`), e na virada de ano (semana > 48) resolve torneios pendentes (campeões de IA), envelhece/evolui jogadores, registra histórico e abre `SeasonSummary`.
- **Partida**: `matchPreview` (Assistir ou Simular Rápido) → `matchSim` (round-a-round, placar acumulado) → `finalizarPartidaAtiva` → `matchResult` → volta ao painel. Bracket: vitória avança a fase, derrota elimina.

## Convenções OBRIGATÓRIAS
1. **Imutabilidade Zustand**: NUNCA mute objetos do estado. `{ ...teams }` é cópia RASA — copie também os aninhados: `updatedTeams[id] = { ...team, stats: { ...team.stats, wins: ... } }`. Mutar `updatedTeams[id].stats.wins++` corrompe o estado anterior.
2. **Zero `any`**: use os tipos de `types/index.ts`; em `e.target.value` de `<select>`, faça cast ao union (`as TeamTactics['playstyle']`).
3. **Navegação**: `setScreen('nome')` + um `case` no switch de `App.tsx`. Telas normais entram no menu (`Sidebar.tsx`); telas imersivas (sem sidebar) vão no array `isMatchScreen`.
4. **Feedback**: use `addToast(msg, 'success'|'error'|'info'|'warning')`, não `alert()`. Ações destrutivas usam `<ConfirmModal>`.
5. **Hooks**: todos os hooks ANTES de qualquer `return` condicional (senão "Rendered fewer hooks than expected").
6. **Persistência**: ver seção acima — todo estado novo salvável entra no `SaveGame` + 4 pontos.

## Deploy (Cloudflare Pages)
Build command `npm run build`, output `dist`. **Nunca** sirva a raiz em produção (o `index.html` da raiz aponta para `/src/main.tsx`, que quebra com MIME `octet-stream`). Ver `README.md` e `wrangler.toml`.

## Gotchas
- O ambiente de dev do dono tem um hook (RTK) que reescreve `npx`/`git` — rode `tsc` via `./node_modules/.bin/tsc -b` se `npx` falhar.
- `dist/` é gerado no build e **não** versionado.
- Saves antigos: sempre trate campos novos do `SaveGame` como opcionais com fallback.
