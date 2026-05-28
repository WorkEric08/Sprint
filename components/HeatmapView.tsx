import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BlockLog } from '../types';
import { db } from '../db';
import {
  toLocalDateKey,
  last52WeekMondays,
  addDays,
  todayKey,
  computeToleratedStreak,
} from '../utils/dateUtils';

const DAYS_OF_WEEK = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Seg–Dom (pt-BR)
const CELL = 13;       // px – tamanho da célula (maior para toque)
const GAP = 2;         // px – espaço entre células
const COL_W = CELL + GAP; // 15px por coluna de semana
const LABEL_W = 22;    // px – coluna de rótulos de dia

// ── Day cell data ──────────────────────────────────────────────────────────

interface DayData {
  dateKey: string;
  blocks: number;
  questions: number;
  correct: number;
  isToday: boolean;
  isFuture: boolean;
}

// ── Color intensity (indigo scale) ────────────────────────────────────────

function intensityClass(blocks: number, isFuture: boolean): string {
  if (isFuture) return 'bg-gray-100 dark:bg-gray-800/40 opacity-30';
  if (blocks === 0) return 'bg-gray-100 dark:bg-gray-800/60';
  if (blocks === 1) return 'bg-indigo-200 dark:bg-indigo-900/60';
  if (blocks === 2) return 'bg-indigo-300 dark:bg-indigo-800/70';
  if (blocks <= 4) return 'bg-indigo-400 dark:bg-indigo-700/80';
  if (blocks <= 6) return 'bg-indigo-500 dark:bg-indigo-600';
  return 'bg-indigo-600 dark:bg-indigo-500';
}

// ── Month label positions ─────────────────────────────────────────────────

function getMonthLabelMap(mondays: string[]): Map<number, string> {
  const seen = new Set<string>();
  const map = new Map<number, string>();
  mondays.forEach((monday, col) => {
    const [y, m] = monday.split('-');
    const key = `${y}-${m}`;
    if (!seen.has(key)) {
      seen.add(key);
      const date = new Date(Number(y), Number(m) - 1, 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      map.set(col, label);
    }
  });
  return map;
}

// ── Main component ─────────────────────────────────────────────────────────

interface HeatmapProps {
  streakEnabled?: boolean;
}

const HeatmapView: React.FC<HeatmapProps> = ({ streakEnabled = true }) => {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [selected, setSelected] = useState<DayData | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayKey();

  useEffect(() => {
    db.blockLogs.toArray().then(setBlockLogs).catch(console.error);
  }, []);

  // Auto-scroll para mostrar hoje (final do grid) assim que o container monta
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, []);

  // Controla fade esquerdo conforme o usuário rola
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowLeftFade(el.scrollLeft > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const mondays = useMemo(() => last52WeekMondays(), []);

  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();
    mondays.forEach(monday => {
      for (let i = 0; i < 7; i++) {
        const dateKey = addDays(monday, i);
        map.set(dateKey, {
          dateKey,
          blocks: 0,
          questions: 0,
          correct: 0,
          isToday: dateKey === today,
          isFuture: dateKey > today,
        });
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
  }, [blockLogs, mondays, today]);

  const activeDayKeys = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    dayMap.forEach((data, key) => { if (data.blocks > 0) s.add(key); });
    return s;
  }, [dayMap]);

  const streak = useMemo(() => computeToleratedStreak(activeDayKeys), [activeDayKeys]);
  const totalBlocks = useMemo(() => [...dayMap.values()].reduce((a, d) => a + d.blocks, 0), [dayMap]);
  const monthLabelMap = useMemo(() => getMonthLabelMap(mondays), [mondays]);

  const gridWidth = LABEL_W + mondays.length * COL_W;

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
                Total (1 ano)
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
              Total de blocos · 1 ano
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">
            {totalBlocks}
            <span className="text-sm font-bold text-gray-400 ml-1">blocos</span>
          </p>
        </div>
      )}

      {/* ── Heatmap grid ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        {/* Wrapper relativo para os fades de scroll */}
        <div className="relative">
          {/* Fade esquerdo – indica histórico disponível ao rolar */}
          <div
            className={`absolute inset-y-0 left-0 w-8 pointer-events-none z-10 transition-opacity duration-200 rounded-l-lg bg-gradient-to-r from-white dark:from-gray-900 to-transparent ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Container de scroll horizontal */}
          <div ref={scrollRef} className="overflow-x-scroll-area">
            <div style={{ width: `${gridWidth}px` }}>

              {/* Rótulos de mês – um slot por coluna de semana */}
              <div
                className="flex"
                style={{ paddingLeft: `${LABEL_W}px`, marginBottom: '4px' }}
              >
                {mondays.map((monday, col) => (
                  <div key={monday} style={{ width: `${COL_W}px`, flexShrink: 0 }}>
                    {monthLabelMap.has(col) && (
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest whitespace-nowrap">
                        {monthLabelMap.get(col)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Corpo do grid */}
              <div className="flex" style={{ gap: `${GAP}px` }}>
                {/* Coluna de rótulos de dia-da-semana */}
                <div
                  className="flex flex-col flex-shrink-0"
                  style={{ width: `${LABEL_W}px`, gap: `${GAP}px` }}
                >
                  {DAYS_OF_WEEK.map((d, i) => (
                    <div
                      key={i}
                      style={{ height: `${CELL}px` }}
                      className="flex items-center justify-end pr-1 text-[9px] font-bold text-gray-300 dark:text-gray-700"
                    >
                      {i % 2 === 0 ? d : ''}
                    </div>
                  ))}
                </div>

                {/* Colunas de semana */}
                {mondays.map(monday => (
                  <div key={monday} className="flex flex-col flex-shrink-0" style={{ gap: `${GAP}px` }}>
                    {Array.from({ length: 7 }).map((_, dayOffset) => {
                      const dateKey = addDays(monday, dayOffset);
                      const data = dayMap.get(dateKey);
                      if (!data) return (
                        <div key={dayOffset} style={{ width: `${CELL}px`, height: `${CELL}px` }} />
                      );

                      const isSelected = selected?.dateKey === dateKey;

                      return (
                        <button
                          key={dayOffset}
                          onClick={() => !data.isFuture && setSelected(prev => prev?.dateKey === dateKey ? null : data)}
                          title={dateKey}
                          style={{ width: `${CELL}px`, height: `${CELL}px` }}
                          className={[
                            'rounded-[3px] transition-all duration-150 flex-shrink-0',
                            intensityClass(data.blocks, data.isFuture),
                            data.isToday
                              ? 'ring-1 ring-indigo-500 ring-offset-[1px] ring-offset-white dark:ring-offset-gray-900'
                              : '',
                            isSelected
                              ? 'ring-2 ring-indigo-400 ring-offset-[1px] ring-offset-white dark:ring-offset-gray-900 scale-125'
                              : '',
                            data.isFuture
                              ? 'cursor-default'
                              : 'cursor-pointer hover:scale-125 active:scale-95',
                          ].join(' ')}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Menos</span>
                {[
                  'bg-gray-100 dark:bg-gray-800/60',
                  'bg-indigo-200 dark:bg-indigo-900/60',
                  'bg-indigo-300 dark:bg-indigo-800/70',
                  'bg-indigo-400 dark:bg-indigo-700/80',
                  'bg-indigo-600 dark:bg-indigo-500',
                ].map((cls, i) => (
                  <div
                    key={i}
                    style={{ width: `${CELL}px`, height: `${CELL}px` }}
                    className={`rounded-[3px] flex-shrink-0 ${cls}`}
                  />
                ))}
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Mais</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel de detalhe do dia ── */}
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
