import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Shirt,
  ClipboardList,
  History,
  CheckCircle2,
  X,
  Search,
  ArrowLeft,
} from "lucide-react";
import { clubsService } from "../services/clubs.service";
import { ClubDetail, ClubPlayer } from "../types/club.types";
import { ClubStatCards } from "../components/ClubStatCards";
import { ClubSquadTab } from "../components/ClubSquadTab";
import { ClubLineupTab } from "../components/ClubLineupTab";
import { ClubHistoryTab } from "../components/ClubHistoryTab";
import { SellPlayerModal } from "../components/SellPlayerModal";

interface Toast {
  id: number;
  type: "success" | "error";
  title: string;
  message: string;
}

let toastCounter = 0;

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"squad" | "lineup" | "history">(
    "squad",
  );
  const [playerToSell, setPlayerToSell] = useState<ClubPlayer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const showToast = useCallback(
    (type: Toast["type"], title: string, message: string) => {
      const toastId = ++toastCounter;
      setToasts((prev) => [...prev, { id: toastId, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    },
    [],
  );

  async function loadClub() {
    if (!id) return;
    try {
      setLoading(true);
      const data = await clubsService.getClubById(Number(id));
      setClub(data);

      try {
        const txs = await clubsService.getTransactions(Number(id));
        setTransactions(Array.isArray(txs) ? txs : txs?.data || []);
      } catch {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClub();

    // Se veio do redirecionamento de criação de clube
    if (location.state?.justCreated && location.state?.clubName) {
      showToast(
        "success",
        "Clube criado",
        `${location.state.clubName} (${location.state.acronym}) começa com 300,00 em caixa.`,
      );
      // Limpa o state para não disparar em reloads
      window.history.replaceState({}, document.title);
    }
  }, [id]);

  if (loading && !club) {
    return (
      <div className="py-24 text-center text-zinc-400 text-xs">
        Carregando detalhes do clube...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-2xs max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 mb-1">
          Clube não encontrado
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">
          Clube não encontrado. O endereço pode estar errado ou o clube não
          existe.
        </p>
        <button
          onClick={() => navigate("/clubs")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para clubes
        </button>
      </div>
    );
  }

  const playersCount = club.players?.length || 0;

  return (
    <div className="space-y-6 font-sans text-zinc-900 pb-12">
      {/* Header do clube (C04 / C05) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-800">
            {club.acronym}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              {club.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600">
                Sigla {club.acronym}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600">
                <Shirt className="w-3 h-3" />
                {playersCount} de 12 jogadores
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/players?free=true")}
          className="inline-flex items-center gap-2 h-9 px-4 bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Comprar jogadores</span>
        </button>
      </div>

      {/* 4 Cards de Estatísticas */}
      <ClubStatCards
        cash={club.cash}
        squadValue={club.squad_value}
        netWorth={club.net_worth}
        playersCount={playersCount}
      />

      {/* Navegação por Abas */}
      <div className="border-b border-zinc-200">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("squad")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "squad"
                ? "border-[#155DFC] text-[#155DFC]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Elenco</span>
            <span className="text-[11px] font-mono opacity-80">
              {playersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("lineup")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "lineup"
                ? "border-[#155DFC] text-[#155DFC]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Escalação</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "history"
                ? "border-[#155DFC] text-[#155DFC]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico</span>
            <span className="text-[11px] font-mono opacity-80">
              {transactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === "squad" && (
        <ClubSquadTab
          players={club.players}
          onSellClick={(player) => setPlayerToSell(player)}
        />
      )}

      {activeTab === "lineup" && (
        <ClubLineupTab
          club={club}
          onLineupSaved={(form) => {
            loadClub();
            showToast(
              "success",
              "Escalação salva",
              `${club.name} na ${form}, com os 5 titulares devolvidos pela API.`,
            );
          }}
        />
      )}

      {activeTab === "history" && (
        <ClubHistoryTab
          clubId={club.id}
          clubName={club.name}
          clubCash={club.cash}
        />
      )}

      {/* Modal de Venda de Jogador (V01-V05) */}
      {playerToSell && (
        <SellPlayerModal
          isOpen={!!playerToSell}
          player={playerToSell}
          clubName={club.name}
          onClose={() => setPlayerToSell(null)}
          onViewHistory={() => setActiveTab("history")}
          onSuccess={() => {
            loadClub();
            showToast(
              "success",
              "Jogador vendido",
              `${playerToSell.name} foi vendido de volta ao mercado.`,
            );
          }}
        />
      )}

      {/* Notificações Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 bg-white border border-zinc-200 rounded-2xl shadow-xl px-4 py-3 max-w-sm animate-slide-up"
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
