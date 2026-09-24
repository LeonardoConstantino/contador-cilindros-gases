import { GasCounter, ExportSettings } from '../types/gas';

export interface GenerateInventoryImageOptions {
  counters: GasCounter[];
  settings: ExportSettings;
  theme?: 'light' | 'dark';
}

export function generateInventoryCanvas({
  counters,
  settings,
  theme = 'light',
}: GenerateInventoryImageOptions): HTMLCanvasElement {
  const filtered = counters.filter((c) => {
    if (settings.includeEmptyRows) return true;
    return c.full > 0 || c.empty > 0;
  });

  const totalFull = filtered.reduce((acc, c) => acc + c.full, 0);
  const totalEmpty = filtered.reduce((acc, c) => acc + c.empty, 0);
  const grandTotal = totalFull + totalEmpty;

  const lowStockItems = filtered.filter((c) => {
    const min = typeof c.minStock === 'number' ? c.minStock : 2;
    return min > 0 && c.full <= min;
  });
  const hasLowStock = Boolean(settings.indicateLowStock && lowStockItems.length > 0);
  const alertBannerHeight = hasLowStock ? 48 : 0;

  const width = 1200;
  const paddingX = 48;
  const paddingY = 0; // header começa no topo absoluto

  const accentBarWidth = 8;        // barra lateral azul-escuro
  const headerBgHeight = 148;      // área de fundo do cabeçalho
  const metaCardHeight = 52;
  const metaCardY = 76;
  const dividerHeight = 1;
  const tableHeaderHeight = 52;
  const rowHeight = 52;
  const totalRowHeight = 64;
  const notesHeight = settings.includeNotes ? 80 : 0;
  const footerHeight = 56;
  const rowsCount = Math.max(filtered.length, 1);

  const height =
    headerBgHeight +
    dividerHeight +
    tableHeaderHeight +
    rowsCount * rowHeight +
    totalRowHeight +
    alertBannerHeight +
    notesHeight +
    footerHeight;

  const canvas = document.createElement('canvas');
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2) : 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o contexto Canvas 2D.');
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';

  // Paleta corporativa refinada
  const colors = {
    // Superfícies
    bg:              isDark ? '#0f172a' : '#f8fafc',
    headerBg:        isDark ? '#0c1929' : '#f0f7ff',
    cardBg:          isDark ? '#1e293b' : '#ffffff',
    tableHeaderBg:   isDark ? '#0c4a6e' : '#0c4a6e', // azul-marinho em ambos
    rowEven:         isDark ? '#1e293b' : '#ffffff',
    rowOdd:          isDark ? '#162235' : '#f8fafc',
    totalBg:         isDark ? '#0c1929' : '#f0f7ff',

    // Textos
    textPrimary:     isDark ? '#f1f5f9' : '#0f172a',
    textSecondary:   isDark ? '#94a3b8' : '#64748b',
    textTableHeader: '#bfdbfe', // sempre claro sobre azul-marinho

    // Bordas
    border:          isDark ? '#1e3a5f' : '#e2e8f0',
    headerDivider:   isDark ? '#1e3a5f' : '#bfdbfe',
    totalDivider:    isDark ? '#1e3a5f' : '#0c4a6e',

    // Acento lateral
    accentBar:       '#0c4a6e',

    // Badges — soft (fundo + texto semântico para melhor leitura)
    greenBadgeBg:    isDark ? '#14532d' : '#dcfce7',
    greenBadgeText:  isDark ? '#86efac' : '#166534',
    redBadgeBg:      isDark ? '#7f1d1d' : '#fee2e2',
    redBadgeText:    isDark ? '#fca5a5' : '#991b1b',
    amberBadgeBg:    isDark ? '#451a03' : '#fef3c7',
    amberBadgeText:  isDark ? '#fcd34d' : '#b45309',

    // Badges de total (sólidos, mais enfáticos)
    greenTotalBg:    isDark ? '#166534' : '#166534',
    greenTotalText:  isDark ? '#dcfce7' : '#dcfce7',
    redTotalBg:      isDark ? '#991b1b' : '#991b1b',
    redTotalText:    isDark ? '#fee2e2' : '#fee2e2',

    // Total geral (azul corporativo)
    totalAccent:     isDark ? '#38bdf8' : '#0c4a6e',

    // Traços laterais de linha (cada gás tem uma cor discreta)
    rowAccents: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#6366f1'],
  };

  // ─── 1. Fundo geral ───────────────────────────────────────────────────────
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // ─── 2. Barra lateral de acento ──────────────────────────────────────────
  ctx.fillStyle = colors.accentBar;
  ctx.fillRect(0, 0, accentBarWidth, height);

  // ─── 3. Fundo do cabeçalho ───────────────────────────────────────────────
  ctx.fillStyle = colors.headerBg;
  ctx.fillRect(accentBarWidth, 0, width - accentBarWidth, headerBgHeight);

  // Divisor inferior do cabeçalho
  ctx.fillStyle = colors.headerDivider;
  ctx.fillRect(accentBarWidth, headerBgHeight, width - accentBarWidth, dividerHeight);

  // ─── 4. Ícone / logo placeholder ─────────────────────────────────────────
  const iconX = paddingX + accentBarWidth;
  const iconY = 20;
  const iconSize = 40;
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 8, colors.accentBar);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('G', iconX + iconSize / 2, iconY + iconSize / 2 + 7);
  ctx.textAlign = 'left';

  // ─── 5. Títulos do cabeçalho ──────────────────────────────────────────────
  const titleX = iconX + iconSize + 16;
  ctx.fillStyle = colors.accentBar;
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('RELATÓRIO DE ESTOQUE', titleX, iconY + 17);

  ctx.fillStyle = colors.textSecondary;
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Contagem de Cilindros de Gases', titleX, iconY + 36);

  // Linha separadora tênue dentro do header
  ctx.strokeStyle = colors.headerDivider;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(paddingX + accentBarWidth, 68);
  ctx.lineTo(width - paddingX, 68);
  ctx.stroke();

  // ─── 6. Cards de metadados ───────────────────────────────────────────────
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const meta = [
    { label: 'LOCAL',        value: settings.location?.trim()    || 'Geral'          },
    { label: 'RESPONSÁVEL',  value: settings.responsible?.trim() || 'Não informado'  },
    { label: 'TURNO',        value: settings.shift?.trim()       || 'Geral'          },
    { label: 'DATA / HORA',  value: `${dateStr} — ${timeStr}`                        },
  ];

  const cardTotalWidth = width - (paddingX + accentBarWidth) - paddingX;
  const cardGap = 16;
  const cardW = (cardTotalWidth - cardGap * (meta.length - 1)) / meta.length;

  meta.forEach((m, i) => {
    const cx = paddingX + accentBarWidth + i * (cardW + cardGap);
    roundRect(ctx, cx, metaCardY, cardW, metaCardHeight, 4, colors.cardBg, colors.border, 0.5);

    ctx.fillStyle = colors.textSecondary;
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText(m.label, cx + 12, metaCardY + 17);

    ctx.fillStyle = colors.textPrimary;
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    // Truncamento seguro para o card
    let val = m.value;
    if (ctx.measureText(val).width > cardW - 24) {
      while (ctx.measureText(val + '…').width > cardW - 24 && val.length > 4) val = val.slice(0, -1);
      val += '…';
    }
    ctx.fillText(val, cx + 12, metaCardY + 37);
  });

  let currentY = headerBgHeight + dividerHeight;

  // ─── 7. Cabeçalho da tabela ──────────────────────────────────────────────
  ctx.fillStyle = colors.tableHeaderBg;
  ctx.fillRect(accentBarWidth, currentY, width - accentBarWidth, tableHeaderHeight);

  const colX = {
    gas:   paddingX + accentBarWidth + 12,
    full:  width - 390,
    empty: width - 250,
    total: width - 110,
  };

  ctx.fillStyle = colors.textTableHeader;
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TIPO DE GÁS / ITEM', colX.gas, currentY + 32);

  ctx.textAlign = 'center';
  ctx.fillText('CHEIOS', colX.full,  currentY + 32);
  ctx.fillText('VAZIOS', colX.empty, currentY + 32);
  ctx.fillText('TOTAL',  colX.total, currentY + 32);
  ctx.textAlign = 'left';

  currentY += tableHeaderHeight;

  // ─── 8. Linhas de dados ──────────────────────────────────────────────────
  if (filtered.length === 0) {
    ctx.fillStyle = colors.rowEven;
    ctx.fillRect(accentBarWidth, currentY, width - accentBarWidth, rowHeight);
    ctx.fillStyle = colors.textSecondary;
    ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Nenhum cilindro registrado no momento.', colX.gas, currentY + 32);
    currentY += rowHeight;
  } else {
    filtered.forEach((counter, idx) => {
      const rowBg = idx % 2 === 0 ? colors.rowEven : colors.rowOdd;
      ctx.fillStyle = rowBg;
      ctx.fillRect(accentBarWidth, currentY, width - accentBarWidth, rowHeight);

      // Traço lateral colorido por item (identidade visual por gás)
      const accentColor = colors.rowAccents[idx % colors.rowAccents.length];
      ctx.fillStyle = accentColor;
      ctx.fillRect(accentBarWidth, currentY, 3, rowHeight);

      // Divisor inferior sutil
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(accentBarWidth + 3, currentY + rowHeight);
      ctx.lineTo(width - paddingX, currentY + rowHeight);
      ctx.stroke();

      // Nome do gás e status
      const minStock = typeof counter.minStock === 'number' ? counter.minStock : 2;
      const isLowStock = Boolean(settings.indicateLowStock && minStock > 0 && counter.full <= minStock);
      const isCritical = isLowStock && counter.full === 0;

      ctx.fillStyle = colors.textPrimary;
      ctx.font = '600 15px system-ui, -apple-system, sans-serif';
      let gasLabel = counter.label;
      if (isLowStock) {
        gasLabel += isCritical ? ' [ZERADO!]' : ' [BAIXO]';
      }
      if (counter.notes?.trim() && settings.includeNotes) gasLabel += ` (${counter.notes.trim()})`;
      const maxLabelWidth = colX.full - colX.gas - 24;
      if (ctx.measureText(gasLabel).width > maxLabelWidth) {
        while (ctx.measureText(gasLabel + '…').width > maxLabelWidth && gasLabel.length > 4) {
          gasLabel = gasLabel.slice(0, -1);
        }
        gasLabel += '…';
      }
      ctx.fillText(gasLabel, colX.gas, currentY + rowHeight / 2 + 6);

      // Badges soft (fundo colorido claro / alerta se estoque de cheios baixo)
      if (isLowStock) {
        if (isCritical) {
          drawPill(ctx, colX.full - 34, currentY + 13, 68, 26, colors.redBadgeBg, '0 🚨', colors.redBadgeText, true);
        } else {
          drawPill(ctx, colX.full - 34, currentY + 13, 68, 26, colors.amberBadgeBg, `${counter.full} ⚠️`, colors.amberBadgeText, true);
        }
      } else {
        drawPill(ctx, colX.full - 34, currentY + 13, 68, 26, colors.greenBadgeBg, String(counter.full), colors.greenBadgeText);
      }
      drawPill(ctx, colX.empty - 34, currentY + 13, 68, 26, colors.redBadgeBg, String(counter.empty), colors.redBadgeText);

      // Total da linha
      const rowTotal = counter.full + counter.empty;
      ctx.fillStyle = colors.textPrimary;
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(rowTotal), colX.total, currentY + rowHeight / 2 + 6);
      ctx.textAlign = 'left';

      currentY += rowHeight;
    });
  }

  // ─── 9. Linha de Total Geral ─────────────────────────────────────────────
  // Divisor superior enfático
  ctx.fillStyle = colors.totalDivider;
  ctx.fillRect(accentBarWidth, currentY, width - accentBarWidth, 2);

  ctx.fillStyle = colors.totalBg;
  ctx.fillRect(accentBarWidth, currentY + 2, width - accentBarWidth, totalRowHeight - 2);

  ctx.fillStyle = colors.totalAccent;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL GERAL', colX.gas, currentY + totalRowHeight / 2 + 7);

  // Badges sólidos no total (mais peso visual)
  drawPill(ctx, colX.full  - 34, currentY + 17, 68, 30, colors.greenTotalBg, String(totalFull),  colors.greenTotalText, true);
  drawPill(ctx, colX.empty - 34, currentY + 17, 68, 30, colors.redTotalBg,   String(totalEmpty), colors.redTotalText,   true);

  ctx.fillStyle = colors.totalAccent;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(grandTotal), colX.total, currentY + totalRowHeight / 2 + 8);
  ctx.textAlign = 'left';

  currentY += totalRowHeight;

  // ─── 9.5. Banner de Alerta de Estoque Baixo (se houver e estiver ativo) ───
  if (hasLowStock) {
    const bannerH = 34;
    const bannerY = currentY + 7;
    const bannerBg = isDark ? '#451a03' : '#fffbeb';
    const bannerBorder = isDark ? '#b45309' : '#fde68a';
    const bannerText = isDark ? '#fde047' : '#92400e';

    roundRect(
      ctx,
      paddingX + accentBarWidth,
      bannerY,
      width - (paddingX + accentBarWidth) - paddingX,
      bannerH,
      6,
      bannerBg,
      bannerBorder,
      1
    );

    ctx.fillStyle = bannerText;
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    const names = lowStockItems.map(c => `${c.label}: ${c.full}`).join(' | ');
    const alertMsg = `⚠️ ALERTA: ${lowStockItems.length} ${lowStockItems.length === 1 ? 'item com estoque de cheios baixo' : 'itens com estoque de cheios baixo'} (${names})`;

    let safeMsg = alertMsg;
    const maxBannerWidth = width - (paddingX + accentBarWidth) - paddingX - 28;
    if (ctx.measureText(safeMsg).width > maxBannerWidth) {
      while (ctx.measureText(safeMsg + '…').width > maxBannerWidth && safeMsg.length > 10) {
        safeMsg = safeMsg.slice(0, -1);
      }
      safeMsg += '…';
    }

    ctx.fillText(safeMsg, paddingX + accentBarWidth + 12, bannerY + bannerH / 2 + 4);
    currentY += alertBannerHeight;
  }

  // ─── 10. Rodapé ──────────────────────────────────────────────────────────
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(accentBarWidth, currentY + 16);
  ctx.lineTo(width - paddingX, currentY + 16);
  ctx.stroke();

  ctx.fillStyle = colors.textSecondary;
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Relatório gerado via Contador de Cilindros de Gases  •  Controle de Estoque Ágil',
    paddingX + accentBarWidth,
    currentY + 38
  );

  ctx.textAlign = 'right';
  ctx.fillText('CONFIDENCIAL', width - paddingX, currentY + 38);
  ctx.textAlign = 'left';

  return canvas;
}

// ─── Auxiliar interno: roundRect ─────────────────────────────────────────────
// Não exportado — uso exclusivo interno desta função.
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string, strokeWidth = 1
) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  if (fill)   { ctx.fillStyle = fill;     ctx.fill();   }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
}

// ─── drawPill — assinatura preservada ────────────────────────────────────────
function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bgColor: string, text: string, textColor: string, isBold = false
) {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, 5);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = `${isBold ? 'bold' : '600'} 13px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 5);
  ctx.restore();
}

// ─── Funções exportadas — assinaturas 100% intactas ──────────────────────────

export function getCanvasPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao exportar canvas para Blob PNG'));
    }, 'image/png');
  });
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = 'contagem_cilindros.png') {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function shareOrCopyCanvasPng(
  canvas: HTMLCanvasElement,
  title = 'Contagem de Cilindros de Gases'
): Promise<'shared' | 'copied' | 'downloaded'> {
  const blob = await getCanvasPngBlob(canvas);
  const file = new File([blob], `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`, {
    type: 'image/png',
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title, text: 'Contagem de Cilindros de Gases', files: [file] });
      return 'shared';
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return 'shared';
    }
  }

  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    } catch { /* segue para download */ }
  }

  downloadCanvasAsPng(canvas, file.name);
  return 'downloaded';
}