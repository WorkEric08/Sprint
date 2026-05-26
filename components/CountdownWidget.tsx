import React, { useState, useMemo } from 'react';

interface Props {
  examDate: string | null;   // "YYYY-MM-DD"
  examName?: string;         // from selected edital
  onEditDate: () => void;
}

const MILESTONES = {
  far:    ['Mapear o edital completo', 'Criar ciclo de estudos base', 'Construir fundamentos teóricos'],
  mid:    ['Equilibrar teoria e questões', 'Resolver provas dos últimos anos', 'Intensificar revisão espaçada'],
  near:   ['Intensificar resolução de questões', 'Simular condições de prova', 'Focar nos pontos fracos'],
  urgent: ['Revisão dos pontos críticos', 'Simulado completo diário', 'Cuidar do sono e alimentação'],
};

function getUrgency(days: number): 'far' | 'mid' | 'near' | 'urgent' {
  if (days > 180) return 'far';
  if (days > 90)  return 'mid';
  if (days > 30)  return 'near';
  return 'urgent';
}

const URGENCY_STYLES = {
  far:    { bar: 'bg-gray-400 dark:bg-gray-600',   text: 'text-gray-500 dark:text-gray-400',   badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
  mid:    { bar: 'bg-indigo-500',                  text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
  near:   { bar: 'bg-amber-500',                   text: 'text-amber-600 dark:text-amber-400',  badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  urgent: { bar: 'bg-red-500',                     text: 'text-red-600 dark:text-red-400',      badge: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
};

function todayMidnight(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseDateKey(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

const CountdownWidget: React.FC<Props> = ({ examDate, examName, onEditDate }) => {
  const [expanded, setExpanded] = useState(false);

  const info = useMemo(() => {
    if (!examDate) return null;
    const examMs  = parseDateKey(examDate);
    const todayMs = todayMidnight();
    const days    = Math.ceil((examMs - todayMs) / 86_400_000);
    return { days, urgency: getUrgency(Math.max(0, days)) };
  }, [examDate]);

  if (!info) return null;

  const { days, urgency } = info;
  const style = URGENCY_STYLES[urgency];
  const milestones = MILESTONES[urgency];

  if (days < 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-flag-checkered text-gray-400 text-sm" />
          <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Prova encerrada</span>
        </div>
        <button onClick={onEditDate} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Atualizar</button>
      </div>
    );
  }

  // Progress: assume max 365 days from now
  const totalRange = Math.max(days, 365);
  const elapsed = totalRange - days;
  const progressPct = Math.min(100, Math.round((elapsed / totalRange) * 100));

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.badge}`}>
              {days === 0 ? 'HOJE' : `${days} ${days === 1 ? 'dia' : 'dias'}`}
            </div>
            <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-tight truncate max-w-[180px]">
              {examName ?? 'para a prova'}
            </span>
          </div>
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-[10px] text-gray-300 dark:text-gray-700`} />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Início</span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>
            {progressPct}% do caminho
          </span>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Prova</span>
        </div>
      </button>

      {/* Expanded: marcos sugeridos */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            Marcos sugeridos para esta fase
          </p>
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${style.badge}`}>
                <span className="text-[8px] font-black">{i + 1}</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{m}</span>
            </div>
          ))}
          <button
            onClick={e => { e.stopPropagation(); onEditDate(); }}
            className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-indigo-500 transition-colors"
          >
            <i className="fas fa-calendar-alt mr-1" />
            Alterar data da prova
          </button>
        </div>
      )}
    </div>
  );
};

export default CountdownWidget;
