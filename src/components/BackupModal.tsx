import React, { useState, useRef } from 'react';
import { GasCounter, CountSnapshot } from '../types/gas';
import {
  downloadBackupFile,
  validateBackupFileContent,
  AppBackupData,
} from '../utils/backupStorage';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Download,
  Upload,
  HardDrive,
  FileCheck2,
  AlertCircle,
  Database,
  History,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: GasCounter[];
  snapshots: CountSnapshot[];
  onRestoreBackup: (backup: AppBackupData, mode: 'replace' | 'merge') => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  counters,
  snapshots,
  onRestoreBackup,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<AppBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      triggerHaptic('success');
      downloadBackupFile(counters, snapshots);
      onShowToast('Arquivo de backup (.json) baixado com sucesso!');
    } catch {
      triggerHaptic('error');
      onShowToast('Erro ao gerar arquivo de backup.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError(null);
    setParsedBackup(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = validateBackupFileContent(text);
      if (result.valid && result.data) {
        setParsedBackup(result.data);
        triggerHaptic('light');
      } else {
        setImportError(result.error || 'Arquivo de backup inválido.');
        triggerHaptic('warning');
      }
    };
    reader.onerror = () => {
      setImportError('Não foi possível ler o arquivo selecionado.');
      triggerHaptic('error');
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;

    triggerHaptic('success');
    onRestoreBackup(parsedBackup, restoreMode);
    onShowToast(
      restoreMode === 'replace'
        ? 'Backup restaurado com sucesso (dados substituídos)!'
        : 'Backup mesclado com o inventário atual!'
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Backup e Restauração
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guarde seus dados em arquivo JSON ou transfira entre aparelhos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Exportar / Importar */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              triggerHaptic('light');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fazer Backup (Exportar)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              triggerHaptic('light');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar Backup (Importar)</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50">
                <h3 className="font-bold text-sky-950 dark:text-sky-200 text-sm flex items-center gap-1.5 mb-1">
                  <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Salvar cópia de segurança em arquivo JSON
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Baixe um arquivo <code className="font-mono bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 rounded text-sky-800 dark:text-sky-200 font-semibold">.json</code> contendo todos os seus cilindros, contagens de cheios e vazios, histórico gravado e modelos personalizados.
                </p>
              </div>

              {/* Resumo do que será exportado */}
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Cilindros</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{counters.length} tipos</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                  <History className="w-5 h-5 text-sky-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Históricos</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{snapshots.length} registros</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-sky-500 active:scale-98"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Baixar Arquivo de Backup (.json)</span>
                </button>
                <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Você pode guardar no Google Drive, enviar pelo WhatsApp ou guardar no pendrive.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
                <h3 className="font-bold text-purple-950 dark:text-purple-200 text-sm flex items-center gap-1.5 mb-1">
                  <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Carregar arquivo de backup
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Selecione o arquivo <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 py-0.5 rounded text-purple-800 dark:text-purple-200 font-semibold">.json</code> gerado anteriormente para restaurar sua contagem e histórico neste aparelho.
                </p>
              </div>

              {/* Botão de Selecionar Arquivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 p-6 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-800/30 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo .json'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Suporta arquivos de backup do app'}
                  </span>
                </div>
              </button>

              {/* Mensagem de Erro se houver */}
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview e Confirmação se o arquivo for válido */}
              {parsedBackup && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Backup válido verificado!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-slate-500 block">Cilindros no arquivo:</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {parsedBackup.counters.length} itens
                      </strong>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-slate-500 block">Históricos no arquivo:</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {parsedBackup.snapshots.length} registros
                      </strong>
                    </div>
                  </div>

                  {/* Modo de Restauração */}
                  <div className="pt-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                      Como aplicar os dados:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          value="replace"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs">
                          <strong className="text-slate-900 dark:text-white">Substituir tudo</strong> (recomendado ao trocar de aparelho)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs">
                          <strong className="text-slate-900 dark:text-white">Mesclar</strong> (atualiza existentes e adiciona novos)
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Restauração Agora</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
