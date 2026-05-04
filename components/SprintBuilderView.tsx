import React, { useState } from 'react';
import { Subject, SprintQueueItem, SprintResolvedItem } from '../types';
import { useBackButton } from '../hooks/useBackButton';

interface Props {
  subjects: Subject[];
  onStart: (items: SprintResolvedItem[]) => void;
  onClose: () => void;
}

const BREAK_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const SprintBuilderView: React.FC<Props> = ({ subjects, onStart, onClose }) => {
  const [queue, setQueue] = useState<SprintQueueItem[]>([]);

  useBackButton(onClose);

  const totalMinutes = queue.reduce((acc, item) => {
    if (item.type === 'study') {
      const s = subjects.find(s => s.id === item.subjectId);
      return acc + (s?.duration ?? 0);
    }
    return acc + item.duration;
  }, 0);

  const studyCount = queue.filter(i => i.type === 'study').length;

  const addStudy = (subjectId: string) => {
    setQueue(prev => [...prev, { id: uid(), type: 'study', subjectId }]);
  };

  const addBreak = () => {
    setQueue(prev => [...prev, { id: uid(), type: 'break', duration: 5 }]);
  };

  const remove = (id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id));
  };

  const stepBreak = (id: string, delta: number) => {
    setQueue(prev => prev.map(item => {
      if (item.id !== id || item.type !== 'break') return item;
      const idx = BREAK_STEPS.indexOf(item.duration);
      const next = Math.max(0, Math.min(BREAK_STEPS.length - 1, idx + delta));
      return { ...item, duration: BREAK_STEPS[next] };
    }));
  };

  const handleStart = () => {
    if (studyCount === 0) return;
    const resolved: SprintResolvedItem[] = queue.map(item => {
      if (item.type === 'break') return { type: 'break', duration: item.duration };
      return { type: 'study', subject: subjects.find(s => s.id === item.subjectId)! };
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

      {/* Queue */}
      <div className="flex-1 overflow-y-auto p-4">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
              <i className="fas fa-list-ul text-gray-300 dark:text-gray-600 text-xl" />
            </div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Sprint vazio
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[180px] leading-relaxed">
              Toque nas matérias abaixo para adicionar blocos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item, index) => {
              if (item.type === 'study') {
                const subject = subjects.find(s => s.id === item.subjectId);
                if (!subject) return null;
                return (
                  <div
                    key={item.id}
                    className="flex items-stretch bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  >
                    {/* Color accent */}
                    <div className="w-1 shrink-0" style={{ backgroundColor: subject.color }} />
                    <div className="flex-1 flex items-center gap-3 px-3 py-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      <span className="flex-1 text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                        {subject.title}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase shrink-0">
                        {subject.duration}min
                      </span>
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

              // Break item
              return (
                <div
                  key={item.id}
                  className="flex items-stretch bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  <div className="w-1 shrink-0 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 flex items-center gap-3 px-3 py-2.5">
                    <i className="fas fa-mug-hot text-gray-400 dark:text-gray-600 text-sm shrink-0" />
                    <span className="flex-1 text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                      Pausa
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => stepBreak(item.id, -1)}
                        disabled={BREAK_STEPS.indexOf(item.duration) === 0}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                      >
                        <i className="fas fa-minus text-[8px]" />
                      </button>
                      <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 w-12 text-center uppercase tracking-wide">
                        {item.duration}min
                      </span>
                      <button
                        onClick={() => stepBreak(item.id, 1)}
                        disabled={BREAK_STEPS.indexOf(item.duration) === BREAK_STEPS.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                      >
                        <i className="fas fa-plus text-[8px]" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="w-11 flex items-center justify-center text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors"
                  >
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
        {/* Subject + break chips */}
        <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {subjects.map(subject => {
            const remaining = subject.blockCount - subject.completedBlocks.length;
            return (
              <button
                key={subject.id}
                onClick={() => addStudy(subject.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 active:scale-95 transition-transform shrink-0"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight whitespace-nowrap">
                  {subject.title}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 whitespace-nowrap">
                  {remaining}/{subject.blockCount}
                </span>
              </button>
            );
          })}
          <button
            onClick={addBreak}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform shrink-0"
          >
            <i className="fas fa-mug-hot text-gray-400 text-[10px]" />
            <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">
              Pausa
            </span>
          </button>
        </div>

        {/* Start button */}
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
