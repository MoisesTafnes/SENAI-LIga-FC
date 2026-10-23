import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  Activity,
  Loader2,
  Check,
  Minus,
} from 'lucide-react';
import { api } from '../services/api';

interface DuelPlayer {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
}

interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
}

interface MatchTeam {
  club_id: number;
  club_name: string;
  formation: string;
  goals: number;
}

interface MatchDetail {
  id: number;
  played_at: string;
  home: MatchTeam;
  away: MatchTeam;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
  duels: Duel[];
}

function getPlayerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPlayerLastName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || name;
}

function formatMatchDate(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${h}:${m}`;
}

function resultLabel(result: string): string {
  if (result === 'MANDANTE') return 'Vitória do mandante';
  if (result === 'VISITANTE') return 'Vitória do visitante';
  return 'Empate';
}

function attributeLabel(attr: string): string {
  if (attr === 'shooting') return 'Finalização';
  if (attr === 'passing') return 'Passe';
  if (attr === 'dribbling') return 'Drible';
  if (attr === 'defending') return 'Defesa';
  return attr;
}

function positionLabel(pos: string): string {
  return pos;
}

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    async function loadMatch() {
      try {
        setLoading(true);
        const res = await api.get(`/matches/${id}`);
        setMatch(res.data);
      } catch (err: any) {
        setError(err.message || 'Partida não encontrada.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadMatch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/matches')}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para partidas
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-sm">
          {error || 'Partida não encontrada.'}
        </div>
      </div>
    );
  }

  const homeDuels = match.duels.filter((d) => d.attacking_club_id === match.home.club_id);
  const awayDuels = match.duels.filter((d) => d.attacking_club_id === match.away.club_id);
  const homeGoals = homeDuels.filter((d) => d.goal).length;
  const awayGoals = awayDuels.filter((d) => d.goal).length;

  // Build a deduped list of all players from duels for pitch display
  const allDuelPlayers = new Map<number, { name: string; position: string; condition: string; team: 'home' | 'away' }>();
  match.duels.forEach((d) => {
    const atkTeam = d.attacking_club_id === match.home.club_id ? 'home' : 'away';
    const defTeam = atkTeam === 'home' ? 'away' : 'home';
    if (!allDuelPlayers.has(d.attacker.player_id)) {
      allDuelPlayers.set(d.attacker.player_id, {
        name: d.attacker.player_name,
        position: d.attacker.position,
        condition: d.attacker.condition,
        team: atkTeam,
      });
    }
    if (!allDuelPlayers.has(d.defender.player_id)) {
      allDuelPlayers.set(d.defender.player_id, {
        name: d.defender.player_name,
        position: d.defender.position,
        condition: d.defender.condition,
        team: defTeam,
      });
    }
  });

  // Get home team acronym
  function getAcronymFromName(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts.map(p => p[0]).join('').substring(0, 3).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
  }

  const homeAcronym = getAcronymFromName(match.home.club_name);
  const awayAcronym = getAcronymFromName(match.away.club_name);

  // Build pitch lineup from duels data (5 per team, ordered by position)
  function buildPitchPlayers(team: 'home' | 'away') {
    const players: { name: string; position: string; condition: string; initials: string; attribute?: string; value?: number }[] = [];
    const seenIds = new Set<number>();

    match!.duels.forEach((d) => {
      const atkTeam = d.attacking_club_id === match!.home.club_id ? 'home' : 'away';
      const defTeam = atkTeam === 'home' ? 'away' : 'home';

      if (atkTeam === team && !seenIds.has(d.attacker.player_id)) {
        seenIds.add(d.attacker.player_id);
        players.push({
          name: d.attacker.player_name,
          position: d.attacker.position,
          condition: d.attacker.condition,
          initials: getPlayerInitials(d.attacker.player_name),
          attribute: attributeLabel(d.attacker.attribute),
          value: d.attacker.value,
        });
      }
      if (defTeam === team && !seenIds.has(d.defender.player_id)) {
        seenIds.add(d.defender.player_id);
        players.push({
          name: d.defender.player_name,
          position: d.defender.position,
          condition: d.defender.condition,
          initials: getPlayerInitials(d.defender.player_name),
          attribute: attributeLabel(d.defender.attribute),
          value: d.defender.value,
        });
      }
    });

    // Sort: GOL first, then by position order
    const posOrder: Record<string, number> = { GOL: 0, ZAG: 1, LAT: 2, MEI: 3, ATA: 4 };
    players.sort((a, b) => (posOrder[a.position] ?? 5) - (posOrder[b.position] ?? 5));
    return players;
  }

  const homePitchPlayers = buildPitchPlayers('home');
  const awayPitchPlayers = buildPitchPlayers('away');

  return (
    <div className="space-y-6 font-sans">
      {/* Back link */}
      <button
        onClick={() => navigate('/matches')}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para partidas
      </button>

      {/* Toast notification */}
      {showToast && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-fade-in relative">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900">Partida jogada</div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {match.home.club_name} {match.home.goals} × {match.away.goals} {match.away.club_name}. Placar e duelos
              devolvidos pela API.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Match score header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-center gap-8">
          {/* Home */}
          <div className="text-right">
            <div className="font-bold text-zinc-900 text-base">{match.home.club_name}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Mandante · {match.home.formation}
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-500">
            {homeAcronym}
          </span>

          {/* Score */}
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
              {match.home.goals}{' '}
              <span className="text-zinc-300 font-medium">×</span>{' '}
              {match.away.goals}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1.5">{formatMatchDate(match.played_at)}</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
              {resultLabel(match.result)}
            </div>
          </div>

          <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-500">
            {awayAcronym}
          </span>
          {/* Away */}
          <div className="text-left">
            <div className="font-bold text-zinc-900 text-base">{match.away.club_name}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Visitante · {match.away.formation}
            </div>
          </div>
        </div>
      </div>

      {/* Em campo - Pitch Visualization */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Em campo</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Titulares de cada clube na formação da partida e os valores usados nos duelos, já com o efeito da condição.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EA580C] flex items-center justify-center">
                <Activity className="w-2 h-2 text-white" />
              </span>
              Mal condicionado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-zinc-400 flex items-center justify-center">
                <Minus className="w-2 h-2 text-white" />
              </span>
              Out no duelo
            </span>
          </div>
        </div>

        {/* Pitch */}
        <div className="w-full aspect-[16/7] min-h-[300px] bg-[#0E512A] rounded-2xl p-4 relative border border-[#0A3D20] shadow-sm overflow-hidden select-none">
          {/* Grass stripes */}
          <div className="absolute inset-0 flex pointer-events-none opacity-15">
            <div className="flex-1 bg-black/15" />
            <div className="flex-1 bg-transparent" />
            <div className="flex-1 bg-black/15" />
            <div className="flex-1 bg-transparent" />
            <div className="flex-1 bg-black/15" />
            <div className="flex-1 bg-transparent" />
            <div className="flex-1 bg-black/15" />
            <div className="flex-1 bg-transparent" />
          </div>

          {/* Field lines */}
          <div className="absolute inset-4 border border-white/40 rounded-lg pointer-events-none" />
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/40 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border border-white/40 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Goal areas */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-32 border border-white/40 border-l-0 pointer-events-none" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-16 border border-white/40 border-l-0 pointer-events-none" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-32 border border-white/40 border-r-0 pointer-events-none" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-16 border border-white/40 border-r-0 pointer-events-none" />

          {/* Team label - Home (left) */}
          <div className="absolute top-4 left-6 z-20 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold text-white/90 tracking-wide">
              {homeAcronym} {match.home.club_name} · {match.home.formation} · ataca →
            </span>
          </div>

          {/* Team label - Away (right) */}
          <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold text-white/90 tracking-wide">
              {awayAcronym} {match.away.club_name} · {match.away.formation} · ataca ←
            </span>
          </div>

          {/* Home team players (left side) */}
          <div className="absolute left-6 top-14 bottom-6 w-[45%] flex items-center justify-around z-10">
            {homePitchPlayers.map((p, idx) => (
              <PitchPlayer key={idx} player={p} team="home" />
            ))}
          </div>

          {/* Away team players (right side) */}
          <div className="absolute right-6 top-14 bottom-6 w-[45%] flex items-center justify-around z-10">
            {awayPitchPlayers.map((p, idx) => (
              <PitchPlayer key={idx} player={p} team="away" />
            ))}
          </div>
        </div>
      </div>

      {/* Duelos */}
      <div>
        <h2 className="text-sm font-bold text-zinc-900 mb-1">Duelos</h2>
        <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed max-w-2xl">
          Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de linha vão do 1° (o mais recuado) ao 4° (o mais avançado), pela ordem do elenco: o 4° ataca o goleiro, o 3° ataca o 1° e o 2° ataca o 2°.
        </p>

        <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 text-[11px] font-semibold bg-zinc-50/50">
                <th className="text-center py-2.5 px-3 font-medium">Duelo</th>
                <th className="text-left py-2.5 px-3 font-medium">Atacante</th>
                <th className="text-center py-2.5 px-3 font-medium">Ataque</th>
                <th className="text-left py-2.5 px-3 font-medium">Defensor</th>
                <th className="text-center py-2.5 px-3 font-medium">Defesa</th>
                <th className="text-center py-2.5 px-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {/* Home attacks header */}
              <tr className="bg-zinc-50/80">
                <td colSpan={5} className="py-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-[9px] font-mono font-bold text-zinc-600">
                      {homeAcronym}
                    </span>
                    Ataques do {match.home.club_name} (mandante)
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-[10px] font-bold text-zinc-500">
                  {homeGoals} gol{homeGoals !== 1 ? 's' : ''}
                </td>
              </tr>

              {homeDuels.map((d) => (
                <DuelRow key={d.order} duel={d} />
              ))}

              {/* Away attacks header */}
              <tr className="bg-zinc-50/80">
                <td colSpan={5} className="py-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-[9px] font-mono font-bold text-zinc-600">
                      {awayAcronym}
                    </span>
                    Ataques do {match.away.club_name} (visitante)
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-[10px] font-bold text-zinc-500">
                  {awayGoals} gol{awayGoals !== 1 ? 's' : ''}
                </td>
              </tr>

              {awayDuels.map((d) => (
                <DuelRow key={d.order} duel={d} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Mesma tela logo depois de jogar e ao abrir uma partida do histórico, com as formações dos dois clubes e os 6 duelos.
        Os valores e a condição de cada titular vêm gravados nos duelos devolvidos pela API;
        mal condicionado joga com 15% a menos (RN20).
      </p>
    </div>
  );
}

/* ---- Sub-components ---- */

function PitchPlayer({
  player,
  team,
}: {
  player: { name: string; position: string; condition: string; initials: string; attribute?: string; value?: number };
  team: 'home' | 'away';
}) {
  const isMal = player.condition === 'MAL_CONDICIONADO';
  const lastName = getPlayerLastName(player.name);

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md ${
          team === 'home' ? 'bg-[#155DFC] text-white' : 'bg-white text-zinc-800'
        }`}>
          {player.initials}
        </div>
        {isMal && (
          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Activity className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <div className="mt-1 px-2 py-0.5 rounded-full bg-[#082F18]/95 border border-white/20 text-[9px] font-semibold text-white tracking-wide shadow-xs text-center max-w-[72px] truncate">
        {lastName}
      </div>
      <div className="text-[8px] text-white/70 font-mono mt-0.5 text-center">
        {player.position} · {player.attribute || 'Def'} {player.value}
      </div>
    </div>
  );
}

function DuelRow({ duel }: { duel: Duel }) {
  const atkInitials = getPlayerInitials(duel.attacker.player_name);
  const defInitials = getPlayerInitials(duel.defender.player_name);

  return (
    <tr className="hover:bg-zinc-50/50 transition-colors">
      <td className="py-3 px-3 text-center">
        <span className="font-bold text-zinc-800">{duel.order}</span>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-blue-50 text-[#155DFC] font-bold text-[10px] flex items-center justify-center border border-blue-100 shrink-0">
            {atkInitials}
          </span>
          <div>
            <div className="font-semibold text-zinc-900">{duel.attacker.player_name}</div>
            <div className="text-[10px] text-zinc-400">
              {positionLabel(duel.attacker.position)}, {getLineNumber(duel.attacker.position)} de linha · {getClubLabel(duel)}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <div className="font-mono font-bold text-zinc-800">
          {attributeLabel(duel.attacker.attribute)}{' '}
          <span className="text-base font-black">{duel.attacker.value}</span>
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center justify-center border border-purple-100 shrink-0">
            {defInitials}
          </span>
          <div>
            <div className="font-semibold text-zinc-900">{duel.defender.player_name}</div>
            <div className="text-[10px] text-zinc-400">
              {positionLabel(duel.defender.position)}, {getLineNumber(duel.defender.position)} de linha
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="font-mono font-bold text-zinc-800">
          Defesa <span className="text-base font-black">{duel.defender.value}</span>
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        {duel.goal ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
            ⚽ Gol
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium">
            Sem gol
          </span>
        )}
      </td>
    </tr>
  );
}

function getLineNumber(position: string): string {
  const lineMap: Record<string, string> = {
    GOL: 'Goleiro',
    ZAG: '1°',
    LAT: '2°',
    MEI: '3°',
    ATA: '4°',
  };
  return lineMap[position] || position;
}

function getClubLabel(_duel: Duel): string {
  return '';
}
