
import React, { useMemo, useState } from 'react';
import { Objective, Subject, BlockLog, BlockType, BLOCK_TYPE_LABELS, BLOCK_TYPE_COLORS } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { db } from '../db';
import HeatmapView from './HeatmapView';

interface Props {
  objectives: Objective[];
  subjects: Subject[];
  onOpenErrorNotebook: () => void;
}

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
};

function getPeriodStart(period: Period): number {
  const d = new Date();
  if (period === 'day') {
    d.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function formatTime(minutes: number): string {
  if (minutes === 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ── Feature 3: Taxa de acerto por subtópico ───────────────────────────────

interface SubtopicStat {
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  subtopic: string;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number; // 0-100
}

function useSubtopicStats() {
  const [stats, setStats] = useState<SubtopicStat[]>([]);

  useMemo(() => {
    db.blockLogs
      .filter(log => log.questionsTotal > 0)
      .toArray()
      .then((logs: BlockLog[]) => {
        const map = new Map<string, SubtopicStat>();
        logs.forEach(log => {
          const key = `${log.subjectId}::${log.subtopic || '__none__'}`;
          const existing = map.get(key);
          if (existing) {
            existing.totalQuestions += log.questionsTotal;
            existing.totalCorrect += log.questionsCorrect;
            existing.accuracy = Math.round((existing.totalCorrect / existing.totalQuestions) * 100);
          } else {
            map.set(key, {
              subjectId: log.subjectId,
              subjectTitle: log.subjectTitle,
              subjectColor: log.subjectColor,
              subtopic: log.subtopic || '(sem subtópico)',
              totalQuestions: log.questionsTotal,
              totalCorrect: log.questionsCorrect,
              accuracy: Math.round((log.questionsCorrect / log.questionsTotal) * 100),
            });
          }
        });
        setStats([...map.values()]);
      })
      .catch(() => {});
  }, []);

  return stats;
}

const StatsOverview: React.FC<Props> = ({ subjects, onOpenErrorNotebook }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [activePeriod, setActivePeriod] = useState<Period>('day');
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const subtopicStats = useSubtopicStats();

  const overallProgress = useMemo(() => {
    const totalBlocks = subjects.reduce((a, s) => a + s.blockCount, 0);
    const completedBlocks = subjects.reduce((a, s) => a + s.completedBlocks.length, 0);
    const percent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
    return { totalBlocks, completedBlocks, percent: isNaN(percent) ? 0 : percent };
  }, [subjects]);

  const periodMetrics = useMemo(() => {
    const start = getPeriodStart(activePeriod);
    let totalSprints = 0;
    let totalMinutes = 0;
    const typeCounts: Record<BlockType, number> = { study: 0, review: 0, questions: 0 };

    const subjectBreakdown = subjects
      .map(s => {
        const periodBlocks = s.completedBlocks.filter(b => b.timestamp >= start);
        const blocks = periodBlocks.length;
        const minutes = blocks * s.duration;
        totalSprints += blocks;
        totalMinutes += minutes;
        periodBlocks.forEach(b => { typeCounts[b.type] = (typeCounts[b.type] ?? 0) + 1; });
        return { id: s.id, title: s.title, color: s.color, blocks, minutes, blockCount: s.blockCount };
      })
      .filter(s => s.blocks > 0)
      .sort((a, b) => b.minutes - a.minutes);

    return { totalSprints, totalMinutes, subjectBreakdown, typeCounts };
  }, [subjects, activePeriod]);

  // Feature 3: Top strong/weak subtopics (min 3 questions to count)
  const { strongPoints, weakPoints } = useMemo(() => {
    const qualified = subtopicStats.filter(s => s.totalQuestions >= 3);
    const sorted = [...qualified].sort((a, b) => b.accuracy - a.accuracy);
    return {
      strongPoints: sorted.slice(0, 5),
      weakPoints: [...sorted].reverse().slice(0, 5),
    };
  }, [subtopicStats]);

  const pieData = [
    { value: overallProgress.percent },
    { value: 100 - overallProgress.percent },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 pb-2">

      {/* ── Desktop: two-column | Mobile: stacked ── */}
      <div className="md:flex md:gap-8 md:items-start lg:gap-12">

        {/* ── Coluna esquerda: anel + lista de matérias ── */}
        <div className="md:w-56 lg:w-64 md:shrink-0 md:sticky md:top-0">
          <div className="flex flex-col items-center justify-center py-3 md:py-6">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={450}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                  >
                    <Cell fill={isDarkMode ? '#6366f1' : '#4f46e5'} />
                    <Cell fill={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-800 dark:text-white leading-none">
                  {overallProgress.percent}%
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                  Concluído
                </span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Progresso Geral</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {subjects.length === 0
                  ? 'Nenhuma matéria cadastrada'
                  : `${overallProgress.completedBlocks} de ${overallProgress.totalBlocks} blocos concluídos`}
              </p>
            </div>
          </div>

          {/* Lista de matérias — apenas no desktop */}
          {subjects.length > 0 && (
            <div className="hidden md:block mt-2 pb-6 space-y-2.5">
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3 text-center">
                Matérias
              </p>
              {subjects.map(s => {
                const pct = s.blockCount > 0
                  ? Math.round((s.completedBlocks.length / s.blockCount) * 100)
                  : 0;
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{s.title}</span>
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-600">{pct}%</span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-4">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Coluna direita: métricas por período ── */}
        <div className="flex-1 space-y-4 px-2 md:px-0 md:pt-6 mt-4 md:mt-0">
          {/* Header de período */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Métricas
            </h3>
            <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    activePeriod === p
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Cards de métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <i className="fas fa-hourglass-half text-indigo-500 text-[9px]" />
                </div>
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Tempo
                </span>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                {formatTime(periodMetrics.totalMinutes)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <i className="fas fa-bolt text-indigo-500 text-[9px]" />
                </div>
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Sprints
                </span>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                {periodMetrics.totalSprints === 0 ? '—' : periodMetrics.totalSprints}
                {periodMetrics.totalSprints > 0 && (
                  <span className="text-sm font-bold text-gray-400 ml-1">
                    {periodMetrics.totalSprints === 1 ? 'bloco' : 'blocos'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Feature 4: Distribuição de tipos de bloco */}
          {periodMetrics.totalSprints > 0 && (
            (() => {
              const types: BlockType[] = ['study', 'review', 'questions'];
              const hasMultiple = types.filter(t => periodMetrics.typeCounts[t] > 0).length > 1;
              if (!hasMultiple) return null;
              return (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 space-y-2">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Distribuição</p>
                  {types.filter(t => periodMetrics.typeCounts[t] > 0).map(t => {
                    const pct = Math.round((periodMetrics.typeCounts[t] / periodMetrics.totalSprints) * 100);
                    return (
                      <div key={t} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{BLOCK_TYPE_LABELS[t]}</span>
                          <span className="text-[10px] font-black" style={{ color: BLOCK_TYPE_COLORS[t] }}>{pct}%</span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BLOCK_TYPE_COLORS[t] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}

          {/* Breakdown por matéria */}
          {periodMetrics.subjectBreakdown.length > 0 ? (
            <div className="space-y-4 pt-1">
              {periodMetrics.subjectBreakdown.map(s => (
                <div key={s.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                        {s.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-gray-600 shrink-0 ml-2">
                      <span>{s.blocks} / {s.blockCount} blocos</span>
                      <span>·</span>
                      <span>{formatTime(s.minutes)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: s.blockCount > 0
                          ? `${Math.min((s.blocks / s.blockCount) * 100, 100)}%`
                          : '0%',
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 dark:text-gray-600 text-sm border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              Nenhuma atividade neste período
            </div>
          )}

          {/* ── Feature 3: Pontos Fortes / Fracos ── */}
          {(strongPoints.length > 0 || weakPoints.length > 0) && (
            <div className="space-y-3 pt-2">
              <SubtopicCard
                title="Pontos Fortes"
                icon="fa-arrow-trend-up"
                iconColor="text-green-500"
                bgColor="bg-green-50 dark:bg-green-900/10"
                borderColor="border-green-100 dark:border-green-900/30"
                items={strongPoints}
                expandedKey={expandedSubtopic}
                onToggle={setExpandedSubtopic}
              />
              <SubtopicCard
                title="Pontos Fracos"
                icon="fa-arrow-trend-down"
                iconColor="text-red-500"
                bgColor="bg-red-50 dark:bg-red-900/10"
                borderColor="border-red-100 dark:border-red-900/30"
                items={weakPoints}
                expandedKey={expandedSubtopic}
                onToggle={setExpandedSubtopic}
              />
            </div>
          )}

          {/* ── Feature 4: Heatmap ── */}
          <div className="pt-2">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Histórico · 52 semanas
            </h3>
            <HeatmapView />
          </div>

          {/* ── Caderno de Erros entry point ── */}
          <button
            onClick={onOpenErrorNotebook}
            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <i className="fas fa-book text-red-500 text-sm" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-800 dark:text-gray-100">Caderno de Erros</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                  Ver registros e anotações
                </p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SubtopicCard helper component ─────────────────────────────────────────

interface SubtopicCardProps {
  title: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  items: SubtopicStat[];
  expandedKey: string | null;
  onToggle: (key: string | null) => void;
}

const SubtopicCard: React.FC<SubtopicCardProps> = ({
  title, icon, iconColor, bgColor, borderColor, items, expandedKey, onToggle
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`rounded-2xl border ${bgColor} ${borderColor} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-2">
        <i className={`fas ${icon} ${iconColor} text-sm`} />
        <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
        {items.map(item => {
          const key = `${item.subjectId}::${item.subtopic}`;
          const isExpanded = expandedKey === key;
          return (
            <button
              key={key}
              onClick={() => onToggle(isExpanded ? null : key)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/60 dark:hover:bg-gray-800/30 transition-colors text-left"
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.subjectColor }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                  {item.subtopic}
                </p>
                {isExpanded && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                    {item.subjectTitle} · {item.totalCorrect}/{item.totalQuestions} certas
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-sm font-black"
                  style={{ color: item.accuracy >= 70 ? '#22c55e' : item.accuracy >= 50 ? '#f97316' : '#ef4444' }}
                >
                  {item.accuracy}%
                </span>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[9px] text-gray-300 dark:text-gray-700`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatsOverview;
