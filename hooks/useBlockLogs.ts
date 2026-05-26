import { useState, useEffect, useCallback } from 'react';
import { BlockLog, ErrorEntry, PostBlockData, BlockType } from '../types';
import { db } from '../db';

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

interface UseBlockLogsReturn {
  blockLogs: BlockLog[];
  errorEntries: ErrorEntry[];
  saveBlockLog: (
    subject: { id: string; title: string; color: string },
    data: PostBlockData & { blockType?: BlockType }
  ) => Promise<void>;
  updateErrorNote: (entryId: string, note: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useBlockLogs(): UseBlockLogsReturn {
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[]>([]);

  const reload = useCallback(async () => {
    try {
      const [logs, errors] = await Promise.all([
        db.blockLogs.orderBy('timestamp').reverse().toArray(),
        db.errorEntries.orderBy('timestamp').reverse().toArray(),
      ]);
      setBlockLogs(logs);
      setErrorEntries(errors);
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

      // Auto-create error entry when there are wrong answers
      const questionsWrong = data.questionsTotal - data.questionsCorrect;
      if (questionsWrong > 0) {
        const entry: ErrorEntry = {
          id: uid(),
          blockLogId: log.id,
          subjectId: subject.id,
          subjectTitle: subject.title,
          subjectColor: subject.color,
          subtopic: data.subtopic,
          timestamp: log.timestamp,
          questionsTotal: data.questionsTotal,
          questionsCorrect: data.questionsCorrect,
          questionsWrong,
          note: '',
        };
        await db.errorEntries.put(entry);
        setErrorEntries(prev => [entry, ...prev]);
      }
    } catch (e) {
      console.error('Failed to save block log', e);
    }
  };

  const updateErrorNote = async (entryId: string, note: string): Promise<void> => {
    try {
      await db.errorEntries.update(entryId, { note });
      setErrorEntries(prev =>
        prev.map(e => e.id === entryId ? { ...e, note } : e)
      );
    } catch (e) {
      console.error('Failed to update error note', e);
    }
  };

  return { blockLogs, errorEntries, saveBlockLog, updateErrorNote, reload };
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
