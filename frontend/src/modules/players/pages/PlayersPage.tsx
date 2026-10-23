import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ShoppingCart,
  Activity,
  Edit,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { Player } from "../types/player.types";
import {
  CreatePlayerModal,
  ConditionModal,
  EditPlayerModal,
} from "../components/PlayerModals";
import { BuyPlayerModal } from "../components/BuyPlayerModal";
import { playersService } from "../services/players.service";
import { clubsService } from "../../clubs/services/clubs.service";

interface Toast {
  id: number;
  type: "success" | "error";
  title: string;
  message: string;
}

let toastIdCounter = 0;

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
  });

  // Contadores para as abas
  const [tabCounts, setTabCounts] = useState({ all: 0, free: 0, club: 0 });

  // Filtros
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [clubFilter, setClubFilter] = useState<string>("");
  const [ageRange, setAgeRange] = useState<string>("");
  const [valueRange, setValueRange] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"all" | "free" | "club">("all");
  const [sortOption, setSortOption] = useState<string>("name");

  // Clubes para o filtro e compra
  const [clubs, setClubs] = useState<
    { id: number; name: string; acronym: string; cash: number }[]
  >([]);

  // Estados de modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlayerForBuy, setSelectedPlayerForBuy] =
    useState<Player | null>(null);
  const [selectedPlayerForCondition, setSelectedPlayerForCondition] =
    useState<Player | null>(null);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] =
    useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dropdowns abertos
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(!!playerToDelete);

  const showToast = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4500,
      );
    },
    [],
  );

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
        setActionMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce da busca por nome
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Carrega lista de clubes uma vez
  useEffect(() => {
    async function fetchClubsList() {
      try {
        const cData = await clubsService.getClubs();
        setClubs(cData);
      } catch {
        // Fallback
      }
    }
    fetchClubsList();
  }, []);

  // Carrega contagens totais para as abas
  async function fetchTabCounts() {
    try {
      const res = await playersService.getAllPlayers();
      const allP = res?.data || res || [];
      const freeCount = allP.filter((p: any) => !p.club_id).length;
      const clubCount = allP.filter((p: any) => !!p.club_id).length;
      setTabCounts({
        all: Array.isArray(allP) ? allP.length : 0,
        free: freeCount,
        club: clubCount,
      });
    } catch {
      setTabCounts({ all: 0, free: 0, club: 0 });
    }
  }

  useEffect(() => {
    fetchTabCounts();
  }, []);

  async function fetchPlayers() {
    try {
      setLoading(true);
      setFetchError(null);
      const params: Record<string, any> = {
        page: meta.page,
        limit: 10,
        sort: sortOption,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (positionFilter) params.position = positionFilter;
      if (conditionFilter) params.condition = conditionFilter;

      if (statusTab === "free") {
        params.free = true;
      } else if (statusTab === "club") {
        params.free = false;
        if (clubFilter) params.club_id = Number(clubFilter);
      } else {
        if (clubFilter) params.club_id = Number(clubFilter);
      }

      if (ageRange) {
        const [min, max] = ageRange.split("-");
        if (min) params.min_age = Number(min);
        if (max) params.max_age = Number(max);
      }

      if (valueRange) {
        const [min, max] = valueRange.split("-");
        if (min) params.min_value = Number(min);
        if (max) params.max_value = Number(max);
      }

      const res = await playersService.getPlayers(params);
      const responseData: Player[] = res?.data || res || [];
      const enrichedPlayers = Array.isArray(responseData)
        ? responseData.map((p) => {
            if (p.club_id && !p.club_name) {
              const matchedClub = clubs.find((c) => c.id === p.club_id);
              if (matchedClub) {
                return {
                  ...p,
                  club_name: matchedClub.name,
                  club_acronym: matchedClub.acronym,
                };
              }
            }
            return p;
          })
        : [];

      setPlayers(enrichedPlayers);
      if (res?.meta) {
        setMeta(res.meta);
      } else {
        setMeta({
          page: 1,
          limit: 10,
          total_items: enrichedPlayers.length,
          total_pages: 1,
        });
      }
    } catch (err: any) {
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Não foi possível carregar os dados. Verifique a conexão e tente de novo.",
      );
      setPlayers([]);
      setMeta({ page: 1, limit: 10, total_items: 0, total_pages: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlayers();
  }, [
    meta.page,
    debouncedSearch,
    positionFilter,
    conditionFilter,
    clubFilter,
    ageRange,
    valueRange,
    statusTab,
    sortOption,
    clubs,
  ]);

  function handleDeletePlayer(player: Player) {
    if (player.club_id) return;
    setPlayerToDelete(player);
    setActionMenuOpenId(null);
  }

  async function confirmDeletePlayer() {
    if (!playerToDelete) return;
    const name = playerToDelete.name;
    try {
      await playersService.deletePlayer(playerToDelete.id);
      setPlayerToDelete(null);
      fetchPlayers();
      fetchTabCounts();
      showToast(
        "success",
        "Jogador excluído",
        `${name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`,
      );
    } catch (err: any) {
      showToast(
        "error",
        "Erro ao excluir",
        err.response?.data?.message || "Erro ao excluir jogador.",
      );
      setPlayerToDelete(null);
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getInitialColors = (index: number) => {
    const colors = [
      { bg: "#F4F4F5", text: "#52525B" },
      { bg: "#FDF2F8", text: "#DB2777" },
      { bg: "#FDF4FF", text: "#C026D3" },
      { bg: "#EFF6FF", text: "#2563EB" },
      { bg: "#F0FDF4", text: "#16A34A" },
      { bg: "#F5F3FF", text: "#7C3AED" },
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "0,00";
    return Number(val).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setPositionFilter("");
    setConditionFilter("");
    setClubFilter("");
    setAgeRange("");
    setValueRange("");
    setMeta({ ...meta, page: 1 });
  };

  const activeFiltersCount = [
    debouncedSearch,
    positionFilter,
    conditionFilter,
    clubFilter,
    ageRange,
    valueRange,
  ].filter(Boolean).length;

  return (
    <div
      className="w-full min-w-0 space-y-4 font-sans text-zinc-900 pb-12"
      ref={dropdownRef}
    >
      {/* CABEÇALHO DA PÁGINA (Conforme J01) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-50/60 border border-blue-100/80 rounded-2xl flex items-center justify-center text-[#155DFC]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Jogadores
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cadastre jogadores, acompanhe os indicadores e compre os que estão
              livres.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#155DFC] hover:bg-[#1447E6] active:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo jogador</span>
        </button>
      </div>

      {/* BARRA DE FILTROS SUPERIORES (Conforme J01 e J02) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-7 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#155DFC] text-zinc-800 placeholder-zinc-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown: Posição */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "pos" ? null : "pos")
            }
            className={`h-8.5 px-3 border rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              positionFilter
                ? "border-[#155DFC] bg-blue-50/50 text-[#155DFC]"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>Posição{positionFilter ? `: ${positionFilter}` : ""}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          {openDropdown === "pos" && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs">
              <button
                onClick={() => {
                  setPositionFilter("");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-600"
              >
                Todas as posições
              </button>
              {["GOL", "ZAG", "LAT", "MEI", "ATA"].map((pos) => (
                <button
                  key={pos}
                  onClick={() => {
                    setPositionFilter(pos);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium ${
                    positionFilter === pos
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown: Condição */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "cond" ? null : "cond")
            }
            className={`h-8.5 px-3 border rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              conditionFilter
                ? "border-[#155DFC] bg-blue-50/50 text-[#155DFC]"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>
              Condição
              {conditionFilter === "APTO" && ": Apto"}
              {conditionFilter === "MAL_CONDICIONADO" && ": Mal condicionado"}
              {conditionFilter === "DOENTE" && ": Doente"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          {openDropdown === "cond" && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs">
              <button
                onClick={() => {
                  setConditionFilter("");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-600"
              >
                Todas as condições
              </button>
              {[
                { val: "APTO", label: "Apto" },
                { val: "MAL_CONDICIONADO", label: "Mal condicionado" },
                { val: "DOENTE", label: "Doente" },
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => {
                    setConditionFilter(c.val);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium ${
                    conditionFilter === c.val
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown: Clube (Desabilitado com Tooltip se statusTab === 'free', conforme J04) */}
        <div className="relative group">
          <button
            type="button"
            disabled={statusTab === "free"}
            onClick={() =>
              statusTab !== "free" &&
              setOpenDropdown(openDropdown === "club" ? null : "club")
            }
            className={`h-8.5 px-3 border rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              statusTab === "free"
                ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed opacity-75"
                : clubFilter
                  ? "border-[#155DFC] bg-blue-50/50 text-[#155DFC]"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>
              Clube
              {clubFilter && clubs.find((c) => String(c.id) === clubFilter)
                ? `: ${clubs.find((c) => String(c.id) === clubFilter)?.name}`
                : ""}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {/* Tooltip quando "Livres" ativo (J04) */}
          {statusTab === "free" && (
            <div className="hidden group-hover:flex absolute -top-8 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap items-center gap-1">
              <Info className="w-3 h-3 text-white" />
              <span>"Livres" não combina com o filtro por clube.</span>
            </div>
          )}

          {openDropdown === "club" && statusTab !== "free" && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs max-h-56 overflow-y-auto">
              <button
                onClick={() => {
                  setClubFilter("");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-600"
              >
                Todos os clubes
              </button>
              {clubs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClubFilter(String(c.id));
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium truncate ${
                    clubFilter === String(c.id)
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {c.name} ({c.acronym})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown: Idade */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "age" ? null : "age")
            }
            className={`h-8.5 px-3 border rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              ageRange
                ? "border-[#155DFC] bg-blue-50/50 text-[#155DFC]"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>
              Idade{ageRange ? `: ${ageRange.replace("-", " a ")}` : ""}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          {openDropdown === "age" && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs">
              <button
                onClick={() => {
                  setAgeRange("");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-600"
              >
                Qualquer idade
              </button>
              {[
                { label: "16 a 21 anos", val: "16-21" },
                { label: "18 a 30 anos", val: "18-30" },
                { label: "22 a 28 anos", val: "22-28" },
                { label: "29 a 35 anos", val: "29-35" },
                { label: "36 a 45 anos", val: "36-45" },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    setAgeRange(item.val);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium ${
                    ageRange === item.val
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown: Valor de Mercado */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "val" ? null : "val")
            }
            className={`h-8.5 px-3 border rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              valueRange
                ? "border-[#155DFC] bg-blue-50/50 text-[#155DFC]"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>
              Valor de mercado
              {valueRange === "0-30" && ": até 30,00"}
              {valueRange === "10-60" && ": 10,00 a 60,00"}
              {valueRange === "30-70" && ": 30,00 a 70,00"}
              {valueRange === "70-1000" && ": acima de 70,00"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          {openDropdown === "val" && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs">
              <button
                onClick={() => {
                  setValueRange("");
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-600"
              >
                Qualquer valor
              </button>
              {[
                { label: "Até 30,00 moedas", val: "0-30" },
                { label: "10,00 a 60,00 moedas", val: "10-60" },
                { label: "30,00 a 70,00 moedas", val: "30-70" },
                { label: "Acima de 70,00 moedas", val: "70-1000" },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    setValueRange(item.val);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium ${
                    valueRange === item.val
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHIPS DE FILTROS ATIVOS (Conforme J02 e J03) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
          <span className="text-zinc-400 text-[11px] font-medium">
            {debouncedSearch ? "Resultados para a busca:" : "Filtros ativos:"}
          </span>

          {debouncedSearch && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>Busca: {debouncedSearch}</span>
              <button
                onClick={() => setSearch("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {conditionFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>
                Condição:{" "}
                {conditionFilter === "MAL_CONDICIONADO"
                  ? "Mal condicionado"
                  : conditionFilter === "DOENTE"
                    ? "Doente"
                    : "Apto"}
              </span>
              <button
                onClick={() => setConditionFilter("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {ageRange && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>Idade: {ageRange.replace("-", " a ")}</span>
              <button
                onClick={() => setAgeRange("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {valueRange && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>
                Valor de mercado:{" "}
                {valueRange === "10-60" ? "10,00 a 60,00" : valueRange}
              </span>
              <button
                onClick={() => setValueRange("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {positionFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>Posição: {positionFilter}</span>
              <button
                onClick={() => setPositionFilter("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {clubFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-full font-medium text-[11px]">
              <span>
                Clube: {clubs.find((c) => String(c.id) === clubFilter)?.name}
              </span>
              <button
                onClick={() => setClubFilter("")}
                className="hover:text-zinc-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[#155DFC] hover:underline font-semibold text-[11px] ml-1 cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* ABAS (TODOS, LIVRES, EM CLUBES) + ORDENAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-600">
          <button
            onClick={() => {
              setStatusTab("all");
              setMeta({ ...meta, page: 1 });
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusTab === "all"
                ? "bg-white text-zinc-900 shadow-xs"
                : "hover:text-zinc-900"
            }`}
          >
            Todos{" "}
            <span className="text-zinc-400 font-normal ml-0.5">
              {tabCounts.all}
            </span>
          </button>

          <button
            disabled={!!clubFilter}
            onClick={() => {
              if (clubFilter) return;
              setStatusTab("free");
              setClubFilter(""); // Reseta clube ao ir para livres
              setMeta({ ...meta, page: 1 });
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              clubFilter
                ? "opacity-40 cursor-not-allowed text-zinc-400"
                : statusTab === "free"
                  ? "bg-white text-zinc-900 shadow-xs cursor-pointer"
                  : "hover:text-zinc-900 cursor-pointer"
            }`}
          >
            Livres{" "}
            <span className="text-zinc-400 font-normal ml-0.5">
              {tabCounts.free}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusTab("club");
              setMeta({ ...meta, page: 1 });
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusTab === "club"
                ? "bg-white text-zinc-900 shadow-xs"
                : "hover:text-zinc-900"
            }`}
          >
            Em clubes{" "}
            <span className="text-zinc-400 font-normal ml-0.5">
              {tabCounts.club}
            </span>
          </button>
        </div>

        {/* Seletor de Ordenação */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "sort" ? null : "sort")
            }
            className="h-8.5 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Ordenar:{" "}
              {sortOption === "name"
                ? "nome"
                : sortOption === "-market_value"
                  ? "maior valor de mercado"
                  : sortOption === "market_value"
                    ? "menor valor de mercado"
                    : sortOption === "-age"
                      ? "maior idade"
                      : sortOption === "age"
                        ? "menor idade"
                        : sortOption === "position"
                          ? "posição"
                          : "nome"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          {openDropdown === "sort" && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 text-xs">
              <div className="px-3 py-1.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                Ordenar por
              </div>
              {[
                { label: "Nome", val: "name" },
                { label: "Maior valor de mercado", val: "-market_value" },
                { label: "Menor valor de mercado", val: "market_value" },
                { label: "Maior idade", val: "-age" },
                { label: "Menor idade", val: "age" },
                { label: "Posição (GOL a ATA)", val: "position" },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => {
                    setSortOption(s.val);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 font-medium ${
                    sortOption === s.val
                      ? "text-[#155DFC] font-bold bg-blue-50/40"
                      : "text-zinc-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABELA DE JOGADORES (Fidelidade ao grid do Figma J01-J04) */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 text-[11px] font-semibold bg-zinc-50/50">
                <th className="py-3 px-4 font-semibold">Jogador</th>
                <th className="py-3 px-3 font-semibold text-center">Posição</th>
                <th className="py-3 px-3 font-semibold text-center">Overall</th>
                <th className="py-3 px-3 font-semibold">Agilidade</th>
                <th className="py-3 px-3 font-semibold text-center">Idade</th>
                <th className="py-3 px-3 font-semibold">Condição</th>
                <th className="py-3 px-3 font-semibold text-right">
                  Valor base
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  Valor de mercado
                </th>
                <th className="py-3 px-3 font-semibold">Clube</th>
                <th className="py-3 px-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fetchError ? (
                /* ESTADO: Erro ao carregar (E03 / E07) */
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">
                      Não foi possível carregar os jogadores
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4 leading-relaxed">
                      {fetchError}
                    </p>
                    <button
                      onClick={fetchPlayers}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar de novo
                    </button>
                  </td>
                </tr>
              ) : loading ? (
                /* ESTADO: Carregando Skeleton Rows (E01 / E07) */
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-zinc-100 rounded-md" />
                          <div className="w-16 h-2.5 bg-zinc-100 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="w-8 h-4 bg-zinc-100 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="w-6 h-4 bg-zinc-100 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-20 h-3 bg-zinc-100 rounded" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="w-6 h-4 bg-zinc-100 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-16 h-5 bg-zinc-100 rounded-full" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="w-14 h-4 bg-zinc-100 rounded ml-auto" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="w-14 h-4 bg-zinc-100 rounded ml-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-20 h-4 bg-zinc-100 rounded" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="w-6 h-6 bg-zinc-100 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    {activeFiltersCount > 0 || debouncedSearch ? (
                      /* ESTADO: Sem resultados de busca/filtros (E02) */
                      <div className="space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                          <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900">
                          {debouncedSearch
                            ? `Nenhum jogador encontrado para "${debouncedSearch}"`
                            : "Nenhum jogador encontrado"}
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Confira a grafia ou tire alguns filtros. A busca
                          ignora maiúsculas, minúsculas e acentos.
                        </p>
                        <button
                          onClick={clearAllFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Limpar filtros
                        </button>
                      </div>
                    ) : (
                      /* ESTADO: Nenhum jogador cadastrado no sistema (E07) */
                      <div className="space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900">
                          Nenhum jogador cadastrado
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Com o banco recém-criado, a lista começa vazia.
                        </p>
                        <button
                          onClick={() => setIsCreateOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#155DFC] text-white text-xs font-semibold hover:bg-[#1447E6] transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Novo jogador
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                players.map((player, idx) => {
                  const avatarColor = getInitialColors(idx);
                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      {/* Avatar + Nome + Posição Extensa */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                            style={{
                              backgroundColor: avatarColor.bg,
                              color: avatarColor.text,
                            }}
                          >
                            {getInitials(player.name)}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block leading-tight">
                              {player.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
                              {player.position === "GOL" && "Goleiro"}
                              {player.position === "ZAG" && "Zagueiro"}
                              {player.position === "LAT" && "Lateral"}
                              {player.position === "MEI" && "Meio-campo"}
                              {player.position === "ATA" && "Atacante"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Posição Sigla */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono font-bold text-[10px]">
                          {player.position}
                        </span>
                      </td>

                      {/* Overall */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-900 text-xs tabular-nums">
                        {player.overall}
                      </td>

                      {/* Agilidade (com barra visual horizontal do Figma) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-700 font-medium text-xs tabular-nums w-5">
                            {player.agility}
                          </span>
                          <div className="w-12 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                player.agility >= 70
                                  ? "bg-[#008832]"
                                  : player.agility >= 40
                                    ? "bg-zinc-500"
                                    : "bg-[#E4001B]"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, player.agility))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Idade */}
                      <td className="py-3 px-3 text-center font-mono text-zinc-700 text-xs tabular-nums">
                        {player.age}
                      </td>

                      {/* Condição com Badge Semântico do Figma */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {player.condition === "APTO" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#008832]" />
                            <span>Apto</span>
                          </span>
                        )}
                        {player.condition === "MAL_CONDICIONADO" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                            <span>Mal condicionado</span>
                          </span>
                        )}
                        {player.condition === "DOENTE" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E4001B]" />
                            <span>Doente</span>
                          </span>
                        )}
                      </td>

                      {/* Valor Base */}
                      <td className="py-3 px-3 text-right font-mono text-zinc-500 tabular-nums">
                        {formatCurrency(player.base_value)}
                      </td>

                      {/* Valor de Mercado */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                        {formatCurrency(player.market_value)}
                      </td>

                      {/* Clube ou Livre */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {player.club_id && player.club_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-zinc-400">
                              {player.club_acronym || "CLB"}
                            </span>
                            <span className="text-zinc-800 underline decoration-zinc-300 font-medium hover:text-[#155DFC]">
                              {player.club_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-medium">
                            Livre
                          </span>
                        )}
                      </td>

                      {/* Ações (Comprar ou Menu de 3 Pontos) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!player.club_id && (
                            <button
                              onClick={() => setSelectedPlayerForBuy(player)}
                              className="inline-flex items-center gap-1 h-7 px-2.5 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="w-3 h-3 text-zinc-600" />
                              <span>Comprar</span>
                            </button>
                          )}

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpenId((prev) =>
                                  prev === player.id ? null : player.id,
                                );
                              }}
                              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {actionMenuOpenId === player.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 py-1 text-xs"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedPlayerForEdit(player);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Editar jogador</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedPlayerForCondition(player);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Alterar condição</span>
                                </button>

                                {!player.club_id && (
                                  <button
                                    onClick={() => {
                                      handleDeletePlayer(player);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer border-t border-zinc-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    <span>Excluir jogador</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO INFERIOR (Fidelidade ao rodapé de J01) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-zinc-100 bg-white text-xs text-zinc-500">
          <div>
            Mostrando{" "}
            {players.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}–
            {Math.min(meta.page * meta.limit, meta.total_items)} de{" "}
            {meta.total_items} jogadores
          </div>

          <div className="flex items-center gap-1 font-medium">
            <button
              disabled={meta.page <= 1}
              onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
              className="inline-flex items-center gap-1 px-2 py-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map(
              (pNum) => (
                <button
                  key={pNum}
                  onClick={() => setMeta({ ...meta, page: pNum })}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    meta.page === pNum
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {pNum}
                </button>
              ),
            )}

            <button
              disabled={meta.page >= meta.total_pages}
              onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
              className="inline-flex items-center gap-1 px-2 py-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Próxima</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* NOTA DE RODAPÉ DO FIGMA */}
      <div className="text-[11px] text-zinc-400">
        A tela mostra o novo valor de mercado depois da alteração.
      </div>

      {/* MODAL 1: NOVO JOGADOR (J05) */}
      <CreatePlayerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchPlayers();
          fetchTabCounts();
          showToast(
            "success",
            "Jogador cadastrado",
            "O novo jogador foi adicionado à lista.",
          );
        }}
      />

      {/* MODAL: COMPRAR JOGADOR (RN12 & RN13) */}
      {selectedPlayerForBuy && (
        <BuyPlayerModal
          isOpen={!!selectedPlayerForBuy}
          player={selectedPlayerForBuy}
          clubs={clubs}
          onClose={() => setSelectedPlayerForBuy(null)}
          onSuccess={() => {
            fetchPlayers();
            fetchTabCounts();
            showToast(
              "success",
              "Jogador Comprado!",
              `${selectedPlayerForBuy.name} foi comprado com sucesso.`,
            );
          }}
        />
      )}

      {/* MODAL 2: CONDIÇÃO FÍSICA (J10/J16) */}
      {selectedPlayerForCondition && (
        <ConditionModal
          isOpen={!!selectedPlayerForCondition}
          onClose={() => setSelectedPlayerForCondition(null)}
          onSuccess={(
            newMarketValue?: number,
            conditionLabel?: string,
            playerName?: string,
          ) => {
            fetchPlayers();
            const mv =
              newMarketValue !== undefined
                ? newMarketValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "";
            showToast(
              "success",
              "Condição alterada",
              `${playerName ?? selectedPlayerForCondition?.name} agora está ${conditionLabel ?? "com nova condição"}.${mv ? ` Valor de mercado: ${mv}.` : ""}`,
            );
          }}
          player={selectedPlayerForCondition}
        />
      )}

      {/* MODAL 3: EDITAR JOGADOR */}
      {selectedPlayerForEdit && (
        <EditPlayerModal
          isOpen={!!selectedPlayerForEdit}
          onClose={() => setSelectedPlayerForEdit(null)}
          onSuccess={() => fetchPlayers()}
          player={selectedPlayerForEdit}
        />
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO (J13) */}
      {playerToDelete && (
        <DeleteConfirmModal
          player={playerToDelete}
          onCancel={() => setPlayerToDelete(null)}
          onConfirm={confirmDeletePlayer}
        />
      )}

      {/* TOASTS (J11 e J14) */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 bg-white border border-zinc-200 rounded-2xl shadow-xl px-4 py-3 max-w-xs animate-slide-up"
          >
            <CheckCircle2 className="w-4 h-4 text-[#008832] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-900">
                {toast.title}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-zinc-400 hover:text-zinc-600 ml-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal de Confirmação de Exclusão (J13) ─── */
function DeleteConfirmModal({
  player,
  onCancel,
  onConfirm,
}: {
  player: Player;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const POSITION_LABELS: Record<string, string> = {
    GOL: "Goleiro",
    ZAG: "Zagueiro",
    LAT: "Lateral",
    MEI: "Meio-campo",
    ATA: "Atacante",
  };

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Excluir {player.name}?
          </h2>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            O jogador sai da lista e da busca, mas as transações e as partidas
            antigas dele continuam como foram gravadas.
          </p>
        </div>

        {/* Card do jogador */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-[12px] text-zinc-600 shrink-0">
              {getInitials(player.name)}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900">
                {player.name}
              </div>
              <div className="text-[11px] text-zinc-400">
                {player.position} ·{" "}
                {POSITION_LABELS[player.position] ?? player.position} ·{" "}
                {player.age} anos
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-500">Livre</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? "Excluindo..." : "Excluir jogador"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Players = PlayersPage;
