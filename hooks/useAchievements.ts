import { useState, useEffect, useCallback } from 'react';
import { AchievementId, AchievementRecord, BlockLog, SimuladoRecord, RedacaoSession } from '../types';
import { db } from '../db';
import { toLocalDateKey } from '../utils/dateUtils';

interface CheckContext {
  blockLogs: BlockLog[];
  simuladoRecords: SimuladoRecord[];
  redacaoSessions: RedacaoSession[];
  totalStudyDays: number;
}

interface UseAchievementsReturn {
  unlocked: AchievementRecord[];
  newlyUnlocked: AchievementId | null;
  clearNewlyUnlocked: () => void;
  checkAll: (ctx: CheckContext) => Promise<void>;
}

/** Check all achievement conditions and unlock new ones. */
async function evaluateAchievements(
  ctx: CheckContext,
  alreadyUnlocked: Set<AchievementId>
): Promise<AchievementId[]> {
  const newOnes: AchievementId[] = [];

  const check = (id: AchievementId, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(id)) newOnes.push(id);
  };

  const { blockLogs, simuladoRecords, redacaoSessions, totalStudyDays } = ctx;

  // 1. Primeiro bloco
  check('first-block', blockLogs.length > 0);

  // 2. Primeira semana — 7 unique study days
  check('first-week', totalStudyDays >= 7);

  // 3. Mil questões
  const totalQuestions = blockLogs.reduce((a, l) => a + l.questionsTotal, 0);
  check('mil-questoes', totalQuestions >= 1000);

  // 4. Consistência — 30 days in any 35-day window
  if (!alreadyUnlocked.has('consistencia') && totalStudyDays >= 30) {
    const dayKeys = [...new Set(blockLogs.map(l => toLocalDateKey(l.timestamp)))].sort();
    let consistent = false;
    for (let i = 0; i < dayKeys.length && !consistent; i++) {
      // Count days in window [dayKeys[i], dayKeys[i] + 35]
      const windowStart = dayKeys[i];
      const [y, m, d] = windowStart.split('-').map(Number);
      const endTs = new Date(y, m - 1, d + 35).getTime();
      const daysInWindow = dayKeys.filter(k => {
        const [ky, km, kd] = k.split('-').map(Number);
        return new Date(ky, km - 1, kd).getTime() <= endTs;
      }).length;
      if (daysInWindow >= 30) consistent = true;
    }
    check('consistencia', consistent);
  }

  // 5. Volta por cima — redação nota +100 points from first to latest
  if (!alreadyUnlocked.has('volta-por-cima') && redacaoSessions.length >= 3) {
    const withScore = redacaoSessions
      .filter(s => s.estimatedScore !== null)
      .sort((a, b) => a.startedAt - b.startedAt);
    if (withScore.length >= 2) {
      const first = withScore[0].estimatedScore!;
      const last = withScore[withScore.length - 1].estimatedScore!;
      check('volta-por-cima', last - first >= 100);
    }
  }

  // 6. Maratonista — simulado ≥295min completed
  check(
    'maratonista',
    simuladoRecords.some(r => r.completed && r.actualDurationMinutes >= 295)
  );

  // 7. Detalhista — 50 blocos com subtópico
  const logsWithSubtopic = blockLogs.filter(l => l.subtopic && l.subtopic.trim() !== '').length;
  check('detalhista', logsWithSubtopic >= 50);

  return newOnes;
}

export function useAchievements(): UseAchievementsReturn {
  const [unlocked, setUnlocked] = useState<AchievementRecord[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId | null>(null);

  useEffect(() => {
    db.achievements.toArray().then(setUnlocked).catch(console.error);
  }, []);

  const checkAll = useCallback(async (ctx: CheckContext) => {
    try {
      const current = await db.achievements.toArray();
      const alreadyUnlocked = new Set(current.map(a => a.id));
      const newOnes = await evaluateAchievements(ctx, alreadyUnlocked);

      if (newOnes.length > 0) {
        const records: AchievementRecord[] = newOnes.map(id => ({
          id,
          unlockedAt: Date.now(),
        }));
        await db.achievements.bulkPut(records);
        setUnlocked(prev => [...prev, ...records]);
        // Show first newly unlocked one (queue others for next open — keep it discrete)
        setNewlyUnlocked(newOnes[0]);
      }
    } catch (e) {
      console.error('Achievement check failed', e);
    }
  }, []);

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), []);

  return { unlocked, newlyUnlocked, clearNewlyUnlocked, checkAll };
}
