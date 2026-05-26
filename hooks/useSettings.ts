import { useState, useEffect } from 'react';
import { db } from '../db';

interface UseSettingsReturn {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  // Fase 3
  examDate: string | null;        // "YYYY-MM-DD" or null
  setExamDate: (date: string | null) => Promise<void>;
  selectedEditalId: string | null;
  setSelectedEditalId: (id: string | null) => Promise<void>;
  loading: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [userName, setUserNameState] = useState('');
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [selectedEditalId, setSelectedEditalIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.settings.get('theme'),
      db.settings.get('user_name'),
      db.settings.get('exam_date'),
      db.settings.get('selected_edital_id'),
    ])
      .then(([themeR, userR, examR, editalR]) => {
        if (themeR && (themeR.value === 'light' || themeR.value === 'dark')) {
          setThemeState(themeR.value);
        }
        if (userR) setUserNameState(userR.value);
        if (examR && examR.value) setExamDateState(examR.value);
        if (editalR && editalR.value) setSelectedEditalIdState(editalR.value);
      })
      .catch(e => console.error('Failed to load settings', e))
      .finally(() => setLoading(false));
  }, []);

  const setTheme = async (value: 'light' | 'dark') => {
    try { await db.settings.put({ key: 'theme', value }); setThemeState(value); }
    catch (e) { console.error('Failed to save theme', e); }
  };

  const setUserName = async (value: string) => {
    try { await db.settings.put({ key: 'user_name', value }); setUserNameState(value); }
    catch (e) { console.error('Failed to save user_name', e); }
  };

  const setExamDate = async (value: string | null) => {
    try {
      if (value) await db.settings.put({ key: 'exam_date', value });
      else await db.settings.delete('exam_date');
      setExamDateState(value);
    } catch (e) { console.error('Failed to save exam_date', e); }
  };

  const setSelectedEditalId = async (value: string | null) => {
    try {
      if (value) await db.settings.put({ key: 'selected_edital_id', value });
      else await db.settings.delete('selected_edital_id');
      setSelectedEditalIdState(value);
    } catch (e) { console.error('Failed to save selected_edital_id', e); }
  };

  return {
    theme, setTheme,
    userName, setUserName,
    examDate, setExamDate,
    selectedEditalId, setSelectedEditalId,
    loading,
  };
}
