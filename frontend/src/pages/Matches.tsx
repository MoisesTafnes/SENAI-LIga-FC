import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { leagueService } from "../services/league.service";

interface MatchSummary {
  id: number;
  played_at: string;
  home: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  away: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  result: "MANDANTE" | "VISITANTE" | "EMPATE";
}

interface ClubOption {
  id: number;
  name: string;
  acronym: string;
}

function getAcronym(name: string, clubs: ClubOption[]): string {
  const found = clubs.find((c) => c.name === name);
  return found?.acronym || name.substring(0, 3).toUpperCase();
}

function formatMatchDate(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}  ${h}:${m}`;
}

function resultLabel(result: string): string {
  if (result === "MANDANTE") return "Vitória do mandante";
  if (result === "VISITANTE") return "Vitória do visitante";
  return "Empate";
}

export function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [filterClubId, setFilterClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [homeClubId, setHomeClubId] = useState<number | "">("");
  const [awayClubId, setAwayClubId] = useState<number | "">("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [matchRes, clubRes] = await Promise.allSettled([
        leagueService.getMatches(),
        leagueService.getClubs(),
      ]);

      if (matchRes.status === "fulfilled") {
        const data = matchRes.value.data;
        setMatches(Array.isArray(data) ? data : data?.data || []);
      } else {
        setError("Não foi possível carregar as partidas. Tente de novo.");
      }

      if (clubRes.status === "fulfilled") {
        const data = clubRes.value.data;
        const list = Array.isArray(data) ? data : data?.data || [];
        setClubs(
          list.map((c: any) => ({
            id: c.id,
            name: c.name,
            acronym: c.acronym,
          })),
        );
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as partidas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMatches = useMemo(() => {
    if (!filterClubId) return matches;
    return matches.filter(
      (m) => m.home.club_id === filterClubId || m.away.club_id === filterClubId,
    );
  }, [matches, filterClubId]);

  const lastMatch = matches.length > 0 ? matches[0] : null;

  async function handlePlayMatch() {
    if (!homeClubId || !awayClubId) return;
    setModalError(null);
    setPlaying(true);
    try {
      const res = await leagueService.createMatch(
        Number(homeClubId),
        Number(awayClubId),
      );
      const matchId = res.data?.id;
      setShowModal(false);
      setHomeClubId("");
      setAwayClubId("");
      if (matchId) {
        navigate(`/matches/${matchId}`);
      } else {
        loadData();
      }
    } catch (err: any) {
      const msg = err.message || "Erro ao jogar a partida.";
      setModalError(msg);
    } finally {
      setPlaying(false);
    }
  }

  function openModal() {
    setModalError(null);
    setHomeClubId("");
    setAwayClubId("");
    setShowModal(true);
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#155DFC]">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Partidas
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Jogue partidas entre clubes com os 5 titulares escalados e
              acompanhe o histórico.
            </p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#155DFC] text-white text-xs font-semibold rounded-lg hover:bg-[#1247CC] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova partida
        </button>
      </div>

      {/* ESTADO: Erro ao carregar partidas (E07) */}
      {error ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            Não foi possível carregar as partidas
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5 leading-relaxed">
            {error}
          </p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Loader2 className="w-3.5 h-3.5" />
            Tentar de novo
          </button>
        </div>
      ) : !loading && matches.length === 0 ? (
        /* ESTADO: Lista vazia de partidas (E06 / E07) */
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">
              Nenhuma partida jogada
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Escale os 5 titulares de dois clubes e jogue a primeira partida. O
              resultado aparece aqui e na classificação.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova partida
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Nenhuma partida jogada ainda. A classificação continua com todos os
            clubes, zerados.
          </p>
        </div>
      ) : (
        <>
          {/* Última partida */}
          {lastMatch && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Última partida</p>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Home */}
                    <div className="text-right">
                      <div className="font-bold text-zinc-900 text-sm">
                        {lastMatch.home.club_name}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Mandante
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-600">
                      {getAcronym(lastMatch.home.club_name, clubs)}
                    </span>

                    {/* Score */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-2xl font-black text-zinc-900 tracking-tight">
                        {lastMatch.home.goals}{" "}
                        <span className="text-zinc-300 font-medium">×</span>{" "}
                        {lastMatch.away.goals}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {formatMatchDate(lastMatch.played_at)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                        {resultLabel(lastMatch.result)}
                      </div>
                    </div>

                    {/* Away */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-600">
                      {getAcronym(lastMatch.away.club_name, clubs)}
                    </span>
                    <div className="text-left">
                      <div className="font-bold text-zinc-900 text-sm">
                        {lastMatch.away.club_name}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Visitante
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/matches/${lastMatch.id}`)}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                  >
                    Ver duelos
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de partidas */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Histórico de partidas
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Da mais recente para a mais antiga.
                </p>
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterClubId ?? ""}
                  onChange={(e) =>
                    setFilterClubId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg cursor-pointer focus:outline-none hover:border-zinc-300 transition-colors"
                >
                  <option value="">Clube: todos</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-zinc-100 text-zinc-400 text-[11px] font-semibold">
                    <th className="text-left py-2.5 px-5 font-medium">
                      Data e hora
                    </th>
                    <th className="text-right py-2.5 px-3 font-medium">
                      Mandante
                    </th>
                    <th className="text-center py-2.5 px-3 font-medium">
                      Placar
                    </th>
                    <th className="text-left py-2.5 px-3 font-medium">
                      Visitante
                    </th>
                    <th className="text-left py-2.5 px-3 font-medium">
                      Resultado
                    </th>
                    <th className="text-right py-2.5 px-5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-zinc-400 text-xs"
                      >
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-300" />
                        Carregando partidas...
                      </td>
                    </tr>
                  ) : filteredMatches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-zinc-400 text-xs"
                      >
                        Nenhuma partida encontrada para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredMatches.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="py-3 px-5 text-zinc-600 font-medium whitespace-nowrap">
                          {formatMatchDate(m.played_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-zinc-900">
                            {m.home.club_name}
                          </span>
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-500">
                            {getAcronym(m.home.club_name, clubs)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-black text-zinc-900">
                            {m.home.goals}{" "}
                            <span className="text-zinc-300 font-medium">×</span>{" "}
                            {m.away.goals}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-left">
                          <span className="mr-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-500">
                            {getAcronym(m.away.club_name, clubs)}
                          </span>
                          <span className="font-bold text-zinc-900">
                            {m.away.club_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-500 font-medium">
                          {resultLabel(m.result)}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => navigate(`/matches/${m.id}`)}
                            className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer ml-auto"
                          >
                            Ver duelos
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-zinc-100 text-[11px] text-zinc-400">
              {filteredMatches.length} partida
              {filteredMatches.length !== 1 ? "s" : ""}
            </div>
          </div>

          <p className="text-[11px] text-zinc-400">
            Partidas da mais recente para a mais antiga, com filtro por clube.
            "Ver duelos" abre a partida.
          </p>
        </>
      )}

      {/* ===== MODAL NOVA PARTIDA (L02 / L04) ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fade-in">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-zinc-900">Nova partida</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Escolha o mandante e o visitante. O placar sai dos atributos dos
              titulares, sem sorteio.
            </p>

            {/* Error */}
            {modalError && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-800">
                    Não foi possível jogar a partida
                  </div>
                  <div className="mt-0.5 text-red-600">{modalError}</div>
                </div>
              </div>
            )}

            {/* Mandante */}
            <div className="mt-5">
              <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                Mandante
              </label>
              <div className="relative">
                <select
                  value={homeClubId}
                  onChange={(e) => {
                    setHomeClubId(e.target.value ? Number(e.target.value) : "");
                    setModalError(null);
                  }}
                  className={`w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-semibold bg-white border rounded-lg cursor-pointer focus:outline-none transition-colors ${
                    modalError && homeClubId
                      ? "border-red-300 text-red-700"
                      : "border-zinc-200 text-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <option value="">Selecionar clube mandante...</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.acronym})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Faz os 3 primeiros ataques.
              </p>
            </div>

            {/* Visitante */}
            <div className="mt-4">
              <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                Visitante
              </label>
              <div className="relative">
                <select
                  value={awayClubId}
                  onChange={(e) => {
                    setAwayClubId(e.target.value ? Number(e.target.value) : "");
                    setModalError(null);
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg cursor-pointer focus:outline-none hover:border-zinc-300 transition-colors text-zinc-800"
                >
                  <option value="">Selecionar clube visitante...</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.acronym})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Precisa ser um clube diferente do mandante.
              </p>
            </div>

            {/* Info box */}
            <div className="mt-5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-zinc-800">
                    Como sai o placar
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                    Cada time faz 3 ataques. Pela ordem do elenco, os jogadores
                    de linha vão do 1º (o mais recuado) ao 4º (o mais avançado):
                    o 4º enfrenta o goleiro, o 3º enfrenta o 1º e o 2º enfrenta
                    o 2º do adversário. O atacante usa finalização (ATA), passe
                    (MEI) ou drible (ZAG e LAT), e quem defende usa defesa. É
                    gol só quando o ataque é maior; mal condicionado joga com
                    15% a menos.
                  </p>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Os dois clubes precisam ter os 5 titulares escalados. A
                    partida não mexe no caixa.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlayMatch}
                disabled={!homeClubId || !awayClubId || playing}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1247CC] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
              >
                {playing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Swords className="w-4 h-4" />
                )}
                {playing ? "Simulando..." : "Jogar partida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
