import React, { useMemo, useState } from 'react';
import { ReviewItem } from '../types';
import {
  isPendingNow,
  isOverdue,
  currentIntervalLabel,
  nextIntervalLabel,
  daysUntilDue,
} from '../utils/reviewAlgorithm';

interface Props {
  reviewItems: ReviewItem[];
  onApplyResult: (itemId: string, correct: boolean) => Promise<void>;
}

interface ReviewModalState {
  item: ReviewItem;
}

function formatDaysAgo(timestamp: number | null): string {
  if (!timestamp) return 'nunca';
  const days = Math.round((Date.now() - timestamp) / 86_400_000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

const ReviewQueueView: React.FC<Props> = ({ reviewItems, onApplyResult }) => {
  const [reviewModal, setReviewModal] = useState<ReviewModalState | null>(null);
  const [batchConfirm, setBatchConfirm] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all' | 'consolidated'>('pending');

  const now = Date.now();

  const pending = useMemo(() => reviewItems.filter(i => isPendingNow(i, now)), [reviewItems, now]);
  const overdue  = useMemo(() => pending.filter(i => isOverdue(i, now)), [pending, now]);
  const dueToday = useMemo(() => pending.filter(i => !isOverdue(i, now)), [pending, now]);
  const upcoming = useMemo(() => reviewItems.filter(i => !i.consolidated && !isPendingNow(i, now)), [reviewItems, now]);
  const consolidated = useMemo(() => reviewItems.filter(i => i.consolidated), [reviewItems]);

  const displayedItems = useMemo(() => {
    if (filter === 'consolidated') return consolidated;
    if (filter === 'all') return [...overdue, ...dueToday, ...upcoming];
    return [...overdue, ...dueToday]; // pending only
  }, [filter, overdue, dueToday, upcoming, consolidated]);

  // Group by subject
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; color: string; items: ReviewItem[] }>();
    displayedItems.forEach(item => {
      const existing = map.get(item.subjectId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.subjectId, {
          title: item.subjectTitle,
          color: item.subjectColor,
          items: [item],
        });
      }
    });
    return [...map.values()];
  }, [displayedItems]);

  const handleBatchMarkAll = async () => {
    for (const item of pending) {
      await onApplyResult(item.id, true);
    }
    setBatchConfirm(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* ── Header stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-2xl font-black text-gray-800 dark:text-white">{pending.length}</p>
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">Pendentes</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-2xl font-black text-amber-500">{overdue.length}</p>
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">Atrasados</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-2xl font-black text-green-500">{consolidated.length}</p>
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">Dominados</p>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5">
        {(['pending', 'all', 'consolidated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              filter === f
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {f === 'pending' ? 'Pendentes' : f === 'all' ? 'Todos' : 'Dominados'}
          </button>
        ))}
      </div>

      {/* ── Batch action ── */}
      {filter === 'pending' && pending.length > 1 && (
        <button
          onClick={() => setBatchConfirm(true)}
          className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <i className="fas fa-check-double text-xs" />
          Marcar todos como revisados ({pending.length})
        </button>
      )}

      {/* ── Empty state ── */}
      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <i className={`fas ${filter === 'consolidated' ? 'fa-trophy' : 'fa-bookmark'} text-gray-300 dark:text-gray-600 text-xl`} />
          </div>
          <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            {filter === 'consolidated'
              ? 'Nenhum conteúdo dominado ainda'
              : filter === 'pending'
              ? 'Nenhuma revisão pendente'
              : 'Nenhum item de revisão'}
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[220px] leading-relaxed">
            {filter === 'pending'
              ? 'Marque subtópicos para revisar no modal pós-bloco.'
              : ''}
          </p>
        </div>
      )}

      {/* ── Grouped list ── */}
      {grouped.map(group => (
        <div key={group.title} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">
              {group.title}
            </span>
          </div>

          {group.items.map(item => {
            const overdueDays = daysUntilDue(item, now);
            const itemIsOverdue = isOverdue(item, now);
            const itemIsPending = isPendingNow(item, now);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${
                  itemIsOverdue
                    ? 'border-amber-200 dark:border-amber-900/40'
                    : item.consolidated
                    ? 'border-green-100 dark:border-green-900/20'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="h-0.5 w-full" style={{ backgroundColor: group.color }} />
                <div className="p-3.5 flex items-center gap-3">
                  {/* Status icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    item.consolidated
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : itemIsOverdue
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : itemIsPending
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <i className={`fas text-xs ${
                      item.consolidated
                        ? 'fa-trophy text-green-500'
                        : itemIsOverdue
                        ? 'fa-clock text-amber-500'
                        : itemIsPending
                        ? 'fa-bookmark text-indigo-500'
                        : 'fa-calendar text-gray-400'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate">
                      {item.subtopic}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        itemIsOverdue ? 'text-amber-500' : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {item.consolidated
                          ? 'Dominado'
                          : itemIsOverdue
                          ? `Atrasado ${Math.abs(overdueDays)} ${Math.abs(overdueDays) === 1 ? 'dia' : 'dias'}`
                          : itemIsPending
                          ? 'Revisar hoje'
                          : `Em ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`}
                      </span>
                      <span className="text-[9px] text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">
                        {currentIntervalLabel(item)}
                      </span>
                      <span className="text-[9px] text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">
                        {formatDaysAgo(item.lastReviewedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action button — only for pending/overdue items */}
                  {(itemIsPending || itemIsOverdue) && !item.consolidated && (
                    <button
                      onClick={() => setReviewModal({ item })}
                      className="shrink-0 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      Revisar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Review modal (individual) ── */}
      {reviewModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            {/* Subject chip */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reviewModal.item.subjectColor }} />
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                {reviewModal.item.subjectTitle}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                {reviewModal.item.subtopic}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                {currentIntervalLabel(reviewModal.item)} · Próximo se acertar: {nextIntervalLabel(reviewModal.item)}
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Você conseguiu revisar e se saiu bem neste conteúdo?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={async () => {
                  await onApplyResult(reviewModal.item.id, false);
                  setReviewModal(null);
                }}
                className="py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform border border-red-100 dark:border-red-900/30"
              >
                <i className="fas fa-times" />
                Errei
              </button>
              <button
                onClick={async () => {
                  await onApplyResult(reviewModal.item.id, true);
                  setReviewModal(null);
                }}
                className="py-4 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-green-500/20"
              >
                <i className="fas fa-check" />
                Acertei
              </button>
            </div>

            <button
              onClick={() => setReviewModal(null)}
              className="w-full py-3 text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Batch confirm modal ── */}
      {batchConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBatchConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 text-center">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-check-double text-indigo-500 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">
                Marcar {pending.length} como revisados?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Todos os itens pendentes avançarão um intervalo. Use com honestidade.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={handleBatchMarkAll}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform"
              >
                Confirmar
              </button>
              <button
                onClick={() => setBatchConfirm(false)}
                className="w-full py-3 text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueueView;
