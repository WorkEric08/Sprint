import React, { useMemo } from 'react';
import { SimuladoRecord } from '../types';

interface Props {
  records: SimuladoRecord[];
}

interface AreaStat {
  name: string;
  color: string;
  lastScore: number;       // % na última vez que apareceu
  prevAvg: number | null;  // média das aparições anteriores
  trend: 'up' | 'down' | 'stable' | 'new';
  delta: number | null;    // lastScore - prevAvg
  appearances: number;
}

function pctForArea(record: SimuladoRecord, areaName: string): number | null {
  const area = record.areaResults.find(a => a.areaName === areaName);
  if (!area || area.questionsTotal === 0) return null;
  return Math.round((area.questionsCorrect / area.questionsTotal) * 100);
}

/**
 * Analisa tendência por área.
 *
 * Edge cases:
 * - Área com apenas 1 aparição → trend = 'new'
 * - Área sem score (questionsTotal=0) → ignorada
 * - Simulados com edital diferente no meio → compara só o que tem a área
 * - Delta < ±5pp → 'stable'
 */
function computeAreaStats(records: SimuladoRecord[]): AreaStat[] {
  // Collect all area names across all records
  const areaMap = new Map<string, { color: string; scores: { when: number; pct: number }[] }>();

  records.forEach(r => {
    r.areaResults.forEach(a => {
      if (a.questionsTotal === 0) return;
      const pct = Math.round((a.questionsCorrect / a.questionsTotal) * 100);
      if (!areaMap.has(a.areaName)) {
        areaMap.set(a.areaName, { color: a.color, scores: [] });
      }
      areaMap.get(a.areaName)!.scores.push({ when: r.completedAt, pct });
    });
  });

  const stats: AreaStat[] = [];

  areaMap.forEach(({ color, scores }, name) => {
    // Sort by date ascending
    const sorted = [...scores].sort((a, b) => a.when - b.when);
    const lastScore = sorted[sorted.length - 1].pct;
    const previous = sorted.slice(0, -1).map(s => s.pct);
    const prevAvg = previous.length > 0
      ? Math.round(previous.reduce((a, v) => a + v, 0) / previous.length)
      : null;
    const delta = prevAvg !== null ? lastScore - prevAvg : null;
    let trend: AreaStat['trend'] = 'new';
    if (delta !== null) {
      if (delta > 5) trend = 'up';
      else if (delta < -5) trend = 'down';
      else trend = 'stable';
    }

    stats.push({ name, color, lastScore, prevAvg, trend, delta, appearances: sorted.length });
  });

  return stats.sort((a, b) => {
    // Sort by trend priority: down first (needs attention), then stable, then up, then new
    const order = { down: 0, stable: 1, up: 2, new: 3 };
    return order[a.trend] - order[b.trend];
  });
}

function generateRecommendation(stats: AreaStat[]): string | null {
  if (stats.length === 0) return null;

  const declining = stats.filter(s => s.trend === 'down' && s.delta !== null);
  if (declining.length === 0) {
    const improving = stats.filter(s => s.trend === 'up');
    if (improving.length === stats.filter(s => s.trend !== 'new').length && improving.length > 0) {
      return 'Você está progredindo em todas as áreas! Mantenha o ritmo.';
    }
    return null;
  }

  const worst = declining.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0];
  const deltaAbs = Math.abs(worst.delta ?? 0);
  return `Sua maior queda foi em ${worst.name} (-${deltaAbs}pp). Considere aumentar os blocos desta matéria.`;
}

const TREND_ICONS: Record<AreaStat['trend'], { icon: string; color: string; label: string }> = {
  up:     { icon: 'fa-arrow-trend-up',   color: '#22c55e', label: 'Melhorando' },
  down:   { icon: 'fa-arrow-trend-down', color: '#ef4444', label: 'Piorando'   },
  stable: { icon: 'fa-minus',            color: '#6b7280', label: 'Estável'    },
  new:    { icon: 'fa-star',             color: '#6366f1', label: 'Primeiro'   },
};

const SimuladoAreaCard: React.FC<Props> = ({ records }) => {
  const stats = useMemo(() => computeAreaStats(records), [records]);
  const recommendation = useMemo(() => generateRecommendation(stats), [stats]);

  if (stats.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800/60">
        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Desempenho por área
        </p>
        <p className="text-sm font-black text-gray-700 dark:text-gray-300 mt-0.5">
          Baseado em {records.length} {records.length === 1 ? 'simulado' : 'simulados'}
        </p>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className={`mx-4 mt-3 rounded-xl p-3 flex items-start gap-2 ${
          recommendation.includes('queda')
            ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20'
            : 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20'
        }`}>
          <i className={`fas ${recommendation.includes('queda') ? 'fa-exclamation-circle text-red-500' : 'fa-circle-check text-green-500'} text-xs mt-0.5`} />
          <p className="text-xs leading-relaxed" style={{ color: recommendation.includes('queda') ? '#991b1b' : '#166534' }}>
            <span className="dark:text-red-300 dark:text-green-300 font-bold">{recommendation}</span>
          </p>
        </div>
      )}

      {/* Area rows */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60 mt-2">
        {stats.map(s => {
          const tStyle = TREND_ICONS[s.trend];
          return (
            <div key={s.name} className="px-4 py-3 flex items-center gap-3">
              {/* Trend icon */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tStyle.color + '15' }}>
                <i className={`fas ${tStyle.icon} text-xs`} style={{ color: tStyle.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.lastScore}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>

              {/* Score + trend */}
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-black" style={{ color: s.lastScore >= 60 ? '#22c55e' : '#ef4444' }}>
                  {s.lastScore}%
                </p>
                {s.delta !== null && (
                  <p className="text-[9px] font-bold" style={{ color: tStyle.color }}>
                    {s.delta > 0 ? '+' : ''}{s.delta}pp
                  </p>
                )}
                {s.trend === 'new' && (
                  <p className="text-[9px] font-bold text-indigo-400">1º sim.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimuladoAreaCard;
