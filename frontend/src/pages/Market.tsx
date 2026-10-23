import { ShoppingCart } from 'lucide-react';

export function Market() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#155DFC]">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Mercado & Transferências</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Compre jogadores livres com fidelidade ou venda atletas com comissão/multa.</p>
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-500 text-xs">
        Selecione um jogador livre na página de <strong className="text-zinc-800">Jogadores</strong> para iniciar uma negociação.
      </div>
    </div>
  );
}
