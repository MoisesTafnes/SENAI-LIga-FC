import React, { useState } from 'react';
import { X, Shield, Banknote, AlertCircle } from 'lucide-react';
import { clubsService } from '../services/clubs.service';
import { Club } from '../types/club.types';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (club: Club) => void;
}

export function CreateClubModal({ isOpen, onClose, onSuccess }: CreateClubModalProps) {
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [acronymError, setAcronymError] = useState('');

  if (!isOpen) return null;

  function validate(): boolean {
    let valid = true;
    setNameError('');
    setAcronymError('');

    const trimmedName = name.trim();
    const words = trimmedName.split(/\s+/).filter(Boolean);

    if (trimmedName.length < 3 || trimmedName.length > 60 || words.length < 2 || words.length > 5) {
      setNameError('De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto.');
      valid = false;
    }

    const trimmedAcronym = acronym.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(trimmedAcronym)) {
      setAcronymError('A sigla deve conter exatamente 3 letras de A a Z.');
      valid = false;
    } else if (trimmedAcronym[0] === trimmedAcronym[1] && trimmedAcronym[1] === trimmedAcronym[2]) {
      setAcronymError('A sigla não pode ter as 3 letras idênticas (ex: "AAA").');
      valid = false;
    }

    const normalizedName = trimmedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const firstLetterOfName = normalizedName.replace(/[^A-Z]/g, '')[0];

    if (trimmedName.length > 0 && trimmedAcronym[0] !== firstLetterOfName) {
      setAcronymError(`A primeira letra da sigla (${trimmedAcronym[0]}) deve ser igual à primeira letra do nome (${firstLetterOfName}).`);
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const created = await clubsService.createClub({
        name: name.trim(),
        acronym: acronym.trim().toUpperCase(),
      });
      onSuccess(created);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erro ao criar clube.';
      setSubmitError(Array.isArray(msg) ? msg.join(' | ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-zinc-900">Novo clube</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Informe o nome e a sigla do clube.</p>

        {submitError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/80 border border-red-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <div className="font-semibold text-red-800">Não foi possível criar o clube</div>
              <div className="mt-0.5 text-red-600">{submitError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Nome</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Shield className="w-4 h-4 text-zinc-300" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                  setSubmitError(null);
                }}
                placeholder="Leões da Serra"
                className={`w-full h-10 pl-9 pr-3 text-sm bg-white border rounded-lg focus:outline-none text-zinc-800 placeholder-zinc-300 transition-colors ${
                  nameError || submitError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-zinc-300 focus:border-[#155DFC]'
                }`}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto.<br />
              Não pode repetir outro clube.
            </p>
            {nameError && <p className="text-[11px] text-red-600 mt-1">{nameError}</p>}
          </div>

          {/* Sigla */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Sigla</label>
            <input
              type="text"
              value={acronym}
              onChange={(e) => {
                setAcronym(e.target.value.toUpperCase().slice(0, 3));
                setAcronymError('');
                setSubmitError(null);
              }}
              placeholder="LDS"
              maxLength={3}
              className={`w-full h-10 px-3 text-sm font-mono bg-white border rounded-lg focus:outline-none text-zinc-800 placeholder-zinc-300 uppercase transition-colors ${
                acronymError || submitError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-zinc-300 focus:border-[#155DFC]'
              }`}
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome.
            </p>
            {acronymError && <p className="text-[11px] text-red-600 mt-1">{acronymError}</p>}
          </div>

          {/* Info inicial */}
          <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-500">
            <Banknote className="w-4 h-4 shrink-0 text-zinc-400" />
            <span>O clube começa com 300,00 em caixa e sem jogadores.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-60 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Criando...' : 'Criar clube'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
