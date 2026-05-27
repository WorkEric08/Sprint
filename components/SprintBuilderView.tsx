import React, { useState } from 'react';
import { Subject, SprintQueueItem, SprintResolvedItem, BlockType, ReviewItem, BLOCK_TYPE_LABELS, BLOCK_TYPE_COLORS } from '../types';
import { useBackButton } from '../hooks/useBackButton';
import { isPendingNow } from '../utils/reviewAlgorithm';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  subjects: Subject[];
  pendingReviewCount: number;
  pendingReviewItems: ReviewItem[];
  onStart: (items: SprintResolvedItem[]) => void;
  onClose: () => void;
}

const BREAK_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const BLOCK_TYPES: BlockType[] = ['study', 'review', 'questions'];

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Color for block type badge — study uses indigo (not subject color at this stage)
const TYPE_BG: Record<BlockType, string> = {
  study:     'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  review:    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  questions: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
};

const SprintBuilderView: React.FC<Props> = ({
  subjects,
  pendingReviewCount,
  pendingReviewItems,
  onStart,
  onClose,
}) => {
  useSecondaryScreen();
  const [queue, setQueue] = useState<SprintQueueItem[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useBackButton(onClose);

  const now = Date.now();
  const pendingNow = pendingReviewItems.filter(i => isPendingNow(i, now));
  const showBanner = pendingReviewCount > 0 && !bannerDismissed &&
    !queue.some(i => i.type === 'review-break');

  const totalMinutes = queue.reduce((acc, item) => {
    if (item.type === 'study') {
      const s = subjects.find(s => s.id === item.subjectId);
      return acc + (s?.duration ?? 0);
    }
    if (item.type === 'break' || item.type === 'review-break') return acc + item.duration;
    return acc;
  }, 0);

  const studyCount = queue.filter(i => i.type === 'study').length;

  const addStudy = (subjectId: string) => {
    setQueue(prev => [...prev, { id: uid(), type: 'study', subjectId, blockType: 'study' }]);
  };

  const cycleBlockType = (itemId: string) => {
    setQueue(prev => prev.map(item => {
      if (item.id !== itemId || item.type !== 'study') return item;
      const idx = BLOCK_TYPES.indexOf(item.blockType);
      return { ...item, blockType: BLOCK_TYPES[(idx + 1) % BLOCK_TYPES.length] };
    }));
  };

  const addBreak = () => {
    setQueue(prev => [...prev, { id: uid(), type: 'break', duration: 5 }]);
  };

  const addReviewBreak = () => {
    const subtopics = pendingNow.map(i => i.subtopic).slice(0, 8);
    setQueue(prev => [...prev, { id: uid(), type: 'review-break', duration: 30, pendingSubtopics: subtopics }]);
    setBannerDismissed(true);
  };

  const remove = (id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id));
  };

  const stepBreak = (id: string, delta: number) => {
    setQueue(prev => prev.map(item => {
      if ((item.type !== 'break' && item.type !== 'review-break') || item.id !== id) return item;
      const idx = BREAK_STEPS.indexOf(item.duration);
      const next = Math.max(0, Math.min(BREAK_STEPS.length - 1, idx + delta));
      return { ...item, duration: BREAK_STEPS[next] };
    }));
  };

  const handleStart = () => {
    if (studyCount === 0) return;
    const resolved: SprintResolvedItem[] = queue.map(item => {
      if (item.type === 'break') return { type: 'break', duration: item.duration };
      if (item.type === 'review-break') return { type: 'review-break', duration: item.duration, pendingSubtopics: item.pendingSubtopics };
      return {
        type: 'study',
        subject: subjects.find(s => s.id === item.subjectId)!,
        blockType: item.blockType,
      };
    });
    onStart(resolved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform shrink-0"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <h2 className="flex-1 text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
          Montar Sprint
        </h2>
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
            <i className="fas fa-clock text-indigo-500 text-[10px]" />
            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {formatDuration(totalMinutes)}
            </span>
          </div>
        )}
      </div>

      {/* Feature 3: Banner de revisões pendentes */}
      {showBanner && (
        <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <i className="fas fa-bookmark text-amber-500 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-amber-800 dark:text-amber-300 leading-tight">
              {pendingReviewCount} {pendingReviewCount === 1 ? 'revisão pendente' : 'revisões pendentes'}
            </p>
            <button
              onClick={addReviewBreak}
              className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-0.5 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              + Adicionar bloco de revisão (30min) →
            </button>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="w-6 h-6 flex items-center justify-center text-amber-400 dark:text-amber-600 shrink-0"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      )}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto p-4">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
              <i className="fas fa-list-ul text-gray-300 dark:text-gray-600 text-xl" />
            </div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Sprint vazio</p>
            <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[180px] leading-relaxed">
              Toque nas matérias abaixo para adicionar blocos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => {
              if (item.type === 'study') {
                const subject = subjects.find(s => s.id === item.subjectId);
                if (!subject) return null;
                return (
                  <div
                    key={item.id}
                    className="flex items-stretch bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  >
                    <div className="w-1 shrink-0" style={{ backgroundColor: subject.color }} />
                    <div className="flex-1 flex items-center gap-3 px-3 py-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      <span className="flex-1 text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                        {subject.title}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase shrink-0">
                        {subject.duration}min
                      </span>
                      {/* Feature 4: block type badge (tap to cycle) */}
                      <button
                        onClick={() => cycleBlockType(item.id)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0 ${TYPE_BG[item.blockType]}`}
                        title="Toque para mudar o tipo"
                      >
                        {BLOCK_TYPE_LABELS[item.blockType]}
                      </button>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="w-11 flex items-center justify-center text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors"
                    >
                      <i className="fas fa-times text-xs" />
                    </button>
                  </div>
                );
              }

              if (item.type === 'review-break') {
                return (
                  <div
                    key={item.id}
                    className="flex items-stretch bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm overflow-hidden"
                  >
                    <div className="w-1 shrink-0 bg-amber-400" />
                    <div className="flex-1 px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fas fa-bookmark text-amber-500 text-[10px]" />
                        <span className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                          Revisão
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          <button onClick={() => stepBreak(item.id, -1)} disabled={BREAK_STEPS.indexOf(item.duration) === 0} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90">
                            <i className="fas fa-minus text-[8px]" />
                          </button>
                          <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 w-10 text-center">{item.duration}min</span>
                          <button onClick={() => stepBreak(item.id, 1)} disabled={BREAK_STEPS.indexOf(item.duration) === BREAK_STEPS.length - 1} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90">
                            <i className="fas fa-plus text-[8px]" />
                          </button>
                        </div>
                      </div>
                      {item.pendingSubtopics.length > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                          {item.pendingSubtopics.slice(0, 3).join(', ')}
                          {item.pendingSubtopics.length > 3 ? ` +${item.pendingSubtopics.length - 3}` : ''}
                        </p>
                      )}
                    </div>
                    <button onClick={() => remove(item.id)} className="w-11 flex items-center justify-center text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors">
                      <i className="fas fa-times text-xs" />
                    </button>
                  </div>
                );
              }

              // Regular break
              return (
                <div key={item.id} className="flex items-stretch bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="w-1 shrink-0 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 flex items-center gap-3 px-3 py-2.5">
                    <i className="fas fa-mug-hot text-gray-400 dark:text-gray-600 text-sm shrink-0" />
                    <span className="flex-1 text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">Pausa</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => stepBreak(item.id, -1)} disabled={BREAK_STEPS.indexOf(item.duration) === 0} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90">
                        <i className="fas fa-minus text-[8px]" />
                      </button>
                      <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 w-12 text-center uppercase tracking-wide">{item.duration}min</span>
                      <button onClick={() => stepBreak(item.id, 1)} disabled={BREAK_STEPS.indexOf(item.duration) === BREAK_STEPS.length - 1} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90">
                        <i className="fas fa-plus text-[8px]" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => remove(item.id)} className="w-11 flex items-center justify-center text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors">
                    <i className="fas fa-times text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-scroll-area flex gap-2 px-4 pt-3 pb-2">
          {subjects.map(subject => {
            const done = subject.completedBlocks.length;
            const inQueue = queue.filter(i => i.type === 'study' && i.subjectId === subject.id).length;
            const available = Math.max(0, subject.blockCount - done - inQueue);
            const exhausted = available === 0;
            return (
              <button
                key={subject.id}
                onClick={() => addStudy(subject.id)}
                disabled={exhausted}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border active:scale-95 transition-transform shrink-0 ${
                  exhausted
                    ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 opacity-40 cursor-not-allowed'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60'
                }`}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight whitespace-nowrap">
                  {subject.title}
                </span>
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: exhausted ? undefined : subject.color }}>
                  {available}/{subject.blockCount - done}
                </span>
              </button>
            );
          })}
          <button
            onClick={addBreak}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform shrink-0"
          >
            <i className="fas fa-mug-hot text-gray-400 text-[10px]" />
            <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">Pausa</span>
          </button>
          <div className="w-4 shrink-0" />
        </div>

        <div className="px-4 pb-4 pt-1">
          <button
            onClick={handleStart}
            disabled={studyCount === 0}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all ${
              studyCount === 0
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98]'
            }`}
          >
            <i className="fas fa-play" />
            {studyCount === 0
              ? 'Adicione blocos para iniciar'
              : `Iniciar · ${studyCount} ${studyCount === 1 ? 'bloco' : 'blocos'} · ${formatDuration(totalMinutes)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintBuilderView;
