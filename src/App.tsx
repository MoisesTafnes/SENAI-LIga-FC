import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Shield, ShoppingCart, PlayCircle, Home as HomeIcon } from 'lucide-react';

const HomePage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Tela Inicial (Dashboard)</div>;
const PlayersPage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Módulo de Jogadores</div>;
const ClubsPage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Módulo de Clubes</div>;
const MarketPage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Módulo de Mercado</div>;
const MatchesPage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Módulo de Partidas</div>;
const StandingsPage = () => <div className="p-8 font-semibold text-slate-700 bg-white rounded-2xl shadow-sm border border-slate-200">Tabela de Classificação</div>;

const NavigationBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: HomeIcon },
    { path: '/players', label: 'Jogadores', icon: Users },
    { path: '/clubs', label: 'Clubes', icon: Shield },
    { path: '/market', label: 'Mercado', icon: ShoppingCart },
    { path: '/matches', label: 'Partidas', icon: PlayCircle },
    { path: '/standings', label: 'Classificação', icon: Trophy },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">PASSE</span>
              <span className="text-xs block text-slate-500 font-medium">Liga SENAI FC 2026</span>
            </div>
          </div>

          <nav className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavigationBar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/standings" element={<StandingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
