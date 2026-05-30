# Milestones

## v1.0 — Jogabilidade & Mundo Vivo (entregue 2026-05-30)

Corrigiu os bloqueios de jogabilidade reportados (auditoria do Rafael + feedback do usuário) e tornou o mundo de IA vivo. Fases:

- **F0 — Lutas de verdade**: bônus de arma aditivo + recalibração (rng 98 / aim 0.72 / overall 0.07) → fim do 13×0.
- **F1 — Elenco sempre 5**: `ensureFiveStarters` em toda saída + guard-rail na simulação.
- **F2 — Roles (recomposição)**: IA repõe a mesma role; IGL dá coordenação ao time.
- **F3 — Mundo vivo**: evolução de jovens, declínio de veteranos, reputação/valor dinâmicos.
- **F4 — Qualificação por mérito**: ranking, cotas regionais no Major, Event Weight, calendário denso.
- **F5 — Amistosos**: tela de desafio sob demanda (amistoso neutro).

Também: auditoria do Rafael (deploy vercel.json, reserva de folha), 96 logos reais (Liquipedia). Validado por tsc + build + 4 testes (squadInvariant, roleRecomposition, worldEvolution, qualificationMerit) + balanceHarness + smoke test Playwright.

## v2.0 — Imersão Competitiva (em planejamento)

Campeonatos com tabelas/standings, stats/MVP/assistências de verdade, roles com peso real na simulação. Ver `REQUIREMENTS.md` e `ROADMAP.md`.
