export interface GasCounter {
  id: string | number;
  label: string;
  full: number;
  empty: number;
  notes: string;
  isFavorite: boolean;
  expanded: boolean;
  colorTag?: string; // Hex or tailwind identifier for gas norm
  minStock?: number; // Optional threshold for low-stock warning
  category?: 'Medicinal' | 'Industrial' | 'Especial' | 'Outro';
  updatedAt?: string;
}

export interface InventoryMetrics {
  totalFull: number;
  totalEmpty: number;
  totalCylinders: number;
  distinctTypes: number;
  lowStockCount: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface ExportSettings {
  location: string;
  responsible: string;
  shift: string;
  includeEmptyRows: boolean;
  includeNotes: boolean;
  indicateLowStock?: boolean;
}

export interface CountSnapshotItem {
  id: string | number;
  label: string;
  full: number;
  empty: number;
  notes?: string;
  minStock?: number;
  category?: string;
}

export interface CountSnapshot {
  id: string;
  timestamp: string;
  formattedDate: string;
  title?: string;
  location?: string;
  responsible?: string;
  shift?: string;
  totalFull: number;
  totalEmpty: number;
  totalCylinders: number;
  items: CountSnapshotItem[];
}

