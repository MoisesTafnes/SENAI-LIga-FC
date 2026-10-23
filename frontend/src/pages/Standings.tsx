import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListOrdered, Plus, ChevronRight, Loader2 } from "lucide-react";
import { leagueService } from "../services/league.service";

interface StandingRow {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface MatchSummary {
  id: number;
  played_at: string;
  home: { club_id: number; club_name: string; goals: number };
  away: { club_id: number; club_name: string; goals: number };
  result: string;
}

interface ClubOption {
  id: number;
  name: string;
  acronym: string;
}

function formatMatchDate(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${h}:${m}`;
}

function getAcronym(clubName: string, clubs: ClubOption[]): string {
  const found = clubs.find((c) => c.name === clubName);
  return found?.acronym || clubName.substring(0, 3).toUpperCase();
}

export function Standings() {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [standingsRes, matchesRes, clubsRes] = await Promise.allSettled([
          leagueService.getStandings(),
          leagueService.getMatches(),
          leagueService.getClubs(),
        ]);

        if (standingsRes.status === "fulfilled") {
          setStandings(standingsRes.value.data || []);
        } else {
          setError("Não foi possível carregar a classificação. Tente de novo.");
        }
        if (matchesRes.status === "fulfilled") {
          const data = matchesRes.value.data;
          setMatches(Array.isArray(data) ? data : data?.data || []);
        }
        if (clubsRes.status === "fulfilled") {
          const data = clubsRes.value.data;
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
        setError(err.message || "Não foi possível carregar a classificação.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Last few matches for sidebar (up to 5)
  const recentMatches = matches.slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#155DFC]">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Classificação
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Todos os clubes, com 3 pontos por vitória e 1 por empate.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/matches")}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova partida
        </button>
      </div>

      {/* Main content: Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Standings table */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
          {error ? (
            /* ESTADO: Erro ao carregar a classificação (E07) */
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <ListOrdered className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">
                Não foi possível carregar a classificação
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4 leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Loader2 className="w-3.5 h-3.5" />
                Tentar de novo
              </button>
            </div>
          ) : loading ? (
            /* ESTADO: Carregando Skeletons (E07) */
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-zinc-100" />
                    <div className="w-28 h-4 rounded bg-zinc-100" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-4 rounded bg-zinc-100" />
                    <div className="w-6 h-4 rounded bg-zinc-100" />
                    <div className="w-6 h-4 rounded bg-zinc-100" />
                    <div className="w-8 h-4 rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : standings.length === 0 ? (
            /* ESTADO: Nenhum clube cadastrado (E07) */
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <ListOrdered className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">
                Nenhum clube cadastrado
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                A classificação mostra todos os clubes, mesmo os que ainda não
                jogaram.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-400 text-[11px] font-semibold">
                  <th className="py-3 px-4 text-center font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Clube</th>
                  <th className="py-3 px-3 text-center font-medium">J</th>
                  <th className="py-3 px-3 text-center font-medium">V</th>
                  <th className="py-3 px-3 text-center font-medium">E</th>
                  <th className="py-3 px-3 text-center font-medium">D</th>
                  <th className="py-3 px-3 text-center font-medium">GP</th>
                  <th className="py-3 px-3 text-center font-medium">GC</th>
                  <th className="py-3 px-3 text-center font-medium">SG</th>
                  <th className="py-3 px-4 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {standings.map((s, idx) => (
                  <tr
                    key={s.club_id}
                    className={`hover:bg-zinc-50 transition-colors ${idx === 0 && s.points > 0 ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                          idx === 0 && s.points > 0
                            ? "bg-[#155DFC] text-white"
                            : "text-zinc-500"
                        }`}
                      >
                        {s.position}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-[9px] font-mono font-bold text-zinc-500">
                          {getAcronym(s.club_name, clubs)}
                        </span>
                        <button
                          onClick={() => {
                            const club = clubs.find(
                              (c) => c.name === s.club_name,
                            );
                            if (club) navigate(`/clubs/${club.id}`);
                          }}
                          className="font-bold text-zinc-900 hover:text-[#155DFC] transition-colors cursor-pointer text-left"
                        >
                          {s.club_name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.played}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.wins}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.draws}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.losses}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.goals_for}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.goals_against}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {s.goal_difference}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-[#155DFC]">
                      {s.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-zinc-100 text-[10px] text-zinc-400">
            J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols
            marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recent Matches */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-zinc-900">
              Últimas partidas
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5 mb-4">
              Da mais recente à mais antiga.
            </p>

            {recentMatches.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                Nenhuma partida jogada.
              </p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => (
                  <div key={m.id} className="text-xs">
                    <div className="text-[10px] text-zinc-400 mb-0.5">
                      {formatMatchDate(m.played_at)}
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                      <span
                        className={
                          m.home.goals > m.away.goals ? "font-black" : ""
                        }
                      >
                        {m.home.club_name}
                      </span>
                      <span className="font-black text-zinc-900 tabular-nums">
                        {m.home.goals}{" "}
                        <span className="text-zinc-300 font-medium">×</span>{" "}
                        {m.away.goals}
                      </span>
                      <span
                        className={
                          m.away.goals > m.home.goals ? "font-black" : ""
                        }
                      >
                        {m.away.club_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matches.length > 0 && (
              <button
                onClick={() => navigate("/matches")}
                className="flex items-center gap-1 mt-4 text-xs font-semibold text-[#155DFC] hover:text-[#1247CC] transition-colors cursor-pointer"
              >
                Ver todas as partidas
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tiebreaker criteria */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-zinc-900">Ordem da tabela</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5 mb-3">
              Critérios de classificação, nesta ordem.
            </p>
            <ol className="space-y-2">
              {[
                "Mais pontos",
                "Maior saldo de gols",
                "Mais gols marcados",
                "Nome do clube, de A a Z",
              ].map((criteria, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs">
                  <span className="w-5 h-5 rounded bg-zinc-100 text-zinc-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-700 font-medium">{criteria}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Classificação de 1 a {standings.length}, com os clubes sem partidas
        zerados. Pontos, saldo e posição são calculados a cada consulta, nunca
        gravados (RN21).
      </p>
    </div>
  );
}
