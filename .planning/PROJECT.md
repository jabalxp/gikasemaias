# ProStrike Manager

## What This Is

Manager de e-sports de Counter-Strike 2 (estilo Football Manager / Brassfoot), single-player, rodando 100% no browser. React 19 + TypeScript (strict, zero `any`) + Vite + Zustand (store única) + Tailwind v4. **Sem backend** — todo o estado persiste em `localStorage`. O jogador assume um time real do cenário de CS, gerencia elenco/táticas/finanças/staff, disputa campeonatos e sobe de divisão rumo ao topo mundial. Deploy na Vercel.

## Core Value

Simular de forma fiel-mas-jogável a jornada de um manager de CS: partidas competitivas (não atropelos), um mundo de IA vivo (times evoluem, mercado se mexe), e progressão por mérito (subir no ranking destrava campeonatos de elite).

## Context

Projeto pessoal/fan (não-comercial). Stack consolidada, sem migração planejada (ver vault `Decisões/nao-migrar-prostrike-react.md`). Motor de simulação em `src/game/simulation/matchSimulator.ts`, calibrado via `balanceHarness`. ~101 times reais, ~511 jogadores, 96 logos reais. Regras de ouro do projeto em `CLAUDE.md` (imutabilidade Zustand, zero any, persistência em SaveGame com fallback, feedback via addToast/ConfirmModal).

## Validated Capabilities (v1.0 — entregue)

- **Simulação calibrada**: bônus de arma aditivo + RNG/skill balanceados — partidas competitivas, fim do 13×0.
- **Integridade de elenco**: todo time mantém 5 titulares (reposição em vendas/aposentadorias); guard-rail na simulação.
- **Recomposição por role**: ao perder titular, a IA repõe a mesma função.
- **Mundo vivo**: jovens de IA evoluem, veteranos declinam, reputação/valor dinâmicos; liga de fundo move o ranking.
- **Qualificação por mérito**: vagas em torneios por ranking, Major com cotas regionais (EU/AM/AS), Event Weight por tier.
- **Amistosos**: desafiar qualquer time sob demanda (neutro).
- **Deploy**: vercel.json (MIME correto na Vercel).

## Key Decisions

- Não migrar de React (avaliado e descartado).
- Logos reais permitidas (projeto não-comercial).
- Sem commit/push automático — só com autorização explícita do usuário no momento.

## Current Milestone: v2.0 Imersão Competitiva

**Goal:** Trazer o "ar competitivo real" (estilo Brassfoot/HLTV): campeonatos com tabelas/standings de verdade, estatísticas e MVP por impacto, e funções (roles) que pesem na simulação.

**Target features:**
- Stats de partida reais: assistências, MVP por impacto, rating tipo HLTV, persistência de carreira do jogador.
- Seção de Campeonatos com tabelas: standings, bracket real (fim do adversário repetido), formatos por tier, campanha, mapa mais jogado.
- Roles com peso real: cada função ponderando os atributos certos na simulação.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**Last updated:** 2026-05-30 — Milestone v2.0 started (GSD adotado em projeto existente).
