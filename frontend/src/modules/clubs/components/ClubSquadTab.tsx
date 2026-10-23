import { useNavigate } from 'react-router-dom';
import { Shirt, Users, Tag, Check } from 'lucide-react';
import { ClubPlayer } from '../types/club.types';

interface ClubSquadTabProps {
  players: ClubPlayer[];
  onSellClick: (player: ClubPlayer) => void;
}

const AVATAR_COLORS = [
  { bg: '#FDF2F8', text: '#BE185D' }, // Rosa
  { bg: '#F5F3FF', text: '#7C3AED' }, // Roxo
  { bg: '#ECFEFF', text: '#0E7490' }, // Ciano
  { bg: '#FFF7ED', text: '#C2410C' }, // Laranja
  { bg: '#F0FDF4', text: '#15803D' }, // Verde
  { bg: '#EFF6FF', text: '#1D4ED8' }, // Azul
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

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return '0,00';
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoStr?: string) {
  if (!isoStr) return { date: '-', time: '' };
  try {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch {
    return { date: '-', time: '' };
  }
}

export function ClubSquadTab({ players, onSellClick }: ClubSquadTabProps) {
  const navigate = useNavigate();

  if (!players || players.length === 0) {
    return (
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400 border border-zinc-200/60">
          <Shirt className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 mb-1">O clube ainda não tem jogadores</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6 leading-relaxed">
          Compre jogadores livres para formar o elenco.
        </p>
        <button
          onClick={() => navigate('/players?free=true')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-800 shadow-2xs transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span>Ver jogadores livres</span>
        </button>
      </div>
    );
  }

  const now = new Date();
  const currentDateFormatted = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTimeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header do container */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-bold text-zinc-900">Elenco</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome. Contrato calculado para uma venda agora.
        </p>
      </div>

      {/* Tabela de jogadores */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/40">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500">Jogador</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-zinc-500">Posição</th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-zinc-500">Overall</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-zinc-500">Condição</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Valor de mercado</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Valor de compra</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Fim da fidelidade</th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-zinc-500">Dias restantes</th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-zinc-500">% de multa</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {players.map((p) => {
              const avatar = getAvatarColor(p.id);
              const initials = getInitials(p.name);
              const { date, time } = formatDate(p.contract?.loyalty_until);
              const daysRemaining = p.contract?.days_remaining ?? 0;
              const penalty = p.contract?.penalty_percentage ?? 0;

              return (
                <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                  {/* Jogador */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                        style={{ background: avatar.bg, color: avatar.text }}
                      >
                        {initials}
                      </div>
                      <span className="font-semibold text-zinc-900 truncate max-w-[150px]">
                        {p.name}
                      </span>
                    </div>
                  </td>

                  {/* Posição */}
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                      {p.position}
                    </span>
                  </td>

                  {/* Overall */}
                  <td className="px-3 py-3 text-center font-bold text-zinc-800">
                    {p.overall}
                  </td>

                  {/* Condição */}
                  <td className="px-3 py-3">
                    {p.condition === 'APTO' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Apto
                      </span>
                    )}
                    {p.condition === 'MAL_CONDICIONADO' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Mal condicionado
                      </span>
                    )}
                    {p.condition === 'DOENTE' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Doente
                      </span>
                    )}
                  </td>

                  {/* Valor de mercado */}
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 font-mono">
                    {fmt(p.market_value)}
                  </td>

                  {/* Valor de compra */}
                  <td className="px-4 py-3 text-right font-mono text-zinc-500">
                    {fmt(p.base_value)}
                  </td>

                  {/* Fim da fidelidade */}
                  <td className="px-4 py-3">
                    <div className="text-zinc-800 font-medium">{date}</div>
                    {time && <div className="text-[10px] text-zinc-400">{time}</div>}
                  </td>

                  {/* Dias restantes */}
                  <td className="px-3 py-3 text-center font-mono text-zinc-600">
                    {daysRemaining.toLocaleString('pt-BR')}
                  </td>

                  {/* % de multa */}
                  <td className="px-3 py-3 text-center">
                    {penalty === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        <Check className="w-3 h-3 text-emerald-600" />
                        0%
                      </span>
                    ) : penalty === 5 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                        5%
                      </span>
                    ) : penalty === 10 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700">
                        10%
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">
                        20%
                      </span>
                    )}
                  </td>

                  {/* Ação Vender */}
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onSellClick(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-zinc-400 rotate-90" />
                      <span>Vender</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé explicativo */}
      <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/30 text-[11px] text-zinc-400">
        Valor de mercado, dias restantes e % de multa calculados para uma venda agora ({currentDateFormatted}, {currentTimeFormatted}). A multa tem teto de 10,00.
      </div>
    </div>
  );
}
