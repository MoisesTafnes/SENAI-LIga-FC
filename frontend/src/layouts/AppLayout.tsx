import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  Swords,
  ListOrdered,
  Plus,
  Trophy,
  Clock,
  RotateCw,
  PanelLeft,
  ChevronRight,
} from "lucide-react";
import { leagueService } from "../services/league.service";

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const [metrics, setMetrics] = useState({
    totalPlayers: 0,
    totalClubs: 0,
    totalMatches: 0,
    lastMatch: "Sem partidas cadastradas",
  });

  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSidebarData() {
      try {
        const [playersRes, clubsRes, matchesRes] = await Promise.allSettled([
          leagueService.getPlayers(),
          leagueService.getClubs(),
          leagueService.getMatches(),
        ]);

        let playerTotal = 0;
        if (playersRes.status === "fulfilled") {
          const pData = playersRes.value.data;
          playerTotal =
            pData?.meta?.total_items ||
            pData?.data?.length ||
            (Array.isArray(pData) ? pData.length : 0);
        }

        let clubList: any[] = [];
        if (clubsRes.status === "fulfilled") {
          const cData = clubsRes.value.data;
          clubList = Array.isArray(cData) ? cData : cData?.data || [];
        }

        let matchTotal = 0;
        let lastMatchStr = "Sem partidas cadastradas";
        if (matchesRes.status === "fulfilled") {
          const mData = matchesRes.value.data;
          const mList = Array.isArray(mData) ? mData : mData?.data || [];
          matchTotal = mList.length;
          if (mList.length > 0) {
            const last = mList[0]; // first = most recent (ordered desc)
            if (last.home?.club_name && last.away?.club_name) {
              lastMatchStr = `${last.home.club_name} ${last.home.goals ?? 0} × ${last.away.goals ?? 0} ${last.away.club_name}`;
            } else if (last.home_club_name && last.away_club_name) {
              lastMatchStr = `${last.home_club_name} ${last.home_score ?? 0} × ${last.away_score ?? 0} ${last.away_club_name}`;
            }
          }
        }

        setMetrics({
          totalPlayers: playerTotal,
          totalClubs: clubList.length,
          totalMatches: matchTotal,
          lastMatch: lastMatchStr,
        });

        setClubs(
          clubList.map((c: any) => ({
            id: c.id,
            name: c.name,
            acronym: c.acronym,
            letter: c.name ? c.name.charAt(0).toUpperCase() : "C",
          })),
        );
      } catch {
        setMetrics({
          totalPlayers: 0,
          totalClubs: 0,
          totalMatches: 0,
          lastMatch: "Sem partidas cadastradas",
        });
        setClubs([]);
      }
    }

    fetchSidebarData();
  }, []);

  const getBreadcrumb = (): {
    category: string;
    page: string;
    subpage?: string;
  } => {
    const path = location.pathname;
    if (path.startsWith("/players"))
      return { category: "Mercado", page: "Jogadores" };
    if (path.startsWith("/clubs")) {
      const match = path.match(/^\/clubs\/(\d+)/);
      if (match) {
        const found = clubs.find((c) => String(c.id) === match[1]);
        return {
          category: "Mercado",
          page: "Clubes",
          subpage: found ? found.name : "Detalhes",
        };
      }
      return { category: "Mercado", page: "Clubes" };
    }
    if (path.startsWith("/market"))
      return { category: "Mercado", page: "Comprar e Vender" };
    if (path.startsWith("/matches")) {
      const matchId = path.match(/^\/matches\/(\d+)/);
      if (matchId) {
        return {
          category: "Liga",
          page: "Partidas",
          subpage: `Partida #${matchId[1]}`,
        };
      }
      return { category: "Liga", page: "Partidas" };
    }
    if (path.startsWith("/standings"))
      return { category: "Liga", page: "Classificação" };
    return { category: "Passe", page: "Início" };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-zinc-900 antialiased">
      {/* SIDEBAR DO FIGMA */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-zinc-200 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* LOGO DO FIGMA */}
          <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#155DFC] rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-2xs">
              P
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-zinc-900 text-sm tracking-tight leading-tight">
                  Passe
                </span>
                <span className="text-[11px] font-normal text-zinc-400 truncate">
                  Gestão da liga
                </span>
              </div>
            )}
          </div>

          {/* NAVEGAÇÃO AGRUPADA DO FIGMA */}
          <div className="p-3 space-y-4">
            {/* MERCADO */}
            <div>
              {!isCollapsed && (
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
                  Mercado
                </div>
              )}
              <div className="space-y-0.5">
                <NavLink
                  to="/players"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "border border-zinc-200/80 bg-white text-zinc-900 shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    } ${isCollapsed ? "justify-center px-0" : ""}`
                  }
                  title={isCollapsed ? "Jogadores" : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-zinc-500 shrink-0" />
                    {!isCollapsed && <span>Jogadores</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[11px] font-mono text-zinc-400 font-medium tabular-nums">
                      {metrics.totalPlayers}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/clubs"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "border border-zinc-200/80 bg-white text-zinc-900 shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    } ${isCollapsed ? "justify-center px-0" : ""}`
                  }
                  title={isCollapsed ? "Clubes" : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-zinc-500 shrink-0" />
                    {!isCollapsed && <span>Clubes</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[11px] font-mono text-zinc-400 font-medium tabular-nums">
                      {metrics.totalClubs}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>

            {/* LIGA (Ícones: Swords para Partidas e ListOrdered para Classificação) */}
            <div>
              {!isCollapsed && (
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
                  Liga
                </div>
              )}
              <div className="space-y-0.5">
                <NavLink
                  to="/matches"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "border border-zinc-200/80 bg-white text-zinc-900 shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    } ${isCollapsed ? "justify-center px-0" : ""}`
                  }
                  title={isCollapsed ? "Partidas" : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Swords className="w-4 h-4 text-zinc-500 shrink-0" />
                    {!isCollapsed && <span>Partidas</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[11px] font-mono text-zinc-400 font-medium tabular-nums">
                      {metrics.totalMatches}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/standings"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "border border-zinc-200/80 bg-white text-zinc-900 shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    } ${isCollapsed ? "justify-center px-0" : ""}`
                  }
                  title={isCollapsed ? "Classificação" : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <ListOrdered className="w-4 h-4 text-zinc-500 shrink-0" />
                    {!isCollapsed && <span>Classificação</span>}
                  </div>
                </NavLink>
              </div>
            </div>

            {/* CLUBES (Badge Redondo com Letra A, D, E, G, M, T) */}
            {!isCollapsed && (
              <div>
                <div className="flex items-center justify-between px-3 mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Clubes
                  </span>
                  <NavLink
                    to="/clubs"
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
                <div className="space-y-0.5">
                  {clubs.length === 0 ? (
                    <div className="px-3 py-1.5 text-[11px] text-zinc-400">
                      Nenhum clube ainda.
                    </div>
                  ) : (
                    clubs.map((c) => (
                      <NavLink
                        key={c.id}
                        to={`/clubs/${c.id}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-white border border-zinc-200/90 text-zinc-900 shadow-2xs font-semibold"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 font-mono transition-colors ${
                                isActive
                                  ? "bg-[#155DFC] text-white shadow-2xs"
                                  : "bg-zinc-100 border border-zinc-200/60 text-zinc-600"
                              }`}
                            >
                              {c.letter}
                            </span>
                            <span className="truncate">{c.name}</span>
                          </>
                        )}
                      </NavLink>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ DA SIDEBAR (Card com Ícones Exatos de Troféu e Espadas Cruzadas) */}
        <div className="p-3 border-t border-zinc-100">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-3 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-center text-zinc-400 shrink-0 shadow-2xs">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-zinc-900 text-xs truncate leading-tight">
                      Liga Fictícia 2026
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                      {metrics.totalClubs} clubes · {metrics.totalPlayers}{" "}
                      jogadores
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-zinc-200/60 pt-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-center text-zinc-400 shrink-0 shadow-2xs">
                    <Swords className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-zinc-800 text-[11px] truncate leading-tight">
                      Última partida
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5 font-medium">
                      {metrics.lastMatch}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-1 text-[10px] text-zinc-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>Horário de Brasília (UTC−3)</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span title="Liga Fictícia 2026">
                <Trophy className="w-5 h-5 text-zinc-400" />
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        {/* HEADER SUPERIOR */}
        <header className="h-14 bg-white border-b border-zinc-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              title={
                isCollapsed
                  ? "Expandir barra lateral"
                  : "Recolher barra lateral"
              }
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* BREADCRUMB */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span>{breadcrumb.category}</span>
              <ChevronRight className="w-3 h-3 text-zinc-300" />
              {breadcrumb.subpage ? (
                <>
                  <NavLink
                    to={breadcrumb.category === "Liga" ? "/matches" : "/clubs"}
                    className="hover:text-zinc-700 transition-colors"
                  >
                    {breadcrumb.page}
                  </NavLink>
                  <ChevronRight className="w-3 h-3 text-zinc-300" />
                  <span className="text-zinc-900 font-semibold">
                    {breadcrumb.subpage}
                  </span>
                </>
              ) : (
                <span className="text-zinc-900 font-semibold">
                  {breadcrumb.page}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Recarregar dados"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </header>

        {/* CONTAINER DO ROUTER OUTLET */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
