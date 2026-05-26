import { useState, useEffect } from 'react';
import { db } from '../db';

interface UseSettingsReturn {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  loading: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [userName, setUserNameState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.settings.get('theme'),
      db.settings.get('user_name'),
    ])
      .then(([themeRecord, userNameRecord]) => {
        if (themeRecord && (themeRecord.value === 'light' || themeRecord.value === 'dark')) {
          setThemeState(themeRecord.value);
        }
        if (userNameRecord) {
          setUserNameState(userNameRecord.value);
        }
      })
      .catch(e => {
        console.error('Failed to load settings from IndexedDB', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setTheme = async (value: 'light' | 'dark'): Promise<void> => {
    try {
      await db.settings.put({ key: 'theme', value });
      setThemeState(value);
    } catch (e) {
      console.error('Failed to save theme to IndexedDB', e);
    }
  };

  const setUserName = async (value: string): Promise<void> => {
    try {
      await db.settings.put({ key: 'user_name', value });
      setUserNameState(value);
    } catch (e) {
      console.error('Failed to save user_name to IndexedDB', e);
    }
  };

  return { theme, setTheme, userName, setUserName, loading };
}
