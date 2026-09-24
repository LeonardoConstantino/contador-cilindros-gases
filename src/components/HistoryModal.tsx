import React, { useState } from 'react';
import { CountSnapshot } from '../types/gas';
import {
  X,
  History,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Calendar,
  MapPin,
  User,
  ChevronDown,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { copyTextToClipboard } from '../utils/exportFormatters';
import { formatSnapshotWhatsApp } from '../utils/historyStorage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: CountSnapshot[];
  onSaveCurrentSnapshot: () => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAllHistory: () => void;
  onRestoreSnapshot: (snapshot: CountSnapshot) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSaveCurrentSnapshot,
  onDeleteSnapshot,
  onClearAllHistory,
  onRestoreSnapshot,
  onShowToast,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(snapshots[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const filteredSnapshots = snapshots.filter(s => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      s.formattedDate.toLowerCase().includes(q) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.responsible && s.responsible.toLowerCase().includes(q)) ||
      (s.shift && s.shift.toLowerCase().includes(q)) ||
      (s.title && s.title.toLowerCase().includes(q))
    );
  });

  const handleCopySnapshot = async (snapshot: CountSnapshot) => {
    const text = formatSnapshotWhatsApp(snapshot);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(snapshot.id);
      onShowToast(`Tabela de ${snapshot.formattedDate} copiada para WhatsApp!`);
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      onShowToast('Não foi possível copiar automaticamente.', 'error');
    }
  };

  const handleRestore = (snapshot: CountSnapshot) => {
    if (
      window.confirm(
        `Deseja restaurar as quantidades da contagem de ${snapshot.formattedDate} (${snapshot.location || 'Geral'}) para o inventário atual?`
      )
    ) {
      onRestoreSnapshot(snapshot);
      onShowToast(`Contagem de ${snapshot.formattedDate} restaurada!`);
      onClose();
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Histórico de Contagens
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snapshots salvos por data para acompanhamento e relatórios
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

        {/* Action / Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex-1">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por data, local, turno ou responsável..."
              className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSaveCurrentSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
              title="Salvar a contagem atual como novo registro no histórico"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Salvar Contagem Atual</span>
            </button>

            {snapshots.length > 0 && (
              <button
                onClick={() => {
                  if (confirmClear) {
                    onClearAllHistory();
                    setConfirmClear(false);
                  } else {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 3000);
                  }
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  confirmClear
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Limpar histórico"
              >
                {confirmClear ? 'Confirmar limpeza?' : 'Limpar Tudo'}
              </button>
            )}
          </div>
        </div>

        {/* Snapshots List Area */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {filteredSnapshots.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
              <History className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {snapshots.length === 0 ? 'Nenhuma contagem salva ainda' : 'Nenhum registro encontrado'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {snapshots.length === 0
                  ? 'Os registros são gravados automaticamente ao exportar para WhatsApp ou você pode clicar no botão "Salvar Contagem Atual" acima.'
                  : 'Tente buscar com outro termo ou limpe o campo de busca.'}
              </p>
              {snapshots.length === 0 && (
                <button
                  onClick={onSaveCurrentSnapshot}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Gravar Primeiro Snapshot</span>
                </button>
              )}
            </div>
          ) : (
            filteredSnapshots.map(snap => {
              const isExpanded = expandedId === snap.id;
              const isCopied = copiedId === snap.id;

              return (
                <div
                  key={snap.id}
                  className={`border rounded-xl transition-all ${
                    isExpanded
                      ? 'border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-800/80 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Snapshot Card Header */}
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          {snap.formattedDate}
                        </span>

                        {snap.shift && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {snap.shift}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {snap.location || 'Almoxarifado'}
                        </span>

                        {snap.responsible && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {snap.responsible}
                          </span>
                        )}
                      </div>

                      {/* Totais do snapshot */}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                          Cheios: {snap.totalFull}
                        </span>
                        <span className="text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
                          Vazios: {snap.totalEmpty}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Total: <strong className="text-slate-900 dark:text-white">{snap.totalCylinders}</strong> un ({snap.items.length} gases)
                        </span>
                      </div>
                    </div>

                    {/* Quick actions for snapshot */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleCopySnapshot(snap)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        title="Copiar tabela desta contagem para WhatsApp"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() => handleRestore(snap)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                        title="Restaurar quantidades desta data no inventário atual"
                        aria-label="Restaurar"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o registro de ${snap.formattedDate}?`)) {
                            onDeleteSnapshot(snap.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Excluir este snapshot"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                        aria-label="Ver itens detalhados"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Item Breakdown Table */}
                  {isExpanded && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/60 rounded-b-xl">
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                              <th className="py-1.5 font-semibold">Gás / Descrição</th>
                              <th className="py-1.5 text-center font-semibold text-emerald-700 dark:text-emerald-400">Cheios</th>
                              <th className="py-1.5 text-center font-semibold text-rose-700 dark:text-rose-400">Vazios</th>
                              <th className="py-1.5 text-center font-semibold">Total</th>
                              <th className="py-1.5 font-semibold">Observações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {snap.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                                <td className="py-2 font-medium text-slate-900 dark:text-slate-100">
                                  {it.label}
                                </td>
                                <td className="py-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
                                  {it.full}
                                </td>
                                <td className="py-2 text-center font-bold text-rose-700 dark:text-rose-300">
                                  {it.empty}
                                </td>
                                <td className="py-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                                  {it.full + it.empty}
                                </td>
                                <td className="py-2 text-slate-500 dark:text-slate-400 italic">
                                  {it.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total de {snapshots.length} {snapshots.length === 1 ? 'registro gravado' : 'registros gravados'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
