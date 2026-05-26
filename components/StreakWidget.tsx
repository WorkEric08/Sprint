import React, { useState } from 'react';
import { StreakState } from '../types';
import { streakLabel, bonusLabel } from '../utils/streakUtils';

interface Props {
  state: StreakState;
  compact?: boolean;
}

/** Copy-safe urgency label for streak */
function streakSubLabel(state: StreakState): string {
  if (state.currentStreak === 0) return 'Estude hoje para começar';
  if (state.currentStreak < 3) return 'Você está construindo o hábito';
  if (state.currentStreak < 7) return 'Bom ritmo! Continue assim';
  if (state.currentStreak < 30) return 'Ritmo consistente';
  return 'Disciplina de longo prazo';
}

const StreakWidget: React.FC<Props> = ({ state, compact = false }) => {
  const [showDetail, setShowDetail] = useState(false);

  const hasStreak = state.currentStreak > 0;
  const hasBonusUsed = state.bonusUsedRecently;
  const lowBonus = state.bonusBalance === 0 && hasStreak;

  if (compact) {
    return (
      <button
        onClick={() => setShowDetail(p => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-transform"
      >
        <i className={`fas fa-fire text-xs ${hasStreak ? 'text-orange-500' : 'text-gray-300 dark:text-gray-700'}`} />
        <span className={`text-[11px] font-black ${hasStreak ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>
          {hasStreak ? `${state.currentStreak}d` : '—'}
        </span>
        {state.bonusBalance > 0 && (
          <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
            +{state.bonusBalance}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Banner: bônus usado recentemente — copy acolhedora */}
      {hasBonusUsed && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <i className="fas fa-heart text-amber-500 text-sm shrink-0" />
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
            Tudo bem descansar. Usamos um dia bônus — sua sequência continua.
          </p>
        </div>
      )}

      {/* Main streak card */}
      <button
        onClick={() => setShowDetail(p => !p)}
        className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 text-left transition-all active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasStreak ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'
            }`}>
              <i className={`fas fa-fire text-lg ${hasStreak ? 'text-orange-500' : 'text-gray-300 dark:text-gray-700'}`} />
            </div>
            <div>
              <p className={`text-xl font-black leading-none ${hasStreak ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>
                {streakLabel(state)}
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">
                {streakSubLabel(state)}
              </p>
            </div>
          </div>
          <div className="text-right">
            {/* Bonus balance */}
            <div className="flex items-center gap-1 justify-end mb-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < state.bonusBalance
                      ? 'bg-amber-400'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {state.bonusBalance === 0 ? 'Sem bônus' : `${state.bonusBalance} bônus`}
            </p>
          </div>
        </div>

        {/* Expanded detail */}
        {showDetail && (
          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/60 space-y-2.5 animate-in fade-in duration-200">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">{state.currentStreak}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Atual</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">{state.longestStreak}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Recorde</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">{state.totalStudyDays}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Total</p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-900/20">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                <i className="fas fa-circle-info mr-1.5" />
                {bonusLabel(state.bonusBalance)}. Dias bônus são acumulados a cada 7 dias de estudo e usados automaticamente quando você precisa descansar.
              </p>
            </div>
            {lowBonus && hasStreak && (
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 text-center">
                Estude por mais {7 - (state.currentStreak % 7)} dia(s) para ganhar um dia bônus.
              </p>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default StreakWidget;
