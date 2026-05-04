
import React, { useMemo, useState } from 'react';
import { Objective, Subject } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  objectives: Objective[];
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

const StatsOverview: React.FC<Props> = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [activePeriod, setActivePeriod] = useState<Period>('day');

  const subjects = useMemo<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('sprint_ciclo_subjects');
      if (saved) {
        return (JSON.parse(saved) as any[]).map(s => ({
          id: s.id,
          title: s.title,
          color: s.color,
          duration: s.duration,
          blockCount: s.blockCount ?? s.pixelCount ?? 20,
          completedBlocks: s.completedBlocks ?? s.completedPixels ?? [],
        }));
      }
    } catch {}
    return [];
  }, []);

  const overallProgress = useMemo(() => {
    const totalBlocks = subjects.reduce((a, s) => a + s.blockCount, 0);
    const completedBlocks = subjects.reduce((a, s) => a + s.completedBlocks.length, 0);
    const percent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
    return { totalBlocks, completedBlocks, percent: isNaN(percent) ? 0 : percent };
  }, [subjects]);

  const todayMetrics = useMemo(() => {
    const start = getPeriodStart('day');
    let sprints = 0;
    let minutes = 0;
    subjects.forEach(s => {
      const blocks = s.completedBlocks.filter(t => t >= start).length;
      sprints += blocks;
      minutes += blocks * s.duration;
    });
    return { sprints, minutes };
  }, [subjects]);

  const periodMetrics = useMemo(() => {
    const start = getPeriodStart(activePeriod);
    let totalSprints = 0;
    let totalMinutes = 0;
    const subjectBreakdown = subjects
      .map(s => {
        const blocks = s.completedBlocks.filter(t => t >= start).length;
        const minutes = blocks * s.duration;
        totalSprints += blocks;
        totalMinutes += minutes;
        return { id: s.id, title: s.title, color: s.color, blocks, minutes, blockCount: s.blockCount };
      })
      .filter(s => s.blocks > 0)
      .sort((a, b) => b.minutes - a.minutes);

    return { totalSprints, totalMinutes, subjectBreakdown };
  }, [subjects, activePeriod]);

  const pieData = [
    { value: overallProgress.percent },
    { value: 100 - overallProgress.percent },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-12">

      {/* Anel de Progresso Geral */}
      <div className="flex flex-col items-center justify-center pt-4">
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
        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Progresso Geral</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {subjects.length === 0
              ? 'Nenhuma matéria cadastrada'
              : `${overallProgress.completedBlocks} de ${overallProgress.totalBlocks} blocos concluídos`}
          </p>
        </div>
      </div>

      {/* Métricas de Hoje */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 text-xs mb-2">
            <i className="fas fa-bolt"></i>
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            Sprints Hoje
          </span>
          <p className="text-xl font-black text-gray-800 dark:text-white leading-none">
            {todayMetrics.sprints === 0 ? '—' : todayMetrics.sprints}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 text-xs mb-2">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            Tempo Hoje
          </span>
          <p className="text-xl font-black text-gray-800 dark:text-white leading-none">
            {formatTime(todayMetrics.minutes)}
          </p>
        </div>
      </div>

      {/* Métricas por período */}
      <div className="space-y-4 px-2">
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

        {/* Cards do período */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <i className="fas fa-hourglass-half text-indigo-500 text-[9px]"></i>
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
                <i className="fas fa-bolt text-indigo-500 text-[9px]"></i>
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
      </div>
    </div>
  );
};

export default StatsOverview;
