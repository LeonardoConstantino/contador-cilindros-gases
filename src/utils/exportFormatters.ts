import { GasCounter, ExportSettings } from '../types/gas';

export type ExportFormatType = 'whatsapp' | 'table' | 'simple' | 'custom';

export function isCounterLowStock(counter: GasCounter): boolean {
  const min = typeof counter.minStock === 'number' ? counter.minStock : 2;
  return min > 0 && counter.full <= min;
}

export function formatSingleGasSummary(counter: GasCounter): string {
  const total = counter.full + counter.empty;
  let text = `*${counter.label}*\nCheios: ${counter.full} | Vazios: ${counter.empty} | Total: ${total}`;
  if (isCounterLowStock(counter)) {
    text += ` ⚠️ (Estoque Baixo: ${counter.full}/${counter.minStock ?? 2})`;
  }
  if (counter.notes?.trim()) {
    text += `\nObs: ${counter.notes.trim()}`;
  }
  return text;
}

function getHeaderMetadata(settings: ExportSettings): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let headerText = `📋 *CONTAGEM DE CILINDROS DE GASES*\n`;
  if (settings.location.trim()) {
    headerText += `📍 *Local:* ${settings.location.trim()}\n`;
  }
  if (settings.responsible.trim()) {
    headerText += `👤 *Responsável:* ${settings.responsible.trim()}\n`;
  }
  if (settings.shift.trim()) {
    headerText += `⏱️ *Turno:* ${settings.shift.trim()}\n`;
  }
  headerText += `📅 *Data/Hora:* ${dateStr} às ${timeStr}\n\n`;
  return headerText;
}

export function formatWhatsAppTable(
  counters: GasCounter[],
  settings: ExportSettings
): string {
  const filtered = counters.filter(c => {
    if (settings.includeEmptyRows) return true;
    return c.full > 0 || c.empty > 0;
  });

  const headerText = getHeaderMetadata(settings);

  if (filtered.length === 0) {
    return `${headerText}_Nenhum cilindro com quantidade registrado no momento._`;
  }

  // Column definitions
  const headers = {
    gas: 'GÁS',
    full: 'CH',
    empty: 'VZ',
    total: 'TOT',
  };

  const rows = filtered.map(c => {
    const total = c.full + c.empty;
    let label = c.label.trim();
    const isLow = Boolean(settings.indicateLowStock && isCounterLowStock(c));
    if (isLow) {
      label += c.full === 0 ? ' [ZERADO!]' : ' [BAIXO]';
    }
    if (c.notes.trim() && settings.includeNotes) {
      label += ' *';
    }
    return {
      label,
      full: String(c.full),
      empty: String(c.empty),
      total: String(total),
      isLow,
      counter: c,
      rawNote: c.notes.trim() ? `* ${c.label}: ${c.notes.trim()}` : null,
    };
  });

  const totalFull = filtered.reduce((acc, c) => acc + c.full, 0);
  const totalEmpty = filtered.reduce((acc, c) => acc + c.empty, 0);
  const grandTotal = totalFull + totalEmpty;

  const totalRow = {
    label: 'TOTAL GERAL',
    full: String(totalFull),
    empty: String(totalEmpty),
    total: String(grandTotal),
  };

  const maxGasLength = Math.max(
    headers.gas.length,
    totalRow.label.length,
    ...rows.map(r => r.label.length)
  );

  const maxFullLength = Math.max(headers.full.length, totalRow.full.length, ...rows.map(r => r.full.length));
  const maxEmptyLength = Math.max(headers.empty.length, totalRow.empty.length, ...rows.map(r => r.empty.length));
  const maxTotalLength = Math.max(headers.total.length, totalRow.total.length, ...rows.map(r => r.total.length));

  const padRight = (str: string, len: number) => str.padEnd(len, ' ');
  const padLeft = (str: string, len: number) => str.padStart(len, ' ');

  const formatLine = (g: string, f: string, e: string, t: string) => {
    return `${padRight(g, maxGasLength)}  ${padLeft(f, maxFullLength)}  ${padLeft(e, maxEmptyLength)}  ${padLeft(t, maxTotalLength)}`;
  };

  const headerLine = formatLine(headers.gas, headers.full, headers.empty, headers.total);
  const separatorLine = '─'.repeat(headerLine.length);
  const doubleSeparator = '═'.repeat(headerLine.length);

  const dataLines = rows.map(r => formatLine(r.label, r.full, r.empty, r.total)).join('\n');
  const totalLine = formatLine(totalRow.label, totalRow.full, totalRow.empty, totalRow.total);

  let asciiTable = '```\n';
  asciiTable += headerLine + '\n';
  asciiTable += separatorLine + '\n';
  asciiTable += dataLines + '\n';
  asciiTable += doubleSeparator + '\n';
  asciiTable += totalLine + '\n';
  asciiTable += '```';

  let legend = '\n_Legenda: CH = Cheios | VZ = Vazios | TOT = Total';
  if (settings.indicateLowStock) {
    legend += ' | [BAIXO] = Cheios ≤ Mínimo';
  }
  legend += '_';

  let lowStockAlert = '';
  if (settings.indicateLowStock) {
    const lowRows = rows.filter(r => r.isLow);
    if (lowRows.length > 0) {
      const alertLines = lowRows.map(r => {
        const min = typeof r.counter.minStock === 'number' ? r.counter.minStock : 2;
        const status = r.counter.full === 0 ? '🚨 CRÍTICO (0 cheios)' : `⚠️ ${r.counter.full} cheios (mínimo: ${min})`;
        return `• ${r.counter.label}: ${status}`;
      });
      lowStockAlert = `\n\n⚠️ *Atenção: Estoque de Cheios Baixo*\n${alertLines.join('\n')}`;
    }
  }

  const activeNotes = rows.filter(r => r.rawNote).map(r => r.rawNote);
  let notesText = '';
  if (settings.includeNotes && activeNotes.length > 0) {
    notesText = '\n\n📝 *Observações:*\n' + activeNotes.join('\n');
  }

  return `${headerText}${asciiTable}${legend}${lowStockAlert}${notesText}`;
}

export function formatAsciiBorderedTable(
  counters: GasCounter[],
  settings: ExportSettings
): string {
  const filtered = counters.filter(c => {
    if (settings.includeEmptyRows) return true;
    return c.full > 0 || c.empty > 0;
  });

  const headerText = getHeaderMetadata(settings);

  if (filtered.length === 0) {
    return `${headerText}_Nenhum cilindro registrado no momento._`;
  }

  const rows = filtered.map(c => {
    const isLow = Boolean(settings.indicateLowStock && isCounterLowStock(c));
    let label = c.label.trim();
    if (isLow) {
      label += c.full === 0 ? ' [ZERADO!]' : ' [BAIXO]';
    }
    return {
      label,
      full: String(c.full),
      empty: String(c.empty),
      total: String(c.full + c.empty),
      notes: c.notes?.trim(),
      isLow,
      counter: c,
    };
  });

  const totalFull = filtered.reduce((acc, c) => acc + c.full, 0);
  const totalEmpty = filtered.reduce((acc, c) => acc + c.empty, 0);
  const grandTotal = totalFull + totalEmpty;

  const gasColWidth = Math.max(18, 'ITEM / TIPO DE GÁS'.length, ...rows.map(r => r.label.length));
  const fullColWidth = Math.max(8, 'CHEIOS'.length, String(totalFull).length);
  const emptyColWidth = Math.max(8, 'VAZIOS'.length, String(totalEmpty).length);
  const totalColWidth = Math.max(8, 'TOTAL'.length, String(grandTotal).length);

  const padR = (s: string, w: number) => s.padEnd(w, ' ');
  const padL = (s: string, w: number) => s.padStart(w, ' ');

  const sep = `+${'-'.repeat(gasColWidth + 2)}+${'-'.repeat(fullColWidth + 2)}+${'-'.repeat(emptyColWidth + 2)}+${'-'.repeat(totalColWidth + 2)}+`;
  const head = `| ${padR('ITEM / TIPO DE GÁS', gasColWidth)} | ${padL('CHEIOS', fullColWidth)} | ${padL('VAZIOS', emptyColWidth)} | ${padL('TOTAL', totalColWidth)} |`;
  const totalRow = `| ${padR('TOTAL GERAL', gasColWidth)} | ${padL(String(totalFull), fullColWidth)} | ${padL(String(totalEmpty), emptyColWidth)} | ${padL(String(grandTotal), totalColWidth)} |`;

  const body = rows
    .map(r => `| ${padR(r.label, gasColWidth)} | ${padL(r.full, fullColWidth)} | ${padL(r.empty, emptyColWidth)} | ${padL(r.total, totalColWidth)} |`)
    .join('\n');

  let table = '```\n' + sep + '\n' + head + '\n' + sep + '\n' + body + '\n' + sep + '\n' + totalRow + '\n' + sep + '\n```';

  if (settings.indicateLowStock) {
    const lowRows = rows.filter(r => r.isLow);
    if (lowRows.length > 0) {
      const alertLines = lowRows.map(r => {
        const min = typeof r.counter.minStock === 'number' ? r.counter.minStock : 2;
        return `• ${r.counter.label}: ${r.counter.full === 0 ? '🚨 ZERADO (0 cheios)' : `${r.counter.full} cheios`} (mínimo: ${min})`;
      });
      table += '\n\n⚠️ *Alerta: Itens com Estoque de Cheios Baixo*\n' + alertLines.join('\n');
    }
  }

  if (settings.includeNotes) {
    const notes = rows.filter(r => r.notes).map(r => `• ${r.label}: ${r.notes}`);
    if (notes.length > 0) {
      table += '\n\n📝 *Observações:*\n' + notes.join('\n');
    }
  }

  return `${headerText}${table}`;
}

export function formatSimpleTextList(
  counters: GasCounter[],
  settings: ExportSettings
): string {
  const filtered = counters.filter(c => {
    if (settings.includeEmptyRows) return true;
    return c.full > 0 || c.empty > 0;
  });

  const headerText = getHeaderMetadata(settings);

  if (filtered.length === 0) {
    return `${headerText}Nenhum cilindro com estoque registrado.`;
  }

  const lines = filtered.map(c => {
    const tot = c.full + c.empty;
    const isLow = Boolean(settings.indicateLowStock && isCounterLowStock(c));
    let line = `• ${c.label}: ${c.full} cheios, ${c.empty} vazios (Total: ${tot})`;
    if (isLow) {
      const min = typeof c.minStock === 'number' ? c.minStock : 2;
      line += c.full === 0 ? ` 🚨 [ESTOQUE ZERADO! Mín: ${min}]` : ` ⚠️ [ESTOQUE BAIXO: ${c.full}/${min}]`;
    }
    if (settings.includeNotes && c.notes?.trim()) {
      line += ` [Obs: ${c.notes.trim()}]`;
    }
    return line;
  });

  const totalFull = filtered.reduce((acc, c) => acc + c.full, 0);
  const totalEmpty = filtered.reduce((acc, c) => acc + c.empty, 0);
  const grandTotal = totalFull + totalEmpty;

  lines.push('');
  lines.push(`📊 *Resumo:* ${totalFull} Cheios | ${totalEmpty} Vazios | ${grandTotal} Total`);

  if (settings.indicateLowStock) {
    const lowItems = filtered.filter(c => isCounterLowStock(c));
    if (lowItems.length > 0) {
      lines.push('');
      lines.push('⚠️ *Atenção - Estoque de Cheios Baixo:*');
      lowItems.forEach(c => {
        const min = typeof c.minStock === 'number' ? c.minStock : 2;
        lines.push(`  - ${c.label}: ${c.full} cheios em estoque (mínimo recomendado: ${min})`);
      });
    }
  }

  return `${headerText}${lines.join('\n')}`;
}

export function formatCustomTemplate(
  counters: GasCounter[],
  settings: ExportSettings,
  templateString: string
): string {
  const filtered = counters.filter(c => {
    if (settings.includeEmptyRows) return true;
    return c.full > 0 || c.empty > 0;
  });

  const totalFull = filtered.reduce((acc, c) => acc + c.full, 0);
  const totalEmpty = filtered.reduce((acc, c) => acc + c.empty, 0);
  const grandTotal = totalFull + totalEmpty;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const lowItems = filtered.filter(c => isCounterLowStock(c));
  const lowStockSummary = lowItems.length > 0
    ? lowItems.map(c => `• ${c.label}: ${c.full} cheios (mín: ${c.minStock ?? 2})`).join('\n')
    : 'Nenhum item com estoque baixo';

  // Generate list items based on line template {item} or line-by-line
  const itemsText = filtered
    .map(c => {
      const tot = c.full + c.empty;
      const isLow = Boolean(settings.indicateLowStock && isCounterLowStock(c));
      const lowTag = isLow ? (c.full === 0 ? ' 🚨 [ZERADO]' : ' ⚠️ [BAIXO]') : '';
      return `${c.label}${lowTag}: ${c.full} CH / ${c.empty} VZ (Tot: ${tot})${c.notes?.trim() ? ` - ${c.notes.trim()}` : ''}`;
    })
    .join('\n');

  return templateString
    .replace(/\{local\}/gi, settings.location || 'Geral')
    .replace(/\{responsavel\}/gi, settings.responsible || 'Operador')
    .replace(/\{turno\}/gi, settings.shift || '-')
    .replace(/\{data\}/gi, dateStr)
    .replace(/\{hora\}/gi, timeStr)
    .replace(/\{total_cheios\}/gi, String(totalFull))
    .replace(/\{total_vazios\}/gi, String(totalEmpty))
    .replace(/\{total_geral\}/gi, String(grandTotal))
    .replace(/\{itens\}/gi, itemsText)
    .replace(/\{estoque_baixo\}/gi, lowStockSummary)
    .replace(/\{alertas\}/gi, lowItems.length > 0 ? `⚠️ Atenção: ${lowItems.length} item(ns) com estoque baixo!\n${lowStockSummary}` : '');
}

export function formatCSV(counters: GasCounter[], location: string, settings?: ExportSettings): string {
  const includeLowStock = settings?.indicateLowStock ?? true;
  const headers = [
    'Nome do Gás',
    'Cheios',
    'Vazios',
    'Total',
    ...(includeLowStock ? ['Alerta Estoque'] : []),
    'Observações',
    'Favorito',
  ];
  const rows = counters.map(c => {
    const isLow = isCounterLowStock(c);
    const lowStatus = isLow ? (c.full === 0 ? 'CRÍTICO (Zerado)' : 'BAIXO') : 'Normal';
    return [
      `"${c.label.replace(/"/g, '""')}"`,
      c.full,
      c.empty,
      c.full + c.empty,
      ...(includeLowStock ? [`"${lowStatus}"`] : []),
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.isFavorite ? 'Sim' : 'Não',
    ];
  });

  return [
    `# Inventario de Cilindros - ${location || 'Geral'}`,
    `# Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    headers.join(';'),
    ...rows.map(r => r.join(';')),
  ].join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback to execCommand below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}
