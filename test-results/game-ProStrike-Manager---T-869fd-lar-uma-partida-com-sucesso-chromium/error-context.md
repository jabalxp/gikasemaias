# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game.spec.ts >> ProStrike Manager - Testes End-to-End de Navegação e Jogabilidade >> Deve criar nova carreira, navegar por todas as abas e simular uma partida com sucesso
- Location: tests\game.spec.ts:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Vitória na Série').or(locator('text=Derrota na Série'))
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=Vitória na Série').or(locator('text=Derrota na Série'))

```

```yaml
- text: Série MD1 • Sala de Preparação
- heading "CONFRONTO DE HOJE" [level=2]
- img "Emblema FURIA"
- paragraph: FURIA
- text: "América do Sul • Rank #750 VS Mapas da Série (MD1)"
- img "Emblema Virtus.pro"
- paragraph: Virtus.pro
- text: "Europa • Rank #855 Probabilidade FURIA: 49% Probabilidade VP: 51%"
- paragraph: "Média de Combat Skill — FURIA: 78 · VP: 82"
- button "Assistir Round a Round"
- button "Simular Rápido"
```

# Test source

```ts
  17  |       consoleErrors.push(`[Page Error]: ${err.message}`);
  18  |     });
  19  |   });
  20  | 
  21  |   test('Deve criar nova carreira, navegar por todas as abas e simular uma partida com sucesso', async ({ page }) => {
  22  |     // 1. Acessa o servidor local de desenvolvimento
  23  |     await page.goto('http://localhost:5173');
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     // Garante que o localStorage está limpo para um início fresco
  27  |     await page.evaluate(() => localStorage.clear());
  28  |     await page.reload();
  29  |     await page.waitForLoadState('networkidle');
  30  | 
  31  |     // Tira uma screenshot da tela inicial
  32  |     const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  33  |     if (!fs.existsSync(screenshotsDir)) {
  34  |       fs.mkdirSync(screenshotsDir, { recursive: true });
  35  |     }
  36  |     await page.screenshot({ path: path.join(screenshotsDir, '01_home.png') });
  37  | 
  38  |     // 2. Inicia o fluxo de Novo Jogo
  39  |     await page.click('text=NOVO JOGO / CARREIRA');
  40  |     await page.waitForTimeout(500);
  41  |     await page.screenshot({ path: path.join(screenshotsDir, '02_newgame.png') });
  42  | 
  43  |     // Preenche cadastro do Manager
  44  |     await page.fill('input[placeholder="Ex: Gabriel FalleN"]', 'Tony FalleN');
  45  |     await page.selectOption('select', { label: 'Brasil' });
  46  |     
  47  |     // Seleciona a dificuldade "Normal" e o time "Furia"
  48  |     await page.click('text=Normal');
  49  |     await page.click('text=FURIA');
  50  | 
  51  |     await page.screenshot({ path: path.join(screenshotsDir, '03_newgame_filled.png') });
  52  | 
  53  |     // Confirma e inicia carreira
  54  |     await page.click('text=INICIAR CARREIRA');
  55  |     await page.waitForTimeout(1000);
  56  | 
  57  |     // 3. Valida chegada ao Dashboard
  58  |     await expect(page.locator('text=PAINEL DO MANAGER')).toBeVisible();
  59  |     await page.screenshot({ path: path.join(screenshotsDir, '04_dashboard.png') });
  60  | 
  61  |     // 4. Navega sistematicamente por todas as abas do Menu/Sidebar usando os rótulos exatos
  62  |     const sidebarTabs = [
  63  |       { text: 'Gerenciar Elenco', name: '05_squad' },
  64  |       { text: 'Táticas & Vetos', name: '06_tactics' },
  65  |       { text: 'Treino Semanal', name: '07_training' },
  66  |       { text: 'Calendário', name: '08_calendar' },
  67  |       { text: 'Campeonatos', name: '09_championships' },
  68  |       { text: 'Amistosos', name: '10_friendlies' },
  69  |       { text: 'Comissão Técnica', name: '11_staff' },
  70  |       { text: 'Academia Base', name: '12_academy' },
  71  |       { text: 'Mercado Pro', name: '13_market' },
  72  |       { text: 'Finanças & Sponsor', name: '14_finances' },
  73  |       { text: 'Rankings Mundiais', name: '15_rankings' },
  74  |       { text: 'Histórico & Títulos', name: '16_history' }
  75  |     ];
  76  | 
  77  |     for (const tab of sidebarTabs) {
  78  |       console.log(`Navegando para a aba: ${tab.text}`);
  79  |       await page.click(`aside button:has-text("${tab.text}")`);
  80  |       await page.waitForTimeout(500);
  81  |       await page.screenshot({ path: path.join(screenshotsDir, `${tab.name}.png`) });
  82  |     }
  83  | 
  84  |     // 5. Retorna ao Dashboard
  85  |     await page.click('aside button:has-text("Painel Principal")');
  86  |     await page.waitForTimeout(500);
  87  | 
  88  |     // 6. Avança a semana de jogo (Disputar Partida / Avançar Até a Partida)
  89  |     console.log('Disparando botão de avanço/ação principal do Dashboard...');
  90  |     const disputarBtn = page.locator('button:has-text("DISPUTAR PARTIDA AGORA")');
  91  |     const avancarBtn = page.locator('button:has-text("AVANÇAR ATÉ A PARTIDA")');
  92  |     
  93  |     if (await disputarBtn.isVisible()) {
  94  |       await disputarBtn.click();
  95  |     } else if (await avancarBtn.isVisible()) {
  96  |       await avancarBtn.click();
  97  |     } else {
  98  |       console.log('Tentando clique genérico no botão de ação principal...');
  99  |       await page.click('button:has-text("PARTIDA")');
  100 |     }
  101 |     await page.waitForTimeout(1500);
  102 | 
  103 |     // 7. Se fomos para a tela de pré-jogo (MatchPreview) ou direto avançou
  104 |     const isPreviewVisible = await page.locator('text=Série MD').isVisible();
  105 |     if (isPreviewVisible) {
  106 |       console.log('Tela de pré-jogo visualizada com sucesso!');
  107 |       await page.screenshot({ path: path.join(screenshotsDir, '17_match_preview.png') });
  108 | 
  109 |       // Clica em Simular Rápido para ir direto aos resultados
  110 |       await page.click('text=Simular Rápido');
  111 |       await page.waitForTimeout(3000);
  112 | 
  113 |       // Imprime erros do console coletados para depuração
  114 |       console.log('Erros no console do navegador após simulação rápida:', consoleErrors);
  115 | 
  116 |       // Valida que estamos na tela de resultados e tira screenshot das fotos dos mapas
> 117 |       await expect(page.locator('text=Vitória na Série').or(page.locator('text=Derrota na Série'))).toBeVisible();
      |                                                                                                     ^ Error: expect(locator).toBeVisible() failed
  118 |       await page.screenshot({ path: path.join(screenshotsDir, '18_match_result.png') });
  119 | 
  120 |       // Avança a semana para fechar a partida
  121 |       await page.click('text=Avançar Semana');
  122 |       await page.waitForTimeout(1000);
  123 |       await page.screenshot({ path: path.join(screenshotsDir, '19_dashboard_post_match.png') });
  124 |     } else {
  125 |       console.log('Semana avançada diretamente (sem partidas).');
  126 |     }
  127 | 
  128 |     // 8. Valida a ausência de erros graves no console do navegador
  129 |     console.log(`Total de erros coletados no console: ${consoleErrors.length}`);
  130 |     if (consoleErrors.length > 0) {
  131 |       console.error('Erros encontrados durante os testes de interatividade:');
  132 |       consoleErrors.forEach(err => console.error(err));
  133 |     }
  134 |     
  135 |     expect(consoleErrors).toHaveLength(0);
  136 |   });
  137 | });
  138 | 
```