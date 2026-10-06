import { GasCounter, CountSnapshot } from '../types/gas';

export interface AppBackupData {
  app: 'contador-cilindros-gases';
  version: string;
  exportedAt: string;
  counters: GasCounter[];
  snapshots: CountSnapshot[];
  preferences?: {
    darkMode?: boolean;
    transferMode?: boolean;
    sortOption?: string;
    customTemplate?: string;
    customItemTemplate?: string;
    location?: string;
    responsible?: string;
  };
}

export function createBackupPayload(
  counters: GasCounter[],
  snapshots: CountSnapshot[]
): AppBackupData {
  let customTemplate: string | undefined;
  let customItemTemplate: string | undefined;
  let location: string | undefined;
  let responsible: string | undefined;
  let transferMode: boolean | undefined;

  try {
    customTemplate = localStorage.getItem('gasCounters_custom_template') || undefined;
    customItemTemplate = localStorage.getItem('gasCounters_custom_item_template') || undefined;
    location = localStorage.getItem('gasCounters_last_location') || undefined;
    responsible = localStorage.getItem('gasCounters_last_responsible') || undefined;
    const tf = localStorage.getItem('gasCounters_transferMode');
    if (tf !== null) transferMode = JSON.parse(tf);
  } catch {
    // Ignore storage read errors
  }

  return {
    app: 'contador-cilindros-gases',
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    counters,
    snapshots,
    preferences: {
      customTemplate,
      customItemTemplate,
      location,
      responsible,
      transferMode,
    },
  };
}

export function downloadBackupFile(
  counters: GasCounter[],
  snapshots: CountSnapshot[]
): void {
  const payload = createBackupPayload(counters, snapshots);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  link.href = url;
  link.download = `backup_cilindros_gases_${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function validateBackupFileContent(jsonText: string): {
  valid: boolean;
  data?: AppBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'O arquivo JSON não contém um objeto válido.' };
    }

    if (!Array.isArray(parsed.counters)) {
      return { valid: false, error: 'O backup não contém a lista de cilindros (counters).' };
    }

    // Validate and sanitize counters
    const validCounters: GasCounter[] = parsed.counters.map((c: Partial<GasCounter>, idx: number) => ({
      id: c.id || Date.now() + idx,
      label: String(c.label || 'Cilindro sem nome'),
      full: Number(c.full) >= 0 ? Number(c.full) : 0,
      empty: Number(c.empty) >= 0 ? Number(c.empty) : 0,
      notes: typeof c.notes === 'string' ? c.notes : '',
      isFavorite: Boolean(c.isFavorite),
      expanded: Boolean(c.expanded),
      colorTag: typeof c.colorTag === 'string' ? c.colorTag : '#0284c7',
      minStock: typeof c.minStock === 'number' ? c.minStock : 2,
      category: c.category || 'Industrial',
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));

    // Validate snapshots
    const validSnapshots: CountSnapshot[] = Array.isArray(parsed.snapshots)
      ? parsed.snapshots
      : [];

    return {
      valid: true,
      data: {
        app: 'contador-cilindros-gases',
        version: parsed.version || '1.0.0',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        counters: validCounters,
        snapshots: validSnapshots,
        preferences: parsed.preferences || {},
      },
    };
  } catch (err) {
    return { valid: false, error: 'Erro ao processar JSON: ' + (err as Error).message };
  }
}
