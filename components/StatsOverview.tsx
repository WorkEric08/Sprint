
import React, { useMemo, useState, useEffect } from 'react';
import { Objective } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  objectives: Objective[];
}

const StatsOverview: React.FC<Props> = ({ objectives }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const [isObjectivesExpanded, setIsObjectivesExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sprint_stats_expanded');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sprint_stats_expanded', String(isObjectivesExpanded));
  }, [isObjectivesExpanded]);

  const stats = useMemo(() => {
    const totalSprints = objectives.reduce((acc, obj) => acc + obj.completions.length, 0);
    const totalMinutes = objectives.reduce((acc, obj) => acc + (obj.completions.length * (obj.duration || 0)), 0);
    
    const objectivesProgress = objectives.map(obj => {
      const startOfPeriod = new Date();
      if (obj.frequency === 'daily') startOfPeriod.setHours(0, 0, 0, 0);
      else if (obj.frequency === 'weekly') {
        const day = startOfPeriod.getDay();
        const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
        startOfPeriod.setDate(diff);
        startOfPeriod.setHours(0, 0, 0, 0);
      } else if (obj.frequency === 'monthly') {
        startOfPeriod.setDate(1);
        startOfPeriod.setHours(0, 0, 0, 0);
      } else {
        startOfPeriod.setMonth(0, 1);
        startOfPeriod.setHours(0, 0, 0, 0);
      }
      
      const count = obj.completions.filter(c => c.timestamp >= startOfPeriod.getTime()).length;
      // Proteção contra divisão por zero
      const target = obj.targetCount > 0 ? obj.targetCount : 1;
      const percent = Math.min((count / target) * 100, 100);
      
      return { ...obj, currentCount: count, percent };
    });

    const avgSuccessRate = objectivesProgress.length > 0 
      ? Math.round(objectivesProgress.reduce((a, b) => a + b.percent, 0) / objectivesProgress.length) 
      : 0;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return { totalSprints, hours, mins, avgSuccessRate, objectivesProgress };
  }, [objectives]);

  // Garante que o gráfico sempre tenha dados válidos
  const safeRate = isNaN(stats.avgSuccessRate) ? 0 : stats.avgSuccessRate;
  const pieData = [
    { value: safeRate },
    { value: 100 - safeRate }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-12">
      
      {/* Visão Geral - Anel de Conclusão */}
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
            <span className="text-4xl font-black text-gray-800 dark:text-white leading-none">{safeRate}%</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Concluído</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Foco Geral</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Média de progresso do período atual</p>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 text-xs mb-2">
            <i className="fas fa-bolt"></i>
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Sprints</span>
          <p className="text-xl font-black text-gray-800 dark:text-white leading-none">{stats.totalSprints}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 text-xs mb-2">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Tempo</span>
          <p className="text-xl font-black text-gray-800 dark:text-white leading-none">{stats.hours}h {stats.mins}m</p>
        </div>
      </div>

      {/* Lista de Objetivos Individuais */}
      <div className="space-y-4 px-2 transition-all duration-300">
        <button 
          onClick={() => setIsObjectivesExpanded(!isObjectivesExpanded)}
          className="w-full flex items-center justify-between mb-2 group focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Objetivos Individuais</h3>
            <span className="text-[10px] font-medium text-gray-300 dark:text-gray-700">({objectives.length})</span>
          </div>
          <i className={`fas fa-chevron-down text-gray-300 dark:text-gray-700 transition-transform duration-300 ${isObjectivesExpanded ? 'rotate-180' : ''}`}></i>
        </button>

        {isObjectivesExpanded && (
          <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
            {stats.objectivesProgress.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                Nenhum objetivo para analisar
              </div>
            ) : (
              stats.objectivesProgress.map((obj) => (
                <div key={obj.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: obj.color }}></div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{obj.title}</span>
                    </div>
                    <span className="text-xs font-black text-gray-400 dark:text-gray-600">
                      {obj.currentCount} / {obj.targetCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${obj.percent}%`,
                        backgroundColor: obj.color
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default StatsOverview;
