import React, { useMemo, useState, useEffect } from 'react';
import { BlockLog } from '../types';
import { db } from '../db';
import { toLocalDateKey, todayKey, computeToleratedStreak } from '../utils/dateUtils';

// Mon–Sun labels (pt-BR initials)
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const MONTH_NAMES: string[] = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// How many months to display (current + previous N-1)
const MONTHS_COUNT = 4;

// ── Types ──────────────────────────────────────────────────────────────────

interface DayData {
  dateKey: string;
  blocks: number;
  questions: number;
  correct: number;
  isToday: boolean;
  isFuture: boolean;
}

// ── Color helpers ──────────────────────────────────────────────────────────

function cellBg(blocks: number, isFuture: boolean): string {
  if (isFuture) return '';
  if (blocks === 0) return 'bg-gray-100 dark:bg-gray-800/50';
  if (blocks === 1) return 'bg-indigo-200 dark:bg-indigo-900/70';
  if (blocks === 2) return 'bg-indigo-300 dark:bg-indigo-800/80';
  if (blocks <= 4) return 'bg-indigo-400 dark:bg-indigo-700';
  if (blocks <= 6) return 'bg-indigo-500 dark:bg-indigo-600';
  return 'bg-indigo-600 dark:bg-indigo-500';
}

function cellTextColor(blocks: number, isFuture: boolean): string {
  if (isFuture) return 'text-gray-200 dark:text-gray-800';
  if (blocks === 0) return 'text-gray-400 dark:text-gray-600';
  if (blocks <= 2) return 'text-indigo-800 dark:text-indigo-200';
  return 'text-white';
}

// ── Calendar helpers ───────────────────────────────────────────────────────

function getMonthsToShow(): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  const now = new Date();
  for (let i = 0; i < MONTHS_COUNT; i++) {
    let m = now.getMonth() - i;
    let y = now.getFullYear();
    while (m < 0) { m += 12; y--; }
    result.push({ year: y, month: m });
  }
  return result; // newest first
}

// Returns array of YYYY-MM-DD strings (or null for empty slots)
function buildMonthCells(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert Sun=0…Sat=6 to Mon=0…Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── Main component ─────────────────────────────────────────────────────────

interface HeatmapProps {
  streakEnabled?: boolean;
}

const HeatmapView: React.FC<HeatmapProps> = ({ streakEnabled = true }) => {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [selected, setSelected] = useState<DayData | null>(null);
  const today = todayKey();

  useEffect(() => {
    db.blockLogs.toArray().then(setBlockLogs).catch(console.error);
  }, []);

  const months = useMemo(() => getMonthsToShow(), []);

  // Build day data map from block logs
  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();

    // Pre-populate all days across the visible months
    months.forEach(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        map.set(dk, {
          dateKey: dk,
          blocks: 0,
          questions: 0,
          correct: 0,
          isToday: dk === today,
          isFuture: dk > today,
        });
      }
    });

    // Accumulate block logs
    blockLogs.forEach(log => {
      const key = toLocalDateKey(log.timestamp);
      const existing = map.get(key);
      if (existing) {
        existing.blocks++;
        existing.questions += log.questionsTotal;
        existing.correct += log.questionsCorrect;
      }
    });

    return map;
  }, [blockLogs, months, today]);

  const activeDayKeys = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    dayMap.forEach((data, key) => { if (data.blocks > 0) s.add(key); });
    return s;
  }, [dayMap]);

  const streak = useMemo(() => computeToleratedStreak(activeDayKeys), [activeDayKeys]);
  const totalBlocks = useMemo(
    () => [...dayMap.values()].reduce((a, d) => a + d.blocks, 0),
    [dayMap]
  );

  return (
    <div className="space-y-4">
      {/* ── Stats row ── */}
      {streakEnabled ? (
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
                Blocos
              </span>
            </div>
            <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
              {totalBlocks}
              <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-rotate text-indigo-500 text-sm" />
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Total de blocos
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {totalBlocks}
            <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
          </p>
        </div>
      )}

      {/* ── Monthly calendars ── */}
      {months.map(({ year, month }) => {
        const cells = buildMonthCells(year, month);
        // Count active days in this month
        const activeDays = cells.filter(
          dk => dk && dayMap.get(dk)?.blocks && (dayMap.get(dk)?.blocks ?? 0) > 0
        ).length;

        return (
          <div
            key={`${year}-${month}`}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
          >
            {/* Month header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                {MONTH_NAMES[month]}
                <span className="text-gray-400 dark:text-gray-600 font-bold ml-1.5 text-xs">
                  {year}
                </span>
              </p>
              {activeDays > 0 && (
                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                  {activeDays} {activeDays === 1 ? 'dia' : 'dias'}
                </span>
              )}
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="text-center text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((dateKey, i) => {
                if (!dateKey) {
                  return <div key={i} className="aspect-square" />;
                }

                const data = dayMap.get(dateKey);
                const blocks = data?.blocks ?? 0;
                const isFuture = data?.isFuture ?? dateKey > today;
                const isToday = data?.isToday ?? false;
                const isSelected = selected?.dateKey === dateKey;
                const day = parseInt(dateKey.split('-')[2], 10);

                return (
                  <button
                    key={dateKey}
                    onClick={() => {
                      if (isFuture || !data) return;
                      setSelected(prev => prev?.dateKey === dateKey ? null : data);
                    }}
                    className={[
                      'aspect-square rounded-xl flex items-center justify-center transition-all duration-150 relative',
                      cellBg(blocks, isFuture),
                      isToday && !isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
                        : '',
                      isSelected
                        ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-110'
                        : '',
                      !isFuture ? 'active:scale-90' : 'cursor-default',
                    ].join(' ')}
                  >
                    <span className={`text-[11px] font-bold leading-none ${cellTextColor(blocks, isFuture)}`}>
                      {day}
                    </span>
                    {/* Block count dot for heavy days */}
                    {blocks >= 5 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] font-black text-white/70 leading-none">
                        {blocks}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Day detail panel ── */}
      {selected && !selected.isFuture && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                {new Date(selected.dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
              {selected.isToday && (
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Hoje</span>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
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
                <p
                  className="text-xl font-black"
                  style={{
                    color: selected.questions > 0
                      ? (selected.correct / selected.questions >= 0.7 ? '#22c55e' : '#ef4444')
                      : undefined,
                  }}
                >
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
