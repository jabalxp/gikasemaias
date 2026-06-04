import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ProStrike Manager - Testes End-to-End de Navegação e Jogabilidade', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitora erros do console do navegador
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error]: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[Page Error]: ${err.message}`);
    });
  });

  test('Deve criar nova carreira, navegar por todas as abas e simular uma partida com sucesso', async ({ page }) => {
    // 1. Acessa o servidor local de desenvolvimento
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Garante que o localStorage está limpo para um início fresco
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Tira uma screenshot da tela inicial
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotsDir, '01_home.png') });

    // 2. Inicia o fluxo de Novo Jogo
    await page.click('text=NOVO JOGO / CARREIRA');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '02_newgame.png') });

    // Preenche cadastro do Manager
    await page.fill('input[placeholder="Ex: Gabriel FalleN"]', 'Tony FalleN');
    await page.selectOption('select', { label: 'Brasil' });
    
    // Seleciona a dificuldade "Normal" e o time "Furia"
    await page.click('text=Normal');
    await page.click('text=FURIA');

    await page.screenshot({ path: path.join(screenshotsDir, '03_newgame_filled.png') });

    // Confirma e inicia carreira
    await page.click('text=INICIAR CARREIRA');
    await page.waitForTimeout(1000);

    // 3. Valida chegada ao Dashboard
    await expect(page.locator('text=PAINEL DO MANAGER')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '04_dashboard.png') });

    // 4. Navega sistematicamente por todas as abas do Menu/Sidebar usando os rótulos exatos
    const sidebarTabs = [
      { text: 'Gerenciar Elenco', name: '05_squad' },
      { text: 'Táticas & Vetos', name: '06_tactics' },
      { text: 'Treino Semanal', name: '07_training' },
      { text: 'Calendário', name: '08_calendar' },
      { text: 'Campeonatos', name: '09_championships' },
      { text: 'Amistosos', name: '10_friendlies' },
      { text: 'Comissão Técnica', name: '11_staff' },
      { text: 'Academia Base', name: '12_academy' },
      { text: 'Mercado Pro', name: '13_market' },
      { text: 'Finanças & Sponsor', name: '14_finances' },
      { text: 'Rankings Mundiais', name: '15_rankings' },
      { text: 'Histórico & Títulos', name: '16_history' }
    ];

    for (const tab of sidebarTabs) {
      console.log(`Navegando para a aba: ${tab.text}`);
      await page.click(`aside button:has-text("${tab.text}")`);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, `${tab.name}.png`) });
    }

    // 5. Retorna ao Dashboard
    await page.click('aside button:has-text("Painel Principal")');
    await page.waitForTimeout(500);

    // 6. Avança a semana de jogo (Disputar Partida / Avançar Até a Partida)
    console.log('Disparando botão de avanço/ação principal do Dashboard...');
    const disputarBtn = page.locator('button:has-text("DISPUTAR PARTIDA AGORA")');
    const avancarBtn = page.locator('button:has-text("AVANÇAR ATÉ A PARTIDA")');
    
    if (await disputarBtn.isVisible()) {
      await disputarBtn.click();
    } else if (await avancarBtn.isVisible()) {
      await avancarBtn.click();
    } else {
      console.log('Tentando clique genérico no botão de ação principal...');
      await page.click('button:has-text("PARTIDA")');
    }
    await page.waitForTimeout(1500);

    // 7. Se fomos para a tela de pré-jogo (MatchPreview) ou direto avançou
    const isPreviewVisible = await page.locator('text=Série MD').isVisible();
    if (isPreviewVisible) {
      console.log('Tela de pré-jogo visualizada com sucesso!');
      await page.screenshot({ path: path.join(screenshotsDir, '17_match_preview.png') });

      // Clica em Simular Rápido para ir direto aos resultados
      await page.click('text=Simular Rápido');
      await page.waitForTimeout(3000);

      // Imprime erros do console coletados para depuração
      console.log('Erros no console do navegador após simulação rápida:', consoleErrors);

      // Valida que estamos na tela de resultados e tira screenshot das fotos dos mapas
      await expect(page.locator('text=Vitória na Série').or(page.locator('text=Derrota na Série'))).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, '18_match_result.png') });

      // Avança a semana para fechar a partida
      await page.click('text=Avançar Semana');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '19_dashboard_post_match.png') });
    } else {
      console.log('Semana avançada diretamente (sem partidas).');
    }

    // 8. Valida a ausência de erros graves no console do navegador
    console.log(`Total de erros coletados no console: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Erros encontrados durante os testes de interatividade:');
      consoleErrors.forEach(err => console.error(err));
    }
    
    expect(consoleErrors).toHaveLength(0);
  });
});
