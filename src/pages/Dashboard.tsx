import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Newspaper, Trophy, Play, Users, Sliders, DollarSign, Dumbbell } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    managerName,
    userTeamId,
    teams,
    players,
    historyNews,
    currentWeek,
    setScreen,
    iniciarPartidaContra
  } = useGameStore();

  const userTeam = teams[userTeamId];

  if (!userTeam) {
    return (
      <div className="flex items-center justify-center h-64 text-sm font-semibold text-slate-400">
        Carregando carreira…
      </div>
    );
  }

  // Encontra o próximo adversário (placeholder simples baseado em times reais)
  const allOpponents = Object.values(teams).filter(t => t.id !== userTeamId);
  const nextOpponent = allOpponents[currentWeek % allOpponents.length] ?? allOpponents[0];

  const userSquad = Object.values(players).filter(p => p.teamId === userTeamId && p.status === 'titular');
  const oppSquad = Object.values(players).filter(p => p.teamId === nextOpponent.id && p.status === 'titular');

  const avgUserOverall = userSquad.length > 0 ? Math.round(userSquad.reduce((acc, p) => acc + p.overall, 0) / userSquad.length) : 70;
  const avgOppOverall = oppSquad.length > 0 ? Math.round(oppSquad.reduce((acc, p) => acc + p.overall, 0) / oppSquad.length) : 70;

  // Odds fictícias baseadas nos overalls
  const userProb = Math.round((avgUserOverall / (avgUserOverall + avgOppOverall)) * 100);
  const oppProb = 100 - userProb;

  // Pega as últimas 3 notícias
  const recentNews = historyNews.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* BOAS-VINDAS E INTRODUÇÃO */}
      <div className="flex justify-between items-center bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-brand-border glow-cyan">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">PAINEL DO MANAGER</h2>
          <p className="text-xs font-semibold text-brand-cyan uppercase tracking-widest text-neon-cyan mt-1">
            Manager ativo: {managerName} • Semana {currentWeek}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Orçamento Operacional</p>
          <span className={`text-xl font-black ${userTeam.budget < 0 ? 'text-brand-danger' : 'text-brand-cyan text-neon-cyan'}`}>
            ${userTeam.budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* GRID DO MEIO: PRÓXIMO CONFRONTO E NOTÍCIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BLOCO: PRÓXIMA PARTIDA JOGÁVEL */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col justify-between h-80 lg:col-span-1">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-brand-purple" />
              <span>Próxima Partida</span>
            </h3>
            
            <div className="flex justify-between items-center mt-2.5">
              <div className="text-center w-24">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-brand-dark mx-auto border"
                  style={{ backgroundColor: userTeam.colorPrimary, borderColor: userTeam.colorSecondary }}
                >
                  {userTeam.tag}
                </div>
                <p className="text-[10px] font-extrabold text-white mt-1.5 truncate">{userTeam.name}</p>
              </div>

              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">VS</span>

              <div className="text-center w-24">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-brand-dark mx-auto border"
                  style={{ backgroundColor: nextOpponent.colorPrimary, borderColor: nextOpponent.colorSecondary }}
                >
                  {nextOpponent.tag}
                </div>
                <p className="text-[10px] font-extrabold text-white mt-1.5 truncate">{nextOpponent.name}</p>
              </div>
            </div>

            {/* ODDS */}
            <div className="mt-5 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Vitória {userTeam.tag}: {userProb}%</span>
                <span>Vitória {nextOpponent.tag}: {oppProb}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden flex">
                <div className="bg-brand-cyan h-full" style={{ width: `${userProb}%` }} />
                <div className="bg-brand-purple h-full flex-1" />
              </div>
            </div>
          </div>

          <button
            onClick={() => iniciarPartidaContra(nextOpponent.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 hover:shadow-md hover:shadow-brand-cyan/20 active:scale-98 transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-brand-dark" />
            <span>DISPUTAR PARTIDA AGORA</span>
          </button>
        </div>

        {/* BLOCO: FEED DE NOTÍCIAS */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-2xl h-80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-brand-cyan" />
              <span>Notícias de e-Sports</span>
            </h3>

            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {recentNews.length > 0 ? (
                recentNews.map((news) => (
                  <div key={news.id} className="p-3 bg-zinc-950 border border-brand-border hover:border-brand-cyan/35 rounded-xl transition-all duration-200 cursor-pointer">
                    <h4 className="text-xs font-bold text-white flex justify-between">
                      <span>{news.title}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{news.dateStr}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed truncate">
                      {news.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs font-semibold text-slate-600 py-10">
                  Nenhuma notícia recente no feed.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* BLOCO: ATALHOS RÁPIDOS */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setScreen('squad')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-cyan/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Users className="w-6 h-6 text-brand-cyan mb-2" />
            <span className="text-xs font-bold text-white">Escalação / Elenco</span>
          </button>

          <button
            onClick={() => setScreen('tactics')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-purple/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Sliders className="w-6 h-6 text-brand-purple mb-2" />
            <span className="text-xs font-bold text-white">Táticas de Jogo</span>
          </button>

          <button
            onClick={() => setScreen('training')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-success/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Dumbbell className="w-6 h-6 text-brand-success mb-2" />
            <span className="text-xs font-bold text-white">Treino Semanal</span>
          </button>

          <button
            onClick={() => setScreen('market')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-warning/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <Sliders className="w-6 h-6 text-brand-warning mb-2" />
            <span className="text-xs font-bold text-white">Mercado de Passes</span>
          </button>

          <button
            onClick={() => setScreen('finances')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-brand-border bg-zinc-950/40 hover:border-brand-info/40 hover:bg-zinc-900/40 transition-all duration-200 text-center"
          >
            <DollarSign className="w-6 h-6 text-brand-info mb-2" />
            <span className="text-xs font-bold text-white">Sponsor & Caixa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
