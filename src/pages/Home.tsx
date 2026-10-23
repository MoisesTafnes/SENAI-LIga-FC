import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  ShoppingCart, 
  PlayCircle, 
  FileText, 
  Trophy, 
  ArrowRight, 
  Activity, 
  UserCheck, 
  Coins, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardMetrics {
  totalPlayers: number;
  freePlayers: number;
  totalClubs: number;
  totalMatches: number;
  leaderName: string | null;
  leaderPoints: number | null;
}

export function Home() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPlayers: 0,
    freePlayers: 0,
    totalClubs: 0,
    totalMatches: 0,
    leaderName: null,
    leaderPoints: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [playersRes, clubsRes, matchesRes, standingsRes] = await Promise.allSettled([
          api.get('/players?limit=100'),
          api.get('/clubs'),
          api.get('/matches'),
          api.get('/standings'),
        ]);

        let totalPlayers = 0;
        let freePlayers = 0;
        if (playersRes.status === 'fulfilled') {
          const players = playersRes.value.data.data || [];
          totalPlayers = playersRes.value.data.meta?.total_items || players.length;
          freePlayers = players.filter((p: any) => p.club_id === null).length;
        }

        let totalClubs = 0;
        if (clubsRes.status === 'fulfilled') {
          totalClubs = clubsRes.value.data.length || 0;
        }

        let totalMatches = 0;
        if (matchesRes.status === 'fulfilled') {
          totalMatches = matchesRes.value.data.length || 0;
        }

        let leaderName: string | null = null;
        let leaderPoints: number | null = null;
        if (standingsRes.status === 'fulfilled' && standingsRes.value.data.length > 0) {
          const leader = standingsRes.value.data[0];
          if (leader && totalMatches > 0) {
            leaderName = leader.club_name;
            leaderPoints = leader.points;
          }
        }

        setMetrics({
          totalPlayers,
          freePlayers,
          totalClubs,
          totalMatches,
          leaderName,
          leaderPoints,
        });
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Atalho de Teclado (Tecla Enter navega para o Passo 1 - Jogadores)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        navigate('/players');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const workflowSteps = [
    {
      number: '01',
      title: 'Jogadores',
      description: 'Nascem livres e Aptos; valor de mercado condicionado por saúde, agilidade e idade.',
      icon: Users,
      path: '/players',
      color: 'bg-blue-500',
    },
    {
      number: '02',
      title: 'Clubes',
      description: 'Começam com \$300.00 moedas em caixa para montar seus elencos.',
      icon: Shield,
      path: '/clubs',
      color: 'bg-indigo-500',
    },
    {
      number: '03',
      title: 'Compra',
      description: 'Regra de até 50% do caixa, comissão de agente e contrato de fidelidade.',
      icon: ShoppingCart,
      path: '/market',
      color: 'bg-emerald-500',
    },
    {
      number: '04',
      title: 'Venda',
      description: 'Multa de rescisão se vendido antes da fidelidade e comissão progressiva.',
      icon: Coins,
      path: '/market',
      color: 'bg-amber-500',
    },
    {
      number: '05',
      title: 'Histórico',
      description: 'Registro completo de transações financeiras e exportação para CSV.',
      icon: FileText,
      path: '/market',
      color: 'bg-purple-500',
    },
    {
      number: '06',
      title: 'Liga',
      description: 'Escalação tática de 5 titulares e simulação de partidas para classificação.',
      icon: Trophy,
      path: '/matches',
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Header */}
      <section className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-70 pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10">
          {/* Badge Superior Reativo */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Liga Fictícia 2026 ·{' '}
              {metrics.totalMatches > 0 && metrics.leaderName
                ? `líder: ${metrics.leaderName}, ${metrics.leaderPoints} ponto${metrics.leaderPoints === 1 ? '' : 's'}`
                : 'nenhuma partida ainda'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Gerencie sua liga de futebol com regras de mercado e simulação.
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Navegue pelos 6 passos do fluxo abaixo para cadastrar atletas, fundar clubes, negociar passes com taxas reais e simular duelos determinísticos.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => navigate('/players')}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Iniciar Exploração</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Pressione <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md font-mono text-slate-600">Enter</kbd> para começar
            </span>
          </div>
        </div>
      </section>

      {/* Faixa de Indicadores (Metrics Bar) */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="flex items-center gap-3.5 p-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {loading ? '...' : metrics.totalPlayers}
            </span>
            <span className="text-xs text-slate-500 font-medium">jogadores</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 pt-4 md:pt-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {loading ? '...' : metrics.freePlayers}
            </span>
            <span className="text-xs text-slate-500 font-medium">livres</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 pt-4 md:pt-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {loading ? '...' : metrics.totalClubs}
            </span>
            <span className="text-xs text-slate-500 font-medium">clubes</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 pt-4 md:pt-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {loading ? '...' : metrics.totalMatches}
            </span>
            <span className="text-xs text-slate-500 font-medium">partidas</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 pt-4 md:pt-2 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 block">Não precisa</span>
            <span className="text-xs text-slate-500 font-medium">de login</span>
          </div>
        </div>
      </section>

      {/* Grid de 6 Passos do Fluxo */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Fluxo de Execução da Liga</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400">6 Etapas Principais</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                onClick={() => navigate(step.path)}
                className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">
                      {step.number}
                    </span>
                    <div className={`p-2.5 rounded-xl ${step.color} text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  <span>Acessar Módulo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
cat << 'EOF' > src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Shield, ShoppingCart, PlayCircle, Home as HomeIcon } from 'lucide-react';
import { Home } from './pages/Home';

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
            <Route path="/" element={<Home />} />
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
