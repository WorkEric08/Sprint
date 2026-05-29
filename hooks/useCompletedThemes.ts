import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sprint_completed_redacao_ids';

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persist(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

interface UseCompletedThemesReturn {
  completedIds: Set<string>;
  markCompleted: (themeId: string) => void;
  resetAll: () => void;
}

/**
 * Tracks which redação themes have been completed by the user.
 * Stored in localStorage (separate from session history) so that
 * resetting the "Feitas" category does not delete past sessions.
 */
export function useCompletedThemes(): UseCompletedThemesReturn {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readStored());

  // Reflect external changes (e.g. another tab) on storage events
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCompletedIds(readStored());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const markCompleted = useCallback((themeId: string) => {
    setCompletedIds(prev => {
      if (prev.has(themeId)) return prev;
      const next = new Set(prev);
      next.add(themeId);
      persist(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setCompletedIds(prev => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      persist(next);
      return next;
    });
  }, []);

  return { completedIds, markCompleted, resetAll };
}
