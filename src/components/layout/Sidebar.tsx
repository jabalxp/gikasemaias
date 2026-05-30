import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  LayoutDashboard,
  Users,
  Sliders,
  Award,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Settings,
  BookOpen,
  Save,
  Dumbbell
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentScreen, setScreen, userTeamId, teams } = useGameStore();
  const userTeam = teams[userTeamId];

  if (!userTeam) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Painel Principal', icon: LayoutDashboard },
    { id: 'squad', label: 'Gerenciar Elenco', icon: Users },
    { id: 'tactics', label: 'Táticas & Vetos', icon: Sliders },
    { id: 'training', label: 'Treino Semanal', icon: Dumbbell },
    { id: 'market', label: 'Mercado Pro', icon: ShoppingBag },
    { id: 'finances', label: 'Finanças & Sponsor', icon: DollarSign },
    { id: 'rankings', label: 'Rankings Mundiais', icon: TrendingUp },
    { id: 'dataEditor', label: 'Editor de Dados', icon: BookOpen },
    { id: 'saves', label: 'Gerenciar Saves', icon: Save }
  ];

  return (
    <aside className="w-64 bg-brand-card border-r border-brand-border h-screen sticky top-0 flex flex-col justify-between p-4 z-40">
      <div>
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 py-4 border-b border-brand-border mb-6">
          <div className="w-10 h-10 rounded bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center glow-cyan">
            <Award className="w-6 h-6 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wider">PROSTRIKE</h1>
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-widest text-neon-cyan">MANAGER</span>
          </div>
        </div>

        {/* LISTA DE ATALHOS */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-purple/10 text-brand-cyan border-l-4 border-brand-cyan border-neon-cyan'
                    : 'text-slate-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-cyan' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* RODA PÉ DA SIDEBAR - INFORMAÇÃO DO TIME */}
      <div className="border-t border-brand-border pt-4">
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-8 h-8 rounded-full border flex items-center justify-center font-extrabold text-sm text-brand-dark"
            style={{
              backgroundColor: userTeam.colorPrimary,
              borderColor: userTeam.colorSecondary,
              color: userTeam.colorPrimary === '#ffffff' ? '#000' : '#fff'
            }}
          >
            {userTeam.tag.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{userTeam.name}</p>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tier {userTeam.tier} • #{userTeam.points} pts
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
