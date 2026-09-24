import React, { useState } from 'react';
import { GasCounter } from '../types/gas';
import { copyTextToClipboard, formatSingleGasSummary } from '../utils/exportFormatters';
import {
  Star,
  Trash2,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  Plus,
  Minus,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';

interface CounterCardProps {
  counter: GasCounter;
  onIncrement: (id: string | number, type: 'full' | 'empty') => void;
  onDecrement: (id: string | number, type: 'full' | 'empty') => void;
  onSetDirect: (id: string | number, type: 'full' | 'empty', value: number) => void;
  onToggleFavorite: (id: string | number) => void;
  onToggleExpand: (id: string | number) => void;
  onUpdateNotes: (id: string | number, notes: string) => void;
  onUpdateMinStock: (id: string | number, minStock: number) => void;
  onRequestRemove: (counter: GasCounter) => void;
  onRequestReset: (counter: GasCounter) => void;
  transferModeEnabled?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CounterCard: React.FC<CounterCardProps> = ({
  counter,
  onIncrement,
  onDecrement,
  onSetDirect,
  onToggleFavorite,
  onToggleExpand,
  onUpdateNotes,
  onUpdateMinStock,
  onRequestRemove,
  onRequestReset,
  transferModeEnabled = false,
  onShowToast,
}) => {
  const [editingField, setEditingField] = useState<'full' | 'empty' | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const total = counter.full + counter.empty;
  const isLowStock =
    typeof counter.minStock === 'number' && counter.minStock > 0 && counter.full <= counter.minStock;
  const isCriticalStock = isLowStock && counter.full === 0;

  const handleStartEdit = (type: 'full' | 'empty', val: number) => {
    setEditingField(type);
    setTempValue(String(val));
  };

  const handleSaveEdit = (type: 'full' | 'empty') => {
    const rawNum = Math.max(0, parseInt(tempValue, 10) || 0);
    const num = transferModeEnabled ? Math.min(rawNum, total) : rawNum;
    onSetDirect(counter.id, type, num);
    setEditingField(null);
  };

  const handleCopySingle = async () => {
    const text = formatSingleGasSummary(counter);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      if (onShowToast) {
        onShowToast(`Copiado: ${counter.label} (${counter.full} CH / ${counter.empty} VZ)`, 'success');
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Border & background style logic based on warning state
  let cardStateStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
  if (isCriticalStock) {
    cardStateStyle =
      'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/30 dark:ring-rose-500/25 bg-rose-50/30 dark:bg-rose-950/20';
  } else if (isLowStock) {
    cardStateStyle =
      'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/30 dark:ring-amber-500/25 bg-amber-50/30 dark:bg-amber-950/20';
  } else if (counter.isFavorite) {
    cardStateStyle = 'border-amber-300 dark:border-amber-700/60 shadow-amber-500/5 bg-white dark:bg-slate-900';
  }

  return (
    <div
      id={`counter-card-${counter.id}`}
      className={`border rounded-xl shadow-xs transition-all overflow-hidden ${cardStateStyle}`}
    >
      {/* Visual Critical / Low Stock Alert Banner */}
      {isLowStock && (
        <div
          className={`px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs font-semibold ${
            isCriticalStock
              ? 'bg-rose-600 text-white'
              : 'bg-amber-500 text-slate-950 dark:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="truncate">
              {isCriticalStock
                ? `ESTOQUE ZERADO: Cheios (0) abaixo do limite de ${counter.minStock} un!`
                : `ESTOQUE CRÍTICO: Cheios (${counter.full}) atingiu o limite mínimo de ${counter.minStock} un`}
            </span>
          </div>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
              isCriticalStock ? 'bg-black/25 text-white' : 'bg-slate-900 text-amber-300'
            }`}
          >
            {isCriticalStock ? 'Repor Urgente' : 'Repor'}
          </span>
        </div>
      )}

      {/* Top Bar / Header do Card */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Tag de Cor Normativa */}
          {counter.colorTag && (
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-slate-900"
              style={{ backgroundColor: counter.colorTag }}
              title="Cor indicativa da norma do gás"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {counter.label}
              </h2>
              {isLowStock && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isCriticalStock
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                  }`}
                  title={`Estoque baixo: Cheios (${counter.full}) <= Mínimo (${counter.minStock})`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {isCriticalStock ? 'Zerado' : 'Mínimo'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                Total: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{total}</strong> un
              </span>
              {transferModeEnabled && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 select-none"
                  title="Modo Troca ativo: botões conservam o total de cilindros deste gás"
                >
                  🔒 Total Fixo
                </span>
              )}
              {typeof counter.minStock === 'number' && counter.minStock > 0 && (
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  • Mín: {counter.minStock}
                </span>
              )}
              {counter.notes?.trim() && (
                <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-medium">
                  <MessageSquare className="w-3 h-3" /> com nota
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações do Cabeçalho: Copiar Gás, Reset Individual, Favorito e Expansor */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Botão de Copiar Individual */}
          <button
            id={`copy-gas-${counter.id}`}
            onClick={handleCopySingle}
            className={`p-2 rounded-lg transition-colors ${
              copied
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
            }`}
            title="Copiar dados deste gás (WhatsApp / Área de transferência)"
            aria-label="Copiar dados deste gás"
          >
            {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Botão de Reset Individual */}
          <button
            onClick={() => onRequestReset(counter)}
            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
            title="Zerar cheios/vazios deste gás (Início de Turno)"
            aria-label="Zerar este contador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleFavorite(counter.id)}
            className={`p-2 rounded-lg transition-colors ${
              counter.isFavorite
                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={counter.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
            aria-label="Favoritar gás"
          >
            <Star className={`w-5 h-5 ${counter.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onToggleExpand(counter.id)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={counter.expanded ? 'Recolher detalhes' : 'Expandir notas, estoque mínimo e opções'}
            aria-label="Expandir ou recolher"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                counter.expanded ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DE CONTAGEM: O CORAÇÃO PRÁTICO DO APP */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Controle CHEIOS (Verde) */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Cheios
            </span>
            <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 font-medium">
              {transferModeEnabled ? '↔ Troca direta' : 'Prontos p/ uso'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              id={`dec-full-${counter.id}`}
              onClick={() => onDecrement(counter.id, 'full')}
              disabled={counter.full === 0}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation text-xl font-black"
              aria-label="Diminuir cheios"
              title={transferModeEnabled ? 'Retira 1 Cheio e adiciona 1 Vazio (-1 Cheio / +1 Vazio)' : 'Diminuir cheios'}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Número grande com edição ao clicar */}
            <div className="flex-1 text-center py-1">
              {editingField === 'full' ? (
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max={transferModeEnabled ? total : undefined}
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleSaveEdit('full')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('full')}
                    className="w-20 text-center text-3xl font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-lg p-1 outline-none"
                  />
                  {transferModeEnabled && (
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                      máx {total} (fixo)
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartEdit('full', counter.full)}
                  className="group px-3 py-1 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                  title="Clique para digitar o valor exato"
                >
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700 dark:text-emerald-300 block">
                    {counter.full}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    editar valor
                  </span>
                </button>
              )}
            </div>

            <button
              id={`inc-full-${counter.id}`}
              onClick={() => onIncrement(counter.id, 'full')}
              disabled={transferModeEnabled && counter.empty === 0}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-30 disabled:pointer-events-none text-white shadow-sm flex items-center justify-center active:scale-95 transition-all touch-manipulation text-xl font-black"
              aria-label="Aumentar cheios"
              title={
                transferModeEnabled
                  ? counter.empty > 0
                    ? 'Retira 1 Vazio e adiciona 1 Cheio (+1 Cheio / -1 Vazio)'
                    : 'Sem cilindros vazios para converter em cheios'
                  : 'Aumentar cheios'
              }
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Controle VAZIOS (Vermelho) */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Vazios
            </span>
            <span className="text-[11px] text-rose-600/90 dark:text-rose-400/90 font-medium">
              {transferModeEnabled ? '↔ Troca direta' : 'Aguardando recarga'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              id={`dec-empty-${counter.id}`}
              onClick={() => onDecrement(counter.id, 'empty')}
              disabled={counter.empty === 0}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation text-xl font-black"
              aria-label="Diminuir vazios"
              title={transferModeEnabled ? 'Retira 1 Vazio e adiciona 1 Cheio (+1 Cheio / -1 Vazio)' : 'Diminuir vazios'}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Número grande com edição ao clicar */}
            <div className="flex-1 text-center py-1">
              {editingField === 'empty' ? (
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max={transferModeEnabled ? total : undefined}
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleSaveEdit('empty')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('empty')}
                    className="w-20 text-center text-3xl font-black text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-lg p-1 outline-none"
                  />
                  {transferModeEnabled && (
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                      máx {total} (fixo)
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartEdit('empty', counter.empty)}
                  className="group px-3 py-1 rounded-lg hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors"
                  title="Clique para digitar o valor exato"
                >
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-rose-700 dark:text-rose-300 block">
                    {counter.empty}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    editar valor
                  </span>
                </button>
              )}
            </div>

            <button
              id={`inc-empty-${counter.id}`}
              onClick={() => onIncrement(counter.id, 'empty')}
              disabled={transferModeEnabled && counter.full === 0}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-30 disabled:pointer-events-none text-white shadow-sm flex items-center justify-center active:scale-95 transition-all touch-manipulation text-xl font-black"
              aria-label="Aumentar vazios"
              title={
                transferModeEnabled
                  ? counter.full > 0
                    ? 'Retira 1 Cheio e adiciona 1 Vazio (-1 Cheio / +1 Vazio)'
                    : 'Sem cilindros cheios para converter em vazios'
                  : 'Aumentar vazios'
              }
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA EXPANSÍVEL: OBSERVAÇÕES, ESTOQUE MÍNIMO E AÇÕES */}
      {counter.expanded && (
        <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl space-y-3">
          {/* Campo de Observações */}
          <div>
            <label
              htmlFor={`notes-${counter.id}`}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Observações ou Lote (aparecerá na exportação):
            </label>
            <input
              id={`notes-${counter.id}`}
              type="text"
              value={counter.notes || ''}
              onChange={(e) => onUpdateNotes(counter.id, e.target.value)}
              placeholder="Ex: 2 aguardando teste hidrostático, reabastecimento agendado..."
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Alerta de Estoque Mínimo Configurável com botões rápidos */}
            <div className="flex items-center gap-2">
              <label
                htmlFor={`min-stock-${counter.id}`}
                className="text-xs text-slate-700 dark:text-slate-300 font-semibold"
              >
                Avisar se Cheios ≤
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => onUpdateMinStock(counter.id, Math.max(0, (counter.minStock ?? 0) - 1))}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                  title="Diminuir limite mínimo"
                >
                  -
                </button>
                <input
                  id={`min-stock-${counter.id}`}
                  type="number"
                  min="0"
                  value={counter.minStock ?? 0}
                  onChange={(e) => onUpdateMinStock(counter.id, parseInt(e.target.value, 10) || 0)}
                  className="w-12 text-center text-xs py-1 px-1 text-slate-800 dark:text-slate-200 font-bold focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => onUpdateMinStock(counter.id, (counter.minStock ?? 0) + 1)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                  title="Aumentar limite mínimo"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">un</span>
            </div>

            {/* Ações expandidas: Zerar Contador e Remover Gás */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => onRequestReset(counter)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors border border-amber-200 dark:border-amber-800/60"
                title="Zerar Cheios e Vazios deste gás para início de contagem"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zerar Contador</span>
              </button>

              <button
                onClick={() => onRequestRemove(counter)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
