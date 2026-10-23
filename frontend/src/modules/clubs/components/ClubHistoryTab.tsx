import { useEffect, useState, useMemo } from "react";
import {
  Download,
  ShoppingCart,
  Tag,
  History,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { clubsService } from "../services/clubs.service";

interface TransactionItem {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: "COMPRA" | "VENDA";
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

interface TransactionsSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

interface ClubHistoryTabProps {
  clubId: number;
  clubName: string;
  clubCash: number;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}`;
}

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const colorMap = [
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-amber-100 text-amber-800",
  "bg-cyan-100 text-cyan-800",
  "bg-indigo-100 text-indigo-800",
  "bg-rose-100 text-rose-800",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colorMap[Math.abs(hash) % colorMap.length];
}

export function ClubHistoryTab({ clubId, clubCash }: ClubHistoryTabProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary>({
    total_spent: 0,
    total_received: 0,
    total_fees: 0,
    total_penalties: 0,
    total_profit: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRefused, setFilterRefused] = useState<string | null>(null);

  // Filters
  const [filterBuy, setFilterBuy] = useState(true);
  const [filterSell, setFilterSell] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | "all">(
    "all",
  );
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);

  // Toast for CSV
  const [csvToast, setCsvToast] = useState<{
    show: boolean;
    fileName: string;
    filterText: string;
  } | null>(null);

  // Distinct players across all transactions for dropdown
  const [allPlayersList, setAllPlayersList] = useState<
    { id: number; name: string }[]
  >([]);

  // Load distinct players initially
  useEffect(() => {
    async function loadDistinctPlayers() {
      try {
        const result = await clubsService.getTransactions(clubId);
        const list: TransactionItem[] = result?.data || [];
        const map = new Map<number, string>();
        list.forEach((t) => map.set(t.player_id, t.player_name));
        setAllPlayersList(
          Array.from(map.entries()).map(([id, name]) => ({ id, name })),
        );
      } catch {
        // silent
      }
    }
    loadDistinctPlayers();
  }, [clubId]);

  // Load transactions based on current filters
  const loadTransactions = async () => {
    // If neither is checked, list is empty
    if (!filterBuy && !filterSell) {
      setTransactions([]);
      setSummary({
        total_spent: 0,
        total_received: 0,
        total_fees: 0,
        total_penalties: 0,
        total_profit: 0,
      });
      setFilterRefused(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFilterRefused(null);

      const params: any = {};
      if (filterBuy && !filterSell) params.type = "COMPRA";
      if (!filterBuy && filterSell) params.type = "VENDA";
      if (selectedPlayerId !== "all") params.player_id = selectedPlayerId;

      const result = await clubsService.getTransactions(clubId, params);
      setTransactions(result?.data || []);
      setSummary(
        result?.summary || {
          total_spent: 0,
          total_received: 0,
          total_fees: 0,
          total_penalties: 0,
          total_profit: 0,
        },
      );
    } catch (err: any) {
      if (err.response?.status === 404 && selectedPlayerId !== "all") {
        // H05 - Filtro recusado
        setFilterRefused(
          err.response?.data?.message || "Jogador não encontrado.",
        );
      } else {
        // E05 - Histórico com erro
        setError(
          err.response?.data?.message ||
            "Não foi possível carregar o histórico. Os totais e a exportação ficam indisponíveis até a lista carregar.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [clubId, filterBuy, filterSell, selectedPlayerId]);

  // CSV Export handler
  const handleExportCsv = async () => {
    try {
      const params: any = {};
      if (filterBuy && !filterSell) params.type = "COMPRA";
      if (!filterBuy && filterSell) params.type = "VENDA";
      if (selectedPlayerId !== "all") params.player_id = selectedPlayerId;

      const csv = await clubsService.exportTransactionsCsv(clubId, params);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `historico-clube-${clubId}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      let filterDesc = "com todos os filtros aplicados.";
      if (filterBuy && !filterSell)
        filterDesc = "com o filtro de tipo Compra aplicado.";
      else if (!filterBuy && filterSell)
        filterDesc = "com o filtro de tipo Venda aplicado.";
      else if (selectedPlayerId !== "all") {
        const p = allPlayersList.find((pl) => pl.id === selectedPlayerId);
        filterDesc = `filtrado pelo jogador ${p?.name || ""}.`;
      }

      setCsvToast({
        show: true,
        fileName,
        filterText: filterDesc,
      });

      setTimeout(() => setCsvToast(null), 5000);
    } catch (err: any) {
      alert(
        "Erro ao exportar CSV: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const isFiltered = !filterBuy || !filterSell || selectedPlayerId !== "all";

  const resetFilters = () => {
    setFilterBuy(true);
    setFilterSell(true);
    setSelectedPlayerId("all");
  };

  const selectedPlayerName = useMemo(() => {
    if (selectedPlayerId === "all") return "todos";
    const found = allPlayersList.find((p) => p.id === selectedPlayerId);
    return found ? found.name : "todos";
  }, [selectedPlayerId, allPlayersList]);

  return (
    <div className="space-y-4 font-sans">
      {/* Toast de CSV exportado (H02) */}
      {csvToast && (
        <div className="fixed bottom-6 right-6 z-[110] bg-white border border-zinc-200 rounded-xl p-4 shadow-xl flex items-start gap-3 max-w-sm animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-zinc-900">CSV baixado</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 break-all">
              {csvToast.fileName}, {csvToast.filterText}
            </div>
          </div>
          <button
            onClick={() => setCsvToast(null)}
            className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header com Título e Botão Exportar CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">
            Histórico de transações
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Da mais recente para a mais antiga, com o nome e os valores do
            momento de cada operação.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-zinc-500" />
          Exportar CSV
        </button>
      </div>

      {/* Linha de Filtros (Tipo e Jogador) */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-zinc-500 font-medium text-[11px]">Tipo</span>
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 cursor-pointer select-none hover:bg-zinc-50">
          <input
            type="checkbox"
            checked={filterBuy}
            onChange={(e) => setFilterBuy(e.target.checked)}
            className="rounded text-[#155DFC] focus:ring-0 cursor-pointer"
          />
          <span className="font-semibold text-xs">Compra</span>
        </label>

        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 cursor-pointer select-none hover:bg-zinc-50">
          <input
            type="checkbox"
            checked={filterSell}
            onChange={(e) => setFilterSell(e.target.checked)}
            className="rounded text-[#155DFC] focus:ring-0 cursor-pointer"
          />
          <span className="font-semibold text-xs">Venda</span>
        </label>

        {/* Dropdown Jogador */}
        <div className="relative">
          <button
            onClick={() => setPlayerDropdownOpen(!playerDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
          >
            <span className="text-zinc-400">👤</span>
            <span>Jogador: {selectedPlayerName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          </button>

          {playerDropdownOpen && (
            <div className="absolute left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-zinc-50 text-xs">
              <button
                onClick={() => {
                  setSelectedPlayerId("all");
                  setPlayerDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors ${
                  selectedPlayerId === "all"
                    ? "font-bold text-[#155DFC] bg-blue-50/50"
                    : "text-zinc-700"
                }`}
              >
                Todos os jogadores
              </button>
              {allPlayersList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    setPlayerDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors truncate ${
                    selectedPlayerId === p.id
                      ? "font-bold text-[#155DFC] bg-blue-50/50"
                      : "text-zinc-700"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link Limpar Filtros */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-[#155DFC] hover:underline cursor-pointer ml-1"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ESTADO: Filtro recusado (H05) */}
      {filterRefused ? (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-900">
                O filtro foi recusado
              </div>
              <div className="text-red-700 mt-0.5">{filterRefused}</div>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-white border border-red-200 text-red-800 rounded-lg text-[11px] font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      ) : error ? (
        /* ESTADO: Histórico com erro (E05 / E07) */
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            Não foi possível carregar o histórico
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-5 leading-relaxed">
            {error}
          </p>
          <button
            onClick={loadTransactions}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar de novo
          </button>
        </div>
      ) : loading ? (
        /* ESTADO: Carregando Skeleton (E01 / E07) */
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-zinc-100 flex items-center gap-2 text-zinc-400 text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#155DFC]" />
            <span>Carregando histórico...</span>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-100" />
                  <div className="w-32 h-3.5 bg-zinc-100 rounded" />
                </div>
                <div className="w-20 h-3.5 bg-zinc-100 rounded" />
                <div className="w-16 h-3.5 bg-zinc-100 rounded" />
                <div className="w-16 h-3.5 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
        /* ESTADO: Lista vazia (H04 / E07) */
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">
              Nenhuma transação ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              As compras e vendas do clube aparecem aqui, com os totais logo
              abaixo.
            </p>
          </div>

          {/* Cards de Totais zerados (H04) */}
          <SummaryCards summary={summary} />

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Sem transações, os totais ficam zerados. O botão Exportar CSV
            continua disponível e baixa só a linha de cabeçalho.
          </p>
        </div>
      ) : (
        /* ESTADO: Lista com dados (H01, H02, H03) */
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-400 text-[11px] font-semibold">
                    <th className="py-2.5 px-3 font-medium">Data e hora</th>
                    <th className="py-2.5 px-3 font-medium">Tipo</th>
                    <th className="py-2.5 px-3 font-medium">Jogador</th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Valor
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Taxa ou comissão
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Multa
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Lucro
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">
                      Variação do caixa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {transactions.map((t) => {
                    const isBuy = t.type === "COMPRA";
                    const initials = getPlayerInitials(t.player_name);
                    const colorClass = getAvatarColor(t.player_name);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-zinc-50/70 transition-colors"
                      >
                        <td className="py-3 px-3 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(t.created_at)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isBuy ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#155DFC] font-semibold text-[10px] border border-blue-100">
                              <ShoppingCart className="w-3 h-3" />
                              Compra
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold text-[10px] border border-zinc-200">
                              <Tag className="w-3 h-3 text-zinc-500" />
                              Venda
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${colorClass}`}
                            >
                              {initials}
                            </span>
                            <span className="font-semibold text-zinc-900">
                              {t.player_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-800">
                          {formatCurrency(t.value)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-500">
                          {formatCurrency(t.fee)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-500">
                          {formatCurrency(t.penalty)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {t.profit === null ? (
                            <span className="text-zinc-300">–</span>
                          ) : t.profit > 0 ? (
                            <span className="font-bold text-emerald-600">
                              +{formatCurrency(t.profit)}
                            </span>
                          ) : t.profit < 0 ? (
                            <span className="font-bold text-red-600">
                              {formatCurrency(t.profit)}
                            </span>
                          ) : (
                            <span className="text-zinc-500">0,00</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {t.cash_change > 0 ? (
                            <span className="text-emerald-600">
                              +{formatCurrency(t.cash_change)}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              {formatCurrency(t.cash_change)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards de Resumo e Totais inferiores (H01) */}
          <SummaryCards summary={summary} />

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Os totais respeitam os filtros. 300,00 + soma das variações = caixa
            atual ({formatCurrency(clubCash)}).
          </p>
        </div>
      )}
    </div>
  );
}

/* Componente de Cards de Resumo (H01, H02, H03, H04) */
function SummaryCards({ summary }: { summary: TransactionsSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total pago em compras */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium">
          <ShoppingCart className="w-3 h-3" />
          <span>Total pago em compras</span>
        </div>
        <div className="text-base font-black text-zinc-900 font-mono mt-1">
          {formatCurrency(summary.total_spent)}
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Valor + taxa</div>
      </div>

      {/* Total recebido em vendas */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium">
          <Tag className="w-3 h-3" />
          <span>Total recebido em vendas</span>
        </div>
        <div className="text-base font-black text-zinc-900 font-mono mt-1">
          {formatCurrency(summary.total_received)}
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Crédito líquido</div>
      </div>

      {/* Taxas e comissões */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium">
          <span>%</span>
          <span>Taxas e comissões</span>
        </div>
        <div className="text-base font-black text-zinc-900 font-mono mt-1">
          {formatCurrency(summary.total_fees)}
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Somadas</div>
      </div>

      {/* Multas */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium">
          <AlertCircle className="w-3 h-3" />
          <span>Multas</span>
        </div>
        <div className="text-base font-black text-zinc-900 font-mono mt-1">
          {formatCurrency(summary.total_penalties)}
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Por fidelidade</div>
      </div>

      {/* Lucro total */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium">
          <span>📈</span>
          <span>Lucro total</span>
        </div>
        <div
          className={`text-base font-black font-mono mt-1 ${
            summary.total_profit > 0
              ? "text-emerald-600"
              : summary.total_profit < 0
                ? "text-red-600"
                : "text-zinc-900"
          }`}
        >
          {summary.total_profit > 0
            ? `+${formatCurrency(summary.total_profit)}`
            : formatCurrency(summary.total_profit)}
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">
          Soma dos lucros, com sinal
        </div>
      </div>
    </div>
  );
}
