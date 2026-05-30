# Roadmap: ProStrike Manager

## Milestones

- ✅ **v1.0 Jogabilidade & Mundo Vivo** — Phases F0-F5 (entregue 2026-05-30)
- 🚧 **v2.0 Imersão Competitiva** — Phases 1-4 (em planejamento)

## Phases

<details>
<summary>✅ v1.0 Jogabilidade & Mundo Vivo (F0-F5) — ENTREGUE 2026-05-30</summary>

Entregue sem GSD. Fases documentadas em MILESTONES.md.

- [x] F0: Lutas de verdade — bônus aditivo de arma, recalibração (fim do 13×0)
- [x] F1: Elenco sempre 5 — ensureFiveStarters + guard-rail na simulação
- [x] F2: Roles (recomposição) — IA repõe mesma role; IGL dá coordenação
- [x] F3: Mundo vivo — evolução jovens, declínio veteranos, reputação/valor dinâmicos
- [x] F4: Qualificação por mérito — ranking, cotas regionais, Event Weight, calendário
- [x] F5: Amistosos — tela de desafio sob demanda

</details>

---

### 🚧 v2.0 Imersão Competitiva

**Milestone Goal:** Trazer o "ar competitivo real" — stats de partida reais (ADR, assists, rating HLTV), roles com peso na simulação, e campeonatos com formatos fiéis ao CS (Swiss+Buchholz, GSL, round-robin) e telas de standings/bracket.

**Ordem de execução (motor primeiro):** Stats → Roles → Motor de Campeonatos → Tela de Campeonatos

#### Phases Summary

- [ ] **Phase 1: Stats de Partida** — Motor coleta assists, ADR, multi-kills, clutches; rating HLTV acumulado e persistido
- [ ] **Phase 2: Roles com Peso Real** — Bônus de função no resolveClash, seleção por role, vantagem coletiva do Support, validado no balanceHarness
- [ ] **Phase 3: Motor de Campeonatos** — Modelo de dados, todos os jogos de IA materializados, bracket com seeding, formatos Swiss/GSL/round-robin, Bo1/Bo3/Bo5, mapa mais jogado
- [ ] **Phase 4: Tela de Campeonatos e Stats** — UI de Campeonatos (standings/jogos/bracket/campanha/stats), stats na UI pós-jogo e rankings, histórico da temporada

## Phase Details

### Phase 1: Stats de Partida
**Goal**: O motor de simulação coleta e persiste estatísticas reais de cada partida — assists, ADR, first kills, clutches, multi-kills e rating composto — disponíveis para exibição e acúmulo de carreira.
**Depends on**: Nothing (primeiro no motor)
**Requirements**: STATS-01, STATS-02, STATS-03, STATS-04, STATS-05
**Success Criteria** (what must be TRUE):
  1. Após qualquer partida oficial, a scoreboard registra pelo menos uma assistência (>0 em casos realistas) para cada equipe.
  2. O ADR de cada jogador é calculável por partida (dano acumulado dividido por rounds).
  3. First kills, clutches vencidos e multi-kills (3K+) aparecem nos dados de resultado de partida.
  4. O MVP da partida é um jogador distinto do top-killer em pelo menos um subconjunto de cenários (clutcher de 1v2 com menos kills totais pode ganhar).
  5. Após 5 partidas oficiais, kills/deaths/assists/ADR/rating de carreira de um jogador são não-nulos e crescentes no store (validado por teste tsx).
**Plans**: TBD
**UI hint**: no

### Phase 2: Roles com Peso Real
**Goal**: Cada função pesa na simulação de forma observável — Entry abre o round, AWPer domina ângulos, Support gera vantagem coletiva, Clutcher/Lurker protagonizam situações 1vX — e um time bem montado por roles vence em margem clara um time de mesmo overall mal distribuído.
**Depends on**: Phase 1
**Requirements**: ROLES-01, ROLES-02, ROLES-03, ROLES-04, ROLES-05
**Success Criteria** (what must be TRUE):
  1. Um time com Entry/AWPer/Support/Lurker/Clutcher definidos e atributos bem distribuídos vence, em média, mais de 55% das partidas contra um time de mesmo overall com roles aleatórias (balanceHarness com 500+ simulações).
  2. Em partidas simuladas, o primeiro duelista escolhido na fase de abertura é consistentemente o Entry (não um Support ou IGL).
  3. Em situações de 1vX, o último vivo é Clutcher ou Lurker em mais de 60% dos casos (quando ambos estão disponíveis no time).
  4. O bônus de função é ADITIVO ao bônus de arma existente (tsc compila sem erro; o blowout Tier1vsTier1 ~50% não é alterado além de ±3 pp no balanceHarness).
**Plans**: TBD

### Phase 3: Motor de Campeonatos
**Goal**: Todos os jogos de um torneio são materializados (não só o confronto do usuário), standings e bracket são populados com seeding real, os formatos Swiss+Buchholz, GSL e round-robin são implementados com lógica fiel, e Bo1/Bo3/Bo5 variam por contexto.
**Depends on**: Phase 2
**Requirements**: CHAMP-01, CHAMP-02, CHAMP-03, CHAMP-04, CHAMP-05, CHAMP-06, CHAMP-07, CHAMP-09
**Success Criteria** (what must be TRUE):
  1. Ao avançar uma rodada de um Major, o store contém resultados simulados de TODOS os confrontos daquela rodada (não apenas o do usuário), e a tabela Swiss reflete wins/losses com Buchholz correto.
  2. Em um torneio estilo BLAST (GSL), nenhuma equipe enfrenta a mesma adversária duas vezes até que o bracket exija (dupla-eliminação respeitada).
  3. Em uma Liga (round-robin), após todas as rodadas todos os times jogaram contra todos, e o playoff é populado pelos N primeiros colocados na tabela de pontos.
  4. O usuário nunca enfrenta o mesmo adversário em rodadas consecutivas dentro de uma mesma fase por motivo artificial (seeding e bracket determinam o encontro).
  5. O mapa mais jogado do torneio é calculável a partir dos dados registrados em CHAMP-01.
**Plans**: TBD

### Phase 4: Tela de Campeonatos e Stats
**Goal**: O usuário pode navegar para a tela de Campeonatos, ver todas as abas (Classificação, Jogos, Bracket, Campanha, Estatísticas) de qualquer torneio, e ao virar a temporada a campanha é preservada no histórico; a tela pós-jogo e rankings exibem assists, MVP e rating.
**Depends on**: Phase 3
**Requirements**: STATS-06, CHAMP-08, CHAMP-10
**Success Criteria** (what must be TRUE):
  1. A sidebar tem item "Campeonatos" que leva a uma tela listando todos os torneios ativos e passados.
  2. Ao clicar em um torneio, o usuário vê abas funcionais: Classificação (standings com rating/top fragger), Jogos (resultados de todos os confrontos), Bracket (árvo re visual), Campanha (jornada do time do usuário), Estatísticas (mapa mais jogado, MVP do torneio).
  3. Na tela pós-jogo, a coluna de assists é exibida e o MVP é destacado com base em impacto (não só kills).
  4. Na tela de rankings de jogadores, a coluna de rating acumulado e assists totais são visíveis e não-nulos após partidas jogadas.
  5. Após virar uma temporada, o histórico de campeonatos anteriores é acessível na tela (sala de troféus), com a campanha e resultado final preservados.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** 1 → 2 → 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Stats de Partida | v2.0 | 0/? | Not started | - |
| 2. Roles com Peso Real | v2.0 | 0/? | Not started | - |
| 3. Motor de Campeonatos | v2.0 | 0/? | Not started | - |
| 4. Tela de Campeonatos e Stats | v2.0 | 0/? | Not started | - |
