import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  BarChart2,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { playersService } from "../services/players.service";
import { clubsService } from "../../clubs/services/clubs.service";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { Player, PlayerPosition } from "../types/player.types";

const POSITIONS: { key: PlayerPosition; label: string; desc: string }[] = [
  { key: "GOL", label: "GOL", desc: "Goleiro" },
  { key: "ZAG", label: "ZAG", desc: "Zagueiro" },
  { key: "LAT", label: "LAT", desc: "Lateral" },
  { key: "MEI", label: "MEI", desc: "Meio-campo" },
  { key: "ATA", label: "ATA", desc: "Atacante" },
];

const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meio-campo",
  ATA: "Atacante",
};

interface CreateResult {
  name: string;
  base_value: number;
  market_value: number;
  overall: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   J05 + J06 · Novo jogador  (cadastro + validação inline)
───────────────────────────────────────────────────────────────────────────── */
export function CreatePlayerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    position: "MEI" as PlayerPosition,
    age: 23,
    agility: 70,
    pace: 66,
    shooting: 62,
    passing: 74,
    dribbling: 70,
    defending: 48,
    physical: 58,
    potential: 82,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const maxAgilityAllowed = formData.age >= 35 ? 85 : 100;

  const technicalList = [
    { label: "Velocidade", val: formData.pace, key: "pace" as const },
    { label: "Finalização", val: formData.shooting, key: "shooting" as const },
    { label: "Passe", val: formData.passing, key: "passing" as const },
    { label: "Drible", val: formData.dribbling, key: "dribbling" as const },
    { label: "Defesa", val: formData.defending, key: "defending" as const },
    { label: "Físico", val: formData.physical, key: "physical" as const },
  ];

  const attributeSum = technicalList.reduce((s, t) => s + t.val, 0);
  const maxTechnical = Math.max(...technicalList.map((t) => t.val));

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const nameParts = formData.name.trim().split(/\s+/);

    if (
      formData.name.length < 3 ||
      formData.name.length > 100 ||
      nameParts.length < 2
    ) {
      errors.name = "Use de 3 a 100 caracteres, com pelo menos duas palavras.";
    } else if (/\d/.test(formData.name)) {
      errors.name = "O nome não pode conter números.";
    }

    if (formData.age < 16 || formData.age > 45) {
      errors.age = "Use uma idade de 16 a 45 anos.";
    }

    if (formData.agility < 1 || formData.agility > maxAgilityAllowed) {
      errors.agility = `Use um valor de 1 a ${maxAgilityAllowed}.`;
    }

    for (const t of technicalList) {
      if (t.val < 1 || t.val > 99) {
        errors[t.key] = "Use um valor de 1 a 99.";
      }
    }

    if (attributeSum > 480) {
      errors.sum = `Soma dos atributos (${attributeSum}) não pode ultrapassar 480.`;
    }

    if (
      !formData.potential ||
      formData.potential < 1 ||
      formData.potential > 99
    ) {
      errors.potential = "Informe o potencial.";
    } else if (formData.age >= 33 && formData.potential !== maxTechnical) {
      errors.potential = `Com 33+ anos, potencial deve ser igual ao maior atributo (${maxTechnical}).`;
    } else if (formData.potential < maxTechnical) {
      errors.potential = `Potencial deve ser ≥ maior atributo (${maxTechnical}).`;
    }

    return errors;
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    try {
      setLoading(true);
      const data = await playersService.createPlayer(formData);
      setResult({
        name: formData.name,
        base_value: data.base_value,
        market_value: data.market_value,
        overall: data.overall,
      });
      onSuccess();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao cadastrar jogador.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setFieldErrors({});
    setSubmitError(null);
    onClose();
  }

  // J07 – Modal de sucesso
  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-[#008832]" />
              <h2 className="text-base font-bold text-zinc-900">
                Jogador cadastrado
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-500 mb-5">
            {result.name} entrou livre e Apto. Valores em moedas, calculados
            pela API ao salvar.
          </p>

          <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 mb-5">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-zinc-800">
                  Valor base
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Calculado no cadastro; não muda depois
                </div>
              </div>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {result.base_value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-zinc-800">
                  Valor de mercado
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Com condição, agilidade e idade
                </div>
              </div>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {result.market_value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-zinc-800">
                  Overall
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Pelos pesos da posição {POSITION_LABELS[formData.position]}
                </div>
              </div>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {result.overall}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver detalhes</span>
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] rounded-lg shadow-xs cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Novo jogador</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {hasErrors
                ? "Corrija os campos destacados para salvar."
                : "Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              placeholder="Ex: Davi Melo"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name)
                  setFieldErrors({ ...fieldErrors, name: "" });
              }}
              className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                fieldErrors.name
                  ? "border-[#E4001B] focus:border-[#E4001B] focus:ring-[#E4001B]/20"
                  : "border-zinc-200 focus:border-[#155DFC] focus:ring-[#155DFC]/20"
              }`}
            />
            {fieldErrors.name ? (
              <p className="text-[11px] text-[#E4001B] mt-1 flex items-center gap-1">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#E4001B] text-white text-center leading-none text-[9px] font-bold flex-shrink-0">
                  !
                </span>
                {fieldErrors.name}
              </p>
            ) : (
              <span className="text-[11px] text-zinc-400 mt-1 block">
                De 3 a 100 caracteres, com pelo menos duas palavras e sem
                números.
              </span>
            )}
          </div>

          {/* Posição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Posição
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {POSITIONS.map((pos) => {
                const isSelected = formData.position === pos.key;
                return (
                  <button
                    key={pos.key}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, position: pos.key })
                    }
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#155DFC] bg-blue-50/40 text-[#155DFC] ring-1 ring-[#155DFC]"
                        : "border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white"
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">
                      {pos.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">
                      {pos.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Idade + Agilidade + Valor base */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Idade
              </label>
              <input
                type="number"
                min={16}
                max={45}
                value={formData.age}
                onChange={(e) => {
                  setFormData({ ...formData, age: Number(e.target.value) });
                  if (fieldErrors.age)
                    setFieldErrors({ ...fieldErrors, age: "" });
                }}
                className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none ${
                  fieldErrors.age
                    ? "border-[#E4001B] focus:border-[#E4001B]"
                    : "border-zinc-200 focus:border-[#155DFC]"
                }`}
              />
              {fieldErrors.age ? (
                <p className="text-[11px] text-[#E4001B] mt-1 flex items-center gap-1">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#E4001B] text-white text-center leading-none text-[9px] font-bold flex-shrink-0">
                    !
                  </span>
                  {fieldErrors.age}
                </p>
              ) : (
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  De 16 a 45 anos.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Agilidade
              </label>
              <input
                type="number"
                min={1}
                max={maxAgilityAllowed}
                value={formData.agility}
                onChange={(e) => {
                  setFormData({ ...formData, agility: Number(e.target.value) });
                  if (fieldErrors.agility)
                    setFieldErrors({ ...fieldErrors, agility: "" });
                }}
                className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none ${
                  fieldErrors.agility
                    ? "border-[#E4001B] focus:border-[#E4001B]"
                    : "border-zinc-200 focus:border-[#155DFC]"
                }`}
              />
              {fieldErrors.agility ? (
                <p className="text-[11px] text-[#E4001B] mt-1 flex items-center gap-1">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#E4001B] text-white text-center leading-none text-[9px] font-bold flex-shrink-0">
                    !
                  </span>
                  {fieldErrors.agility}
                </p>
              ) : (
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  De 1 a 100 (até 85 com 35 anos ou mais).
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Valor base (moedas)
              </label>
              <div className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-1.5 text-zinc-400">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Após salvar</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Calculado no cadastro.
              </span>
            </div>
          </div>

          {/* Indicadores Técnicos */}
          <div className="pt-1 border-t border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-900">
              Indicadores técnicos
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Seis atributos e o potencial, de 1 a 99. Não mudam depois do
              cadastro; a soma dos seis atributos não pode passar de 480.
            </p>

            {fieldErrors.sum && (
              <p className="text-[11px] text-[#E4001B] mt-1">
                {fieldErrors.sum}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              {/* Inputs */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {technicalList.slice(0, 4).map((t) => (
                    <div key={t.key}>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                        {t.label}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={t.val}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            [t.key]: Number(e.target.value),
                          });
                          if (fieldErrors[t.key])
                            setFieldErrors({ ...fieldErrors, [t.key]: "" });
                        }}
                        className={`w-full h-8 px-2.5 text-xs bg-white border rounded-lg focus:outline-none ${
                          fieldErrors[t.key]
                            ? "border-[#E4001B] focus:border-[#E4001B]"
                            : "border-zinc-200 focus:border-[#155DFC]"
                        }`}
                      />
                      {fieldErrors[t.key] && (
                        <p className="text-[10px] text-[#E4001B] mt-0.5 flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-full bg-[#E4001B] text-white text-center leading-none text-[8px] font-bold flex-shrink-0">
                            !
                          </span>
                          {fieldErrors[t.key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {technicalList.slice(4).map((t) => (
                    <div key={t.key}>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                        {t.label}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={t.val}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            [t.key]: Number(e.target.value),
                          });
                          if (fieldErrors[t.key])
                            setFieldErrors({ ...fieldErrors, [t.key]: "" });
                        }}
                        className={`w-full h-8 px-2.5 text-xs bg-white border rounded-lg focus:outline-none ${
                          fieldErrors[t.key]
                            ? "border-[#E4001B] focus:border-[#E4001B]"
                            : "border-zinc-200 focus:border-[#155DFC]"
                        }`}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Potencial
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={formData.potential}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          potential: Number(e.target.value),
                        });
                        if (fieldErrors.potential)
                          setFieldErrors({ ...fieldErrors, potential: "" });
                      }}
                      className={`w-full h-8 px-2.5 text-xs bg-white border rounded-lg focus:outline-none ${
                        fieldErrors.potential
                          ? "border-[#E4001B] focus:border-[#E4001B]"
                          : "border-zinc-200 focus:border-[#155DFC]"
                      }`}
                    />
                    {fieldErrors.potential && (
                      <p className="text-[10px] text-[#E4001B] mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#E4001B] text-white text-center leading-none text-[8px] font-bold flex-shrink-0">
                          !
                        </span>
                        {fieldErrors.potential}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Overall
                    </label>
                    <div className="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-1.5 text-zinc-400">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>Após salvar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prévia dos atributos */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-600 font-semibold text-[11px]">
                    <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Prévia dos atributos</span>
                  </div>

                  {hasErrors || fieldErrors.sum ? (
                    <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                      Corrija os valores destacados para ver a prévia.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {technicalList.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <span className="w-18 text-zinc-500 font-medium truncate">
                            {item.label}
                          </span>
                          <div className="flex-1 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#155DFC] h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, item.val))}%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono font-bold text-zinc-800 text-[11px]">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-200/80 mt-2">
                  <span className="text-[10px] text-zinc-400 leading-tight block">
                    Faixa clara: até o potencial ({formData.potential}). A
                    prévia só desenha os valores digitados; não calcula overall
                    nem valor base.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <span className="text-[11px] text-zinc-400">
              ⓘ O jogador começa livre e Apto.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-60 rounded-lg shadow-xs cursor-pointer"
              >
                {loading ? "Salvando..." : "Salvar jogador"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   J09 · Editar jogador  (nome, posição, idade, agilidade)
───────────────────────────────────────────────────────────────────────────── */
export function EditPlayerModal({
  isOpen,
  onClose,
  onSuccess,
  player,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  player: Player;
}) {
  const [formData, setFormData] = useState({
    name: player.name,
    position: player.position,
    age: player.age,
    agility: player.agility,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasClub = !!player.club_id;
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const nameParts = formData.name.trim().split(/\s+/);
    if (
      formData.name.length < 3 ||
      formData.name.length > 100 ||
      nameParts.length < 2
    ) {
      errors.name =
        "De 3 a 100 caracteres, com pelo menos duas palavras e sem números.";
    } else if (/\d/.test(formData.name)) {
      errors.name = "O nome não pode conter números.";
    }
    if (formData.age < player.age || formData.age > 45) {
      errors.age = `De ${player.age} a 45 anos (a idade não pode ser reduzida).`;
    }
    const maxAgility = formData.age >= 35 ? 85 : 100;
    if (formData.agility < 1 || formData.agility > maxAgility) {
      errors.agility = `De 1 a 100 (até 85 com 35 anos ou mais).`;
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    try {
      setLoading(true);
      await playersService.updatePlayer(player.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || err.message || "Erro ao editar jogador.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Editar jogador
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Edite nome, posição, idade e agilidade. Os demais dados não mudam.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none ${
                fieldErrors.name
                  ? "border-[#E4001B]"
                  : "border-zinc-200 focus:border-[#155DFC]"
              }`}
            />
            {fieldErrors.name ? (
              <p className="text-[11px] text-[#E4001B] mt-1">
                {fieldErrors.name}
              </p>
            ) : (
              <span className="text-[11px] text-zinc-400 mt-1 block">
                De 3 a 100 caracteres, com pelo menos duas palavras e sem
                números.
              </span>
            )}
          </div>

          {/* Posição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Posição
            </label>
            <div className="grid grid-cols-5 gap-2">
              {POSITIONS.map((pos) => {
                const isSelected = formData.position === pos.key;
                const isDisabled = hasClub && !isSelected;
                return (
                  <button
                    key={pos.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      !isDisabled &&
                      setFormData({ ...formData, position: pos.key })
                    }
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-[#155DFC] bg-blue-50/40 text-[#155DFC] ring-1 ring-[#155DFC] cursor-pointer"
                        : isDisabled
                          ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50"
                          : "border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white cursor-pointer"
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">
                      {pos.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">
                      {pos.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            {hasClub && (
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Jogador com clube não muda de posição: as outras posições ficam
                desabilitadas.
              </p>
            )}
          </div>

          {/* Idade + Agilidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Idade
              </label>
              <input
                type="number"
                min={16}
                max={45}
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: Number(e.target.value) })
                }
                className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none ${
                  fieldErrors.age
                    ? "border-[#E4001B]"
                    : "border-zinc-200 focus:border-[#155DFC]"
                }`}
              />
              {fieldErrors.age ? (
                <p className="text-[11px] text-[#E4001B] mt-1">
                  {fieldErrors.age}
                </p>
              ) : (
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  De 16 a 45, sem diminuir (atual: {player.age}).
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Agilidade
              </label>
              <input
                type="number"
                min={1}
                max={formData.age >= 35 ? 85 : 100}
                value={formData.agility}
                onChange={(e) =>
                  setFormData({ ...formData, agility: Number(e.target.value) })
                }
                className={`w-full h-9 px-3 text-xs bg-white border rounded-lg focus:outline-none ${
                  fieldErrors.agility
                    ? "border-[#E4001B]"
                    : "border-zinc-200 focus:border-[#155DFC]"
                }`}
              />
              {fieldErrors.agility ? (
                <p className="text-[11px] text-[#E4001B] mt-1">
                  {fieldErrors.agility}
                </p>
              ) : (
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  De 1 a 100 (até 85 com 35 anos ou mais).
                </span>
              )}
            </div>
          </div>

          {/* Nota de campos imutáveis */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200/70 rounded-lg px-3 py-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Não mudam depois do cadastro: valor base (
              {player.base_value?.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
              ), indicadores e potencial.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-60 rounded-lg shadow-xs cursor-pointer"
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   J10 · Alterar condição física  (com avatar, descrições detalhadas)
───────────────────────────────────────────────────────────────────────────── */
function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ConditionModal({
  isOpen,
  onClose,
  onSuccess,
  player,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    marketValue?: number,
    conditionLabel?: string,
    playerName?: string,
  ) => void;
  player: Player;
}) {
  const [condition, setCondition] = useState<string>(player.condition);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarter, setIsStarter] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    setCondition(player.condition);
    setError(null);
    setIsStarter(false);

    if (player.club_id) {
      clubsService
        .getLineup(player.club_id)
        .then((lineupData) => {
          const lineup =
            lineupData?.players ?? lineupData?.lineup ?? lineupData ?? [];
          const starterIds: number[] = Array.isArray(lineup)
            ? lineup.map((p: any) => p.id ?? p.player_id)
            : [];
          setIsStarter(starterIds.includes(player.id));
        })
        .catch(() => {});
    }
  }, [player]);

  if (!isOpen) return null;

  const conditionLabels: Record<string, string> = {
    APTO: "Apto",
    MAL_CONDICIONADO: "Mal condicionado",
    DOENTE: "Doente",
  };

  const conditionOptions = [
    {
      value: "APTO",
      label: "Apto",
      suffix: player.condition === "APTO" ? " · Atual" : "",
      desc:
        player.condition === "DOENTE"
          ? "Sem desconto por condição.\nDe Doente não passa direto para Apto."
          : "Sem desconto por condição.",
      disabled: player.condition === "DOENTE",
    },
    {
      value: "MAL_CONDICIONADO",
      label: "Mal condicionado",
      suffix: player.condition === "MAL_CONDICIONADO" ? " · Atual" : "",
      desc: "Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.",
      disabled: false,
    },
    {
      value: "DOENTE",
      label: "Doente",
      suffix: player.condition === "DOENTE" ? " · Atual" : "",
      desc: "Desconto de 30%, com o mesmo ajuste de agilidade.",
      disabled: false,
    },
  ];

  const showStarterWarning =
    isStarter &&
    (condition === "DOENTE" || condition === "MAL_CONDICIONADO") &&
    condition !== player.condition;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (player.condition === "DOENTE" && condition === "APTO") {
      setError(
        "De Doente não passa direto para Apto. Selecione Mal condicionado primeiro.",
      );
      return;
    }

    try {
      setLoading(true);
      const updatedPlayer = await playersService.updateCondition(
        player.id,
        condition,
      );
      const newMarketValue: number | undefined = updatedPlayer?.market_value;
      const label = conditionLabels[condition] ?? condition;
      onSuccess(newMarketValue, label, player.name);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao alterar condição.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">
            Alterar condição física
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 -mt-1">
          A condição muda o desconto do valor de mercado, recalculado ao salvar.
        </p>

        {/* Card do jogador */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-[12px] text-blue-600 shrink-0">
              {getInitials(player.name)}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900">
                {player.name}
              </div>
              <div className="text-[11px] text-zinc-400">
                {POSITION_LABELS[player.position]} · {player.position} ·{" "}
                {player.age} anos
              </div>
            </div>
          </div>
          {player.condition === "APTO" && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#008832]" />
              Apto
            </span>
          )}
          {player.condition === "MAL_CONDICIONADO" && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
              Mal condicionado
            </span>
          )}
          {player.condition === "DOENTE" && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4001B]" />
              Doente
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {conditionOptions.map((opt) => {
            const isSelected = condition === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  opt.disabled
                    ? "border-zinc-100 bg-zinc-50/50 opacity-60 cursor-not-allowed"
                    : isSelected
                      ? "border-zinc-300 bg-white cursor-pointer"
                      : "border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled}
                  onChange={(e) =>
                    !opt.disabled && setCondition(e.target.value)
                  }
                  className="mt-0.5 accent-[#155DFC]"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-zinc-900">
                    {opt.label}
                    {"suffix" in opt && opt.suffix && (
                      <span className="text-zinc-400 font-normal">
                        {opt.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 whitespace-pre-line leading-relaxed">
                    {opt.desc}
                  </div>
                </div>
              </label>
            );
          })}

          {/* J16 · Aviso de titular */}
          {showStarterWarning && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 leading-relaxed">
                <span className="font-semibold">{player.name} é titular</span>
                <br />
                Ao passar a {conditionLabels[condition]}, ele sai da escalação,
                e o clube só volta a jogar partidas depois de escalar de novo os
                5 titulares.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-60 rounded-lg shadow-xs cursor-pointer"
            >
              {loading ? "Salvando..." : "Salvar condição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
