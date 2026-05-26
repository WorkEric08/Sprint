/**
 * Streak com bônus explícitos — Feature 1 da Fase 6.
 *
 * REGRAS:
 * - A cada 7 dias estudados consecutivos → +1 dia bônus (máx 3 acumulados)
 * - Quando há um gap de 1 dia: gasta 1 bônus automaticamente
 * - Gap de 2+ dias sem bônus: sequência encerrada
 * - Com bônus disponível: gap de 1 dia é preenchido silenciosamente
 *
 * CASOS DE BORDA (Nota técnica da Fase 6):
 * - Mudança de fuso: usamos timezone local consistentemente via dateUtils
 * - Retorno após gap longo: streak = 0, longestStreak preservado
 * - Primeiro uso: streak = 1 se estudou hoje ou ontem
 * - "Semana" = 7 dias corridos de estudo, não semana calendário
 * - Bônus máx 3 garante que a tolerância não se torna ilimitada
 *
 * COPY PRINCIPLE: streak é incentivo, nunca culpa.
 * Todos os textos derivados desta função devem seguir esse filtro.
 */

import { addDays, todayKey, daysBetween } from './dateUtils';
import { StreakState } from '../types';

const MAX_BONUS = 3;
const STUDY_DAYS_PER_BONUS = 7;

/**
 * Computa o streak completo com estado de bônus a partir de um conjunto de dias ativos.
 *
 * @param activeDayKeys - Set de strings "YYYY-MM-DD" com dias de estudo
 */
export function computeFullStreak(activeDayKeys: Set<string>): StreakState {
  const today = todayKey();
  const yesterday = addDays(today, -1);

  const totalStudyDays = activeDayKeys.size;

  // Sem dados: streak zero
  if (totalStudyDays === 0) {
    return {
      currentStreak: 0,
      bonusBalance: 0,
      longestStreak: 0,
      totalStudyDays: 0,
      lastStudyDate: null,
      bonusUsedRecently: false,
    };
  }

  const sortedDesc = [...activeDayKeys].sort((a, b) => (a < b ? 1 : -1));
  const lastStudyDate = sortedDesc[0];

  // Streak só continua se houve estudo hoje ou ontem
  const anchorExists = activeDayKeys.has(today) || activeDayKeys.has(yesterday);

  let currentStreak = 0;
  let bonusBalance = 0;
  let studyDaysSinceLastBonus = 0; // contador para próximo bônus
  let bonusUsedRecently = false;
  let cursor = today;
  let longestRun = 0;
  let runLength = 0;

  if (anchorExists) {
    // Walk backwards from today
    for (const dayKey of sortedDesc) {
      const gap = daysBetween(dayKey, cursor);

      if (gap === 0) {
        // Same day as cursor — don't count, just move cursor
        if (dayKey === today && activeDayKeys.has(today)) {
          currentStreak = 1;
          studyDaysSinceLastBonus = 1;
          runLength = 1;
          cursor = dayKey;
        }
        continue;
      }

      if (gap === 1) {
        // Consecutive day
        currentStreak++;
        studyDaysSinceLastBonus++;
        runLength++;
        cursor = dayKey;

        if (studyDaysSinceLastBonus === STUDY_DAYS_PER_BONUS) {
          bonusBalance = Math.min(bonusBalance + 1, MAX_BONUS);
          studyDaysSinceLastBonus = 0;
        }
      } else if (gap === 2 && bonusBalance > 0) {
        // 1-day gap — spend a bonus
        bonusBalance--;

        // Check if the skipped day was today or yesterday (recent usage)
        const skippedDay = addDays(cursor, -1);
        if (skippedDay === today || skippedDay === yesterday) {
          bonusUsedRecently = true;
        }

        currentStreak++; // the gap day counts toward streak
        studyDaysSinceLastBonus++;
        runLength++;
        cursor = dayKey;

        if (studyDaysSinceLastBonus === STUDY_DAYS_PER_BONUS) {
          bonusBalance = Math.min(bonusBalance + 1, MAX_BONUS);
          studyDaysSinceLastBonus = 0;
        }
      } else {
        // Streak breaks — no bonus or gap too large
        longestRun = Math.max(longestRun, runLength);
        break;
      }
    }
    longestRun = Math.max(longestRun, runLength);
  }

  // Compute longestStreak separately (simple pass, no bonus) for accuracy
  const longestStreak = computeLongestStreak(sortedDesc);

  return {
    currentStreak,
    bonusBalance,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalStudyDays,
    lastStudyDate,
    bonusUsedRecently,
  };
}

/** Simple longest streak without bonus (for historical record). */
function computeLongestStreak(sortedDescDays: string[]): number {
  if (sortedDescDays.length === 0) return 0;
  let best = 0;
  let run = 1;
  for (let i = 1; i < sortedDescDays.length; i++) {
    const gap = daysBetween(sortedDescDays[i], sortedDescDays[i - 1]);
    if (gap === 1) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  return Math.max(best, run);
}

/** True if the user has been absent for more than 3 days and has history. */
export function shouldShowWelcomeBack(state: StreakState): boolean {
  if (!state.lastStudyDate || state.currentStreak > 0) return false;
  const daysAbsent = daysBetween(state.lastStudyDate, todayKey());
  return daysAbsent >= 3 && state.longestStreak >= 3;
}

/** Copy-safe streak label. Never blames. */
export function streakLabel(state: StreakState): string {
  if (state.currentStreak === 0) return 'Vamos começar!';
  if (state.currentStreak === 1) return '1 dia seguido';
  return `${state.currentStreak} dias seguidos`;
}

/** Copy-safe bonus label. Encouraging. */
export function bonusLabel(balance: number): string {
  if (balance === 0) return 'Sem dias bônus';
  if (balance === 1) return '1 dia bônus guardado';
  return `${balance} dias bônus guardados`;
}
