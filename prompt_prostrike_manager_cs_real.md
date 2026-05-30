# PROMPT MASTER — Manager de CS com Dados Reais

> **Objetivo:** criar um jogo web manager de e-sports FPS tático, inspirado em managers clássicos de futebol, mas com tema competitivo de CS/CS2.  
> **Uso pretendido:** projeto pessoal, estudo, diversão solo ou com amigos.  
> **Importante:** usar nomes reais de times, jogadores e mapas como texto/dados editáveis, mas não usar logos, fotos, uniformes, marcas visuais, assets oficiais ou o nome “Counter-Strike” como título principal do jogo.

---

## 1. Papel da IA

Você deve agir como:

- Dev Full Stack Sênior.
- Engenheiro de Games.
- Game Designer.
- Arquiteto de Software.
- UI/UX Designer.
- Especialista em simulação esportiva/e-sports.
- Especialista em balanceamento de jogos manager.

Crie um jogo web completo, jogável e funcional.

Não entregue apenas layout bonito.  
Não entregue apenas mockup.  
Não entregue apenas telas estáticas.  
O jogo precisa funcionar de verdade.

---

## 2. Nome do jogo

Não use “Counter-Strike” ou “CS2” como título principal do jogo.

Sugestões de nome:

- ProStrike Manager
- Clutch Manager
- Tactical Manager FPS
- Arena FPS Manager
- Major Manager
- Headshot Manager
- Bombsite Manager
- Global Tactics Manager

Use o nome **ProStrike Manager** como padrão, mas deixe fácil trocar depois.

---

## 3. Tipo de projeto

Criar um **manager de e-sports FPS tático**.

O jogador será dono, técnico e manager de uma organização competitiva.

Ele deve:

- Escolher ou criar uma organização.
- Gerenciar elenco.
- Contratar jogadores reais.
- Vender jogadores.
- Definir titulares.
- Definir funções.
- Definir táticas.
- Treinar jogadores.
- Administrar dinheiro.
- Fechar patrocínios.
- Investir na base.
- Disputar campeonatos.
- Simular partidas round a round.
- Evoluir jogadores.
- Subir no ranking.
- Vencer campeonatos nacionais, internacionais e Majors fictícios.

A pegada deve ser de manager clássico: simples, viciante, estratégico, rápido de jogar e com muitas decisões importantes.

---

## 4. Stack obrigatória

Use:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- Zustand para estado global.
- LocalStorage ou IndexedDB para saves.
- Framer Motion, se fizer sentido.
- Recharts para gráficos simples, se fizer sentido.
- Lucide React para ícones.
- Componentes limpos e reutilizáveis.

O MVP deve funcionar sem backend.

Deixe preparado para futura integração com:

- Firebase.
- Supabase.
- Banco online.
- Multiplayer assíncrono.
- Importação/exportação de dados JSON.

---

## 5. Regras legais e de uso de nomes reais

Este projeto é para uso pessoal, estudo, protótipo e diversão com amigos.

Pode usar como texto/dados editáveis:

- Nomes reais de times.
- Nomes reais de jogadores.
- Nicknames reais.
- Nacionalidades reais.
- Mapas reais.
- Regiões reais.
- Funções reais de jogadores.

Não usar:

- Logos oficiais.
- Escudos oficiais.
- Fotos reais.
- Uniformes oficiais.
- Ícones oficiais.
- Assets oficiais de jogos.
- Marcas visuais protegidas.
- Nome “Counter-Strike” como nome principal do jogo.
- Nome “CS2” como nome principal do jogo.
- Imagens baixadas automaticamente de jogadores ou organizações.

Para times reais, gerar visual genérico com:

- Iniciais.
- Cores editáveis.
- Ícones abstratos.
- Formas geométricas.
- Avatares gerados por texto.

Exemplo:

- FURIA aparece como texto “FURIA”.
- O escudo visual deve ser genérico, criado pelo sistema, sem copiar a pantera/logo oficial.

---

## 6. Modos de jogo

Ao iniciar uma carreira, o jogador escolhe:

### 6.1 Modo Realista

- Usa times reais.
- Usa jogadores reais.
- Usa mapas reais.
- Usa regiões reais.
- Usa rankings aproximados/editáveis.
- Usa elencos reais ou próximos da realidade.
- Jogadores sem time viram free agents.
- Times incompletos são preenchidos com jogadores gerados.

### 6.2 Modo Alternativo

- Usa times reais.
- Usa jogadores reais.
- Embaralha os elencos.
- Cria mercados imprevisíveis.
- Pode gerar transferências aleatórias no início.

### 6.3 Modo Fictício

- Usa apenas times fictícios.
- Usa apenas jogadores gerados.
- Usa mapas fictícios.
- Ideal para versão pública/comercial.

Para este projeto, priorize o **Modo Realista**, porque a ideia é diversão solo/entre amigos.

---

## 7. Criação de carreira

Tela “Novo Jogo” com:

- Nome do manager.
- Nacionalidade do manager.
- Nome da organização, caso queira criar uma.
- Sigla da organização.
- Cor primária.
- Cor secundária.
- Dificuldade.
- Modo de jogo.
- Time inicial.

Opções de dificuldade:

- Fácil.
- Normal.
- Difícil.
- Hardcore.

A dificuldade deve afetar:

- Dinheiro inicial.
- Moral inicial.
- Qualidade do elenco disponível.
- Exigência dos patrocinadores.
- Força dos adversários.
- Recompensas.
- Salários.
- Frequência de propostas.

Opções de time inicial:

- Escolher time real existente.
- Criar organização própria.
- Começar desempregado e receber propostas.
- Começar com elenco aleatório.

---

## 8. Times reais

Criar um banco inicial em:

```txt
src/game/data/realTeams.ts
```

Cada time deve ter:

- ID.
- Nome.
- Sigla.
- País.
- Região.
- Tier.
- Ranking aproximado.
- Reputação.
- Orçamento.
- Estilo de jogo.
- Mapas fortes.
- Mapas fracos.
- Rivalidades.
- Elenco.
- Cores genéricas.
- Objetivo da temporada.

### 8.1 Times brasileiros/sul-americanos obrigatórios

Inclua pelo menos:

- FURIA
- paiN Gaming
- MIBR
- Imperial
- Legacy
- Fluxo
- RED Canids
- Sharks
- ODDIK
- BESTIA
- 9z Team
- Case Esports
- W7M
- Hype
- Galorys
- Solid
- Bounty Hunters
- Players
- Corinthians Esports
- Flamengo Esports
- LOUD

### 8.2 Times internacionais obrigatórios

Inclua pelo menos:

- Team Vitality
- Natus Vincere
- FaZe Clan
- Team Spirit
- G2 Esports
- MOUZ
- Team Falcons
- Team Liquid
- Complexity
- Astralis
- Virtus.pro
- HEROIC
- Ninjas in Pyjamas
- fnatic
- BIG
- ENCE
- Cloud9
- GamerLegion
- SAW
- The MongolZ
- Aurora
- BetBoom Team
- 3DMAX
- B8
- Eternal Fire
- Monte
- Apeks
- OG
- TSM
- PARIVISION
- Sangal
- M80
- FlyQuest
- Lynn Vision
- TYLOO
- Rare Atom
- Grayhound
- NRG
- Wildcard
- MASONIC
- ECSTATIC
- Sprout
- Copenhagen Wolves

Se algum time estiver sem elenco definido, completar com jogadores gerados.

---

## 9. Jogadores reais

Criar um banco inicial em:

```txt
src/game/data/realPlayers.ts
```

Cada jogador real deve ter:

- ID.
- Nickname.
- Nome real, se conhecido.
- Nacionalidade.
- Idade aproximada.
- Time atual ou último time conhecido.
- Função principal.
- Funções secundárias.
- Overall.
- Potencial.
- Valor de mercado fictício.
- Salário fictício.
- Contrato fictício.
- Moral.
- Forma.
- Experiência.
- Personalidade.
- Atributos.
- Status: titular, reserva, free agent, aposentado ou coach.

### 9.1 Atributos dos jogadores

Cada jogador deve ter atributos de 1 a 100:

- Mira.
- Reflexo.
- Controle de spray.
- Noção de jogo.
- Posicionamento.
- Comunicação.
- Liderança.
- Controle emocional.
- Clutch.
- Utilitários.
- Agressividade.
- Consistência.
- Disciplina.
- Trabalho em equipe.
- Stamina.
- Potencial.
- Experiência.
- Impacto.
- Versatilidade.

### 9.2 Funções

Funções principais:

- AWPer.
- Rifler.
- Entry Fragger.
- Lurker.
- Support.
- IGL.
- Anchor.
- Rotator.
- Clutcher.
- Star Player.

Permitir função principal e funções secundárias.

### 9.3 Jogadores brasileiros obrigatórios

Inclua pelo menos:

- FalleN
- fer
- coldzera
- fnx
- TACO
- boltz
- felps
- HEN1
- LUCAS1
- kNgV-
- yuurih
- KSCERATO
- arT
- VINI
- saffee
- chelo
- drop
- guerri
- insani
- exit
- brnz4n
- biguzera
- skullz
- nqz
- lux
- kauez
- snow
- decenty
- dumau
- latto
- b4rtiN
- dav1deuS
- try
- max
- malbsMd
- davideuS
- cass1n
- togs
- WOOD7
- JOTA
- PKL
- hardzao
- NEKIZ
- Lucaozy
- zevy
- historia
- gafolo

### 9.4 Jogadores internacionais obrigatórios

Inclua pelo menos:

- s1mple
- ZywOo
- NiKo
- m0NESY
- donk
- sh1ro
- ropz
- rain
- karrigan
- broky
- frozen
- dev1ce
- blameF
- cadiaN
- Twistzz
- NAF
- EliGE
- b1t
- jL
- w0nderful
- Aleksib
- apEX
- Spinx
- flameZ
- mezii
- Magisk
- dupreeh
- gla1ve
- XANTARES
- woxic
- MAJ3R
- electroNic
- Perfecto
- Ax1Le
- huNter-
- HooXi
- nexa
- torzsi
- Jimpphat
- xertioN
- siuhy
- chopper
- zont1x
- magixx
- iM
- Snappi
- NertZ
- SunPayus
- jabbi
- stavn
- TeSeS
- sjuush
- degster
- KSCERATO
- YEKINDAR
- Jame
- FL1T
- fame
- n0rb3r7
- REZ
- Brollan
- k0nfig
- headtr1ck
- KRIMZ
- mezii
- mezii
- blameF
- device
- Ax1Le
- Senzu
- 910
- Techno4K
- blitz
- mzinho
- kaze
- JamYoung
- somebody
- advent
- dexter
- jks
- INS
- Liazz

Remova duplicados no código.

### 9.5 Exemplo de construção de atributos

O sistema deve atribuir atributos coerentes com o perfil do jogador.

Exemplos:

- FalleN: AWPer/IGL, altíssima liderança, comunicação, experiência e noção de jogo.
- KSCERATO: Rifler/Clutcher, alta consistência, mira, clutch e disciplina.
- yuurih: Rifler, impacto, consistência e teamplay altos.
- biguzera: IGL/Rifler, liderança, mira e impacto altos.
- ZywOo: AWPer/Star Player, overall altíssimo, reflexo, clutch e consistência altíssimos.
- s1mple: AWPer/Star Player, impacto, mira, clutch e agressividade altíssimos.
- NiKo: Rifler/Star Player, mira, controle de spray e impacto altíssimos.
- m0NESY: AWPer, reflexo e mecânica altíssimos.
- donk: Entry/Rifler, agressividade, mira e impacto altíssimos.
- karrigan: IGL, liderança, leitura tática e experiência altíssimas.
- apEX: IGL, liderança, emoção e agressividade altas.
- ropz: Lurker/Rifler, disciplina, posicionamento e clutch altos.
- dev1ce: AWPer, posicionamento, consistência e disciplina altíssimos.
- XANTARES: Rifler, mira e reflexo altíssimos.

Os overalls devem ser balanceados, não exagerados.

Sugestão:

- Lendas/estrelas absolutas: 88 a 96.
- Grandes jogadores Tier 1: 82 a 89.
- Bons jogadores Tier 1/Tier 2: 75 a 83.
- Jogadores nacionais bons: 68 a 78.
- Jovens promessas: 58 a 76, com potencial alto.

---

## 10. Mapas reais

Criar banco inicial em:

```txt
src/game/data/realMaps.ts
```

### 10.1 Map pool ativo principal

Usar como pool competitivo principal:

- Anubis
- Ancient
- Dust2
- Inferno
- Mirage
- Nuke
- Overpass

### 10.2 Mapas reserva/históricos/editáveis

Também incluir:

- Train
- Vertigo
- Cache
- Cobblestone
- Tuscan
- Season
- Agency
- Office
- Italy
- Basalt

Cada mapa deve ter:

- ID.
- Nome.
- Status: ativo, reserva, histórico ou casual.
- Exigência de mira.
- Exigência tática.
- Exigência de utilitários.
- Impacto de AWP.
- Importância de lurker.
- Importância de entry.
- Importância de IGL.
- Dificuldade para ataque.
- Dificuldade para defesa.
- Tendência de lado.
- Ritmo médio.
- Tipo de mapa.
- Times especialistas.
- Jogadores que performam melhor.

### 10.3 Perfil dos mapas

Exemplos:

#### Dust2

- Mapa clássico.
- Favorece AWP.
- Favorece duelos de mira.
- Bom para times agressivos.
- Alto impacto de pickoff.

#### Mirage

- Mapa equilibrado.
- Bom para execuções.
- Bom para jogadores individuais fortes.
- Exige boa comunicação no meio.

#### Inferno

- Exige controle de utilitários.
- Exige paciência.
- Bom para supports e anchors.
- Retakes são importantes.

#### Nuke

- Mapa muito tático.
- Exige rotação, comunicação e leitura.
- Favorece IGL forte.
- Punir erro de comunicação.

#### Ancient

- Exige controle de mapa.
- Favorece riflers fortes.
- Exige bom uso de utilitários.

#### Anubis

- Mapa dinâmico.
- Bom para times agressivos.
- Exige controle de espaços e leitura de timings.

#### Overpass

- Mapa tático.
- Exige controle de mapa.
- Rotação e leitura são muito importantes.

---

## 11. Dashboard principal

Criar uma tela principal com:

- Nome do time.
- Sigla.
- Ranking nacional.
- Ranking mundial.
- Saldo.
- Reputação.
- Moral média.
- Sinergia.
- Forma recente.
- Próxima partida.
- Próximo campeonato.
- Notícias recentes.
- Atalhos rápidos.

Atalhos:

- Elenco.
- Tática.
- Treino.
- Mercado.
- Base.
- Campeonatos.
- Calendário.
- Finanças.
- Patrocínios.
- Ranking.
- Jogar próxima partida.

---

## 12. Sistema de elenco

Tela de elenco com:

- Lista de todos os jogadores.
- Titulares.
- Reservas.
- Free agents, se estiverem no mercado.
- Overall.
- Potencial.
- Função.
- Idade.
- Nacionalidade.
- Salário.
- Valor.
- Moral.
- Forma.
- Contrato.
- Cansaço.

Ações:

- Definir titular.
- Remover titular.
- Definir AWPer.
- Definir IGL.
- Definir capitão.
- Colocar no banco.
- Colocar à venda.
- Renovar contrato.
- Dispensar.
- Ver perfil.
- Comparar jogadores.
- Auto escalação.

Regras:

- Time precisa de no mínimo 5 jogadores.
- O elenco ideal deve ter 6 a 8 jogadores.
- Se jogar com jogador cansado, performance cai.
- Se deixar estrela no banco, moral pode cair.
- Se trocar muito o elenco, sinergia cai.
- Se manter elenco por muito tempo, sinergia sobe.

---

## 13. Perfil do jogador

Cada jogador deve ter página própria com:

- Nickname.
- Nome real.
- Nacionalidade.
- Idade.
- Time.
- Função.
- Overall.
- Potencial.
- Valor.
- Salário.
- Contrato.
- Moral.
- Forma.
- Cansaço.
- Estatísticas da temporada.
- Estatísticas da carreira.
- Gráfico de evolução.
- Histórico de times.
- Títulos.
- Prêmios individuais.
- Personalidade.
- Pontos fortes.
- Pontos fracos.

Estatísticas:

- Rating.
- K/D.
- ADR.
- KAST.
- HS%.
- Clutches vencidos.
- First kills.
- First deaths.
- Mapas jogados.
- MVPs.
- Títulos.

---

## 14. Sistema de táticas

Tela de tática com:

### 14.1 Estilo de jogo

- Muito agressivo.
- Agressivo.
- Equilibrado.
- Defensivo.
- Muito defensivo.

### 14.2 Ritmo

- Lento.
- Normal.
- Rápido.
- Explosivo.

### 14.3 Foco tático

- Domínio de mapa.
- Execução rápida.
- Controle econômico.
- Pickoffs.
- Retake.
- Defesa sólida.
- Jogo em equipe.
- Jogo individual.
- Controle de meio.
- Explosão em bombsite.
- Jogo de default.

### 14.4 Uso de utilitários

- Baixo.
- Médio.
- Alto.
- Muito alto.

### 14.5 Economia

- Econômica.
- Equilibrada.
- Forçada.
- Agressiva.

### 14.6 Veto de mapas

Criar sistema de veto para MD1, MD3 e MD5.

O sistema deve considerar:

- Mapas fortes do time.
- Mapas fracos do time.
- Mapas fortes do adversário.
- Mapas fracos do adversário.
- Forma recente.
- Estatísticas do elenco.
- Tática escolhida.

Botões:

- Veto manual.
- Veto automático.
- Sugerir melhor mapa.
- Sugerir permaban.

---

## 15. Sistema de treino

Tela de treino semanal.

Categorias:

- Mira.
- Reflexo.
- Spray.
- Tática.
- Utilitários.
- Comunicação.
- Clutch.
- Controle emocional.
- Stamina.
- Map pool.
- Economia.
- Teamplay.
- Retake.
- Entry.
- AWP.
- Anti-eco.
- Pistols.

Intensidade:

- Leve.
- Normal.
- Pesada.
- Bootcamp.

Efeitos:

- Treino pesado aumenta evolução, mas aumenta cansaço.
- Treino leve recupera moral, mas evolui pouco.
- Bootcamp melhora sinergia e mapa, mas custa dinheiro.
- Treino focado melhora atributos específicos.
- Jogadores jovens evoluem mais.
- Jogadores veteranos evoluem menos, mas mantêm experiência.

---

## 16. Sinergia

Criar sinergia do time de 0 a 100.

Aumenta com:

- Vitórias.
- Sequência do mesmo elenco.
- Treino de comunicação.
- IGL forte.
- Jogadores compatíveis.
- Bootcamp.
- Títulos.

Diminui com:

- Derrotas.
- Trocas constantes.
- Salário atrasado.
- Jogador insatisfeito.
- Estrela no banco.
- Crise financeira.
- Conflitos de personalidade.

A sinergia deve influenciar fortemente as partidas.

---

## 17. Mercado de transferências

Tela de mercado com:

- Jogadores de outros times.
- Free agents.
- Jogadores transferíveis.
- Jovens promessas.
- Jogadores aposentando.
- Coaches disponíveis.

Filtros:

- Nome.
- Nickname.
- País.
- Time.
- Função.
- Idade.
- Overall.
- Potencial.
- Valor.
- Salário.
- Contrato.
- Status.

Ações:

- Fazer proposta.
- Negociar salário.
- Contratar.
- Vender.
- Colocar à venda.
- Recusar proposta.
- Comparar jogador.
- Observar jogador.

Negociação deve considerar:

- Reputação do time.
- Salário oferecido.
- Tempo de contrato.
- Interesse do jogador.
- Ranking.
- Moral.
- Papel no elenco.
- Relação com outros jogadores.
- Proposta de outros times.

---

## 18. Base e scout

Tela de base com:

- Investimento mensal.
- Nível da base.
- Scouts.
- Jovens observados.
- Relatórios.
- Promoção para o elenco principal.

Tipos de jovens:

- Comum.
- Promessa.
- Boa promessa.
- Joia.
- Fenômeno.

Cada jovem deve ter:

- Nome.
- Nickname.
- Idade.
- País.
- Função.
- Overall oculto ou parcial.
- Potencial oculto ou parcial.
- Personalidade.
- Custo.
- Tempo de observação.

Scouts melhores revelam mais informações.

---

## 19. Finanças

Tela de finanças com:

- Caixa atual.
- Receita mensal.
- Despesas mensais.
- Folha salarial.
- Premiações.
- Patrocínios.
- Transferências.
- Base.
- Staff.
- Bootcamp.
- Histórico financeiro.

Se o caixa ficar negativo:

- Moral cai.
- Jogadores podem pedir saída.
- Contratações ficam bloqueadas.
- Patrocinadores podem reclamar.
- Diretoria pressiona.
- Pode ser necessário vender jogador.

---

## 20. Patrocínios

Usar patrocinadores reais ou fictícios?

Para evitar uso indevido de marcas visuais, o jogo deve usar **patrocinadores fictícios por padrão**.

Mas permitir adicionar patrocinador real manualmente no editor.

Patrocinadores fictícios sugeridos:

- HyperCore.
- AimLabz.
- Nitrus Energy.
- ByteForce.
- RedFox Gear.
- Nexus Chips.
- PixelBank.
- StormTech.
- ClutchWear.
- GameFuel.
- NeonBank.
- UltraGear.

Cada patrocínio deve ter:

- Nome.
- Valor mensal.
- Bônus por vitória.
- Bônus por título.
- Duração.
- Exigências.
- Multa.
- Reputação mínima.
- Penalidade por desempenho ruim.

Ações:

- Aceitar.
- Recusar.
- Rescindir.
- Renegociar.
- Ver detalhes.

---

## 21. Staff

Contratar:

- Coach.
- Analista.
- Psicólogo.
- Scout.
- Preparador físico.
- Manager financeiro.
- Analista de dados.
- Treinador de mira.
- Treinador tático.

Cada staff tem:

- Nome.
- País.
- Nível.
- Especialidade.
- Salário.
- Efeito.
- Reputação.

Exemplos de efeitos:

- Coach melhora tática e sinergia.
- Analista melhora veto e preparação.
- Psicólogo melhora moral e clutch.
- Scout melhora base e mercado.
- Preparador físico reduz cansaço.
- Financeiro reduz despesas.

---

## 22. Campeonatos

Criar campeonatos com nomes fictícios, mas inspirados na estrutura real do cenário.

Não usar nomes oficiais de campeonatos se houver risco de marca.  
Mas pode criar nomes parecidos genericamente.

### 22.1 Tier 4

- Liga Amadora Regional.
- Copa Lan House.
- Circuito Aberto.
- Open Qualifier Regional.

### 22.2 Tier 3

- Liga Nacional Academy.
- Challenger Regional.
- Copa Semi-Pro.
- Circuito Sul-Americano.

### 22.3 Tier 2

- Liga Nacional Elite.
- Masters Challenger.
- Continental Cup.
- Pro League Regional.

### 22.4 Tier 1

- Major Mundial.
- Superliga Global.
- Champions FPS.
- World Arena Cup.
- International Masters.
- Elite Series.

Cada campeonato deve ter:

- Nome.
- Tier.
- Premiação.
- Número de times.
- Formato.
- Fase de grupos.
- Playoffs.
- MD1, MD3 ou MD5.
- Ranking points.
- Convites.
- Qualificatórias.
- Histórico de campeões.

---

## 23. Calendário e temporadas

Criar sistema de calendário por semanas.

Eventos:

- Treino.
- Partida.
- Campeonato.
- Janela de transferência.
- Bootcamp.
- Descanso.
- Férias.
- Final de temporada.
- Convites.
- Qualificatórias.
- Renovação de contratos.

Ao fim da temporada:

- Atualizar rankings.
- Pagar premiações.
- Atualizar contratos.
- Envelhecer jogadores.
- Evoluir jogadores.
- Gerar jovens.
- Gerar notícias.
- Atualizar mercado.
- Gerar transferências de IA.
- Gerar novos objetivos.
- Mostrar resumo da temporada.

---

## 24. Rankings

Criar:

- Ranking nacional.
- Ranking regional.
- Ranking mundial.

Fatores:

- Vitórias recentes.
- Derrotas recentes.
- Força dos adversários.
- Títulos.
- Campanhas em campeonatos.
- Tier do evento.
- Forma dos últimos 3 meses.
- Consistência.
- Ranking anterior.

Mostrar:

- Top 100 mundial.
- Top 50 regional.
- Top 30 nacional.
- Variação semanal.
- Pontos.
- Histórico de posição.

---

## 25. Simulação de partidas

A partida é o coração do jogo.

Formato padrão:

- MR12.
- 12 rounds por lado.
- Vence quem chegar a 13 rounds.
- Se 12x12, usar overtime opcional.
- MD1, MD3 ou MD5 conforme campeonato.

### 25.1 Pré-jogo

Mostrar:

- Times.
- Ranking.
- Forma.
- Elencos.
- Táticas.
- Mapa.
- Histórico recente.
- Odds/probabilidade.
- Jogadores-chave.
- Veto de mapas.
- Botão “Simular rápido”.
- Botão “Assistir round a round”.

### 25.2 Durante o jogo

Mostrar:

- Placar.
- Round atual.
- Lado.
- Economia.
- Eventos.
- Kills importantes.
- Clutches.
- First kill.
- Bomb plant.
- Defuse.
- Save.
- Eco.
- Force.
- Full buy.
- Pausa tática.
- Momentum.
- Destaque do round.

Eventos exemplo:

- “ZywOo abriu o round com uma eliminação de AWP.”
- “KSCERATO venceu um clutch 1v2.”
- “NiKo dominou o meio com dois abates.”
- “FalleN pediu pausa tática e ajustou a defesa.”
- “donk abriu o bombsite com entrada agressiva.”
- “ropz encontrou espaço no lurk e decidiu o round.”
- “apEX leu bem a rotação adversária.”
- “m0NESY salvou a AWP para o próximo round.”
- “biguzera comandou um retake perfeito.”

### 25.3 Pós-jogo

Mostrar:

- Placar final.
- Mapas jogados.
- MVP.
- Rating dos jogadores.
- K/D.
- ADR.
- KAST.
- Clutches.
- Impacto.
- Variação de moral.
- Variação de ranking.
- Receita.
- Premiação.
- Notícias geradas.

---

## 26. Fórmula da simulação

Criar função de poder do time.

Exemplo:

```ts
teamPower =
  averageOverall * 0.25 +
  synergy * 0.14 +
  morale * 0.10 +
  recentForm * 0.10 +
  mapMastery * 0.12 +
  tacticalFit * 0.10 +
  economy * 0.06 +
  leadership * 0.06 +
  clutchFactor * 0.04 +
  experience * 0.03
```

Depois comparar os dois times com aleatoriedade controlada.

Regras:

- Time melhor vence mais.
- Zebras podem acontecer.
- Tática deve importar.
- Mapa deve importar.
- Economia deve importar.
- Overall sozinho não pode decidir tudo.
- Jogador estrela pode decidir rounds.
- IGL forte deve melhorar adaptação.
- Moral baixa deve punir.
- Cansaço alto deve punir.

---

## 27. Economia dentro da partida

Estados econômicos:

- Pistol.
- Eco.
- Force buy.
- Half buy.
- Full buy.
- Bonus.
- Save.
- Reset econômico.

A economia influencia:

- Chance de vencer round.
- Chance de first kill.
- Chance de clutch.
- Chance de save.
- Momentum.

Não precisa simular arma por arma no MVP, mas o estado econômico deve ser visível.

---

## 28. Estatísticas

Guardar estatísticas de:

### Jogador

- Partidas.
- Mapas.
- Rating médio.
- Kills.
- Deaths.
- Assists.
- K/D.
- ADR.
- KAST.
- HS%.
- First kills.
- First deaths.
- Clutches.
- MVPs.

### Time

- Vitórias.
- Derrotas.
- Win rate.
- Títulos.
- Map win rate.
- Melhor mapa.
- Pior mapa.
- Sequência atual.
- Ranking histórico.

### Campeonato

- Campeão.
- Vice.
- MVP.
- Melhor rating.
- Melhor mapa.
- Maior zebra.
- Final.

---

## 29. Notícias dinâmicas

Criar sistema de notícias.

Exemplos:

- “FURIA vence clássico brasileiro e sobe no ranking.”
- “ZywOo carrega Team Vitality em vitória dominante.”
- “Jogador insatisfeito pode deixar o elenco.”
- “Organização recebe proposta por KSCERATO.”
- “Time sofre eliminação precoce e torcida cobra mudanças.”
- “Jovem promessa surge na base.”
- “Patrocinador ameaça reduzir investimento.”
- “s1mple volta a decidir em partida importante.”
- “donk é eleito MVP do campeonato.”

As notícias devem ser geradas conforme eventos reais do save.

---

## 30. Save/load

Implementar:

- Auto-save.
- Save manual.
- Carregar save.
- Excluir save.
- Exportar save JSON.
- Importar save JSON.

Salvar:

- Carreira.
- Elenco.
- Dinheiro.
- Rankings.
- Calendário.
- Campeonatos.
- Estatísticas.
- Notícias.
- Configurações.
- Dados editados.
- Histórico de temporadas.

O jogo não pode perder progresso ao atualizar a página.

---

## 31. Editor de dados

Criar tela “Editor de Dados”.

Permitir editar:

- Times.
- Jogadores.
- Mapas.
- Campeonatos.
- Patrocinadores.
- Staff.
- Overalls.
- Funções.
- Contratos.
- Nacionalidades.
- Elencos.
- Status de jogadores.

Funções:

- Criar jogador.
- Editar jogador.
- Aposentar jogador.
- Transformar jogador em coach.
- Transferir jogador.
- Criar time.
- Editar time.
- Resetar dados para padrão.
- Importar JSON.
- Exportar JSON.

Isso é essencial porque elencos reais mudam o tempo todo.

---

## 32. Interface visual

UI em português do Brasil.

Estilo:

- Escuro.
- Gamer.
- Moderno.
- Dashboard.
- Neon moderado.
- Cards organizados.
- Tabelas claras.
- Sidebar fixa.
- Header com dados do time.
- Responsivo para desktop/notebook.

Cores:

- Fundo: zinc/slate quase preto.
- Primária: cyan ou violet.
- Sucesso: green.
- Alerta: yellow.
- Erro: red.
- Informação: blue.

Componentes:

- Cards.
- Badges.
- Tabelas.
- Progress bars.
- Modais.
- Toasts.
- Tooltips.
- Tabs.
- Selects.
- Inputs.
- Gráficos simples.

---

## 33. Telas obrigatórias

Criar:

1. Tela inicial.
2. Novo jogo.
3. Escolha de time.
4. Dashboard.
5. Elenco.
6. Perfil do jogador.
7. Tática.
8. Veto de mapas.
9. Treino.
10. Mercado.
11. Base/scout.
12. Campeonatos.
13. Calendário.
14. Pré-jogo.
15. Simulação da partida.
16. Pós-jogo.
17. Ranking.
18. Finanças.
19. Patrocínios.
20. Staff.
21. Notícias.
22. Histórico.
23. Títulos.
24. Configurações.
25. Editor de dados.
26. Save/load.

---

## 34. Arquitetura sugerida

```txt
src/
  components/
    layout/
    ui/
    cards/
    tables/
    modals/
    charts/
  pages/
    Home/
    NewGame/
    TeamSelect/
    Dashboard/
    Squad/
    PlayerProfile/
    Tactics/
    MapVeto/
    Training/
    Market/
    Academy/
    Competitions/
    Calendar/
    MatchPreview/
    MatchSimulation/
    MatchResult/
    Rankings/
    Finances/
    Sponsors/
    Staff/
    News/
    History/
    Settings/
    DataEditor/
    Saves/
  game/
    data/
      realTeams.ts
      realPlayers.ts
      realMaps.ts
      defaultSponsors.ts
      defaultCompetitions.ts
    generators/
      playerGenerator.ts
      teamGenerator.ts
      seasonGenerator.ts
      newsGenerator.ts
      sponsorGenerator.ts
    simulation/
      matchSimulator.ts
      roundSimulator.ts
      economySimulator.ts
      mapVetoSimulator.ts
    ranking/
      rankingSystem.ts
    economy/
      financeSystem.ts
    transfers/
      transferSystem.ts
    training/
      trainingSystem.ts
    save/
      saveSystem.ts
  store/
    useGameStore.ts
  types/
    player.ts
    team.ts
    match.ts
    map.ts
    tournament.ts
    save.ts
    sponsor.ts
    staff.ts
  utils/
  hooks/
  styles/
```

---

## 35. Tipagens obrigatórias

Criar interfaces/types para:

- Player.
- Team.
- RealTeam.
- RealPlayer.
- GameMap.
- Match.
- Round.
- RoundEvent.
- Tournament.
- Season.
- Sponsor.
- Staff.
- NewsItem.
- Tactic.
- SaveGame.
- RankingEntry.
- TransferOffer.
- TrainingPlan.
- Career.
- FinanceEntry.
- PlayerStats.
- TeamStats.

---

## 36. Critérios de aceite

O projeto só está pronto quando eu conseguir:

- Criar carreira.
- Escolher time real.
- Criar organização própria.
- Ver times reais.
- Ver jogadores reais.
- Ver mapas reais.
- Escalar 5 titulares.
- Definir IGL.
- Definir AWPer.
- Definir tática.
- Fazer veto de mapa.
- Treinar time.
- Contratar jogador.
- Vender jogador.
- Jogar partida.
- Ver simulação round a round.
- Ver estatísticas pós-jogo.
- Disputar campeonato.
- Avançar calendário.
- Ver ranking.
- Ganhar/perder dinheiro.
- Receber notícia.
- Salvar jogo.
- Carregar jogo.
- Editar dados reais.
- Exportar/importar save.
- Atualizar página sem quebrar o jogo.

---

## 37. Balanceamento

O jogo deve ser divertido e justo.

Regras:

- Dinheiro não pode ser infinito.
- Salários precisam pesar.
- Jogador velho perde stamina com o tempo.
- Jogador jovem evolui mais.
- Overall não deve decidir tudo.
- Sinergia deve ser importante.
- Mapa deve ser importante.
- Tática deve ser importante.
- Moral deve ser importante.
- Elencos muito estrelados devem ter problemas de salário e ego.
- Times pequenos podem crescer.
- Times grandes devem ser difíceis de bater.
- Zebras devem existir, mas sem parecer aleatório demais.

---

## 38. Prioridade de desenvolvimento

Construa em fases.

### Fase 1 — MVP jogável

- Criar projeto.
- Criar dados reais básicos.
- Criar carreira.
- Dashboard.
- Elenco.
- Tática.
- Simulador de partida.
- Pós-jogo.
- Save/load.

### Fase 2 — Manager completo

- Mercado.
- Treino.
- Calendário.
- Campeonatos.
- Ranking.
- Finanças.
- Notícias.

### Fase 3 — Profundidade

- Patrocínios.
- Staff.
- Base.
- Veto de mapas.
- Estatísticas avançadas.
- Histórico de temporadas.

### Fase 4 — Polimento

- Editor de dados.
- Importar/exportar JSON.
- Animações.
- Gráficos.
- Responsividade.
- Melhorias visuais.

Não pule a Fase 1.  
Faça primeiro o jogo funcionar.

---

## 39. Comandos esperados

O projeto deve rodar com:

```bash
npm install
npm run dev
```

Não pode ter erro no console.

---

## 40. Entrega esperada

Entregar:

- Código completo.
- Projeto React + TypeScript + Vite.
- Tailwind configurado.
- Zustand configurado.
- Dados reais editáveis.
- Geradores automáticos.
- Simulador de partida funcional.
- Sistema de save/load.
- README explicando como rodar.
- Comentários nos pontos importantes.
- Estrutura limpa.

---

## 41. Observações finais para a IA geradora

Priorize diversão, funcionalidade e progressão.

Este jogo precisa parecer um manager de verdade, não uma tela estática.

A experiência ideal:

1. Crio minha carreira.
2. Escolho FURIA, Vitality, NAVI, G2 ou crio meu time.
3. Vejo jogadores reais.
4. Escalo os titulares.
5. Defino tática.
6. Jogo uma MD1 ou MD3.
7. Vejo rounds acontecendo.
8. Vejo estatísticas.
9. Ganho/perco dinheiro, moral e ranking.
10. Contrato jogadores.
11. Disputo campeonatos.
12. Evoluo por temporadas.

Use dados reais como base textual, mas mantenha tudo editável.

O jogo deve ser divertido para jogar solo ou com amigos no mesmo computador, comparando saves, fazendo drafts e criando desafios.
