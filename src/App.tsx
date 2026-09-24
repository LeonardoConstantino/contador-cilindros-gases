import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GasCounter, InventoryMetrics, ToastMessage, CountSnapshot, ExportSettings } from './types/gas';
import { POPULAR_GASES } from './constants/defaultGases';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { CounterCard } from './components/CounterCard';
import { AddCounterModal } from './components/AddCounterModal';
import { ExportModal } from './components/ExportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ResetIndividualModal } from './components/ResetIndividualModal';
import { HistoryModal } from './components/HistoryModal';
import { ToastContainer } from './components/ToastContainer';
import { Plus, RotateCcw, Sparkles } from 'lucide-react';
import {
  getHistorySnapshots,
  addSnapshotToHistory,
  deleteSnapshotFromHistory,
  clearAllHistory,
  createSnapshotFromCounters,
} from './utils/historyStorage';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const STORAGE_KEY = 'gasCounters_data_v1';
const DARK_MODE_KEY = 'gasCounters_darkMode';
const TRANSFER_MODE_KEY = 'gasCounters_transferMode';

const INITIAL_DEFAULT_COUNTERS: GasCounter[] = [
  {
    id: 1,
    label: 'Oxigênio Medicinal',
    full: 0,
    empty: 0,
    notes: '',
    isFavorite: true,
    expanded: false,
    colorTag: '#10b981',
    minStock: 3,
    category: 'Medicinal',
  },
  {
    id: 2,
    label: 'Argônio Industrial',
    full: 0,
    empty: 0,
    notes: '',
    isFavorite: true,
    expanded: false,
    colorTag: '#b45309',
    minStock: 2,
    category: 'Industrial',
  },
  {
    id: 3,
    label: 'Acetileno',
    full: 0,
    empty: 0,
    notes: '',
    isFavorite: false,
    expanded: false,
    colorTag: '#dc2626',
    minStock: 2,
    category: 'Industrial',
  },
  {
    id: 4,
    label: 'Dióxido de Carbono (CO₂)',
    full: 0,
    empty: 0,
    notes: '',
    isFavorite: false,
    expanded: false,
    colorTag: '#334155',
    minStock: 2,
    category: 'Industrial',
  },
];

export default function App() {
  // PWA and Connectivity
  const { isInstallable, installApp } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    } catch {
      return false;
    }
  });

  // Counters state
  const [counters, setCounters] = useState<GasCounter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize with any new properties
          return parsed.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            label: item.label || 'Gás sem nome',
            full: Number(item.full) || 0,
            empty: Number(item.empty) || 0,
            notes: item.notes || '',
            isFavorite: Boolean(item.isFavorite),
            expanded: Boolean(item.expanded),
            colorTag:
              item.colorTag ||
              POPULAR_GASES.find(p => p.label.toLowerCase() === (item.label || '').toLowerCase())?.colorTag ||
              '#0284c7',
            minStock: typeof item.minStock === 'number' ? item.minStock : 2,
            category: item.category || 'Industrial',
          }));
        }
      }
    } catch (e) {
      console.error('Erro ao ler localStorage', e);
    }
    return INITIAL_DEFAULT_COUNTERS;
  });

  // Snapshots History state
  const [snapshots, setSnapshots] = useState<CountSnapshot[]>(() => getHistorySnapshots());

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'low-stock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [counterToRemove, setCounterToRemove] = useState<GasCounter | null>(null);
  const [counterToReset, setCounterToReset] = useState<GasCounter | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetAction, setResetAction] = useState<'zero' | 'deleteAll'>('zero');

  // Transfer mode (1 Cheio -> 1 Vazio) state
  const [transferModeEnabled, setTransferModeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(TRANSFER_MODE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleTransferMode = useCallback((enabled: boolean) => {
    setTransferModeEnabled(enabled);
    try {
      localStorage.setItem(TRANSFER_MODE_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.warn('Erro ao salvar preferência de atalho de transferência', e);
    }
  }, []);

  // Visual Save Indicator state & trigger
  const [isSavedPulsing, setIsSavedPulsing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  const triggerSavePulse = useCallback(() => {
    setIsSavedPulsing(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setIsSavedPulsing(false);
    }, 1600);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark mode class and color-scheme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
    } catch (e) {
      console.warn('Erro ao salvar tema', e);
    }
  }, [darkMode]);

  // Persist counters and trigger visual pulse
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
      if (!isFirstMount.current) {
        triggerSavePulse();
      } else {
        isFirstMount.current = false;
      }
    } catch (e) {
      console.warn('Erro ao salvar contadores', e);
    }
  }, [counters, triggerSavePulse]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Handlers for counter actions
  const handleIncrement = useCallback((id: string | number, type: 'full' | 'empty') => {
    setCounters(prev =>
      prev.map(c => {
        if (c.id !== id) return c;

        if (transferModeEnabled) {
          // Incrementing Cheios: converte 1 Vazio em Cheio (+1 Cheio / -1 Vazio)
          if (type === 'full') {
            if (c.empty <= 0) return c;
            return {
              ...c,
              full: c.full + 1,
              empty: c.empty - 1,
              updatedAt: new Date().toISOString(),
            };
          }
          // Incrementing Vazios: converte 1 Cheio em Vazio (-1 Cheio / +1 Vazio)
          if (type === 'empty') {
            if (c.full <= 0) return c;
            return {
              ...c,
              full: c.full - 1,
              empty: c.empty + 1,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        // Modo padrão independente
        return {
          ...c,
          [type]: c[type] + 1,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [transferModeEnabled]);

  const handleDecrement = useCallback((id: string | number, type: 'full' | 'empty') => {
    setCounters(prev =>
      prev.map(c => {
        if (c.id !== id) return c;

        if (transferModeEnabled) {
          // Decrementing Cheios: retirou 1 Cheio em uso, vira Vazio (-1 Cheio / +1 Vazio)
          if (type === 'full') {
            if (c.full <= 0) return c;
            return {
              ...c,
              full: c.full - 1,
              empty: c.empty + 1,
              updatedAt: new Date().toISOString(),
            };
          }
          // Decrementing Vazios: recarregou 1 Vazio, vira Cheio (+1 Cheio / -1 Vazio)
          if (type === 'empty') {
            if (c.empty <= 0) return c;
            return {
              ...c,
              full: c.full + 1,
              empty: c.empty - 1,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        // Modo padrão independente
        if (c[type] > 0) {
          return {
            ...c,
            [type]: c[type] - 1,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  }, [transferModeEnabled]);

  const handleSetDirect = useCallback((id: string | number, type: 'full' | 'empty', value: number) => {
    setCounters(prev =>
      prev.map(c => {
        if (c.id !== id) return c;

        const sanitized = Math.max(0, value);

        if (transferModeEnabled) {
          const currentTotal = c.full + c.empty;
          // Clamp value so it never exceeds total
          const clamped = Math.min(sanitized, currentTotal);
          const counterpart = currentTotal - clamped;

          if (type === 'full') {
            return {
              ...c,
              full: clamped,
              empty: counterpart,
              updatedAt: new Date().toISOString(),
            };
          } else {
            return {
              ...c,
              empty: clamped,
              full: counterpart,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        return {
          ...c,
          [type]: sanitized,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [transferModeEnabled]);

  const handleToggleFavorite = useCallback((id: string | number) => {
    setCounters(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
      // Re-sort favorites to top
      return [...updated].sort((a, b) => {
        if (a.isFavorite === b.isFavorite) return 0;
        return a.isFavorite ? -1 : 1;
      });
    });
  }, []);

  const handleToggleExpand = useCallback((id: string | number) => {
    setCounters(prev =>
      prev.map(c => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    );
  }, []);

  const handleUpdateNotes = useCallback((id: string | number, notes: string) => {
    setCounters(prev =>
      prev.map(c => (c.id === id ? { ...c, notes } : c))
    );
  }, []);

  const handleUpdateMinStock = useCallback((id: string | number, minStock: number) => {
    setCounters(prev =>
      prev.map(c => (c.id === id ? { ...c, minStock } : c))
    );
  }, []);

  const handleAddCounters = useCallback(
    (newItems: { label: string; full: number; empty: number; colorTag?: string; minStock?: number }[]) => {
      const timestamp = Date.now();
      const created: GasCounter[] = newItems.map((item, idx) => ({
        id: timestamp + idx,
        label: item.label,
        full: item.full,
        empty: item.empty,
        notes: '',
        isFavorite: false,
        expanded: false,
        colorTag: item.colorTag,
        minStock: item.minStock ?? 2,
      }));

      setCounters(prev => [...prev, ...created]);
      showToast(
        created.length === 1
          ? `"${created[0].label}" adicionado ao inventário!`
          : `${created.length} novos contadores adicionados com sucesso!`
      );
    },
    [showToast]
  );

  const handleConfirmRemove = useCallback(() => {
    if (!counterToRemove) return;
    setCounters(prev => prev.filter(c => c.id !== counterToRemove.id));
    showToast(`"${counterToRemove.label}" removido do inventário.`);
    setCounterToRemove(null);
  }, [counterToRemove, showToast]);

  // Individual reset handler
  const handleConfirmIndividualReset = useCallback(
    (counterId: string | number, resetType: 'both' | 'full' | 'empty') => {
      setCounters(prev =>
        prev.map(c => {
          if (c.id === counterId) {
            return {
              ...c,
              full: resetType === 'empty' ? c.full : 0,
              empty: resetType === 'full' ? c.empty : 0,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
      showToast('Contador individual zerado com sucesso!');
    },
    [showToast]
  );

  // General reset handler
  const handleConfirmReset = useCallback(() => {
    if (resetAction === 'zero') {
      setCounters(prev =>
        prev.map(c => ({
          ...c,
          full: 0,
          empty: 0,
        }))
      );
      showToast('Todas as quantidades foram zeradas para uma nova contagem.');
    } else {
      setCounters([]);
      showToast('Todos os contadores foram excluídos.');
    }
    setResetModalOpen(false);
  }, [resetAction, showToast]);

  const handleAddDefaultPresets = useCallback(() => {
    setCounters(INITIAL_DEFAULT_COUNTERS);
    showToast('Contadores padrão restaurados!');
  }, [showToast]);

  // History Snapshots Handlers
  const handleSaveSnapshot = useCallback(
    (settings?: Partial<ExportSettings> & { title?: string }) => {
      if (counters.length === 0) {
        showToast('Nenhum cilindro cadastrado para salvar.', 'error');
        return;
      }
      const snap = createSnapshotFromCounters(counters, settings);
      const updated = addSnapshotToHistory(snap);
      setSnapshots(updated);
      showToast(`Snapshot registrado com sucesso (${snap.totalCylinders} cilindros)!`);
    },
    [counters, showToast]
  );

  const handleDeleteSnapshot = useCallback(
    (id: string) => {
      const updated = deleteSnapshotFromHistory(id);
      setSnapshots(updated);
      showToast('Registro de contagem excluído.');
    },
    [showToast]
  );

  const handleClearAllHistory = useCallback(() => {
    clearAllHistory();
    setSnapshots([]);
    showToast('Histórico de contagens foi limpo.');
  }, [showToast]);

  const handleRestoreSnapshot = useCallback(
    (snap: CountSnapshot) => {
      setCounters(prev => {
        const itemMap = new Map(snap.items.map(it => [String(it.label).toLowerCase(), it]));

        // Update existing counters
        const updated = prev.map(c => {
          const match = itemMap.get(c.label.toLowerCase());
          if (match) {
            itemMap.delete(c.label.toLowerCase());
            return {
              ...c,
              full: match.full,
              empty: match.empty,
              notes: match.notes !== undefined ? match.notes : c.notes,
            };
          }
          return c;
        });

        // If snapshot had items not in current list, add them
        const remainingItems: GasCounter[] = [];
        itemMap.forEach(it => {
          remainingItems.push({
            id: it.id || Date.now() + Math.random(),
            label: it.label,
            full: it.full,
            empty: it.empty,
            notes: it.notes || '',
            isFavorite: false,
            expanded: false,
            minStock: it.minStock ?? 2,
          });
        });

        return [...updated, ...remainingItems];
      });
      showToast(`Valores da contagem de ${snap.formattedDate} restaurados!`);
    },
    [showToast]
  );

  // Derived Metrics
  const metrics: InventoryMetrics = useMemo(() => {
    let totalFull = 0;
    let totalEmpty = 0;
    let lowStockCount = 0;

    for (const c of counters) {
      totalFull += c.full;
      totalEmpty += c.empty;
      if (typeof c.minStock === 'number' && c.minStock > 0 && c.full <= c.minStock) {
        lowStockCount += 1;
      }
    }

    return {
      totalFull,
      totalEmpty,
      totalCylinders: totalFull + totalEmpty,
      distinctTypes: counters.length,
      lowStockCount,
    };
  }, [counters]);

  // Filtered counters for display
  const displayedCounters = useMemo(() => {
    let list = counters;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => c.label.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q));
    }

    if (activeFilter === 'favorites') {
      list = list.filter(c => c.isFavorite);
    } else if (activeFilter === 'low-stock') {
      list = list.filter(c => typeof c.minStock === 'number' && c.minStock > 0 && c.full <= c.minStock);
    }

    return list;
  }, [counters, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenResetModal={() => setResetModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        historyCount={snapshots.length}
        hasCounters={counters.length > 0}
        isInstallable={isInstallable}
        onInstallApp={async () => {
          const installed = await installApp();
          if (installed) {
            showToast('Aplicativo instalado com sucesso!');
          }
        }}
        isOnline={isOnline}
        isSavedPulsing={isSavedPulsing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* Metrics & Filter Bar */}
        <MetricsBar
          metrics={metrics}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          transferModeEnabled={transferModeEnabled}
          onToggleTransferMode={handleToggleTransferMode}
        />

        {/* Counters Grid / List */}
        {displayedCounters.length > 0 ? (
          <div className="space-y-3.5">
            {displayedCounters.map(counter => (
              <CounterCard
                key={counter.id}
                counter={counter}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onSetDirect={handleSetDirect}
                onToggleFavorite={handleToggleFavorite}
                onToggleExpand={handleToggleExpand}
                onUpdateNotes={handleUpdateNotes}
                onUpdateMinStock={handleUpdateMinStock}
                onRequestRemove={(c) => setCounterToRemove(c)}
                onRequestReset={(c) => setCounterToReset(c)}
                transferModeEnabled={transferModeEnabled}
                onShowToast={showToast}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            {counters.length === 0 ? (
              <>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                  Nenhum cilindro cadastrado no momento
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
                  Adicione seus gases para começar a contagem ágil de cheios e vazios.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Gás</span>
                  </button>
                  <button
                    onClick={handleAddDefaultPresets}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Carregar Gases Padrão</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                  Nenhum gás encontrado para este filtro
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Tente alterar os termos de busca ou remover o filtro ativo.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200"
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button on Mobile when scroll */}
      <div className="fixed bottom-5 right-5 sm:hidden z-20 flex flex-col gap-2">
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="w-11 h-11 rounded-full bg-slate-800 text-slate-200 border border-slate-700 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Ver histórico"
          title="Histórico de contagens"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-sky-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Adicionar gás"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modals */}
      <AddCounterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCounters={handleAddCounters}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        counters={counters}
        onShowToast={showToast}
        onSaveSnapshot={(settings) => handleSaveSnapshot(settings)}
      />

      {/* Modal de Histórico de Contagens por Data */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        snapshots={snapshots}
        onSaveCurrentSnapshot={() => handleSaveSnapshot({ title: 'Contagem Manual' })}
        onDeleteSnapshot={handleDeleteSnapshot}
        onClearAllHistory={handleClearAllHistory}
        onRestoreSnapshot={handleRestoreSnapshot}
        onShowToast={showToast}
      />

      {/* Modal de Reset Individual de Contador */}
      <ResetIndividualModal
        counter={counterToReset}
        isOpen={Boolean(counterToReset)}
        onClose={() => setCounterToReset(null)}
        onConfirmReset={handleConfirmIndividualReset}
      />

      {/* Modal de confirmação de exclusão individual */}
      <ConfirmModal
        isOpen={Boolean(counterToRemove)}
        title="Remover Gás do Inventário"
        message={`Tem certeza que deseja remover "${counterToRemove?.label}"? Todos os valores registrados para este gás serão excluídos.`}
        confirmText="Sim, remover"
        confirmVariant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setCounterToRemove(null)}
      />

      {/* Modal de Reset / Zerar Geral */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setResetModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
              Gerenciar / Zerar Inventário
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">
              Escolha a ação que deseja realizar com os contadores atuais:
            </p>

            <div className="space-y-2 mb-5">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  resetAction === 'zero'
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="resetAction"
                  checked={resetAction === 'zero'}
                  onChange={() => setResetAction('zero')}
                  className="mt-1 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <strong className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Zerar apenas as contagens (Cheios e Vazios = 0)
                  </strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Mantém o cadastro dos gases e notas intactos para uma nova contagem de início de turno.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  resetAction === 'deleteAll'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="resetAction"
                  checked={resetAction === 'deleteAll'}
                  onChange={() => setResetAction('deleteAll')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <strong className="block text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400">
                    Excluir todos os gases cadastrados
                  </strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Apaga toda a lista e reinicia o aplicativo em branco.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-xs transition-colors ${
                  resetAction === 'deleteAll'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {resetAction === 'deleteAll' ? 'Sim, excluir tudo' : 'Zerar contagens'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
