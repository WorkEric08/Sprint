import React, { useMemo, useState } from 'react';
import { Edital, Subject } from '../types';

interface Props {
  edital: Edital;
  subjects: Subject[];
  onApplyDistribution: (updated: Subject[]) => void;
}

interface SubjectDelta {
  subject: Subject;
  editalWeight: number;   // % expected by edital (0 if not matched)
  actualPct: number;      // % of completed blocks dedicated to this subject
  delta: number;          // actualPct - editalWeight
  status: 'ok' | 'under' | 'over' | 'untracked';
}

const TOLERANCE = 5; // ±5 percentage points is considered "ok"

const EditalDistributionCard: React.FC<Props> = ({ edital, subjects, onApplyDistribution }) => {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [previewApplied, setPreviewApplied] = useState(false);

  const totalBlocks = useMemo(
    () => subjects.reduce((a, s) => a + s.completedBlocks.length, 0),
    [subjects]
  );

  // Normalize edital weights to sum exactly 100
  const totalEditalWeight = edital.subjects.reduce((a, es) => a + es.weight, 0);
  const normalizeWeight = (w: number) =>
    totalEditalWeight > 0 ? Math.round((w / totalEditalWeight) * 100) : 0;

  const deltas = useMemo<SubjectDelta[]>(() => {
    return subjects.map(s => {
      const editalSubject = edital.subjects.find(
        es => es.name.toLowerCase() === s.title.toLowerCase()
      );

      const editalWeight = editalSubject ? normalizeWeight(editalSubject.weight) : 0;
      const actualPct = totalBlocks > 0
        ? Math.round((s.completedBlocks.length / totalBlocks) * 100)
        : 0;
      const delta = actualPct - editalWeight;

      let status: SubjectDelta['status'] = 'ok';
      if (!editalSubject) {
        status = 'untracked';
      } else if (delta < -TOLERANCE) {
        status = 'under';
      } else if (delta > TOLERANCE) {
        status = 'over';
      }

      return { subject: s, editalWeight, actualPct, delta, status };
    }).sort((a, b) => b.editalWeight - a.editalWeight);
  }, [subjects, edital, totalBlocks]);

  const hasIssues = deltas.some(d => d.status === 'under' || d.status === 'over');
  const underCount = deltas.filter(d => d.status === 'under').length;
  const overCount = deltas.filter(d => d.status === 'over').length;

  // Compute suggested blockCounts based on edital weights
  const suggestion = useMemo(() => {
    // Total current blocks across all subjects
    const totalCurrent = subjects.reduce((a, s) => a + s.blockCount, 0);
    const baseline = Math.max(totalCurrent, 100); // at least 100 blocks to distribute

    return subjects.map(s => {
      const editalSubject = edital.subjects.find(
        es => es.name.toLowerCase() === s.title.toLowerCase()
      );
      if (!editalSubject) return { subject: s, suggestedCount: s.blockCount, change: 0 };

      const norm = normalizeWeight(editalSubject.weight);
      const suggested = Math.max(5, Math.round((norm / 100) * baseline));
      return { subject: s, suggestedCount: suggested, change: suggested - s.blockCount };
    });
  }, [subjects, edital]);

  const handleApply = () => {
    const updated = subjects.map(s => {
      const sug = suggestion.find(sg => sg.subject.id === s.id);
      return sug ? { ...s, blockCount: Math.max(s.completedBlocks.length, sug.suggestedCount) } : s;
    });
    onApplyDistribution(updated);
    setPreviewApplied(true);
    setTimeout(() => setPreviewApplied(false), 3000);
    setShowSuggestion(false);
  };

  if (totalBlocks === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
          Sua distribuição vs edital
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Complete alguns blocos para ver a comparação com o edital.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Sua distribuição
            </p>
            <p className="text-sm font-black text-gray-700 dark:text-gray-300 mt-0.5">
              {hasIssues
                ? `${underCount} subestudada${underCount !== 1 ? 's' : ''}, ${overCount} superestudada${overCount !== 1 ? 's' : ''}`
                : 'Distribuição equilibrada ✓'}
            </p>
          </div>
          {hasIssues && (
            <button
              onClick={() => setShowSuggestion(p => !p)}
              className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors shrink-0 ml-2"
            >
              {showSuggestion ? 'Ocultar' : 'Ver sugestão'}
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Real</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Edital</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/40" />
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">Subestudado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/40" />
            <span className="text-[9px] font-bold text-blue-500">Superestudado</span>
          </div>
        </div>
      </div>

      {/* Delta bars */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {deltas.map(d => {
          const barColor =
            d.status === 'under'     ? 'bg-amber-400 dark:bg-amber-500' :
            d.status === 'over'      ? 'bg-blue-400 dark:bg-blue-500'   :
            d.status === 'untracked' ? 'bg-gray-300 dark:bg-gray-700'   :
                                       'bg-indigo-400 dark:bg-indigo-500';

          return (
            <div key={d.subject.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.subject.color }} />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    {d.subject.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[9px] font-black ${
                    d.status === 'under' ? 'text-amber-600 dark:text-amber-400' :
                    d.status === 'over'  ? 'text-blue-500' :
                    'text-gray-400 dark:text-gray-600'
                  }`}>
                    {d.actualPct}%
                  </span>
                  {d.editalWeight > 0 && (
                    <span className="text-[9px] text-gray-300 dark:text-gray-700">
                      / {d.editalWeight}%
                    </span>
                  )}
                  {d.status === 'under' && <i className="fas fa-arrow-up text-amber-500 text-[8px]" />}
                  {d.status === 'over'  && <i className="fas fa-arrow-down text-blue-400 text-[8px]" />}
                </div>
              </div>

              {/* Stacked bar: real vs expected */}
              <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                {/* Expected marker */}
                {d.editalWeight > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
                    style={{ left: `${Math.min(d.editalWeight, 100)}%` }}
                  />
                )}
                {/* Actual bar */}
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${Math.min(d.actualPct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion panel */}
      {showSuggestion && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Ajuste sugerido de blocos
          </p>
          {suggestion.filter(sg => sg.change !== 0).map(sg => (
            <div key={sg.subject.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sg.subject.color }} />
              <span className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">{sg.subject.title}</span>
              <span className="text-xs font-black text-gray-500 dark:text-gray-500">{sg.subject.blockCount}</span>
              <i className="fas fa-arrow-right text-[9px] text-gray-300 dark:text-gray-700" />
              <span className={`text-xs font-black ${sg.change > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                {sg.suggestedCount}
              </span>
              <span className={`text-[9px] font-bold ${sg.change > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                ({sg.change > 0 ? '+' : ''}{sg.change})
              </span>
            </div>
          ))}
          <p className="text-[9px] text-gray-400 dark:text-gray-600 leading-relaxed">
            Ajusta apenas o número de blocos planejados. Blocos já concluídos não são removidos.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApply}
              disabled={previewApplied}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                previewApplied
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {previewApplied ? '✓ Aplicado' : 'Aplicar sugestão'}
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditalDistributionCard;
