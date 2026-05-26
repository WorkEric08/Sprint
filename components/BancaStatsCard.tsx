import React, { useMemo, useState } from 'react';
import { BlockLog } from '../types';

interface Props {
  blockLogs: BlockLog[];
  targetBanca: string | null;
}

const MIN_QUESTIONS = 50;

interface BancaStat {
  banca: string;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  blockCount: number;
}

const BancaStatsCard: React.FC<Props> = ({ blockLogs, targetBanca }) => {
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo<BancaStat[]>(() => {
    const map = new Map<string, { total: number; correct: number; blocks: number }>();

    blockLogs.forEach(log => {
      if (!log.banca || log.questionsTotal === 0) return;
      const existing = map.get(log.banca) ?? { total: 0, correct: 0, blocks: 0 };
      existing.total += log.questionsTotal;
      existing.correct += log.questionsCorrect;
      existing.blocks++;
      map.set(log.banca, existing);
    });

    return [...map.entries()]
      .map(([banca, data]) => ({
        banca,
        totalQuestions: data.total,
        totalCorrect: data.correct,
        accuracy: Math.round((data.correct / data.total) * 100),
        blockCount: data.blocks,
      }))
      .filter(s => s.totalQuestions >= MIN_QUESTIONS)
      .sort((a, b) => b.totalQuestions - a.totalQuestions);
  }, [blockLogs]);

  const targetStat = stats.find(s => s.banca === targetBanca);

  if (stats.length === 0) return null;

  const best = [...stats].sort((a, b) => b.accuracy - a.accuracy)[0];
  const worst = [...stats].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Desempenho por banca</p>
            <p className="text-sm font-black text-gray-700 dark:text-gray-300 mt-0.5">
              {stats.length} {stats.length === 1 ? 'banca' : 'bancas'} com ≥{MIN_QUESTIONS} questões
            </p>
          </div>
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-[10px] text-gray-300 dark:text-gray-700`} />
        </div>

        {/* Quick summary */}
        <div className="grid grid-cols-2 gap-2">
          {best && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-2.5 border border-green-100 dark:border-green-900/20">
              <p className="text-[9px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest">Melhor</p>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate">{best.banca}</p>
              <p className="text-lg font-black text-green-500">{best.accuracy}%</p>
            </div>
          )}
          {worst && worst.banca !== best?.banca && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 border border-red-100 dark:border-red-900/20">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Mais difícil</p>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate">{worst.banca}</p>
              <p className="text-lg font-black text-red-500">{worst.accuracy}%</p>
            </div>
          )}
        </div>

        {/* Target banca recommendation */}
        {targetBanca && targetStat && (
          <div className="mt-2 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-900/20">
            <i className="fas fa-crosshairs text-indigo-500 text-xs" />
            <div>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Banca alvo: {targetBanca}</span>
              <p className="text-xs font-black text-gray-700 dark:text-gray-300">
                {targetStat.accuracy}% de acerto · {targetStat.totalQuestions} questões
                {targetStat.accuracy < 65 && ' · Abaixo do esperado'}
              </p>
            </div>
          </div>
        )}
        {targetBanca && !targetStat && (
          <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-2.5 border border-amber-100 dark:border-amber-900/20">
            <i className="fas fa-triangle-exclamation text-amber-500 text-xs" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Banca alvo: <strong>{targetBanca}</strong>. Ainda sem dados suficientes (mín. {MIN_QUESTIONS} questões).
            </p>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800/60 divide-y divide-gray-50 dark:divide-gray-800/60">
          {stats.map(s => (
            <div key={s.banca} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{s.banca}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5">{s.totalCorrect}/{s.totalQuestions} certas · {s.blockCount} blocos</p>
                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.accuracy}%`,
                      backgroundColor: s.accuracy >= 70 ? '#22c55e' : s.accuracy >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
              <p
                className="text-lg font-black shrink-0"
                style={{ color: s.accuracy >= 70 ? '#22c55e' : s.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}
              >
                {s.accuracy}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BancaStatsCard;
