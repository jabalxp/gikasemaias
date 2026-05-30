import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { Home } from './pages/Home';
import { NewGame } from './pages/NewGame';
import { Dashboard } from './pages/Dashboard';
import { Squad } from './pages/Squad';
import { Tactics } from './pages/Tactics';
import { Training } from './pages/Training';
import { Staff } from './pages/Staff';
import { Academy } from './pages/Academy';
import { Market } from './pages/Market';
import { Finances } from './pages/Finances';
import { Rankings } from './pages/Rankings';
import { DataEditor } from './pages/DataEditor';
import { Saves } from './pages/Saves';
import { MatchSim } from './pages/MatchSim';
import { MatchPreview } from './pages/MatchPreview';
import { MatchResult } from './pages/MatchResult';
import { PlayerProfile } from './pages/PlayerProfile';
import { SeasonSummary } from './pages/SeasonSummary';

function App() {
  const { currentScreen, gameLoaded, carregarJogo } = useGameStore();

  // Auto-load automático ao abrir o app se houver save no localStorage
  useEffect(() => {
    if (!gameLoaded) {
      carregarJogo();
    }
  }, [gameLoaded, carregarJogo]);

  // Renderizador dinâmico de páginas internas
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard />;
      case 'squad':
        return <Squad />;
      case 'tactics':
        return <Tactics />;
      case 'training':
        return <Training />;
      case 'staff':
        return <Staff />;
      case 'academy':
        return <Academy />;
      case 'market':
        return <Market />;
      case 'finances':
        return <Finances />;
      case 'rankings':
        return <Rankings />;
      case 'dataEditor':
        return <DataEditor />;
      case 'saves':
        return <Saves />;
      case 'playerProfile':
        return <PlayerProfile />;
      case 'matchPreview':
        return <MatchPreview />;
      case 'matchResult':
        return <MatchResult />;
      case 'matchSim':
        return <MatchSim />;
      case 'seasonSummary':
        return <SeasonSummary />;
      default:
        return <Dashboard />;
    }
  };

  // Se a tela for de simulação visual de partida, oculta a sidebar/header padrão para imersão total
  const isMatchScreen = ['matchSim', 'matchPreview', 'matchResult', 'seasonSummary'].includes(currentScreen);

  // Resolve o layout da tela atual; o ToastContainer é renderizado por cima de qualquer layout.
  const renderLayout = () => {
    if (currentScreen === 'home') {
      return <Home />;
    }

    if (currentScreen === 'newGame') {
      return <NewGame />;
    }

    if (isMatchScreen) {
      return (
        <div className="min-h-screen bg-[#030306] p-8 flex items-center justify-center select-none overflow-y-auto">
          <div className="w-full max-w-5xl">
            {renderScreen()}
          </div>
        </div>
      );
    }

    return (
      <div className="flex bg-[#030305] min-h-screen text-slate-100 font-sans relative overflow-x-hidden">
        {/* SIDEBAR DE CONFIGURAÇÃO FIXA */}
        <Sidebar />

        {/* CONTAINER PRINCIPAL */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* HEADER SUPERIOR */}
          <Header />

          {/* CONTEÚDO DA PÁGINA COM PADDING */}
          <div className="flex-1 p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {renderScreen()}
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {renderLayout()}
      <ToastContainer />
    </>
  );
}

export default App;
