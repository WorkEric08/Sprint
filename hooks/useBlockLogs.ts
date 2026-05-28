import { useState, useEffect, useCallback } from 'react';
import { BlockLog, PostBlockData, BlockType } from '../types';
import { db } from '../db';

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

interface UseBlockLogsReturn {
  blockLogs: BlockLog[];
  saveBlockLog: (
    subject: { id: string; title: string; color: string },
    data: PostBlockData & { blockType?: BlockType }
  ) => Promise<void>;
  reload: () => Promise<void>;
}

export function useBlockLogs(): UseBlockLogsReturn {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);

  const reload = useCallback(async () => {
    try {
      const logs = await db.blockLogs.orderBy('timestamp').reverse().toArray();
      setBlockLogs(logs);
    } catch (e) {
      console.error('Failed to load block logs', e);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveBlockLog = async (
    subject: { id: string; title: string; color: string },
    data: PostBlockData & { blockType?: BlockType }
  ): Promise<void> => {
    try {
      const log: BlockLog = {
        id: uid(),
        subjectId: subject.id,
        subjectTitle: subject.title,
        subjectColor: subject.color,
        timestamp: Date.now(),
        questionsTotal: data.questionsTotal,
        questionsCorrect: data.questionsCorrect,
        subtopic: data.subtopic,
        selfScore: data.selfScore,
        flaggedForReview: data.flaggedForReview,
        blockType: data.blockType ?? 'study',
      };

      await db.blockLogs.put(log);
      setBlockLogs(prev => [log, ...prev]);
    } catch (e) {
      console.error('Failed to save block log', e);
    }
  };

  return { blockLogs, saveBlockLog, reload };
}

// Standalone helper — used by PostBlockModal to fetch subtopic suggestions
export async function getSubtopicsForSubject(subjectId: string): Promise<string[]> {
  try {
    const logs = await db.blockLogs.where('subjectId').equals(subjectId).toArray();
    return [...new Set(logs.map(l => l.subtopic).filter(Boolean))].sort();
  } catch {
    return [];
  }
}
