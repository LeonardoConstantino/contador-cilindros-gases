import React from 'react';
import {
  Cylinder,
  Moon,
  Sun,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  History,
  DownloadCloud,
  Wifi,
  WifiOff,
  Cloud,
  Check,
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenResetModal: () => void;
  onOpenHistoryModal: () => void;
  historyCount: number;
  hasCounters: boolean;
  isInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
  isSavedPulsing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenAddModal,
  onOpenExportModal,
  onOpenResetModal,
  onOpenHistoryModal,
  historyCount,
  hasCounters,
  isInstallable = false,
  onInstallApp,
  isOnline = true,
  isSavedPulsing = false,
}) => {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Logo, Status, Persistência e Data */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
              <Cylinder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Contador de Cilindros
                </h1>

                {/* Indicador Visual de Salvo Localmente com Animação */}
                <div
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-all duration-300 font-semibold select-none ${
                    isSavedPulsing
                      ? 'bg-emerald-500 text-white shadow-xs scale-105 ring-2 ring-emerald-400/40 animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60'
                  }`}
                  title="Todas as alterações são gravadas instantaneamente no armazenamento interno deste aparelho."
                >
                  {isSavedPulsing ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Salvo agora!</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Salvo localmente</span>
                    </>
                  )}
                </div>

                {/* Offline Pill */}
                {!isOnline && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    title="Modo offline: os dados continuam salvos no seu celular"
                  >
                    <WifiOff className="w-2.5 h-2.5" />
                    Offline
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                <span>{today}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> Operação em campo
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Tools (Theme & PWA) */}
          <div className="flex items-center gap-1 sm:hidden shrink-0">
            {isInstallable && onInstallApp && (
              <button
                type="button"
                onClick={onInstallApp}
                className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 active:scale-95 transition-transform"
                title="Instalar App no Celular"
                aria-label="Instalar aplicativo"
              >
                <DownloadCloud className="w-4 h-4" />
              </button>
            )}

            <button
              id="mobile-dark-mode-toggle"
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
              aria-label="Alternar tema escuro/claro"
              title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* PWA Install Button on Desktop */}
          {isInstallable && onInstallApp && (
            <button
              type="button"
              onClick={onInstallApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 transition-colors shadow-2xs"
              title="Instalar como aplicativo no computador ou celular"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Histórico Button */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistoryModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Ver histórico de contagens anteriores"
          >
            <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Histórico</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {hasCounters && (
            <>
              <button
                id="header-export-btn"
                type="button"
                onClick={onOpenExportModal}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                title="Exportar contagem para WhatsApp"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar</span>
              </button>

              <button
                id="header-reset-btn"
                type="button"
                onClick={onOpenResetModal}
                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                title="Zerar ou resetar todo o inventário"
                aria-label="Resetar inventário"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            id="header-add-counter-btn"
            type="button"
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gás</span>
          </button>

          {/* Desktop dark mode toggle */}
          <button
            id="desktop-dark-mode-toggle"
            type="button"
            onClick={onToggleDarkMode}
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            aria-label="Alternar tema"
            title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
