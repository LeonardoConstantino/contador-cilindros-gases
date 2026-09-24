import React, { useState } from 'react';
import { GasCounter } from '../types/gas';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface ResetIndividualModalProps {
  counter: GasCounter | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (counterId: string | number, resetType: 'both' | 'full' | 'empty') => void;
}

export const ResetIndividualModal: React.FC<ResetIndividualModalProps> = ({
  counter,
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [resetType, setResetType] = useState<'both' | 'full' | 'empty'>('both');

  if (!isOpen || !counter) return null;

  const total = counter.full + counter.empty;

  const handleConfirm = () => {
    onConfirmReset(counter.id, resetType);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Zerar Contador Individual
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {counter.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Valores atuais gravados:</span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">
                Cheios: {counter.full}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Vazios: {counter.empty}
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                (Total: {total})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Selecione o que deseja zerar neste início de contagem:
            </label>

            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                resetType === 'both'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="resetIndividualType"
                  checked={resetType === 'both'}
                  onChange={() => setResetType('both')}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold">Zerar Cheios e Vazios (Recomendado)</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Cheios: 0 | Vazios: 0</span>
            </label>

            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                resetType === 'full'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="resetIndividualType"
                  checked={resetType === 'full'}
                  onChange={() => setResetType('full')}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold">Zerar apenas Cheios</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Mantém {counter.empty} vazios</span>
            </label>

            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                resetType === 'empty'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="resetIndividualType"
                  checked={resetType === 'empty'}
                  onChange={() => setResetType('empty')}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold">Zerar apenas Vazios</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Mantém {counter.full} cheios</span>
            </label>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>O cadastro do gás, observações e configurações de estoque mínimo serão mantidos intactos.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirmar e Zerar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
