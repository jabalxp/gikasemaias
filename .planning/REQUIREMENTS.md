# Requirements — Milestone v2.0 Imersão Competitiva

Decisões de escopo: formatos de campeonato **fiéis ao CS real** (Swiss+Buchholz, GSL, round-robin por tier); ordem de execução **motor primeiro** (Stats → Roles → Campeonatos).

## v2.0 Requirements

### STATS — Estatísticas, MVP e Assistências
- [ ] **STATS-01**: A cada kill, o motor credita assistência a um colega de equipe de forma realista (modulada por utilitárias/colegas vivos), exibida na scoreboard (>0).
- [ ] **STATS-02**: O motor acumula dano por jogador, permitindo calcular ADR real por partida.
- [ ] **STATS-03**: O motor registra first kills, clutches vencidos e multi-kills (3K+) por jogador.
- [ ] **STATS-04**: O MVP da partida é decidido por impacto (kills, assists, clutches, multi-kills, first kills, mortes), não só por kills.
- [ ] **STATS-05**: As estatísticas de carreira do jogador (kills/deaths/assists/ADR/KAST/rating/mvps/mapsPlayed) são acumuladas e persistidas após cada partida oficial, com rating composto estilo HLTV 2.1.
- [ ] **STATS-06**: As telas (pós-jogo e rankings de jogadores) exibem assists, MVP por impacto e o rating acumulado.

### ROLES — Funções com peso real na simulação
- [ ] **ROLES-01**: O duelo (resolveClash) aplica um bônus de função ADITIVO por fase (abertura/pós-plant/meio), derivado dos 5 atributos existentes — sem inventar atributos novos.
- [ ] **ROLES-02**: A seleção do duelista de cada fase é ponderada pela função (Entry abre o round; AWPer prioriza ângulos; Lurker/Clutcher protagonizam pós-plant/1vX).
- [ ] **ROLES-03**: O Support converte utilitárias em vantagem COLETIVA do time (beneficia o entry), não só o próprio duelo.
- [ ] **ROLES-04**: Em situações de 1vX, o último jogador vivo é escolhido priorizando Clutcher/Lurker.
- [ ] **ROLES-05**: Um time bem montado por funções vence, em margem clara, um time de mesmo overall mal distribuído (validado no balanceHarness, sem estourar blowouts nem alterar Tier1vsTier1 ~50%).

### CHAMP — Campeonatos com tabelas e formatos reais
- [ ] **CHAMP-01**: O modelo de dados registra cada partida do torneio (times, placar, mapa, rodada) e a classificação (standings) por torneio.
- [ ] **CHAMP-02**: Os jogos das outras IAs no torneio são materializados (não só o campeão), preenchendo tabela e bracket.
- [ ] **CHAMP-03**: O usuário enfrenta adversários reais por chaveamento com seeding — sem repetição artificial de oponente.
- [ ] **CHAMP-04**: O Major usa formato Suíço com desempate por Buchholz (3 vitórias classifica / 3 derrotas elimina).
- [ ] **CHAMP-05**: Torneios estilo BLAST usam fase de grupos GSL (dupla eliminação).
- [ ] **CHAMP-06**: Ligas usam fase de pontos corridos (round-robin) seguida de playoff.
- [ ] **CHAMP-07**: O formato do confronto (Bo1/Bo3/Bo5) varia por contexto, com Bo1 mais sujeito a zebra.
- [ ] **CHAMP-08**: Existe uma tela de Campeonatos que lista todos os torneios e mostra, por torneio, abas de Classificação, Jogos, Bracket, Campanha do meu time e Estatísticas.
- [ ] **CHAMP-09**: Cada torneio exibe o mapa mais jogado do evento.
- [ ] **CHAMP-10**: A campanha de cada torneio é preservada no histórico ao virar a temporada (sala de troféus).

## Out of Scope (v2.0)
- Editor de formato de campeonato pelo usuário (criar torneios customizados).
- Estatísticas por mapa individual de jogador (heatmaps, etc).
- Transmissão/replay visual além do round-a-round já existente.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STATS-01 | Phase 1 | Done |
| STATS-02 | Phase 1 | Done |
| STATS-03 | Phase 1 | Done |
| STATS-04 | Phase 1 | Done |
| STATS-05 | Phase 1 | Done |
| STATS-06 | Phase 4 | Done |
| ROLES-01 | Phase 2 | Done |
| ROLES-02 | Phase 2 | Done |
| ROLES-03 | Phase 2 | Done |
| ROLES-04 | Phase 2 | Done |
| ROLES-05 | Phase 2 | Done |
| CHAMP-01 | Phase 3 | Done |
| CHAMP-02 | Phase 3 | Done |
| CHAMP-03 | Phase 3 | Done |
| CHAMP-04 | Phase 3 | Done |
| CHAMP-05 | Phase 3 | Done |
| CHAMP-06 | Phase 3 | Done |
| CHAMP-07 | Phase 3 | Done |
| CHAMP-08 | Phase 4 | Done |
| CHAMP-09 | Phase 3 | Done |
| CHAMP-10 | Phase 4 | Done |
