import React from 'react';
import { InventoryMetrics } from '../types/gas';
import { CheckCircle2, AlertCircle, Layers, ShieldAlert, ArrowRightLeft } from 'lucide-react';

interface MetricsBarProps {
  metrics: InventoryMetrics;
  activeFilter: 'all' | 'favorites' | 'low-stock';
  onFilterChange: (filter: 'all' | 'favorites' | 'low-stock') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  transferModeEnabled: boolean;
  onToggleTransferMode: (enabled: boolean) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  transferModeEnabled,
  onToggleTransferMode,
}) => {
  return (
    <div className="space-y-3.5">
      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Cheios */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
              Cheios
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {metrics.totalFull}
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">cilindros</span>
          </div>
        </div>

        {/* Total Vazios */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
              Vazios
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-300">
              {metrics.totalEmpty}
            </span>
            <span className="text-xs text-rose-600/80 dark:text-rose-400/80">cilindros</span>
          </div>
        </div>

        {/* Total Geral */}
        <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
              Total Geral
            </span>
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-700 dark:text-sky-300">
              {metrics.totalCylinders}
            </span>
            <span className="text-xs text-sky-600/80 dark:text-sky-400/80">no pátio</span>
          </div>
        </div>

        {/* Tipos Cadastrados / Alertas */}
        <div className="bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Tipos de Gases
            </span>
            {metrics.lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                {metrics.lowStockCount} baixos
              </span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">Cadastrados</span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200">
              {metrics.distinctTypes}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">itens</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            id="search-gas-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome do gás (ex: Oxigênio, CO2, Argônio)..."
            className="w-full px-3.5 py-2 pl-9 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 shadow-xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filtros em Abas */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 p-0.5 shrink-0">
          <button
            id="filter-tab-all"
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({metrics.distinctTypes})
          </button>
          <button
            id="filter-tab-favorites"
            type="button"
            onClick={() => onFilterChange('favorites')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeFilter === 'favorites'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ★ Favoritos
          </button>
          {metrics.lowStockCount > 0 && (
            <button
              id="filter-tab-lowstock"
              type="button"
              onClick={() => onFilterChange('low-stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeFilter === 'low-stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Estoque Crítico ({metrics.lowStockCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Configuração: Modo Troca / Conservação de Total Fixo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
        <label
          htmlFor="toggle-transfer-shortcut"
          className="inline-flex items-center gap-2.5 cursor-pointer select-none"
        >
          <input
            id="toggle-transfer-shortcut"
            type="checkbox"
            checked={transferModeEnabled}
            onChange={(e) => onToggleTransferMode(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            Modo Troca (Total Fixo de Cilindros)
          </span>
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {transferModeEnabled
            ? 'Total travado: os botões + e - transferem diretamente entre Cheios e Vazios'
            : 'Modo livre: cada botão altera Cheios ou Vazios de forma independente'}
        </span>
      </div>
    </div>
  );
};
