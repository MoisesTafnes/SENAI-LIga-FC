import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  ArrowUpDown,
  ChevronRight,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { clubsService } from '../services/clubs.service';
import { Club, ClubSortOption } from '../types/club.types';
import { CreateClubModal } from '../components/CreateClubModal';

interface Toast {
  id: number;
  type: 'success' | 'error';
  title: string;
  message: string;
}

const ACRONYM_COLORS = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#15803D' },
  { bg: '#FDF4FF', text: '#9333EA' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F0FDFA', text: '#0F766E' },
  { bg: '#FDF2F8', text: '#BE185D' },
];

function getClubColor(index: number) {
  return ACRONYM_COLORS[index % ACRONYM_COLORS.length];
}

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return '0,00';
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ClubsPage() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<ClubSortOption>('net_worth_desc');
  const [sortOpen, setSortOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sortRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  async function fetchClubs() {
    try {
      setLoading(true);
      setError(null);
      const data = await clubsService.getClubs(sortOption);
      setClubs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Tente de novo. Se a API respondeu, mostre o message dela.');
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClubs();
  }, [sortOption]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sortLabels: Record<ClubSortOption, string> = {
    name: 'nome',
    net_worth_desc: 'patrimônio (maior para o menor)',
    net_worth_asc: 'patrimônio (menor para o maior)',
  };

  return (
    <div className="space-y-4 font-sans text-zinc-900 pb-12">
      {/* Cabeçalho C01 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-50/70 border border-blue-100/90 rounded-2xl flex items-center justify-center text-[#155DFC]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Clubes</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20 clubes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo clube</span>
        </button>
      </div>

      {/* Estado: Erro ao carregar (E07) */}
      {error ? (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-16 text-center shadow-2xs">
          <div className="w-14 h-14 bg-zinc-50 border border-zinc-200/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <AlertCircle className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">Não foi possível carregar os clubes</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchClubs}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar de novo</span>
          </button>
        </div>
      ) : loading ? (
        /* Estado: Carregando Skeletons (E07) */
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <RefreshCw className="w-4 h-4 animate-spin text-[#155DFC]" />
            <span>Carregando clubes...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100" />
                  <div className="w-32 h-4 bg-zinc-100 rounded" />
                </div>
                <div className="w-24 h-4 bg-zinc-100 rounded" />
                <div className="w-20 h-4 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : clubs.length === 0 ? (
        /* Estado: Nenhum clube cadastrado (E07) */
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-16 text-center shadow-2xs">
          <div className="w-14 h-14 bg-zinc-50 border border-zinc-200/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Shield className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">Nenhum clube cadastrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">
            Crie o primeiro clube para começar.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo clube</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {/* Barra superior de status e ordenação */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
            <div className="text-xs text-zinc-500 font-medium">
              <span className="font-bold text-zinc-800">{clubs.length} clubes</span>
              <span className="ml-2">{clubs.length} de 20</span>
            </div>

            {/* Dropdown de Ordenação (C01) */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="h-8 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ordenar: {sortLabels[sortOption]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 text-xs animate-slide-up">
                  <div className="px-3.5 py-1 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    Ordenar por
                  </div>
                  {(
                    [
                      { label: 'Nome', val: 'name' },
                      { label: 'Patrimônio (maior para o menor)', val: 'net_worth_desc' },
                      { label: 'Patrimônio (menor para o maior)', val: 'net_worth_asc' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.val}
                      onClick={() => {
                        setSortOption(s.val);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 flex items-center justify-between font-medium cursor-pointer ${
                        sortOption === s.val ? 'text-zinc-900 font-semibold' : 'text-zinc-700'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortOption === s.val && <span className="text-[#155DFC] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/30">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500">Clube</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Sigla</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Caixa</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-zinc-500">Valor do elenco</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-zinc-500">Patrimônio</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400">
                      Carregando clubes...
                    </td>
                  </tr>
                ) : (
                  clubs.map((club, idx) => {
                    const color = getClubColor(idx);
                    return (
                      <tr
                        key={club.id}
                        className="hover:bg-zinc-50/70 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] shrink-0 border"
                              style={{
                                background: color.bg,
                                color: color.text,
                                borderColor: color.bg,
                              }}
                            >
                              {club.acronym}
                            </div>
                            <span className="font-semibold text-zinc-900">{club.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500 font-mono">{club.acronym}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700">{fmt(club.cash)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700">{fmt(club.squad_value)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-zinc-900 font-mono">
                          {fmt(club.net_worth)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/clubs/${club.id}`)}
                            className="inline-flex items-center gap-1 text-[#155DFC] hover:underline font-semibold text-xs cursor-pointer"
                          >
                            <span>Ver clube</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela */}
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/30 text-[11px] text-zinc-400">
            Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor, com empate desfeito pelo nome.
          </div>
        </div>
      )}

      {/* Modal Novo Clube */}
      <CreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          setIsCreateOpen(false);
          navigate(`/clubs/${created.id}`, {
            state: { justCreated: true, clubName: created.name, acronym: created.acronym },
          });
        }}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 bg-white border border-zinc-200 rounded-2xl shadow-xl px-4 py-3 max-w-sm animate-slide-up"
          >
            <CheckCircle2 className="w-4 h-4 text-[#008832] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-900">{toast.title}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
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
