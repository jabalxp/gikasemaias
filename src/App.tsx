import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { PageTransition } from './components/layout/PageTransition';
import { Home } from './pages/Home';
import { NewGame } from './pages/NewGame';
import { Dashboard } from './pages/Dashboard';
import { Squad } from './pages/Squad';
import { Tactics } from './pages/Tactics';
import { Training } from './pages/Training';
import { Calendar } from './pages/Calendar';
import { Staff } from './pages/Staff';
import { Academy } from './pages/Academy';
import { Market } from './pages/Market';
import { Friendlies } from './pages/Friendlies';
import { Finances } from './pages/Finances';
import { Rankings } from './pages/Rankings';
import { Championships } from './pages/Championships';
import { History } from './pages/History';
import { DataEditor } from './pages/DataEditor';
import { Saves } from './pages/Saves';
import { MatchSim } from './pages/MatchSim';
import { MatchPreview } from './pages/MatchPreview';
import { MatchResult } from './pages/MatchResult';
import { PlayerProfile } from './pages/PlayerProfile';
import { SeasonSummary } from './pages/SeasonSummary';
import { MapVeto } from './pages/MapVeto';

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
      case 'calendar':
        return <Calendar />;
      case 'staff':
        return <Staff />;
      case 'academy':
        return <Academy />;
      case 'market':
        return <Market />;
      case 'friendlies':
        return <Friendlies />;
      case 'finances':
        return <Finances />;
      case 'rankings':
        return <Rankings />;
      case 'championships':
        return <Championships />;
      case 'history':
        return <History />;
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
      case 'mapVeto':
        return <MapVeto />;
      default:
        return <Dashboard />;
    }
  };

  // Se a tela for de simulação visual de partida, oculta a sidebar/header padrão para imersão total
  const isMatchScreen = ['matchSim', 'matchPreview', 'matchResult', 'seasonSummary', 'mapVeto'].includes(currentScreen);

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
        <div className="min-h-screen bg-[#030306] bg-grid-pattern p-8 flex items-center justify-center select-none overflow-y-auto relative overflow-hidden">
          {/* Efeitos de Glows Neon no Fundo */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] glow-blur-cyan rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] glow-blur-purple rounded-full pointer-events-none z-0" />

          <div className="w-full max-w-5xl z-10 relative">
            <PageTransition key={currentScreen}>{renderScreen()}</PageTransition>
          </div>
        </div>
      );
    }

    return (
      <div className="flex bg-[#030305] bg-grid-pattern min-h-screen text-slate-100 font-sans relative overflow-x-hidden">
        {/* Efeitos de Glows Neon no Fundo */}
        <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] glow-blur-cyan rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[70%] glow-blur-purple rounded-full pointer-events-none z-0" />

        <div className="flex flex-1 z-10 relative">
          {/* SIDEBAR DE CONFIGURAÇÃO FIXA */}
          <Sidebar />

          {/* CONTAINER PRINCIPAL */}
          <main className="flex-1 flex flex-col min-h-screen">
            {/* HEADER SUPERIOR */}
            <Header />

            {/* CONTEÚDO DA PÁGINA COM PADDING */}
            <div className="flex-1 p-8 max-w-7xl w-full mx-auto overflow-y-auto">
              <PageTransition key={currentScreen}>{renderScreen()}</PageTransition>
            </div>
          </main>
        </div>
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
