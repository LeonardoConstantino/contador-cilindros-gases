import { CountSnapshot, GasCounter, ExportSettings } from '../types/gas';
import { formatWhatsAppTable } from './exportFormatters';

const HISTORY_KEY = 'gasCounters_history_v1';

export function getHistorySnapshots(): CountSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Erro ao carregar histórico de contagens:', err);
  }
  return [];
}

export function saveHistorySnapshots(snapshots: CountSnapshot[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(snapshots));
  } catch (err) {
    console.error('Erro ao salvar histórico de contagens:', err);
  }
}

export function createSnapshotFromCounters(
  counters: GasCounter[],
  settings?: Partial<ExportSettings> & { title?: string }
): CountSnapshot {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let totalFull = 0;
  let totalEmpty = 0;

  const items = counters.map(c => {
    totalFull += c.full;
    totalEmpty += c.empty;
    return {
      id: c.id,
      label: c.label,
      full: c.full,
      empty: c.empty,
      notes: c.notes,
      minStock: c.minStock,
      category: c.category,
    };
  });

  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now.toISOString(),
    formattedDate,
    title: settings?.title || (settings?.shift ? `Contagem - ${settings.shift}` : 'Contagem de Rotina'),
    location: settings?.location || 'Almoxarifado',
    responsible: settings?.responsible || '',
    shift: settings?.shift || '',
    totalFull,
    totalEmpty,
    totalCylinders: totalFull + totalEmpty,
    items,
  };
}

export function addSnapshotToHistory(snapshot: CountSnapshot): CountSnapshot[] {
  const current = getHistorySnapshots();
  // Keep up to 100 most recent snapshots
  const updated = [snapshot, ...current].slice(0, 100);
  saveHistorySnapshots(updated);
  return updated;
}

export function deleteSnapshotFromHistory(id: string): CountSnapshot[] {
  const current = getHistorySnapshots();
  const updated = current.filter(s => s.id !== id);
  saveHistorySnapshots(updated);
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Erro ao limpar histórico:', err);
  }
}

export function formatSnapshotWhatsApp(snapshot: CountSnapshot): string {
  // Convert items back to minimal GasCounter representation for formatWhatsAppTable
  const mockCounters: GasCounter[] = snapshot.items.map(it => ({
    id: it.id,
    label: it.label,
    full: it.full,
    empty: it.empty,
    notes: it.notes || '',
    isFavorite: false,
    expanded: false,
    minStock: it.minStock,
  }));

  return formatWhatsAppTable(mockCounters, {
    location: snapshot.location || 'Não especificado',
    responsible: snapshot.responsible || 'Não informado',
    shift: snapshot.shift || '',
    includeEmptyRows: true,
    includeNotes: true,
  });
}
