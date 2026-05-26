import React, { useMemo, useState, useEffect } from 'react';
import { BlockLog } from '../types';
import { db } from '../db';
import {
  toLocalDateKey,
  last52WeekMondays,
  addDays,
  todayKey,
  computeToleratedStreak,
} from '../utils/dateUtils';

const DAYS_OF_WEEK = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Mon–Sun (pt-BR)

// ── Day cell data ──────────────────────────────────────────────────────────

interface DayData {
  dateKey: string;
  blocks: number;
  totalMinutes: number;
  questions: number;
  correct: number;
  isToday: boolean;
  isFuture: boolean;
}

// ── Color intensity (indigo scale) ────────────────────────────────────────

function intensityClass(blocks: number, isFuture: boolean): string {
  if (isFuture) return 'bg-transparent';
  if (blocks === 0) return 'bg-gray-100 dark:bg-gray-800/60';
  if (blocks === 1) return 'bg-indigo-200 dark:bg-indigo-900/60';
  if (blocks === 2) return 'bg-indigo-300 dark:bg-indigo-800/70';
  if (blocks <= 4) return 'bg-indigo-400 dark:bg-indigo-700/80';
  if (blocks <= 6) return 'bg-indigo-500 dark:bg-indigo-600';
  return 'bg-indigo-600 dark:bg-indigo-500';
}

// ── Month label positions ─────────────────────────────────────────────────

function getMonthLabels(mondays: string[]): { col: number; label: string }[] {
  const seen = new Set<string>();
  const labels: { col: number; label: string }[] = [];
  mondays.forEach((monday, col) => {
    const [y, m] = monday.split('-');
    const key = `${y}-${m}`;
    if (!seen.has(key)) {
      seen.add(key);
      const date = new Date(Number(y), Number(m) - 1, 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'short' });
      labels.push({ col, label: label.replace('.', '') });
    }
  });
  return labels;
}

// ── Main component ─────────────────────────────────────────────────────────

const HeatmapView: React.FC = () => {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [selected, setSelected] = useState<DayData | null>(null);
  const today = todayKey();

  useEffect(() => {
    db.blockLogs.toArray().then(setBlockLogs).catch(console.error);
  }, []);

  const mondays = useMemo(() => last52WeekMondays(), []);

  // Build day data map: dateKey → DayData
  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();

    // Pre-populate all 364 days
    mondays.forEach(monday => {
      for (let i = 0; i < 7; i++) {
        const dateKey = addDays(monday, i);
        map.set(dateKey, {
          dateKey,
          blocks: 0,
          totalMinutes: 0,
          questions: 0,
          correct: 0,
          isToday: dateKey === today,
          isFuture: dateKey > today,
        });
      }
    });

    // Accumulate block logs
    blockLogs.forEach(log => {
      const key = toLocalDateKey(log.timestamp);
      const existing = map.get(key);
      if (existing) {
        existing.blocks++;
        // Approximate minutes from subjects (we don't store duration in BlockLog)
        // We'll derive from the subject's duration stored in subject table — but
        // to avoid async complexity here, we track questionsTotal as a proxy metric
        existing.questions += log.questionsTotal;
        existing.correct += log.questionsCorrect;
      }
    });

    return map;
  }, [blockLogs, mondays, today]);

  // Active day keys for streak
  const activeDayKeys = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    dayMap.forEach((data, key) => { if (data.blocks > 0) s.add(key); });
    return s;
  }, [dayMap]);

  const streak = useMemo(() => computeToleratedStreak(activeDayKeys), [activeDayKeys]);
  const totalBlocks = useMemo(() => [...dayMap.values()].reduce((a, d) => a + d.blocks, 0), [dayMap]);
  const monthLabels = useMemo(() => getMonthLabels(mondays), [mondays]);

  return (
    <div className="space-y-4">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-fire text-orange-500 text-sm" />
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Sequência
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {streak}
            <span className="text-sm font-bold text-gray-400 ml-1">{streak === 1 ? 'dia' : 'dias'}</span>
          </p>
          {streak > 0 && (
            <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1">
              Tolerante · 1 gap/semana
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-rotate text-indigo-500 text-sm" />
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Total (1 ano)
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {totalBlocks}
            <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
          </p>
        </div>
      </div>

      {/* ── Heatmap grid ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 overflow-x-auto">
        <div style={{ minWidth: 680 }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-7">
            {monthLabels.map(({ col, label }) => (
              <div
                key={`${col}-${label}`}
                className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest"
                style={{ marginLeft: col === 0 ? 0 : `${(col - (monthLabels.find(l => l.label === label)?.col ?? col)) * 12}px`, position: 'absolute', left: `${col * 12 + 28}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid: 7 rows (Mon-Sun) × 52 cols (weeks) */}
          <div className="flex gap-0.5 mt-4">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1.5">
              {DAYS_OF_WEEK.map((d, i) => (
                <div
                  key={i}
                  className="w-5 h-[11px] flex items-center justify-end text-[8px] font-bold text-gray-300 dark:text-gray-700"
                >
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {mondays.map(monday => (
              <div key={monday} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayOffset) => {
                  const dateKey = addDays(monday, dayOffset);
                  const data = dayMap.get(dateKey);
                  if (!data) return <div key={dayOffset} className="w-[11px] h-[11px]" />;

                  return (
                    <button
                      key={dayOffset}
                      onClick={() => setSelected(prev => prev?.dateKey === dateKey ? null : data)}
                      title={dateKey}
                      className={`w-[11px] h-[11px] rounded-[2px] transition-all ${
                        intensityClass(data.blocks, data.isFuture)
                      } ${data.isToday ? 'ring-1 ring-indigo-500 ring-offset-[1px] ring-offset-white dark:ring-offset-gray-900' : ''}
                      ${selected?.dateKey === dateKey ? 'ring-1 ring-indigo-400' : ''}
                      ${data.isFuture ? 'cursor-default' : 'cursor-pointer hover:ring-1 hover:ring-indigo-300'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Menos</span>
            {['bg-gray-100 dark:bg-gray-800/60', 'bg-indigo-200 dark:bg-indigo-900/60', 'bg-indigo-300 dark:bg-indigo-800/70', 'bg-indigo-400 dark:bg-indigo-700/80', 'bg-indigo-600 dark:bg-indigo-500'].map((cls, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`} />
            ))}
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Mais</span>
          </div>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      {selected && !selected.isFuture && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                {new Date(selected.dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </p>
              {selected.isToday && (
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Hoje</span>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400"
            >
              <i className="fas fa-times text-[10px]" />
            </button>
          </div>

          {selected.blocks === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-600">Nenhuma atividade registrada.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{selected.blocks}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                  {selected.blocks === 1 ? 'Bloco' : 'Blocos'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-gray-800 dark:text-gray-100">{selected.questions}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Questões</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black" style={{
                  color: selected.questions > 0
                    ? (selected.correct / selected.questions >= 0.7 ? '#22c55e' : '#ef4444')
                    : undefined
                }}>
                  {selected.questions > 0
                    ? `${Math.round((selected.correct / selected.questions) * 100)}%`
                    : '—'}
                </p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Acerto</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeatmapView;
