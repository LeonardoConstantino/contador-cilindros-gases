import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GasCounter, ExportSettings } from '../types/gas';
import {
  formatWhatsAppTable,
  formatAsciiBorderedTable,
  formatSimpleTextList,
  formatCustomTemplate,
  formatCSV,
  copyTextToClipboard,
  ExportFormatType,
} from '../utils/exportFormatters';
import {
  generateInventoryCanvas,
  downloadCanvasAsPng,
  shareOrCopyCanvasPng,
} from '../utils/canvasExport';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  MessageSquare,
  MapPin,
  User,
  Clock,
  Table,
  AlignLeft,
  Sliders,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: GasCounter[];
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveSnapshot?: (settings: ExportSettings) => void;
}

const DEFAULT_CUSTOM_TEMPLATE = `📋 RELATÓRIO DE GASES - {local}
Responsável: {responsavel} | Turno: {turno}
Data: {data} {hora}

Estoque Atual:
{itens}

Totais:
Cheios: {total_cheios} | Vazios: {total_vazios}
Total Geral de Cilindros: {total_geral}`;

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  counters,
  onShowToast,
  onSaveSnapshot,
}) => {
  const [settings, setSettings] = useState<ExportSettings>(() => {
    const savedLowStock = localStorage.getItem('gasCounters_export_indicateLowStock');
    return {
      location: localStorage.getItem('gasCounters_last_location') || 'Almoxarifado Geral',
      responsible: localStorage.getItem('gasCounters_last_responsible') || '',
      shift: '',
      includeEmptyRows: false,
      includeNotes: true,
      indicateLowStock: savedLowStock !== null ? savedLowStock === 'true' : true,
    };
  });

  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType | 'image'>('whatsapp');
  const [customTemplate, setCustomTemplate] = useState<string>(() => {
    return localStorage.getItem('gasCounters_custom_template') || DEFAULT_CUSTOM_TEMPLATE;
  });
  const [editablePreview, setEditablePreview] = useState<string>('');
  const [isManualEditing, setIsManualEditing] = useState<boolean>(false);

  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageActionLoading, setImageActionLoading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate standard preview according to format
  const generatedText = useMemo(() => {
    switch (selectedFormat) {
      case 'table':
        return formatAsciiBorderedTable(counters, settings);
      case 'simple':
        return formatSimpleTextList(counters, settings);
      case 'custom':
        return formatCustomTemplate(counters, settings, customTemplate);
      case 'whatsapp':
      default:
        return formatWhatsAppTable(counters, settings);
    }
  }, [selectedFormat, counters, settings, customTemplate]);

  // Atualiza o canvas e o preview da imagem quando estiver no modo 'image' ou configurações mudarem
  useEffect(() => {
    if (!isOpen) return;

    try {
      const canvas = generateInventoryCanvas({
        counters,
        settings,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
      canvasRef.current = canvas;
      const url = canvas.toDataURL('image/png');
      setImagePreviewUrl(url);
    } catch {
      // Ignore canvas render error
    }
  }, [isOpen, counters, settings, selectedFormat]);

  // Actual text to export (either manual edit or generated)
  const displayText = isManualEditing ? editablePreview : generatedText;

  if (!isOpen) return null;

  const triggerAutoSave = () => {
    if (autoSaveHistory && onSaveSnapshot) {
      onSaveSnapshot(settings);
    }
  };

  const handleUpdateLocation = (val: string) => {
    setSettings(prev => ({ ...prev, location: val }));
    localStorage.setItem('gasCounters_last_location', val);
  };

  const handleUpdateResponsible = (val: string) => {
    setSettings(prev => ({ ...prev, responsible: val }));
    localStorage.setItem('gasCounters_last_responsible', val);
  };

  const handleFormatChange = (fmt: ExportFormatType | 'image') => {
    setSelectedFormat(fmt);
    setIsManualEditing(false);
  };

  const handleCustomTemplateChange = (val: string) => {
    setCustomTemplate(val);
    localStorage.setItem('gasCounters_custom_template', val);
  };

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(displayText);
    if (ok) {
      setCopied(true);
      triggerAutoSave();
      onShowToast('Texto copiado com sucesso e contagem arquivada!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      onShowToast('Não foi possível copiar automaticamente.', 'error');
    }
  };

  const handleNativeShare = async () => {
    triggerAutoSave();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Contagem de Cilindros de Gases',
          text: displayText,
        });
        onShowToast('Compartilhado e salvo no histórico!');
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadCSV = () => {
    triggerAutoSave();
    const csvContent = formatCSV(counters, settings.location, settings);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeLoc = (settings.location || 'geral').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `inventario_cilindros_${safeLoc}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Planilha CSV baixada e contagem salva no histórico!');
  };

  // Funções para Imagem PNG
  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    triggerAutoSave();
    const safeLoc = (settings.location || 'geral').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `relatorio_cilindros_${safeLoc}_${new Date().toISOString().slice(0, 10)}.png`;
    downloadCanvasAsPng(canvasRef.current, filename);
    onShowToast('Imagem PNG baixada com sucesso!');
  };

  const handleShareOrCopyImage = async () => {
    if (!canvasRef.current) return;
    setImageActionLoading(true);
    triggerAutoSave();
    try {
      const result = await shareOrCopyCanvasPng(canvasRef.current, 'Contagem de Cilindros');
      if (result === 'shared') {
        onShowToast('Imagem compartilhada com sucesso!');
      } else if (result === 'copied') {
        onShowToast('Imagem copiada para a área de transferência! (Cole no WhatsApp)');
      } else {
        onShowToast('Imagem PNG baixada para seu dispositivo!');
      }
    } catch {
      handleDownloadImage();
    } finally {
      setImageActionLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Exportar e Compartilhar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o formato ideal para WhatsApp, relatórios em imagem ou planilhas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Seletor de Formato */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Escolha o formato de saída:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleFormatChange('whatsapp')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedFormat === 'whatsapp'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('image')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedFormat === 'image'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Imagem PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('table')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedFormat === 'table'
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Table className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Tabela ASCII</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('simple')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedFormat === 'simple'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlignLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Texto Simples</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('custom')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all col-span-2 sm:col-span-1 ${
                  selectedFormat === 'custom'
                    ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Editor de Template Personalizado (aparece apenas quando custom está ativo) */}
          {selectedFormat === 'custom' && (
            <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Modelo Personalizado:
                </span>
                <button
                  type="button"
                  onClick={() => handleCustomTemplateChange(DEFAULT_CUSTOM_TEMPLATE)}
                  className="text-[11px] text-purple-700 dark:text-purple-400 hover:underline font-medium"
                >
                  Restaurar padrão
                </button>
              </div>
              <textarea
                rows={5}
                value={customTemplate}
                onChange={(e) => handleCustomTemplateChange(e.target.value)}
                placeholder="Insira as tags: {local}, {responsavel}, {turno}, {data}, {hora}, {itens}, {total_cheios}, {total_vazios}, {total_geral}"
                className="w-full text-xs font-mono p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="text-[11px] text-purple-800 dark:text-purple-300 flex flex-wrap gap-1">
                <span className="font-semibold">Tags disponíveis:</span>
                <code>{'{local}'}</code>, <code>{'{responsavel}'}</code>, <code>{'{turno}'}</code>,{' '}
                <code>{'{data}'}</code>, <code>{'{itens}'}</code>, <code>{'{estoque_baixo}'}</code>, <code>{'{total_cheios}'}</code>,{' '}
                <code>{'{total_vazios}'}</code>, <code>{'{total_geral}'}</code>
              </div>
            </div>
          )}

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="export-location"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                Local da contagem:
              </label>
              <input
                id="export-location"
                type="text"
                value={settings.location}
                onChange={(e) => handleUpdateLocation(e.target.value)}
                placeholder="Ex: Almoxarifado, UTI..."
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="export-responsible"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5 text-sky-500" />
                Responsável:
              </label>
              <input
                id="export-responsible"
                type="text"
                value={settings.responsible}
                onChange={(e) => handleUpdateResponsible(e.target.value)}
                placeholder="Ex: Lucas Constantino"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="export-shift"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                Turno (opcional):
              </label>
              <input
                id="export-shift"
                type="text"
                value={settings.shift}
                onChange={(e) => setSettings(prev => ({ ...prev, shift: e.target.value }))}
                placeholder="Ex: 1º Turno, Plantão Noite..."
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Opções de formatação */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.includeEmptyRows}
                onChange={(e) => setSettings(prev => ({ ...prev, includeEmptyRows: e.target.checked }))}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Incluir saldo zerado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.includeNotes}
                onChange={(e) => setSettings(prev => ({ ...prev, includeNotes: e.target.checked }))}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Incluir observações</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.indicateLowStock ?? true}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSettings(prev => ({ ...prev, indicateLowStock: val }));
                  localStorage.setItem('gasCounters_export_indicateLowStock', String(val));
                }}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1.5">
                <span>Indicar estoque de cheios baixo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold">
                  ⚠️ Alerta
                </span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-sky-700 dark:text-sky-400 font-medium">
              <input
                type="checkbox"
                checked={autoSaveHistory}
                onChange={(e) => setAutoSaveHistory(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Salvar no Histórico ao exportar</span>
            </label>
          </div>

          {/* Pré-visualização: Imagem PNG ou Texto */}
          {selectedFormat === 'image' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Pré-visualização da Imagem PNG (Renderizada via Canvas):
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pronta para WhatsApp e download
                </span>
              </div>

              <div className="w-full max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2 flex justify-center">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Pré-visualização do inventário de cilindros"
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Gerando imagem do inventário...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pré-visualização do texto:
                </span>
                <div className="flex items-center gap-2">
                  {isManualEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualEditing(false);
                        setEditablePreview('');
                      }}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Descartar edição manual
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditablePreview(generatedText);
                        setIsManualEditing(true);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ✏️ Editar texto antes de copiar
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={8}
                value={displayText}
                onChange={(e) => {
                  setIsManualEditing(true);
                  setEditablePreview(e.target.value);
                }}
                className="w-full p-3 font-mono text-xs rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 selection:bg-emerald-600 selection:text-white leading-relaxed resize-y overflow-x-auto whitespace-pre"
                placeholder="O texto formatado aparecerá aqui..."
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
            title="Baixar planilha para Excel/LibreOffice"
          >
            <Download className="w-4 h-4" />
            <span>Baixar CSV</span>
          </button>

          {selectedFormat === 'image' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Baixar imagem PNG"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Baixar PNG</span>
              </button>

              <button
                type="button"
                onClick={handleShareOrCopyImage}
                disabled={imageActionLoading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>{imageActionLoading ? 'Processando...' : 'Compartilhar PNG'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Compartilhar direto no WhatsApp"
                >
                  <Share2 className="w-4 h-4 text-sky-500" />
                  <span>Compartilhar</span>
                </button>
              )}

              <button
                id="btn-copy-whatsapp"
                onClick={handleCopy}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
