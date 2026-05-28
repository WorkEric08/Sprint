import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BlockLog } from '../types';
import { db } from '../db';
import { toLocalDateKey, todayKey, computeToleratedStreak } from '../utils/dateUtils';

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const MONTH_NAMES: string[] = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

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
  if (isFuture) return 'bg-transparent';
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

function intensityColor(blocks: number): string {
  if (blocks === 0) return '#e5e7eb';
  if (blocks === 1) return '#a5b4fc';
  if (blocks === 2) return '#818cf8';
  if (blocks <= 4) return '#6366f1';
  if (blocks <= 6) return '#4f46e5';
  return '#4338ca';
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
  return result;
}

function buildMonthCells(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0…Sun=6
  const cells: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDetailDate(dateKey: string): string {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── Component ──────────────────────────────────────────────────────────────

interface HeatmapProps {
  streakEnabled?: boolean;
}

const HeatmapView: React.FC<HeatmapProps> = ({ streakEnabled = true }) => {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [selected, setSelected] = useState<DayData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayKey();

  useEffect(() => {
    db.blockLogs.toArray().then(setBlockLogs).catch(console.error);
  }, []);

  // Auto-scroll to newest month (right side)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // months[0] = newest (current month), months[N-1] = oldest
  const months = useMemo(() => getMonthsToShow(), []);

  // Display order: oldest left → newest right
  const monthsForDisplay = useMemo(() => [...months].reverse(), [months]);

  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();
    months.forEach(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        map.set(dk, { dateKey: dk, blocks: 0, questions: 0, correct: 0, isToday: dk === today, isFuture: dk > today });
      }
    });
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
    dayMap.forEach((d, k) => { if (d.blocks > 0) s.add(k); });
    return s;
  }, [dayMap]);

  const streak = useMemo(() => computeToleratedStreak(activeDayKeys), [activeDayKeys]);
  const totalBlocks = useMemo(
    () => [...dayMap.values()].reduce((a, d) => a + d.blocks, 0),
    [dayMap]
  );

  const selectedAccuracy = selected && selected.questions > 0
    ? Math.round((selected.correct / selected.questions) * 100)
    : null;

  return (
    <div className="space-y-4">

      {/* ── Stats row ── */}
      {streakEnabled ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-fire text-orange-500 text-sm" />
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sequência</span>
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
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Blocos</span>
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
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total de blocos</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {totalBlocks}
            <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
          </p>
        </div>
      )}

      {/* ── Calendars — horizontal scroll, oldest left → newest right ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div ref={scrollRef} className="overflow-x-scroll-area">
          <div className="flex gap-5">
            {monthsForDisplay.map(({ year, month }) => {
              const cells = buildMonthCells(year, month);
              const activeDays = cells.filter(dk => dk && (dayMap.get(dk)?.blocks ?? 0) > 0).length;

              return (
                <div key={`${year}-${month}`} className="shrink-0 w-[220px]">
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                      {MONTH_NAMES[month]}
                      <span className="text-gray-400 dark:text-gray-600 ml-1 font-bold">{year}</span>
                    </span>
                    {activeDays > 0 && (
                      <span className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">
                        {activeDays}d
                      </span>
                    )}
                  </div>

                  {/* Day-of-week labels */}
                  <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
                    {DAY_LABELS.map((d, i) => (
                      <div key={i} className="text-center text-[8px] font-black text-gray-300 dark:text-gray-700 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-[3px]">
                    {cells.map((dateKey, i) => {
                      if (!dateKey) return <div key={i} className="aspect-square" />;

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
                            'aspect-square rounded-[5px] flex items-center justify-center transition-all duration-150 relative',
                            cellBg(blocks, isFuture),
                            isToday && !isSelected
                              ? 'ring-[1.5px] ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
                              : '',
                            isSelected
                              ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-110'
                              : '',
                            !isFuture ? 'active:scale-90' : 'cursor-default',
                          ].join(' ')}
                        >
                          <span className={`text-[10px] font-bold leading-none select-none ${cellTextColor(blocks, isFuture)}`}>
                            {day}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      {selected && !selected.isFuture && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-250">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

            {/* Intensity strip */}
            <div
              className="h-[3px] w-full transition-colors duration-300"
              style={{ backgroundColor: intensityColor(selected.blocks) }}
            />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {selected.isToday && (
                    <span className="inline-block text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                      Hoje
                    </span>
                  )}
                  <p className="text-sm font-black text-gray-800 dark:text-gray-100 leading-snug capitalize">
                    {formatDetailDate(selected.dateKey)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-90 transition-all shrink-0 ml-3"
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              </div>

              {selected.blocks === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-600">Nenhuma atividade registrada.</p>
              ) : (
                <div className="space-y-3">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Blocos */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">
                        {selected.blocks}
                      </p>
                      <p className="text-[8px] font-black text-indigo-400 dark:text-indigo-600 uppercase tracking-widest">
                        {selected.blocks === 1 ? 'Bloco' : 'Blocos'}
                      </p>
                    </div>

                    {/* Questões */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-gray-700 dark:text-gray-200 leading-none mb-1">
                        {selected.questions}
                      </p>
                      <p className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                        Questões
                      </p>
                    </div>

                    {/* Acerto */}
                    <div
                      className="rounded-xl p-3 text-center"
                      style={{
                        backgroundColor: selectedAccuracy === null
                          ? undefined
                          : selectedAccuracy >= 70
                          ? 'rgba(34,197,94,0.1)'
                          : 'rgba(239,68,68,0.08)',
                      }}
                    >
                      <p
                        className="text-2xl font-black leading-none mb-1"
                        style={{
                          color: selectedAccuracy === null
                            ? '#9ca3af'
                            : selectedAccuracy >= 70
                            ? '#16a34a'
                            : '#dc2626',
                        }}
                      >
                        {selectedAccuracy !== null ? `${selectedAccuracy}%` : '—'}
                      </p>
                      <p
                        className="text-[8px] font-black uppercase tracking-widest"
                        style={{
                          color: selectedAccuracy === null
                            ? '#9ca3af'
                            : selectedAccuracy >= 70
                            ? '#16a34a'
                            : '#dc2626',
                          opacity: 0.7,
                        }}
                      >
                        Acerto
                      </p>
                    </div>
                  </div>

                  {/* Accuracy bar */}
                  {selected.questions > 0 && selectedAccuracy !== null && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${selectedAccuracy}%`,
                            backgroundColor: selectedAccuracy >= 70 ? '#22c55e' : '#ef4444',
                          }}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600">
                        {selected.correct} de {selected.questions} corretas
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapView;
