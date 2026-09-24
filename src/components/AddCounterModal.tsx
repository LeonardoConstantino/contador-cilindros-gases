import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { POPULAR_GASES, GasPreset } from '../constants/defaultGases';

interface AddCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCounters: (items: { label: string; full: number; empty: number; colorTag?: string; minStock?: number }[]) => void;
}

export const AddCounterModal: React.FC<AddCounterModalProps> = ({
  isOpen,
  onClose,
  onAddCounters,
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [initialFull, setInitialFull] = useState<number>(0);
  const [initialEmpty, setInitialEmpty] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<GasPreset | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: GasPreset) => {
    setSelectedPreset(preset);
    if (!labelInput.trim()) {
      setLabelInput(preset.label);
    } else {
      // Append if multiple
      const parts = labelInput.split(';').map(p => p.trim()).filter(Boolean);
      if (!parts.includes(preset.label)) {
        parts.push(preset.label);
        setLabelInput(parts.join('; '));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = labelInput.trim();
    if (!trimmed) return;

    const names = trimmed.split(';').map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;

    const toAdd = names.map(name => {
      // Match color from preset if available
      const match = POPULAR_GASES.find(p => p.label.toLowerCase() === name.toLowerCase());
      return {
        label: name,
        full: Math.max(0, Number(initialFull) || 0),
        empty: Math.max(0, Number(initialEmpty) || 0),
        colorTag: match?.colorTag || selectedPreset?.colorTag || '#0284c7',
        minStock: match?.defaultMinStock ?? 2,
      };
    });

    onAddCounters(toAdd);
    setLabelInput('');
    setInitialFull(0);
    setInitialEmpty(0);
    setSelectedPreset(null);
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Cadastrar Contador de Gás
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione um ou múltiplos cilindros (separe com ;)
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

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sugestões rápidas de gases:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_GASES.map((preset) => {
                const isSelected = labelInput.includes(preset.label);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: preset.colorTag }}
                    />
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-sky-600 dark:text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome do Gás */}
          <div>
            <label
              htmlFor="add-gas-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nome do Gás (ou lista separada por ponto e vírgula):
            </label>
            <input
              id="add-gas-name"
              type="text"
              autoFocus
              required
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Ex: Oxigênio Medicinal; Argônio; CO2"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* Quantidades Iniciais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-initial-full"
                className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1"
              >
                Cheios (inicial)
              </label>
              <input
                id="add-initial-full"
                type="number"
                min="0"
                value={initialFull}
                onChange={(e) => setInitialFull(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm font-bold text-center px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="add-initial-empty"
                className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1"
              >
                Vazios (inicial)
              </label>
              <input
                id="add-initial-empty"
                type="number"
                min="0"
                value={initialEmpty}
                onChange={(e) => setInitialEmpty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm font-bold text-center px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!labelInput.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              Adicionar ao Inventário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
