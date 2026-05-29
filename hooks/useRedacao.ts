import { useState, useEffect, useCallback } from 'react';
import { RedacaoSession } from '../types';
import { db } from '../db';

interface UseRedacaoReturn {
  sessions: RedacaoSession[];
  loading: boolean;
  saveSession: (session: RedacaoSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useRedacao(): UseRedacaoReturn {
  const [sessions, setSessions] = useState<RedacaoSession[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      // startedAt não é indexado (índice: id, completedAt, themeId) — ordenar
      // por ele via Dexie lançaria SchemaError. Buscamos tudo e ordenamos em JS,
      // consistente com a ordenação de saveSession.
      const all = await db.redacaoSessions.toArray();
      all.sort((a, b) => b.startedAt - a.startedAt);
      setSessions(all);
    } catch (e) {
      console.error('Failed to load redação sessions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveSession = async (session: RedacaoSession): Promise<void> => {
    try {
      await db.redacaoSessions.put(session);
      setSessions(prev => {
        const without = prev.filter(s => s.id !== session.id);
        return [session, ...without].sort((a, b) => b.startedAt - a.startedAt);
      });
    } catch (e) {
      console.error('Failed to save redação session', e);
    }
  };

  const deleteSession = async (id: string): Promise<void> => {
    try {
      await db.redacaoSessions.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Failed to delete redação session', e);
    }
  };

  return { sessions, loading, saveSession, deleteSession, reload };
}
