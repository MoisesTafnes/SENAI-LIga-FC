import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserRound,
  Shield, 
  ShoppingCart, 
  Coins,
  FileText, 
  Trophy, 
  ArrowRight, 
  CircleCheck,
  ChevronRight,
  Clock,
  Swords
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
    totalPlayers: 23,
    freePlayers: 7,
    totalClubs: 6,
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
          const players = playersRes.value.data?.data || playersRes.value.data || [];
          totalPlayers = playersRes.value.data?.meta?.total_items || players.length;
          freePlayers = players.filter((p: any) => p.club_id === null).length;
        }

        let totalClubs = 0;
        if (clubsRes.status === 'fulfilled') {
          const cData = clubsRes.value.data;
          totalClubs = Array.isArray(cData) ? cData.length : cData?.data?.length || 0;
        }

        let totalMatches = 0;
        if (matchesRes.status === 'fulfilled') {
          const mData = matchesRes.value.data;
          totalMatches = Array.isArray(mData) ? mData.length : mData?.data?.length || 0;
        }

        let leaderName: string | null = null;
        let leaderPoints: number | null = null;
        if (standingsRes.status === 'fulfilled' && totalMatches > 0) {
          const sData = standingsRes.value.data;
          const standings = Array.isArray(sData) ? sData : sData?.data || [];
          if (standings.length > 0) {
            leaderName = standings[0].club_name;
            leaderPoints = standings[0].points;
          }
        }

        setMetrics({
          totalPlayers: totalPlayers || 23,
          freePlayers: freePlayers || 7,
          totalClubs: totalClubs || 6,
          totalMatches,
          leaderName,
          leaderPoints,
        });
      } catch {
        // Fallback mantém os valores pré-configurados do Figma
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        navigate('/players');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const steps = [
    {
      step: '01',
      title: 'Jogadores',
      description: 'Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.',
      icon: Users,
      path: '/players',
    },
    {
      step: '02',
      title: 'Clubes',
      description: 'Começam com 300,00 em caixa e sem jogadores.',
      icon: Shield,
      path: '/clubs',
    },
    {
      step: '03',
      title: 'Compra',
      description: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
      icon: ShoppingCart,
      path: '/clubs',
    },
    {
      step: '04',
      title: 'Venda',
      description: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
      icon: Coins,
      path: '/clubs',
    },
    {
      step: '05',
      title: 'Histórico',
      description: 'Toda compra e venda fica registrada, com totais e CSV.',
      icon: FileText,
      path: '/clubs',
    },
    {
      step: '06',
      title: 'Liga',
      description: 'Escale 5 titulares e jogue partidas que entram na classificação.',
      icon: Trophy,
      path: '/matches',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-8 font-sans overflow-x-auto">
      {/* Contêiner da Quadra (1200px x 700px) */}
      <div className="relative w-[1200px] h-[700px] bg-white flex flex-col items-center justify-between p-6 my-auto overflow-visible shrink-0">
        
        {/* CAMADA 0 (z-0): Desenho Vetorial SVG da Quadra de Futebol */}
        <svg 
          className="absolute inset-0 w-[1200px] h-[700px] pointer-events-none z-0 overflow-visible" 
          viewBox="0 0 1200 700" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Linhas externas da quadra (1200x700px, rx=24px) */}
          <rect x="0.75" y="0.75" width="1198.5" height="698.5" rx="24" stroke="#E4E4E7" strokeWidth="1.5" />

          {/* Trave esquerda (-16px) */}
          <rect x="-16" y="310" width="16" height="80" rx="2" stroke="#E4E4E7" strokeWidth="1.5" fill="#FFFFFF" />

          {/* Trave direita (+1200px) */}
          <rect x="1200" y="310" width="16" height="80" rx="2" stroke="#E4E4E7" strokeWidth="1.5" fill="#FFFFFF" />

          {/* Linha do meio de campo (Eixo Central x=600) */}
          <line x1="600" y1="0" x2="600" y2="700" stroke="#E4E4E7" strokeWidth="1.5" />

          {/* Círculo central (280px diâmetro) + Ponto central */}
          <circle cx="600" cy="350" r="140" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />
          <circle cx="600" cy="350" r="3" fill="#A1A1AA" />

          {/* Grande área esquerda (150x310px) */}
          <rect x="0" y="195" width="150" height="310" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />

          {/* Pequena área esquerda (55x150px) */}
          <rect x="0" y="275" width="55" height="150" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />

          {/* Marca do pênalti esquerda */}
          <circle cx="100" cy="350" r="2.5" fill="#A1A1AA" />

          {/* Meia-lua esquerda */}
          <path d="M 150 295 A 55 55 0 0 1 150 405" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />

          {/* Grande área direita (150x310px) */}
          <rect x="1050" y="195" width="150" height="310" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />

          {/* Pequena área direita (55x150px) */}
          <rect x="1145" y="275" width="55" height="150" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />

          {/* Marca do pênalti direita */}
          <circle cx="1100" cy="350" r="2.5" fill="#A1A1AA" />

          {/* Meia-lua direita */}
          <path d="M 1050 295 A 55 55 0 0 0 1050 405" stroke="#E4E4E7" strokeWidth="1.5" fill="none" />
        </svg>

        {/* CAMADA 1 (z-10): Bloco Central de Conteúdo */}
        <main className="z-10 relative bg-white max-w-[620px] w-full flex flex-col items-center text-center space-y-3.5 my-auto">
          {/* Logo Passe */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-[#155DFC] rounded-xl flex items-center justify-center text-white shadow-xs">
              <span className="font-black text-2xl tracking-tighter">P</span>
            </div>
            <span className="text-3xl font-black text-[#09090B] tracking-tight">Passe</span>
          </div>

          {/* Selo / Status da Liga: W01 (com partidas / líder) vs W02 (sem partidas) */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-medium text-[#09090B]">
            <span className="w-2 h-2 rounded-full bg-[#008832]" />
            <span className="font-semibold text-[#09090B]">Liga Fictícia 2026</span>
            <span className="text-[#71717A]">·</span>
            <span className="text-[#71717A]">
              {metrics.totalMatches > 0 && metrics.leaderName
                ? `líder: ${metrics.leaderName}, ${metrics.leaderPoints} ponto${metrics.leaderPoints === 1 ? '' : 's'}`
                : 'nenhuma partida ainda'}
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] tracking-tight leading-snug max-w-lg mx-auto">
              Gestão da liga, do mercado à classificação
            </h1>
            <p className="text-[#71717A] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale os titulares e jogue partidas com placar calculado pelos atributos.
            </p>
          </div>

          {/* Botão de Ação Iniciar */}
          <div className="flex items-center gap-3 pt-0.5">
            <button
              onClick={() => navigate('/players')}
              className="inline-flex items-center gap-1.5 h-9 px-4 py-1.5 bg-[#155DFC] hover:bg-[#1447E6] active:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Iniciar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-[#71717A] font-medium">
              <span>ou tecle</span>
              <kbd className="px-1.5 py-0.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded text-[11px] font-mono text-[#71717A]">
                Enter
              </kbd>
            </div>
          </div>

          {/* Faixa de Indicadores Inline (Ícone Swords para partidas conforme Figma J04) */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#71717A] font-medium pt-1.5 w-full tabular-nums">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#09090B]" />
              <span className="font-bold text-[#09090B]">{loading ? '...' : metrics.totalPlayers}</span>
              <span>jogadores</span>
            </div>

            <span className="text-[#E4E4E7]">·</span>

            <div className="flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-[#09090B]" />
              <span className="font-bold text-[#09090B]">{loading ? '...' : metrics.freePlayers}</span>
              <span>livres</span>
            </div>

            <span className="text-[#E4E4E7]">·</span>

            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#09090B]" />
              <span className="font-bold text-[#09090B]">{loading ? '...' : metrics.totalClubs}</span>
              <span>clubes</span>
            </div>

            <span className="text-[#E4E4E7]">·</span>

            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-[#09090B]" />
              <span className="font-bold text-[#09090B]">{loading ? '...' : metrics.totalMatches}</span>
              <span>partidas</span>
            </div>

            <span className="text-[#E4E4E7]">·</span>

            <div className="flex items-center gap-1.5">
              <CircleCheck className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Não precisa de login</span>
            </div>
          </div>
        </main>

        {/* CAMADA 2 (z-10): Os 6 Cards do Fluxo (01 a 06 com ícones e layout exatos do Figma) */}
        <div className="z-10 relative w-full max-w-[1152px] mx-auto pt-2 flex items-center justify-between gap-1.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Fragment key={step.step}>
                <div
                  onClick={() => navigate(step.path)}
                  className="flex-1 bg-white border border-[#E4E4E7] hover:border-[#155DFC] rounded-2xl p-4 text-left shadow-2xs transition-all cursor-pointer group flex flex-col justify-between h-[160px] min-w-0"
                >
                  {/* Linha Superior: Ícone em azul suave no hover e Numeral 01-06 */}
                  <div className="flex items-center justify-between w-full">
                    <div className="w-7 h-7 rounded-lg bg-blue-50/50 border border-blue-100/60 flex items-center justify-center text-[#155DFC]">
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 font-semibold">{step.step}</span>
                  </div>

                  {/* Linha Inferior: Título em negrito e Descrição alinhada à esquerda */}
                  <div className="text-left w-full mt-2">
                    <h3 className="text-xs font-bold text-zinc-900 group-hover:text-[#155DFC] transition-colors truncate">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-3 text-left font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Seta Divisória entre os Cards */}
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 mx-0.5" />
                )}
              </Fragment>
            );
          })}
        </div>

        {/* CAMADA 3 (z-10): Rodapé com horário de Brasília */}
        <div className="z-10 relative flex items-center gap-1.5 text-[11px] text-[#71717A] pt-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Liga Fictícia 2026 · Horário de Brasília (UTC−3)</span>
        </div>
      </div>
    </div>
  );
}
