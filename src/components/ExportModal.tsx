import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GasCounter, ExportSettings } from '../types/gas';
import {
  formatWhatsAppTable,
  formatAsciiBorderedTable,
  formatSimpleTextList,
  formatCustomTemplate,
  formatSingleItemWithTemplate,
  formatCSV,
  copyTextToClipboard,
  ExportFormatType,
  DEFAULT_CUSTOM_TEMPLATE,
  DEFAULT_CUSTOM_ITEM_TEMPLATE,
  CUSTOM_TEMPLATE_PRESETS,
  generateLlmPrompt,
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
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Wand2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: GasCounter[];
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveSnapshot?: (settings: ExportSettings) => void;
}

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
  const [customItemTemplate, setCustomItemTemplate] = useState<string>(() => {
    return localStorage.getItem('gasCounters_custom_item_template') || DEFAULT_CUSTOM_ITEM_TEMPLATE;
  });
  const [showItemConfig, setShowItemConfig] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptStyle, setPromptStyle] = useState('WhatsApp com Emojis');
  const [customPromptNote, setCustomPromptNote] = useState('');
  const [llmPromptCopied, setLlmPromptCopied] = useState(false);
  const [modalPromptCopied, setModalPromptCopied] = useState(false);
  const [lastFocusedField, setLastFocusedField] = useState<'main' | 'item'>('main');

  const mainTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

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
        return formatCustomTemplate(counters, settings, customTemplate, customItemTemplate);
      case 'whatsapp':
      default:
        return formatWhatsAppTable(counters, settings);
    }
  }, [selectedFormat, counters, settings, customTemplate, customItemTemplate]);

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

  const handleCustomItemTemplateChange = (val: string) => {
    setCustomItemTemplate(val);
    localStorage.setItem('gasCounters_custom_item_template', val);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = CUSTOM_TEMPLATE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      handleCustomTemplateChange(preset.template);
      if (preset.itemTemplate) {
        handleCustomItemTemplateChange(preset.itemTemplate);
      }
      onShowToast(`Modelo "${preset.name}" aplicado!`, 'info');
    }
  };

  const handleInsertTag = (tag: string, target?: 'main' | 'item') => {
    const targetField = target || lastFocusedField;
    if (targetField === 'item' && showItemConfig && itemInputRef.current) {
      const input = itemInputRef.current;
      const start = input.selectionStart ?? customItemTemplate.length;
      const end = input.selectionEnd ?? customItemTemplate.length;
      const nextVal = customItemTemplate.slice(0, start) + tag + customItemTemplate.slice(end);
      handleCustomItemTemplateChange(nextVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 30);
    } else {
      const textarea = mainTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? customTemplate.length;
        const end = textarea.selectionEnd ?? customTemplate.length;
        const nextVal = customTemplate.slice(0, start) + tag + customTemplate.slice(end);
        handleCustomTemplateChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 30);
      } else {
        handleCustomTemplateChange(customTemplate + tag);
      }
    }
    onShowToast(`Tag ${tag} inserida!`, 'info');
  };

  const handleQuickCopyLlmPrompt = async () => {
    const promptText = generateLlmPrompt();
    const ok = await copyTextToClipboard(promptText);
    if (ok) {
      setLlmPromptCopied(true);
      onShowToast('Prompt para IA copiado! Cole no ChatGPT, Claude ou Gemini.');
      setTimeout(() => setLlmPromptCopied(false), 3000);
    } else {
      onShowToast('Não foi possível copiar o prompt.', 'error');
    }
  };

  const handleCopyModalLlmPrompt = async () => {
    const fullNote = customPromptNote.trim()
      ? `${promptStyle} - ${customPromptNote.trim()}`
      : promptStyle;
    const promptText = generateLlmPrompt(fullNote);
    const ok = await copyTextToClipboard(promptText);
    if (ok) {
      setModalPromptCopied(true);
      onShowToast('Prompt personalizado copiado para a área de transferência!');
      setTimeout(() => setModalPromptCopied(false), 3000);
    } else {
      onShowToast('Não foi possível copiar o prompt.', 'error');
    }
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
            <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-800/60 space-y-3 shadow-xs">
              {/* Header do Custom */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-200 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      Modelo Personalizado de Exportação
                    </h3>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
                      Personalize cabeçalhos, totais e a linha de cada cilindro
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleQuickCopyLlmPrompt}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95"
                    title="Copiar prompt pronto para colar no ChatGPT, Claude ou Gemini"
                  >
                    {llmPromptCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Prompt Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Copiar Prompt p/ IA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPromptModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors"
                    title="Personalizar prompt com estilos e instruções específicas"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Ajustar Prompt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCustomTemplateChange(DEFAULT_CUSTOM_TEMPLATE);
                      handleCustomItemTemplateChange(DEFAULT_CUSTOM_ITEM_TEMPLATE);
                      onShowToast('Modelo padrão restaurado!', 'info');
                    }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 font-medium px-1.5 py-1 hover:underline"
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>

              {/* Seletor de Presets Prontos */}
              <div>
                <span className="block text-[11px] font-semibold text-purple-900 dark:text-purple-300 mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-600" />
                  Modelos prontos para aplicar com 1 clique:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_TEMPLATE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800/90 border border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-300 transition-colors shadow-2xs"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Principal do Modelo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950 dark:text-purple-200">
                    Estrutura do Relatório (Template Principal):
                  </label>
                  <span className="text-[10px] text-purple-700 dark:text-purple-400">
                    Use <code className="bg-purple-100 dark:bg-purple-900/60 px-1 py-0.2 rounded font-mono">{'{itens}'}</code> ou o bloco <code className="bg-purple-100 dark:bg-purple-900/60 px-1 py-0.2 rounded font-mono">[item]...[/item]</code>
                  </span>
                </div>
                <textarea
                  ref={mainTextareaRef}
                  rows={6}
                  value={customTemplate}
                  onFocus={() => setLastFocusedField('main')}
                  onChange={(e) => handleCustomTemplateChange(e.target.value)}
                  placeholder="Ex: 📋 RELATÓRIO - {local}&#10;Data: {data} {hora}&#10;&#10;[item]&#10;• {nome}: {cheios} cheios, {vazios} vazios {alerta}&#10;[/item]&#10;&#10;Total: {total_geral}"
                  className="w-full text-xs font-mono p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                />
              </div>

              {/* Variáveis dos Itens da Linha */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-200/80 dark:border-purple-800/50 space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1">
                      <Wand2 className="w-3 h-3 text-purple-600" />
                      Variáveis de cada item da linha (clique para inserir no modelo):
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Use em [item]...[/item] ou no formato de item
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { tag: '{nome}', desc: 'Nome do gás', label: 'Nome' },
                      { tag: '{cheios}', desc: 'Qtd Cheios', label: 'Cheios' },
                      { tag: '{vazios}', desc: 'Qtd Vazios', label: 'Vazios' },
                      { tag: '{total}', desc: 'Total do cilindro', label: 'Total' },
                      { tag: '{minimo}', desc: 'Estoque Mínimo', label: 'Mínimo' },
                      { tag: '{status}', desc: 'OK / BAIXO / ZERADO', label: 'Status' },
                      { tag: '{alerta}', desc: '⚠️ ou 🚨 Alerta de baixo', label: 'Alerta' },
                      { tag: '{obs}', desc: 'Observações do cilindro', label: 'Obs' },
                      { tag: '{categoria}', desc: 'Medicinal/Industrial', label: 'Categoria' },
                      { tag: '{favorito}', desc: 'Estrela ⭐ se favorito', label: 'Favorito' },
                      { tag: '\n[item]\n• *{nome}*: {cheios} Ch / {vazios} Vz (Tot: {total}){alerta}{obs}\n[/item]\n', desc: 'Inserir bloco de repetição completo', label: '[item]...[/item]', highlight: true },
                    ].map(({ tag, desc, label, highlight }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertTag(tag)}
                        title={`${tag} : ${desc} (clique para inserir)`}
                        className={`px-1.5 py-0.8 text-[11px] rounded font-mono font-semibold transition-colors flex items-center gap-1 ${
                          highlight
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-2xs'
                            : 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 border border-purple-200 dark:border-purple-700/60'
                        }`}
                      >
                        <span>{label}</span>
                        <code className="text-[9px] opacity-75">{tag.trim().startsWith('[') ? '[bloco]' : tag}</code>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variáveis Globais */}
                <div className="pt-1.5 border-t border-purple-100 dark:border-purple-800/40">
                  <span className="block text-[11px] font-semibold text-purple-900 dark:text-purple-300 mb-1">
                    Variáveis globais do relatório (cabeçalho e totais):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { tag: '{local}', label: 'Local' },
                      { tag: '{responsavel}', label: 'Responsável' },
                      { tag: '{turno}', label: 'Turno' },
                      { tag: '{data}', label: 'Data' },
                      { tag: '{hora}', label: 'Hora' },
                      { tag: '{total_cheios}', label: 'Tot. Cheios' },
                      { tag: '{total_vazios}', label: 'Tot. Vazios' },
                      { tag: '{total_geral}', label: 'Tot. Geral' },
                      { tag: '{total_tipos}', label: 'Qtd Tipos' },
                      { tag: '{itens}', label: 'Lista {itens}' },
                      { tag: '{alertas}', label: 'Bloco Alertas' },
                      { tag: '{estoque_baixo}', label: 'Lista Baixos' },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertTag(tag)}
                        title={`${tag} (clique para inserir)`}
                        className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {label} <span className="opacity-60">{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Configuração avançada da linha {itens} (quando não usa [item]) */}
              <div className="rounded-xl border border-purple-200/60 dark:border-purple-800/40 bg-purple-100/40 dark:bg-purple-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowItemConfig(!showItemConfig)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-200 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚙️ Formato da Linha para a tag <code className="font-mono text-[11px] font-bold">{'{itens}'}</code></span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                      (aplicado automaticamente em cada cilindro)
                    </span>
                  </span>
                  {showItemConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showItemConfig && (
                  <div className="p-3 border-t border-purple-200/60 dark:border-purple-800/40 space-y-2 bg-white/50 dark:bg-slate-900/40">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Caso o seu modelo principal contenha <code className="font-mono text-purple-700 dark:text-purple-300 font-bold">{'{itens}'}</code>, cada cilindro será formatado de acordo com o padrão abaixo:
                    </p>
                    <div className="flex gap-2">
                      <input
                        ref={itemInputRef}
                        type="text"
                        value={customItemTemplate}
                        onFocus={() => setLastFocusedField('item')}
                        onChange={(e) => handleCustomItemTemplateChange(e.target.value)}
                        placeholder="Ex: • {nome}: {cheios} CH / {vazios} VZ (Tot: {total}){alerta}{obs}"
                        className="flex-1 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleCustomItemTemplateChange(DEFAULT_CUSTOM_ITEM_TEMPLATE)}
                        className="px-2 py-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-lg whitespace-nowrap transition-colors"
                      >
                        Padrão
                      </button>
                    </div>

                    {/* Exemplo de renderização da linha em tempo real */}
                    <div className="text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                        Exemplo de Linha Renderizada:
                      </span>
                      {formatSingleItemWithTemplate(
                        counters[0] || {
                          id: 'demo',
                          label: 'Oxigênio Medicinal',
                          full: 8,
                          empty: 3,
                          notes: 'Setor A',
                          isFavorite: true,
                          expanded: false,
                          minStock: 2,
                        },
                        customItemTemplate,
                        settings
                      )}
                    </div>
                  </div>
                )}
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

      {/* Modal Assistente de Prompt para LLM */}
      {showPromptModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowPromptModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/80 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-purple-100 dark:border-purple-900/50 bg-linear-to-r from-purple-500/10 via-indigo-500/5 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Criar Layout com IA (LLM)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                      ChatGPT • Claude • Gemini
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Copie o prompt detalhado e peça para uma inteligência artificial desenhar seu relatório ideal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Estilos Rápidos */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  1. Escolha o objetivo ou estilo do layout:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'WhatsApp com Emojis', label: '📱 WhatsApp com Emojis' },
                    { id: 'Plantão Hospitalar / UTI', label: '🏥 Plantão Hospitalar' },
                    { id: 'Tabela Markdown / Monospaçado', label: '📊 Tabela Markdown' },
                    { id: 'Compacto para SMS e Rádio', label: '📻 Compacto / Rádio' },
                    { id: 'Auditoria e Engenharia Clínica', label: '📋 Auditoria Formal' },
                    { id: 'Outro (Personalizado)', label: '✨ Estilo Livre' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPromptStyle(item.id)}
                      className={`px-2.5 py-2 rounded-xl border text-left font-medium transition-all ${
                        promptStyle === item.id
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instrução extra personalizada */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  2. Instruções extras para a IA (opcional):
                </label>
                <input
                  type="text"
                  value={customPromptNote}
                  onChange={(e) => setCustomPromptNote(e.target.value)}
                  placeholder="Ex: Destaque o oxigênio medicinal, use divisórias duplas e inclua aviso para a farmácia..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Prévia do Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    3. Pré-visualização do Prompt que será copiado:
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Contém todas as variáveis de cabeçalho e de linha
                  </span>
                </div>
                <textarea
                  readOnly
                  rows={7}
                  value={generateLlmPrompt(
                    customPromptNote.trim()
                      ? `${promptStyle} - ${customPromptNote.trim()}`
                      : promptStyle
                  )}
                  className="w-full p-2.5 font-mono text-[11px] leading-relaxed rounded-xl bg-slate-950 text-purple-200 border border-slate-800 focus:outline-none select-all"
                />
              </div>

              {/* Passo a Passo */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  💡 Como funciona:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>Clique no botão abaixo para copiar o prompt completo.</li>
                  <li>Abra o ChatGPT, Claude, Gemini, DeepSeek ou Copilot e cole o prompt.</li>
                  <li>A IA responderá apenas com o modelo de texto pronto.</li>
                  <li>Copie o resultado e cole no campo <strong>Modelo Personalizado</strong> no app!</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleCopyModalLlmPrompt}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-98"
              >
                {modalPromptCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Prompt Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Prompt para a IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
