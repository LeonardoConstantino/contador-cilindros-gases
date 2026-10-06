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

export const DEFAULT_CUSTOM_ITEM_TEMPLATE = '• {nome}: {cheios} CH / {vazios} VZ (Tot: {total}){alerta}{obs}';

export const DEFAULT_CUSTOM_TEMPLATE = `📋 *RELATÓRIO DE GASES - {local}*
👤 *Responsável:* {responsavel} | ⏱️ *Turno:* {turno}
📅 *Data:* {data} às {hora}

📦 *Estoque Atual:*
{itens}

📊 *Totais:*
Cheios: {total_cheios} | Vazios: {total_vazios}
Total Geral de Cilindros: {total_geral}
{alertas}`;

export interface CustomTemplatePreset {
  id: string;
  name: string;
  description: string;
  template: string;
  itemTemplate?: string;
}

export const CUSTOM_TEMPLATE_PRESETS: CustomTemplatePreset[] = [
  {
    id: 'default',
    name: 'Padrão {itens}',
    description: 'Cabeçalho organizado e lista de itens formatada',
    template: DEFAULT_CUSTOM_TEMPLATE,
    itemTemplate: DEFAULT_CUSTOM_ITEM_TEMPLATE,
  },
  {
    id: 'block_item',
    name: 'Bloco [item] Detalhado',
    description: 'Utiliza bloco [item]...[/item] com linha totalmente personalizável',
    template: `📋 *CONTAGEM DE CILINDROS - {local}*
📅 {data} às {hora} | 👤 {responsavel} ({turno})

📦 *ESTOQUE DETALHADO:*
[item]
🔹 *{nome}*: {cheios} Cheios | {vazios} Vazios (Total: {total}){alerta}{obs}
[/item]

📊 *RESUMO GERAL:*
✅ Cheios: {total_cheios}
⭕ Vazios: {total_vazios}
🔢 Total: {total_geral} de cilindros
{alertas}`,
    itemTemplate: DEFAULT_CUSTOM_ITEM_TEMPLATE,
  },
  {
    id: 'hospital',
    name: 'Passagem de Plantão / Hospitalar',
    description: 'Formato voltado para enfermagem e engenharia clínica',
    template: `🏥 *BOLETIM DE GASES MEDICINAIS - {local}*
👨‍⚕️ *Responsável:* {responsavel} | ⏰ *Turno:* {turno}
📆 *Data/Hora:* {data} às {hora}

🚨 *STATUS DE ESTOQUE:*
{alertas}

📋 *CONTAGEM POR CILINDRO:*
[item]
• *{nome}*: {cheios} cheios / {vazios} vazios | Mín: {minimo} [{status}]{obs}
[/item]

📈 *CONSOLIDADO DO SETOR:*
🟢 Total Cheios (Prontos): {total_cheios}
🔴 Total Vazios (Recolha): {total_vazios}
📦 Volume Total no Setor: {total_geral}`,
    itemTemplate: '• *{nome}*: {cheios} cheios / {vazios} vazios | Mín: {minimo} [{status}]{obs}',
  },
  {
    id: 'compact',
    name: 'Compacto / Mensagem Rápida',
    description: 'Poucas linhas ideal para SMS, rádio ou Telegram',
    template: `[GASES] {local} ({data} {hora})
Resp: {responsavel} | Turno: {turno}
Itens:
[item]
- {nome}: {cheios}CH/{vazios}VZ{alerta}
[/item]
Totais: {total_cheios} CH | {total_vazios} VZ | Geral: {total_geral}
{alertas}`,
    itemTemplate: '- {nome}: {cheios}CH/{vazios}VZ{alerta}',
  },
  {
    id: 'table_markdown',
    name: 'Tabela Markdown / Discord',
    description: 'Tabela em formato markdown monospaçado',
    template: `### 📋 Inventário de Cilindros - {local}
**Responsável:** {responsavel} | **Data:** {data} {hora}

| Gás / Item | Cheios | Vazios | Total | Status |
| :--- | :---: | :---: | :---: | :--- |
[item]
| {nome} | {cheios} | {vazios} | {total} | {status} |
[/item]
| **TOTAL GERAL** | **{total_cheios}** | **{total_vazios}** | **{total_geral}** | - |

{alertas}`,
    itemTemplate: '| {nome} | {cheios} | {vazios} | {total} | {status} |',
  },
];

export function formatSingleItemWithTemplate(
  c: GasCounter,
  itemTpl: string,
  settings: ExportSettings
): string {
  const tot = c.full + c.empty;
  const isLow = Boolean(settings.indicateLowStock && isCounterLowStock(c));
  const min = typeof c.minStock === 'number' ? c.minStock : 2;
  const statusStr = isLow ? (c.full === 0 ? 'ZERADO' : 'BAIXO') : 'OK';
  const alertStr = isLow ? (c.full === 0 ? ' 🚨 [ZERADO!]' : ' ⚠️ [BAIXO]') : '';
  const notesStr = (settings.includeNotes && c.notes?.trim()) ? ` [Obs: ${c.notes.trim()}]` : '';

  return itemTpl
    .replace(/\{item_nome\}|\{nome\}|\{gas\}|\{item\}|\{rotulo\}/gi, c.label)
    .replace(/\{item_cheios\}|\{cheios\}|\{ch\}|\{cheio\}/gi, String(c.full))
    .replace(/\{item_vazios\}|\{vazios\}|\{vz\}|\{vazio\}/gi, String(c.empty))
    .replace(/\{item_total\}|\{total\}|\{tot\}|\{total_cilindro\}|\{soma\}/gi, String(tot))
    .replace(/\{item_minimo\}|\{minimo\}|\{min\}|\{estoque_minimo\}/gi, String(min))
    .replace(/\{item_status\}|\{status\}/gi, statusStr)
    .replace(/\{item_alerta\}|\{alerta\}|\{aviso\}/gi, alertStr)
    .replace(/\{item_obs\}|\{obs\}|\{observacao\}|\{observacoes\}|\{nota\}/gi, notesStr)
    .replace(/\{item_categoria\}|\{categoria\}/gi, c.category || '')
    .replace(/\{item_favorito\}|\{favorito\}/gi, c.isFavorite ? '⭐' : '');
}

export function generateLlmPrompt(desiredStyle?: string): string {
  const styleInstruction = desiredStyle?.trim()
    ? `\nESTILO / REQUISITO DO USUÁRIO:\n"${desiredStyle.trim()}"\n`
    : `\nESTILO DESEJADO:\n[Exemplo: Crie um layout visualmente atraente para WhatsApp com emojis hospitalares organizados, cabeçalho e totais destacados]\n`;

  return `Você é um assistente especialista em criação de modelos de texto e relatórios operacionais.
Preciso que você crie um MODELO DE LAYOUT PERSONALIZADO (template) para exportação de contagem de cilindros de gases em um aplicativo.

O sistema possui suporte a variáveis dinâmicas que são substituídas automaticamente na hora da exportação.

=== VARIÁVEIS GLOBAIS DISPONÍVEIS ===
• {local} : Local ou setor da contagem (ex: Almoxarifado Central, UTI)
• {responsavel} : Nome do responsável pela contagem
• {turno} : Turno de trabalho (ex: 1º Turno, Plantão Noturno)
• {data} : Data atual formatada (dd/mm/aaaa)
• {hora} : Horário da contagem (hh:mm)
• {total_cheios} : Quantidade total somada de cilindros cheios
• {total_vazios} : Quantidade total somada de cilindros vazios
• {total_geral} : Soma total geral de cilindros
• {total_tipos} : Total de tipos de gases registrados
• {total_baixo} : Total de itens com estoque baixo/crítico
• {estoque_baixo} : Lista resumida apenas dos itens abaixo do estoque mínimo
• {alertas} : Bloco com aviso destacado de itens zerados ou baixos
• {itens} : Bloco com a listagem de todos os cilindros formatados

=== VARIÁVEIS DE CADA LINHA / CILINDRO INDIVIDUAL ===
Você pode formatar cada cilindro dentro de um bloco [item] ... [/item] no template.
O bloco [item]...[/item] será repetido automaticamente para cada cilindro do estoque:
• {item_nome} ou {nome} : Nome do gás (ex: Oxigênio Medicinal, Argônio)
• {item_cheios} ou {cheios} : Quantidade de cheios
• {item_vazios} ou {vazios} : Quantidade de vazios
• {item_total} ou {total} : Soma cheios + vazios
• {item_minimo} ou {minimo} : Estoque mínimo de segurança
• {item_status} ou {status} : Situação ('OK', 'BAIXO' ou 'ZERADO')
• {item_alerta} ou {alerta} : Alerta visual (ex: ' ⚠️ [BAIXO]' ou ' 🚨 [ZERADO!]')
• {item_obs} ou {obs} : Observações anotadas no cilindro (se houver)
• {item_categoria} ou {categoria} : Categoria (Medicinal, Industrial, etc.)
• {item_favorito} ou {favorito} : Estrela ⭐ se for marcado como favorito

=== EXEMPLO DE ESTRUTURA VÁLIDA: ===
📋 *CONTROLE DE CILINDROS - {local}*
👤 Resp: {responsavel} | ⏰ Turno: {turno}
📅 Data: {data} {hora}

📦 *CILINDROS:*
[item]
• *{nome}*: {cheios} Cheios | {vazios} Vazios (Total: {total}){alerta}{obs}
[/item]

📊 *TOTAIS:*
✅ Cheios: {total_cheios} | ⭕ Vazios: {total_vazios} | 🔢 Geral: {total_geral}

{alertas}

---
${styleInstruction}
DIRETRIZES:
1. Use as tags exatamente como listadas acima (entre chaves, ex: {local}, {nome}, {cheios}).
2. Você pode usar formatação do WhatsApp (*negrito*, _itálico_, ~tachado~, \`monospaçado\`) e emojis.
3. Se quiser listar os cilindros linha por linha com formatação própria, coloque a estrutura da linha dentro de [item] e [/item]. Caso prefira usar a formatação padrão, apenas insira a tag {itens}.
4. Retorne APENAS o texto do template final, sem introdução, sem explicações em torno e sem cercar com blocos extras desnecessários, para que o usuário possa copiar e colar direto no aplicativo.`;
}

export function formatCustomTemplate(
  counters: GasCounter[],
  settings: ExportSettings,
  templateString: string,
  itemTemplateString?: string
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

  const alertBlock = lowItems.length > 0
    ? `⚠️ *Atenção: ${lowItems.length} item(ns) com estoque baixo!*\n${lowStockSummary}`
    : '';

  let processedTemplate = templateString || DEFAULT_CUSTOM_TEMPLATE;

  // Process repeat block [item]...[/item] or [itens]...[/itens] or {{#itens}}...{{/itens}} or {cada_item}...{/cada_item}
  // Suporta espaços internos em qualquer lugar dos colchetes/chaves: [item ], [ item ], [/ item], etc.
  const blockRegexes = [
    /\[\s*(?:item|itens)\s*\]([\s\S]*?)\[\s*\/\s*(?:item|itens)\s*\]/gi,
    /\{\{\s*#?\s*(?:item|itens)\s*\}\}([\s\S]*?)\{\{\s*\/\s*(?:item|itens)\s*\}\}/gi,
    /\{\s*cada_item\s*\}([\s\S]*?)\{\s*\/\s*cada_item\s*\}/gi,
    /\{\s*(?:item|itens)\s*\}([\s\S]*?)\{\s*\/\s*(?:item|itens)\s*\}/gi,
  ];

  const emptyMsg = '_Nenhum cilindro com quantidade registrado no momento._';

  for (const regex of blockRegexes) {
    processedTemplate = processedTemplate.replace(regex, (_, innerPattern: string) => {
      if (filtered.length === 0) {
        return emptyMsg;
      }
      // Remove apenas quebra de linha inicial/final do bloco, mantendo indentação interna
      const cleanPattern = innerPattern.replace(/^\r?\n/, '').replace(/\r?\n$/, '');
      return filtered
        .map(c => formatSingleItemWithTemplate(c, cleanPattern, settings))
        .join('\n');
    });
  }

  // Fallback inteligente: se o usuário não usou [item] nem {itens}, mas colocou tags de linha como {nome} ou {cheios}
  // expande automaticamente a linha para cada cilindro do estoque
  const hasItemVarsRegex = /\{(?:item_)?(?:nome|gas|rotulo|cheios?|vazios?|minimo?|status|alerta|categoria|favorito)\}/i;
  if (!/\[\s*(?:item|itens)\s*\]/i.test(templateString) && hasItemVarsRegex.test(processedTemplate)) {
    const lines = processedTemplate.split('\n');
    const newLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (hasItemVarsRegex.test(line)) {
        if (filtered.length === 0) {
          newLines.push(emptyMsg);
        } else {
          filtered.forEach(c => {
            newLines.push(formatSingleItemWithTemplate(c, line, settings));
          });
        }
      } else {
        newLines.push(line);
      }
    }
    processedTemplate = newLines.join('\n');
  }

  // Limpeza de segurança: remove qualquer tag residual de bloco que tenha sobrado
  processedTemplate = processedTemplate
    .replace(/\[\s*\/?\s*(?:item|itens)\s*\]\r?\n?/gi, '')
    .replace(/\{\{\s*\/?\s*#?\s*(?:item|itens)\s*\}\}\r?\n?/gi, '')
    .replace(/\{\s*\/?\s*cada_item\s*\}\r?\n?/gi, '');

  // Generate list items based on itemTemplateString if {itens} is present
  const effectiveItemTemplate = itemTemplateString?.trim() || DEFAULT_CUSTOM_ITEM_TEMPLATE;
  const itemsText = filtered.length > 0
    ? filtered
        .map(c => formatSingleItemWithTemplate(c, effectiveItemTemplate, settings))
        .join('\n')
    : emptyMsg;

  return processedTemplate
    .replace(/\{local\}/gi, settings.location || 'Geral')
    .replace(/\{responsavel\}/gi, settings.responsible || 'Operador')
    .replace(/\{turno\}/gi, settings.shift || '-')
    .replace(/\{data\}/gi, dateStr)
    .replace(/\{hora\}/gi, timeStr)
    .replace(/\{total_cheios\}/gi, String(totalFull))
    .replace(/\{total_vazios\}/gi, String(totalEmpty))
    .replace(/\{total_geral\}/gi, String(grandTotal))
    .replace(/\{total_tipos\}/gi, String(filtered.length))
    .replace(/\{total_baixo\}/gi, String(lowItems.length))
    .replace(/\{itens\}/gi, itemsText)
    .replace(/\{estoque_baixo\}/gi, lowStockSummary)
    .replace(/\{alertas\}/gi, alertBlock);
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
