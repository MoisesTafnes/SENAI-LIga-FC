import { Wallet, Layers, Landmark, Shirt } from "lucide-react";

interface ClubStatCardsProps {
  cash: number;
  squadValue: number;
  netWorth: number;
  playersCount: number;
}

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return "0,00";
  return Number(val).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ClubStatCards({
  cash,
  squadValue,
  netWorth,
  playersCount,
}: ClubStatCardsProps) {
  const cards = [
    {
      title: "Caixa",
      icon: Wallet,
      value: `${fmt(cash)}`,
      unit: "moedas",
      subtext: "Só muda por compras e vendas",
    },
    {
      title: "Valor do elenco",
      icon: Layers,
      value: `${fmt(squadValue)}`,
      unit: "moedas",
      subtext: "Soma dos valores de mercado",
    },
    {
      title: "Patrimônio",
      icon: Landmark,
      value: `${fmt(netWorth)}`,
      unit: "moedas",
      subtext: "Caixa + valor do elenco",
    },
    {
      title: "Elenco",
      icon: Shirt,
      value: `${playersCount} de 12`,
      unit: "",
      subtext: "Limite de 12 jogadores",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition-colors"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-medium text-zinc-600">
                {c.title}
              </span>
              <Icon className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-zinc-900 font-mono">
                {c.value}
              </span>
              {c.unit && (
                <span className="text-xs font-medium text-zinc-400">
                  {c.unit}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 truncate">
              {c.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
