import React from 'react';
import { InventoryMetrics, SortOptionType } from '../types/gas';
import { triggerHaptic } from '../utils/haptics';
import {
  CheckCircle2,
  AlertCircle,
  Layers,
  ShieldAlert,
  ArrowRightLeft,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react';

interface MetricsBarProps {
  metrics: InventoryMetrics;
  activeFilter: 'all' | 'favorites' | 'low-stock';
  onFilterChange: (filter: 'all' | 'favorites' | 'low-stock') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  transferModeEnabled: boolean;
  onToggleTransferMode: (enabled: boolean) => void;
  sortOption: SortOptionType;
  onSortChange: (sort: SortOptionType) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  transferModeEnabled,
  onToggleTransferMode,
  sortOption,
  onSortChange,
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

      {/* Barra de Busca, Ordenação e Filtros Rápidos */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
        {/* Input de Busca com Botão 'X' para Limpar */}
        <div className="relative flex-1">
          <input
            id="search-gas-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome do gás (ex: Oxigênio, CO2, Argônio)..."
            className="w-full px-3.5 py-2 pl-9 pr-9 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 shadow-xs placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles de Ordenação e Filtros */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-start">
          {/* Seletor de Ordenação Inteligente */}
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              id="sort-counters-select"
              value={sortOption}
              onChange={(e) => {
                triggerHaptic('light');
                onSortChange(e.target.value as SortOptionType);
              }}
              className="text-xs font-semibold pl-7 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs appearance-none cursor-pointer"
              title="Ordenar lista de cilindros"
            >
              <option value="default">📌 Padrão (Favoritos)</option>
              <option value="critical">🚨 Mais Críticos Primeiro</option>
              <option value="name-asc">🔤 Nome (A ➔ Z)</option>
              <option value="name-desc">🔤 Nome (Z ➔ A)</option>
              <option value="full-desc">🟢 Mais Cheios</option>
              <option value="empty-desc">🔴 Mais Vazios</option>
              <option value="total-desc">📦 Maior Total Geral</option>
            </select>
          </div>

          {/* Filtros em Abas com Badges Contadores */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 p-0.5 shrink-0">
            {/* Aba Todos */}
            <button
              id="filter-tab-all"
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onFilterChange('all');
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'all'
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {metrics.distinctTypes}
              </span>
            </button>

            {/* Aba Favoritos */}
            <button
              id="filter-tab-favorites"
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onFilterChange('favorites');
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeFilter === 'favorites'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>★ Favoritos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                (metrics.favoritesCount ?? 0) > 0
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {metrics.favoritesCount ?? 0}
              </span>
            </button>

            {/* Aba Estoque Crítico / Baixo */}
            <button
              id="filter-tab-lowstock"
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onFilterChange('low-stock');
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeFilter === 'low-stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : metrics.lowStockCount > 0
                  ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {metrics.lowStockCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
              <span>Alerta</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'low-stock'
                  ? 'bg-white text-rose-700'
                  : metrics.lowStockCount > 0
                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {metrics.lowStockCount}
              </span>
            </button>
          </div>
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
            onChange={(e) => {
              triggerHaptic('medium');
              onToggleTransferMode(e.target.checked);
            }}
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
