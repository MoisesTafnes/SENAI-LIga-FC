import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingCart,
  AlertCircle,
  Shield,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Player } from "../types/player.types";
import { playersService } from "../services/players.service";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

interface BuyPlayerModalProps {
  isOpen: boolean;
  player: Player | null;
  clubs: Array<{
    id: number;
    name: string;
    acronym: string;
    cash: number;
    player_count?: number;
  }>;
  onClose: () => void;
  onSuccess: (data: any, clubId: number) => void;
}

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return "0,00";
  return Number(val).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateFull(isoStr?: string) {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date}, ${time}`;
  } catch {
    return isoStr;
  }
}

const POSITION_LABELS: Record<string, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meio-campo",
  ATA: "Atacante",
};

const AVATAR_COLORS = [
  { bg: "#FDF2F8", text: "#BE185D" },
  { bg: "#F5F3FF", text: "#7C3AED" },
  { bg: "#ECFEFF", text: "#0E7490" },
  { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#EFF6FF", text: "#1D4ED8" },
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BuyPlayerModal({
  isOpen,
  player,
  clubs,
  onClose,
  onSuccess,
}: BuyPlayerModalProps) {
  const navigate = useNavigate();

  const [selectedClubId, setSelectedClubId] = useState<number | "">("");
  const [loyaltyDate, setLoyaltyDate] = useState<string>("");
  const [loyaltyTime, setLoyaltyTime] = useState<string>("15:00");
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<"network" | "rule" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buyResult, setBuyResult] = useState<any | null>(null);
  useBodyScrollLock(isOpen);

  // Inicializa data padrão: hoje + 1 ano às 15:00
  useEffect(() => {
    if (isOpen) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setLoyaltyDate(nextYear.toISOString().split("T")[0]);
      setLoyaltyTime("15:00");
      setErrorType(null);
      setErrorMessage(null);
      setBuyResult(null);

      if (clubs.length > 0 && !selectedClubId) {
        setSelectedClubId(clubs[0].id);
      }
    }
  }, [isOpen, clubs]);

  if (!isOpen || !player) return null;

  const selectedClub = clubs.find((c) => c.id === Number(selectedClubId));
  const avatar = getAvatarColor(player.id);
  const initials = getInitials(player.name);
  const posLabel = POSITION_LABELS[player.position] || player.position;

  async function handleConfirm(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!player) return;
    if (!selectedClubId) {
      setErrorType("rule");
      setErrorMessage("Por favor, selecione o clube comprador.");
      return;
    }
    if (!loyaltyDate) {
      setErrorType("rule");
      setErrorMessage(
        "Por favor, informe a data de término do contrato de fidelidade.",
      );
      return;
    }

    try {
      setLoading(true);
      setErrorType(null);
      setErrorMessage(null);

      // Envia data no formato ISO com horário de Brasília (-03:00)
      const timeStr = loyaltyTime || "15:00";
      const isoWithTz = `${loyaltyDate}T${timeStr}:00-03:00`;

      const response = await playersService.buyPlayer(
        player.id,
        Number(selectedClubId),
        isoWithTz,
      );

      setBuyResult(response);
      onSuccess(response, Number(selectedClubId));
    } catch (err: any) {
      if (err.code === "ERR_NETWORK" || !err.response) {
        setErrorType("network");
        setErrorMessage(
          "A compra não foi confirmada. Verifique a conexão e tente de novo.",
        );
      } else {
        setErrorType("rule");
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "A compra foi recusada pela liga.";
        setErrorMessage(Array.isArray(msg) ? msg.join(" | ") : String(msg));
      }
    } finally {
      setLoading(false);
    }
  }

  // TELA M05: Compra concluída
  if (buyResult) {
    const clubName = selectedClub ? selectedClub.name : "clube";
    const isFeeExempt = (buyResult.fee ?? 0) === 0;

    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-zinc-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Compra concluída
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {player.name} agora é do {clubName}.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabela Financeira da Compra */}
          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden text-xs mb-5">
            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <span className="text-zinc-600 block">Valor</span>
                <span className="text-[10px] text-zinc-400">
                  Valor de mercado no momento da compra
                </span>
              </div>
              <span className="font-mono font-bold text-zinc-900">
                {fmt(buyResult.value ?? buyResult.market_value)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <span className="text-zinc-600 block">Taxa</span>
                <span className="text-[10px] text-zinc-400">
                  {isFeeExempt
                    ? "Isento: não passa de 30,00"
                    : "5% do valor, porque passa de 30,00"}
                </span>
              </div>
              <span className="font-mono font-medium text-zinc-800">
                {fmt(buyResult.fee ?? buyResult.league_fee)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-zinc-50/60 font-semibold text-zinc-900">
              <div>
                <span className="block font-bold">Custo total</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  Valor + taxa
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-zinc-900">
                {fmt(buyResult.total_cost)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Fim da fidelidade</span>
              <span className="font-medium text-zinc-800">
                {formatDateFull(buyResult.loyalty_until)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Contrato</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ATIVO
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-zinc-50 font-bold text-zinc-900">
              <span>Novo caixa do {clubName}</span>
              <span className="font-mono text-sm">
                {fmt(buyResult.club_cash)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (selectedClubId) {
                  navigate(`/clubs/${selectedClubId}`);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors shadow-2xs"
            >
              <span>Ver clube</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA M01 / M02 / M03 / M04 / M07 / M08
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-zinc-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Comprar jogador
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Escolha o clube comprador e até quando vai a fidelidade do
              contrato.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALERTA DE ERRO: SEM CONEXÃO (M03) */}
        {errorType === "network" && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Sem conexão</strong>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ALERTA DE ERRO: COMPRA RECUSADA (M04, M07, M08) */}
        {errorType === "rule" && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Compra recusada</strong>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Mini Card do Jogador */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0"
                style={{ backgroundColor: avatar.bg, color: avatar.text }}
              >
                {initials}
              </div>
              <div>
                <span className="font-bold text-zinc-900 block text-xs">
                  {player.name}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {player.position} · {posLabel} · {player.age} anos
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">
                Valor de mercado
              </span>
              <span className="font-mono font-bold text-zinc-900 text-xs">
                {fmt(player.market_value)}
              </span>
            </div>
          </div>

          {/* Clube Comprador */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Clube comprador
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <Shield className="w-4 h-4" />
              </div>
              <select
                value={selectedClubId}
                onChange={(e) =>
                  setSelectedClubId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                required
                disabled={loading}
                className="w-full h-10 pl-9 pr-3 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] cursor-pointer disabled:bg-zinc-50"
              >
                <option value="">Selecione um clube...</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.acronym}) · caixa {fmt(c.cash)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {selectedClub
                ? `Caixa atual: ${fmt(selectedClub.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.`
                : "O custo total (valor + taxa) pode ir até 50% do caixa."}
            </p>
          </div>

          {/* Fim da Fidelidade */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Fim da fidelidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 relative">
                <input
                  type="date"
                  value={loyaltyDate}
                  onChange={(e) => setLoyaltyDate(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-10 px-3 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] disabled:bg-zinc-50"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={loyaltyTime}
                  onChange={(e) => setLoyaltyTime(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-10 px-3 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] disabled:bg-zinc-50"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Depois do momento da compra e até 1.095 dias. Horário de Brasília;
              enviado com o fuso (-03:00).
            </p>
          </div>

          {/* Nota informativa da taxa da liga */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl text-[11px] text-zinc-500 flex items-start gap-2">
            <span className="text-zinc-400 mt-0.5">ℹ</span>
            <p className="leading-relaxed">
              A taxa é de 5% do valor de mercado, só quando ele passa de 30,00.
              Taxa, custo e novo caixa são calculados ao confirmar.
            </p>
          </div>

          {/* Aviso de enviando compra (M02) */}
          {loading && (
            <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <span className="text-blue-500">ℹ</span>
              <span>
                Enviando a compra. Os botões ficam desabilitados até a resposta.
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            {errorType === "network" ? (
              <button
                type="button"
                onClick={() => handleConfirm()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar de novo</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !selectedClubId}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Comprando...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Confirmar compra</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
