import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Swords,
  Lock,
  ChevronDown,
  Activity,
} from "lucide-react";
import { ClubDetail, ClubPlayer } from "../types/club.types";
import { clubsService } from "../services/clubs.service";

interface ClubLineupTabProps {
  club: ClubDetail;
  onLineupSaved: (formation: string, startersCount: number) => void;
}

type Formation = "3-1" | "2-2" | "2-1-1" | "1-2-1";

interface SlotDefinition {
  label: string;
  sublabel: string;
  allowedPositions: ("GOL" | "ZAG" | "LAT" | "MEI" | "ATA")[];
  role: "gol" | "def" | "mei" | "ata";
}

const FORMATIONS: {
  id: Formation;
  label: string;
  desc: string;
  slots: SlotDefinition[];
}[] = [
  {
    id: "3-1",
    label: "3-1",
    desc: "Defesa 3, ataque 1",
    slots: [
      {
        label: "Goleiro",
        sublabel: "GOL",
        allowedPositions: ["GOL"],
        role: "gol",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Ataque",
        sublabel: "ATA",
        allowedPositions: ["ATA"],
        role: "ata",
      },
    ],
  },
  {
    id: "2-2",
    label: "2-2",
    desc: "Defesa 2, ataque 2",
    slots: [
      {
        label: "Goleiro",
        sublabel: "GOL",
        allowedPositions: ["GOL"],
        role: "gol",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Ataque",
        sublabel: "ATA",
        allowedPositions: ["ATA"],
        role: "ata",
      },
      {
        label: "Ataque",
        sublabel: "ATA",
        allowedPositions: ["ATA"],
        role: "ata",
      },
    ],
  },
  {
    id: "2-1-1",
    label: "2-1-1",
    desc: "Defesa 2, meio 1, ataque 1",
    slots: [
      {
        label: "Goleiro",
        sublabel: "GOL",
        allowedPositions: ["GOL"],
        role: "gol",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Meio",
        sublabel: "MEI",
        allowedPositions: ["MEI"],
        role: "mei",
      },
      {
        label: "Ataque",
        sublabel: "ATA",
        allowedPositions: ["ATA"],
        role: "ata",
      },
    ],
  },
  {
    id: "1-2-1",
    label: "1-2-1",
    desc: "Defesa 1, meio 2, ataque 1",
    slots: [
      {
        label: "Goleiro",
        sublabel: "GOL",
        allowedPositions: ["GOL"],
        role: "gol",
      },
      {
        label: "Defesa",
        sublabel: "ZAG ou LAT",
        allowedPositions: ["ZAG", "LAT"],
        role: "def",
      },
      {
        label: "Meio",
        sublabel: "MEI",
        allowedPositions: ["MEI"],
        role: "mei",
      },
      {
        label: "Meio",
        sublabel: "MEI",
        allowedPositions: ["MEI"],
        role: "mei",
      },
      {
        label: "Ataque",
        sublabel: "ATA",
        allowedPositions: ["ATA"],
        role: "ata",
      },
    ],
  },
];

function getPlayerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPlayerLastName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || name;
}

export function ClubLineupTab({ club, onLineupSaved }: ClubLineupTabProps) {
  const [formation, setFormation] = useState<Formation>("2-1-1");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | null)[]>(
    [null, null, null, null, null],
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentFormationDef = useMemo(() => {
    return FORMATIONS.find((f) => f.id === formation) || FORMATIONS[2];
  }, [formation]);

  const [savedFormation, setSavedFormation] = useState<Formation | null>(null);
  const [savedStartersCount, setSavedStartersCount] = useState<number>(0);

  // Carregar escalação existente do clube da API
  useEffect(() => {
    let isMounted = true;
    async function loadLineup() {
      try {
        const res = await clubsService.getLineup(club.id);
        if (!isMounted) return;

        if (res && res.formation) {
          const form = res.formation as Formation;
          setFormation(form);
          setSavedFormation(form);
          const formDef =
            FORMATIONS.find((f) => f.id === form) || FORMATIONS[2];
          const newSlots: (number | null)[] = [null, null, null, null, null];

          // Distribuir os jogadores retornados nas vagas correspondentes
          const returnedPlayers: ClubPlayer[] = res.players || [];
          setSavedStartersCount(returnedPlayers.length);
          const usedIds = new Set<number>();

          formDef.slots.forEach((slot, slotIndex) => {
            const match = returnedPlayers.find(
              (p) =>
                !usedIds.has(p.id) &&
                slot.allowedPositions.includes(p.position),
            );
            if (match) {
              newSlots[slotIndex] = match.id;
              usedIds.add(match.id);
            }
          });

          setSelectedPlayerIds(newSlots);
        } else {
          // Auto-preenchimento inicial inteligente se não houver escalação salva
          autoFillSlots(formation);
        }
      } catch {
        autoFillSlots(formation);
      }
    }

    loadLineup();
    return () => {
      isMounted = false;
    };
  }, [club.id]);

  function autoFillSlots(targetFormation: Formation) {
    const formDef =
      FORMATIONS.find((f) => f.id === targetFormation) || FORMATIONS[2];
    const newSlots: (number | null)[] = [null, null, null, null, null];
    const usedIds = new Set<number>();

    formDef.slots.forEach((slot, slotIdx) => {
      const match = club.players.find(
        (p) =>
          !usedIds.has(p.id) &&
          p.condition !== "DOENTE" &&
          slot.allowedPositions.includes(p.position),
      );
      if (match) {
        newSlots[slotIdx] = match.id;
        usedIds.add(match.id);
      }
    });

    setSelectedPlayerIds(newSlots);
  }

  function handleFormationChange(newForm: Formation) {
    setFormation(newForm);
    setErrorMessage(null);
    autoFillSlots(newForm);
  }

  function handleSelectPlayer(slotIndex: number, playerId: number | null) {
    setErrorMessage(null);
    setSelectedPlayerIds((prev) => {
      const copy = [...prev];
      copy[slotIndex] = playerId;
      return copy;
    });
  }

  // Identificar jogadores escalados e reservas
  const starterPlayers = useMemo(() => {
    return selectedPlayerIds.map((id) =>
      id ? club.players.find((p) => p.id === id) || null : null,
    );
  }, [selectedPlayerIds, club.players]);

  const starterIdsSet = useMemo(() => {
    return new Set(selectedPlayerIds.filter((id): id is number => id !== null));
  }, [selectedPlayerIds]);

  const reservePlayers = useMemo(() => {
    return club.players.filter((p) => !starterIdsSet.has(p.id));
  }, [club.players, starterIdsSet]);

  const isComplete =
    selectedPlayerIds.every((id) => id !== null) &&
    selectedPlayerIds.length === 5;

  // Jogadores mal condicionados entre os titulares (C06 / C10)
  const illConditionedStarters = useMemo(() => {
    return starterPlayers.filter(
      (p): p is ClubPlayer => p !== null && p.condition === "MAL_CONDICIONADO",
    );
  }, [starterPlayers]);

  const hasSickStarter = useMemo(() => {
    return starterPlayers.some((p) => p && p.condition === "DOENTE");
  }, [starterPlayers]);

  async function handleSave() {
    setErrorMessage(null);

    if (!isComplete) {
      setErrorMessage(
        "A escalação precisa ter exatamente 5 titulares selecionados.",
      );
      return;
    }

    const playerIds = selectedPlayerIds.filter(
      (id): id is number => id !== null,
    );

    try {
      setSaving(true);
      await clubsService.updateLineup(club.id, formation, playerIds);
      onLineupSaved(formation, 5);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "A escalação foi recusada.";
      setErrorMessage(Array.isArray(msg) ? msg.join(" | ") : msg);
    } finally {
      setSaving(false);
    }
  }

  function getUsedAttributes(player: ClubPlayer) {
    if (player.position === "GOL") {
      return `Defesa ${player.defending}`;
    }
    if (player.position === "ZAG") {
      return `Defesa ${player.defending}`;
    }
    if (player.position === "LAT") {
      return `Drible ${player.dribbling} Defesa ${player.defending}`;
    }
    if (player.position === "MEI") {
      return `Passe ${player.passing}`;
    }
    if (player.position === "ATA") {
      return `Finalização ${player.shooting}`;
    }
    return "";
  }

  // Diagnóstico para o alerta de escalação incompleta (C07 / C11)
  const incompleteDetails = useMemo(() => {
    const sickList = club.players.filter((p) => p.condition === "DOENTE");
    const fitOutfield = club.players.filter(
      (p) => p.position !== "GOL" && p.condition !== "DOENTE",
    );
    const hasSoldStarter = savedFormation && savedStartersCount < 5;

    if (hasSoldStarter) {
      const sickStr =
        sickList.length > 0
          ? `Com o ${sickList.map((p) => p.name).join(" e ")} DOENTE, `
          : "";
      return {
        title: `Escalação incompleta: o ${club.name} não pode jogar partidas`,
        desc: `Um titular anterior saiu da escalação: a ${formation} continua salva, com ${savedStartersCount} titulares. ${sickStr}sobram ${fitOutfield.length} jogadores de linha que podem ser escalados, e nenhuma formação fecha: o clube precisa comprar um jogador e escalar de novo.`,
      };
    }

    return {
      title: `Escalação incompleta: o ${club.name} não pode jogar partidas`,
      desc: `O elenco tem ${club.players.length} jogadores, e a escalação precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e salve a escalação com os 5 titulares.`,
    };
  }, [club, savedFormation, savedStartersCount, formation]);

  return (
    <div className="space-y-4 font-sans text-zinc-900">
      {/* Grid: Coluna Principal (Titulares e Seletor) + Coluna Direita (Campo & Reservas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Formulário de Escalação (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-5">
          {/* Header Titulares */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Titulares</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar
                troca os 5 de uma vez.
              </p>
            </div>
            {isComplete ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Completa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Incompleta
              </span>
            )}
          </div>

          {/* C07 / C11: Alerta amarelo posicionado dentro do card de Titulares */}
          {!isComplete && (
            <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs animate-slide-up">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-800 leading-relaxed">
                <span className="font-bold">{incompleteDetails.title}</span>
                <p className="mt-0.5 text-amber-700">
                  {incompleteDetails.desc}
                </p>
              </div>
            </div>
          )}

          {/* C10: Alerta de erro caso a API recuse a escalação */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-800">
                  A escalação foi recusada
                </div>
                <div className="mt-0.5 text-red-600">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Seletor de Formações (C06 / C07) */}
          <div>
            <label className="text-xs font-bold text-zinc-800 block mb-1">
              Formação
            </label>
            <p className="text-[11px] text-zinc-400 mb-3">
              Os números contam os jogadores de linha de trás para frente. O
              goleiro fica fora da conta.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FORMATIONS.map((f) => {
                const isSelected = formation === f.id;
                return (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => handleFormationChange(f.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#155DFC] bg-blue-50/40 ring-1 ring-[#155DFC]/30"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {/* Mini campinho icônico */}
                    <div className="w-7 h-9 rounded bg-[#105E32] flex flex-col justify-between p-1 shrink-0 border border-[#0d4d29]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 mx-auto" />
                      <div className="w-full h-px bg-white/30" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 mx-auto" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-[#155DFC] bg-[#155DFC]"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1 h-1 rounded-full bg-white" />
                          )}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          {f.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                        {f.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabela de Vagas da Escalação */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 text-[11px] font-semibold">
                  <th className="text-left py-2 font-medium">Vaga</th>
                  <th className="text-left py-2 font-medium">Titular</th>
                  <th className="text-left py-2 font-medium">Condição</th>
                  <th className="text-center py-2 font-medium">Overall</th>
                  <th className="text-left py-2 font-medium">
                    Atributos usados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentFormationDef.slots.map((slot, slotIdx) => {
                  const selectedId = selectedPlayerIds[slotIdx];
                  const selectedPlayer = selectedId
                    ? club.players.find((p) => p.id === selectedId) || null
                    : null;

                  // Jogadores disponíveis para esta vaga
                  const availableForSlot = club.players.filter((p) => {
                    if (!slot.allowedPositions.includes(p.position))
                      return false;
                    // Se já estiver selecionado em outro slot, não permite duplicar
                    const usedInOtherSlot = selectedPlayerIds.some(
                      (id, i) => i !== slotIdx && id === p.id,
                    );
                    return !usedInOtherSlot;
                  });

                  return (
                    <tr
                      key={slotIdx}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      {/* Vaga */}
                      <td className="py-2.5 pr-2">
                        <div className="font-bold text-zinc-900">
                          {slot.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {slot.sublabel}
                        </div>
                      </td>

                      {/* Select do Titular */}
                      <td className="py-2.5 pr-3">
                        <div className="relative min-w-[190px]">
                          <select
                            value={selectedId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                                ? Number(e.target.value)
                                : null;
                              handleSelectPlayer(slotIdx, val);
                            }}
                            className={`w-full h-8 pl-2.5 pr-7 bg-white border rounded-lg text-xs font-semibold appearance-none focus:outline-none cursor-pointer ${
                              !selectedId
                                ? "border-amber-300 text-zinc-400 bg-amber-50/30"
                                : "border-zinc-200 text-zinc-800"
                            }`}
                          >
                            <option value="">
                              {availableForSlot.length === 0
                                ? `Sem ${slot.sublabel} no elenco`
                                : `Selecionar ${slot.sublabel}...`}
                            </option>
                            {availableForSlot.map((p) => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={p.condition === "DOENTE"}
                              >
                                {p.name} ({p.position}){" "}
                                {p.condition === "DOENTE" ? "· Doente 🔒" : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Condição */}
                      <td className="py-2.5 pr-2">
                        {selectedPlayer ? (
                          selectedPlayer.condition === "APTO" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Apto
                            </span>
                          ) : selectedPlayer.condition ===
                            "MAL_CONDICIONADO" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Mal condicionado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Doente
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Overall */}
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-800">
                        {selectedPlayer ? selectedPlayer.overall : "-"}
                      </td>

                      {/* Atributos Usados */}
                      <td className="py-2.5 pl-2 text-zinc-600 font-medium">
                        {selectedPlayer
                          ? getUsedAttributes(selectedPlayer)
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aviso âmbar se houver mal condicionados (C06) */}
          {illConditionedStarters.length > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {illConditionedStarters.map((p) => p.name).join(" e ")}{" "}
                  {illConditionedStarters.length > 1
                    ? "estão mal condicionados"
                    : "está mal condicionado"}
                </span>
                <p className="mt-0.5 text-amber-700">
                  Podem jogar, mas cada atributo vale 15% a menos durante a
                  partida.
                </p>
              </div>
            </div>
          )}

          {/* Rodapé e Botões de Ação */}
          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-400 max-w-sm leading-relaxed">
              A escalação vale até ser trocada. Titular vendido ou que fica
              doente sai dela, e o clube só volta a jogar depois de escalar de
              novo.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => autoFillSlots(formation)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isComplete || hasSickStarter}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {saving ? "Salvando..." : "Salvar escalação"}
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Em campo (Campinho Tático) + Reservas (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Em campo (C06 / C07) */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-zinc-900">Em campo</h4>
            <p className="text-[11px] text-zinc-400 mb-3">
              {savedFormation && !isComplete
                ? `Prévia da formação ${formation} salva; a vaga vazia fica tracejada.`
                : !isComplete
                  ? `Prévia da formação ${formation}; as vagas vazias ficam tracejadas.`
                  : `Prévia da formação ${formation}, do goleiro ao ataque.`}
            </p>

            {/* Campinho Tático Fiel ao Figma */}
            <div className="w-full aspect-[4/5] min-h-[440px] bg-[#0E512A] rounded-2xl p-4 relative flex flex-col justify-between border border-[#0A3D20] shadow-sm overflow-hidden select-none">
              {/* Faixas de grama alternadas verticais/horizontais sutis */}
              <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
                <div className="flex-1 bg-black/10" />
                <div className="flex-1 bg-transparent" />
                <div className="flex-1 bg-black/10" />
                <div className="flex-1 bg-transparent" />
                <div className="flex-1 bg-black/10" />
                <div className="flex-1 bg-transparent" />
              </div>

              {/* Linhas demarcatórias brancas do campo */}
              {/* Linha externa perimetral */}
              <div className="absolute inset-4 border border-white/40 rounded-lg pointer-events-none" />

              {/* Linha de meio-campo */}
              <div className="absolute top-1/2 left-4 right-4 h-px bg-white/40 -translate-y-1/2 pointer-events-none" />

              {/* Círculo central */}
              <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border border-white/40 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              {/* Área do Goleiro (Inferior) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-44 h-16 border border-white/40 border-b-0 pointer-events-none" />
              {/* Pequena área do Goleiro */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-6 border border-white/40 border-b-0 pointer-events-none" />
              {/* Semicírculo da área inferior */}
              <div className="absolute bottom-[79px] left-1/2 -translate-x-1/2 w-16 h-8 border border-white/40 border-b-0 rounded-t-full pointer-events-none" />

              {/* Cantos (Corner arcs) */}
              <div className="absolute top-4 left-4 w-3 h-3 border-r border-b border-white/40 rounded-br-full pointer-events-none" />
              <div className="absolute top-4 right-4 w-3 h-3 border-l border-b border-white/40 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-3 h-3 border-r border-t border-white/40 rounded-tr-full pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-3 h-3 border-l border-t border-white/40 rounded-tl-full pointer-events-none" />

              {/* Ataque (Topo) */}
              <div className="relative z-10 flex justify-center items-center gap-10 pt-3">
                {currentFormationDef.slots
                  .map((slot, idx) => ({
                    slot,
                    idx,
                    player: starterPlayers[idx],
                  }))
                  .filter((s) => s.slot.role === "ata")
                  .map(({ idx, player }) => (
                    <PlayerOnPitch
                      key={idx}
                      player={player}
                      defaultLabel="Ataque"
                    />
                  ))}
              </div>

              {/* Meio (Centro) */}
              <div className="relative z-10 flex justify-center items-center gap-10">
                {currentFormationDef.slots
                  .map((slot, idx) => ({
                    slot,
                    idx,
                    player: starterPlayers[idx],
                  }))
                  .filter((s) => s.slot.role === "mei")
                  .map(({ idx, player }) => (
                    <PlayerOnPitch
                      key={idx}
                      player={player}
                      defaultLabel="Meio"
                    />
                  ))}
              </div>

              {/* Defesa */}
              <div className="relative z-10 flex justify-center items-center gap-14">
                {currentFormationDef.slots
                  .map((slot, idx) => ({
                    slot,
                    idx,
                    player: starterPlayers[idx],
                  }))
                  .filter((s) => s.slot.role === "def")
                  .map(({ idx, player }) => (
                    <PlayerOnPitch
                      key={idx}
                      player={player}
                      defaultLabel="Defesa"
                    />
                  ))}
              </div>

              {/* Goleiro (Base) */}
              <div className="relative z-10 flex justify-center items-center pb-2">
                {currentFormationDef.slots
                  .map((slot, idx) => ({
                    slot,
                    idx,
                    player: starterPlayers[idx],
                  }))
                  .filter((s) => s.slot.role === "gol")
                  .map(({ idx, player }) => (
                    <PlayerOnPitch
                      key={idx}
                      player={player}
                      defaultLabel="Goleiro"
                    />
                  ))}
              </div>
            </div>

            {/* Regra tática de partida */}
            <div className="flex items-start gap-2 pt-3 mt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
              <Swords className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Na partida, atacam os 3 jogadores de linha mais avançados e
                defendem o goleiro e os 2 mais recuados. É gol quando o ataque é
                maior que a defesa.
              </p>
            </div>
          </div>

          {/* Card Reservas (C06 / C07) */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-zinc-900">Reservas</h4>
            <p className="text-[11px] text-zinc-400 mb-3">
              Jogadores do elenco fora da escalação.
            </p>

            {reservePlayers.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-3 text-center">
                Nenhum reserva: os {club.players.length} jogadores do elenco
                estão escolhidos.
              </p>
            ) : (
              <div className="space-y-2">
                {reservePlayers.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                        {getPlayerInitials(res.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-800 truncate max-w-[120px]">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {res.position}
                        </div>
                      </div>
                    </div>
                    {res.condition === "DOENTE" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium">
                        <Lock className="w-3 h-3 text-red-500" />
                        Doente
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">
                        {res.condition}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper para renderizar a vaga / jogador no campinho idêntico ao Figma */
function PlayerOnPitch({
  player,
  defaultLabel,
}: {
  player: ClubPlayer | null;
  defaultLabel: string;
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/60 bg-black/20 flex items-center justify-center text-white/90 font-bold text-xs shadow-xs">
          +
        </div>
        <div className="mt-1.5 px-3 py-0.5 rounded-full bg-[#082F18]/90 border border-white/20 text-[11px] font-medium text-white/80">
          {defaultLabel}
        </div>
      </div>
    );
  }

  const initials = getPlayerInitials(player.name);
  const lastName = getPlayerLastName(player.name);
  const isMal = player.condition === "MAL_CONDICIONADO";

  return (
    <div className="flex flex-col items-center relative group">
      {/* Círculo do Jogador Azul Royal com borda branca espessa */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
          {initials}
        </div>

        {/* Ícone de Condição Física (Coração Laranja com linha de eletrocardiograma) */}
        {isMal && (
          <div
            title="Mal condicionado (-15%)"
            className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center border-2 border-white shadow-xs"
          >
            <Activity className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Pill escuro arredondado com o sobrenome do jogador */}
      <div className="mt-1.5 px-3 py-0.5 rounded-full bg-[#082F18]/95 border border-white/20 text-[11px] font-semibold text-white tracking-wide shadow-xs max-w-[84px] truncate text-center">
        {lastName}
      </div>
    </div>
  );
}
