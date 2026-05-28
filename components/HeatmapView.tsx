import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BlockLog } from '../types';
import { db } from '../db';
import { toLocalDateKey, todayKey, computeToleratedStreak } from '../utils/dateUtils';
import { useBackButton } from '../hooks/useBackButton';

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const MONTH_NAMES: string[] = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MONTHS_COUNT = 4;
const GOAL_STORAGE_KEY = 'sprint_calendar_goal';
const MAX_GOAL_LIMIT = 12;

// ── Types ──────────────────────────────────────────────────────────────────

interface DayData {
  dateKey: string;
  blocks: number;
  questions: number;
  correct: number;
  isToday: boolean;
  isFuture: boolean;
}

interface GoalSettings {
  min: number;
  max: number;
}

// ── Goal persistence ───────────────────────────────────────────────────────

function loadGoal(): GoalSettings {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GoalSettings;
      if (typeof parsed.min === 'number' && typeof parsed.max === 'number') return parsed;
    }
  } catch {}
  return { min: 2, max: 5 };
}

function persistGoal(goal: GoalSettings): void {
  try { localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal)); } catch {}
}

// ── Color helpers (goal-aware) ─────────────────────────────────────────────

type GoalLevel = 'none' | 'below' | 'partial' | 'full';

function getGoalLevel(blocks: number, isFuture: boolean, goal: GoalSettings): GoalLevel {
  if (isFuture || blocks === 0) return 'none';
  if (blocks < goal.min) return 'below';
  if (blocks < goal.max) return 'partial';
  return 'full';
}

function cellBg(level: GoalLevel): string {
  switch (level) {
    case 'none':    return 'bg-gray-100 dark:bg-gray-800/50';
    case 'below':   return 'bg-violet-200 dark:bg-violet-900/60';
    case 'partial': return 'bg-violet-400 dark:bg-violet-700';
    case 'full':    return 'bg-violet-600 dark:bg-violet-500';
  }
}

function cellText(level: GoalLevel, isFuture: boolean): string {
  if (isFuture) return 'text-gray-200 dark:text-gray-800';
  switch (level) {
    case 'none':    return 'text-gray-400 dark:text-gray-600';
    case 'below':   return 'text-violet-800 dark:text-violet-200';
    case 'partial': return 'text-white';
    case 'full':    return 'text-white';
  }
}

function levelColor(level: GoalLevel): string {
  switch (level) {
    case 'none':    return '#e5e7eb';
    case 'below':   return '#c4b5fd';
    case 'partial': return '#a855f7';
    case 'full':    return '#7c3aed';
  }
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

function formatDetailDate(dateKey: string): string {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── Goal settings modal ────────────────────────────────────────────────────

interface GoalModalProps {
  current: GoalSettings;
  onSave: (goal: GoalSettings) => void;
  onClose: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ current, onSave, onClose }) => {
  const [min, setMin] = useState(current.min);
  const [max, setMax] = useState(current.max);

  useBackButton(onClose);

  const handleMinChange = (v: number) => {
    setMin(v);
    if (v >= max) setMax(v + 1);
  };

  const handleMaxChange = (v: number) => {
    setMax(v);
    if (v <= min) setMin(v - 1);
  };

  const handleSave = () => {
    onSave({ min, max });
    onClose();
  };

  const allPreviewRows: { level: GoalLevel; label: string; range: string }[] = [
    { level: 'below',   label: 'Início',  range: `1–${min - 1} bloco${min - 1 !== 1 ? 's' : ''}` },
    { level: 'partial', label: 'Parcial', range: `${min}–${max - 1} bloco${max - 1 !== 1 ? 's' : ''}` },
    { level: 'full',    label: 'Meta!',   range: `${max}+ bloco${max !== 1 ? 's' : ''}` },
  ];
  const preview = allPreviewRows.filter((row, i) => i === 0 ? min > 1 : true);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                Meta de Blocos
              </h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">
                Define as cores do calendário
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
            >
              <i className="fas fa-times text-[11px]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Sliders */}
          <div className="space-y-5">

            {/* Min */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                  Mínimo diário
                </label>
                <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                  {min} {min === 1 ? 'bloco' : 'blocos'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={MAX_GOAL_LIMIT - 1}
                value={min}
                onChange={e => handleMinChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#7c3aed' }}
              />
            </div>

            {/* Max */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                  Máximo diário
                </label>
                <span className="text-sm font-black text-violet-800 dark:text-violet-300">
                  {max} {max === 1 ? 'bloco' : 'blocos'}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={MAX_GOAL_LIMIT}
                value={max}
                onChange={e => handleMaxChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#4c1d95' }}
              />
            </div>
          </div>

          {/* Legend preview */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Legenda
            </p>
            <div className="space-y-2">
              {/* No activity */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800/50 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Sem estudo</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-600">0 blocos</p>
                </div>
              </div>
              {preview.map(({ level, label, range }) => (
                <div key={level} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: levelColor(level) }}
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-600">{range}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] text-white active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#7c3aed' }}
          >
            Salvar meta
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main component ─────────────────────────────────────────────────────────

interface HeatmapProps {
  streakEnabled?: boolean;
}

const HeatmapView: React.FC<HeatmapProps> = ({ streakEnabled = true }) => {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [selected, setSelected] = useState<DayData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [goal, setGoal] = useState<GoalSettings>(loadGoal);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayKey();

  useEffect(() => {
    db.blockLogs.toArray().then(setBlockLogs).catch(console.error);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const months = useMemo(() => getMonthsToShow(), []);
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

  const handleSaveGoal = (newGoal: GoalSettings) => {
    setGoal(newGoal);
    persistGoal(newGoal);
  };

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
              <i className="fas fa-rotate text-violet-500 text-sm" />
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
            <i className="fas fa-rotate text-violet-500 text-sm" />
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total de blocos</span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {totalBlocks}
            <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
          </p>
        </div>
      )}

      {/* ── Calendar card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">

        {/* Card header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            Últimos {MONTHS_COUNT} meses
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-90 transition-all"
          >
            <i className="fas fa-gear text-[10px]" />
          </button>
        </div>

        {/* Horizontal scroll */}
        <div ref={scrollRef} className="overflow-x-scroll-area">
          <div className="flex gap-5">
            {monthsForDisplay.map(({ year, month }) => {
              const cells = buildMonthCells(year, month);
              const activeDays = cells.filter(dk => dk && (dayMap.get(dk)?.blocks ?? 0) > 0).length;

              return (
                <div key={`${year}-${month}`} className="shrink-0 w-[220px]">
                  {/* Month label */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                      {MONTH_NAMES[month]}
                      <span className="text-gray-400 dark:text-gray-600 ml-1 font-bold">{year}</span>
                    </span>
                    {activeDays > 0 && (
                      <span className="text-[9px] font-black text-violet-400 dark:text-violet-500 uppercase tracking-widest">
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
                      const level = getGoalLevel(blocks, isFuture, goal);

                      return (
                        <button
                          key={dateKey}
                          onClick={() => {
                            if (isFuture || !data) return;
                            setSelected(prev => prev?.dateKey === dateKey ? null : data);
                          }}
                          className={[
                            'aspect-square rounded-[5px] flex items-center justify-center transition-all duration-150',
                            isFuture ? 'bg-transparent' : cellBg(level),
                            isToday && !isSelected
                              ? 'ring-[1.5px] ring-violet-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
                              : '',
                            isSelected
                              ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-110'
                              : '',
                            !isFuture ? 'active:scale-90' : 'cursor-default',
                          ].join(' ')}
                        >
                          <span className={`text-[10px] font-bold leading-none select-none ${cellText(level, isFuture)}`}>
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

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-end">
          <span className="text-[8px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Meta</span>
          {(['below', 'partial', 'full'] as GoalLevel[]).map(level => (
            <div key={level} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-[3px]"
                style={{ backgroundColor: levelColor(level) }}
              />
            </div>
          ))}
          <div className="w-3 h-3 rounded-[3px] bg-gray-100 dark:bg-gray-800/50" />
        </div>
      </div>

      {/* ── Day detail panel ── */}
      {selected && !selected.isFuture && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-250">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

            {/* Intensity strip */}
            <div
              className="h-[3px] w-full transition-colors duration-300"
              style={{ backgroundColor: levelColor(getGoalLevel(selected.blocks, false, goal)) }}
            />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {selected.isToday && (
                    <span className="inline-block text-[9px] font-black text-violet-500 uppercase tracking-widest mb-0.5">
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
                  <div className="grid grid-cols-3 gap-2">
                    {/* Blocos */}
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none mb-1">
                        {selected.blocks}
                      </p>
                      <p className="text-[8px] font-black text-violet-400 dark:text-violet-600 uppercase tracking-widest">
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
                          color: selectedAccuracy === null ? '#9ca3af'
                            : selectedAccuracy >= 70 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {selectedAccuracy !== null ? `${selectedAccuracy}%` : '—'}
                      </p>
                      <p
                        className="text-[8px] font-black uppercase tracking-widest"
                        style={{
                          color: selectedAccuracy === null ? '#9ca3af'
                            : selectedAccuracy >= 70 ? '#16a34a' : '#dc2626',
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

                  {/* Goal status badge */}
                  {(() => {
                    const level = getGoalLevel(selected.blocks, false, goal);
                    const labels: Record<GoalLevel, string> = {
                      none: '',
                      below: `Abaixo do mínimo · meta: ${goal.min} blocos`,
                      partial: `Meta parcial · faltam ${goal.max - selected.blocks} para o máximo`,
                      full: 'Meta completa!',
                    };
                    if (level === 'none') return null;
                    return (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: `${levelColor(level)}22` }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: levelColor(level) }} />
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: levelColor(level) }}>
                          {labels[level]}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Goal settings modal ── */}
      {showSettings && (
        <GoalModal
          current={goal}
          onSave={handleSaveGoal}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default HeatmapView;
