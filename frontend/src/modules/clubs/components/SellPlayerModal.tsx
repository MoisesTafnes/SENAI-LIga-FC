import { useState } from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ClubPlayer } from '../types/club.types';
import { clubsService } from '../services/clubs.service';

interface SellPlayerModalProps {
  isOpen: boolean;
  player: ClubPlayer | null;
  clubName?: string;
  isStarter?: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  onViewHistory?: () => void;
}

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return '0,00';
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateFull(isoStr?: string) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  } catch {
    return isoStr;
  }
}

const POSITION_LABELS: Record<string, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
};

const AVATAR_COLORS = [
  { bg: '#FDF2F8', text: '#BE185D' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#ECFEFF', text: '#0E7490' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F0FDF4', text: '#15803D' },
  { bg: '#EFF6FF', text: '#1D4ED8' },
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SellPlayerModal({
  isOpen,
  player,
  clubName = 'clube',
  isStarter = false,
  onClose,
  onSuccess,
  onViewHistory,
}: SellPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<any | null>(null);

  if (!isOpen || !player) return null;

  async function handleConfirm() {
    if (!player) return;
    try {
      setLoading(true);
      setError(null);
      const res = await clubsService.sellPlayer(player.id);
      setSaleResult(res);
      onSuccess(res);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'A venda foi recusada.';
      setError(Array.isArray(msg) ? msg.join(' | ') : String(msg));
    } finally {
      setLoading(false);
    }
  }

  const avatar = getAvatarColor(player.id);
  const initials = getInitials(player.name);
  const posLabel = POSITION_LABELS[player.position] || player.position;

  const daysRemaining = player.contract?.days_remaining ?? 0;
  const penaltyPercent = player.contract?.penalty_percentage ?? 0;
  const purchaseValue = player.base_value ?? 0;
  const loyaltyDateStr = formatDateFull(player.contract?.loyalty_until);

  // TELA V02 / V03: Venda concluída
  if (saleResult) {
    const isRescinded = saleResult.remaining_days > 0 || (saleResult.penalty ?? 0) > 0;
    const isPositiveProfit = (saleResult.profit ?? 0) > 0;
    const isNegativeProfit = (saleResult.profit ?? 0) < 0;

    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Venda concluída</h2>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  {isRescinded
                    ? `${player.name} voltou a ficar livre e saiu da escalação.`
                    : `${player.name} voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.`}
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

          {/* Extrato da Venda (V02 / V03) */}
          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden text-xs mb-5">
            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Valor de compra</span>
              <span className="font-mono font-medium text-zinc-800">{fmt(saleResult.purchase_value)}</span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <span className="text-zinc-600 block">Valor de venda</span>
                <span className="text-[10px] text-zinc-400">Valor de mercado no momento da venda</span>
              </div>
              <span className="font-mono font-bold text-zinc-900">{fmt(saleResult.sale_value)}</span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Dias restantes</span>
              <span className="font-mono font-medium text-zinc-800">{saleResult.remaining_days ?? 0}</span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <span className="text-zinc-600 block">Multa</span>
                <span className="text-[10px] text-zinc-400">
                  {saleResult.remaining_days > 0
                    ? `${saleResult.penalty_rate ?? penaltyPercent}% do valor de venda, com teto de 10,00`
                    : 'Fidelidade cumprida: sem multa'}
                </span>
              </div>
              <span className="font-mono font-medium text-zinc-800">{fmt(saleResult.penalty ?? 0)}</span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Lucro</span>
              <span
                className={`font-mono font-bold ${
                  isPositiveProfit
                    ? 'text-emerald-600'
                    : isNegativeProfit
                    ? 'text-red-600'
                    : 'text-zinc-700'
                }`}
              >
                {isPositiveProfit ? `+${fmt(saleResult.profit)}` : fmt(saleResult.profit ?? 0)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <div>
                <span className="text-zinc-600 block">Comissão</span>
                <span className="text-[10px] text-zinc-400">
                  {saleResult.profit > 0
                    ? '10% do lucro até 10,00 + 20% do que passar'
                    : 'Sem lucro: sem comissão'}
                </span>
              </div>
              <span className="font-mono font-medium text-zinc-800">{fmt(saleResult.fee ?? 0)}</span>
            </div>

            <div className="p-3 flex items-center justify-between bg-zinc-50/60 font-semibold text-zinc-900">
              <div>
                <span className="block font-bold">Crédito no caixa</span>
                <span className="text-[10px] text-zinc-400 font-normal">Valor de venda - multa - comissão</span>
              </div>
              <span className="font-mono text-sm font-bold text-zinc-900">
                +{fmt(saleResult.cash_change ?? saleResult.net_receivable)}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between bg-white">
              <span className="text-zinc-600">Contrato</span>
              {isRescinded ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  RESCINDIDO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  ENCERRADO
                </span>
              )}
            </div>

            <div className="p-3 flex items-center justify-between bg-zinc-50 font-bold text-zinc-900">
              <span>Novo caixa do {clubName}</span>
              <span className="font-mono text-sm">{fmt(saleResult.club_cash ?? saleResult.new_cash)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {onViewHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewHistory();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ver histórico</span>
              </button>
            )}
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

  // TELA V01 / V04 / V05: Confirmação de Venda
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Vender {player.name}?</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              O jogador sai do elenco do {clubName} e volta a ficar livre.
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

        {/* Alerta de erro da API (V04) */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">A venda foi recusada</strong>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Alerta de Titular (V01) */}
        {isStarter && (
          <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl mb-4 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">{player.name} é titular</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Ao vender, ele sai da escalação, e o {clubName} só volta a jogar partidas depois de escalar de novo os 5 titulares.
              </p>
            </div>
          </div>
        )}

        {/* Mini Card do Jogador */}
        <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0"
              style={{ backgroundColor: avatar.bg, color: avatar.text }}
            >
              {initials}
            </div>
            <div>
              <span className="font-bold text-zinc-900 block text-xs">{player.name}</span>
              <span className="text-[11px] text-zinc-500">
                {player.position} · {posLabel} · {player.age} anos
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block">Valor de mercado</span>
            <span className="font-mono font-bold text-zinc-900 text-xs">{fmt(player.market_value)}</span>
          </div>
        </div>

        {/* Dados Financeiros e Contratuais */}
        <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden text-xs mb-4">
          <div className="p-3 flex items-center justify-between bg-white">
            <span className="text-zinc-600">Valor de compra</span>
            <span className="font-mono font-medium text-zinc-800">{fmt(purchaseValue)}</span>
          </div>

          <div className="p-3 flex items-center justify-between bg-white">
            <span className="text-zinc-600">Fim da fidelidade</span>
            <span className="font-medium text-zinc-800">{loyaltyDateStr}</span>
          </div>

          <div className="p-3 flex items-center justify-between bg-white">
            <span className="text-zinc-600">Dias restantes</span>
            <span className="font-mono font-medium text-zinc-800">{daysRemaining}</span>
          </div>

          <div className="p-3 flex items-center justify-between bg-white">
            <span className="text-zinc-600">% de multa se vender agora</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                penaltyPercent === 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : penaltyPercent === 5
                  ? 'bg-amber-50 text-amber-700'
                  : penaltyPercent === 10
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {penaltyPercent}%
            </span>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl mb-4 text-[11px] text-zinc-500 flex items-start gap-2">
          <span className="text-zinc-400 mt-0.5">ℹ</span>
          <p className="leading-relaxed">
            A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e crédito são calculados ao confirmar.
          </p>
        </div>

        {/* Aviso de enviando venda (V05) */}
        {loading && (
          <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl mb-4 text-xs text-blue-900 flex items-center gap-2">
            <span className="text-blue-500">ℹ</span>
            <span>Enviando a venda. Os botões ficam desabilitados até a resposta.</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Vendendo...</span>
              </>
            ) : (
              <span>Confirmar venda</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
