import { useState, useEffect } from 'react';
import { db } from '../db';
import { NotificationSettings } from '../types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../services/notificationService';

interface UseSettingsReturn {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  // Fase 3
  examDate: string | null;
  setExamDate: (date: string | null) => Promise<void>;
  selectedEditalId: string | null;
  setSelectedEditalId: (id: string | null) => Promise<void>;
  // Fase 5
  notificationSettings: NotificationSettings;
  setNotificationSettings: (s: NotificationSettings) => Promise<void>;
  targetBanca: string | null;
  setTargetBanca: (banca: string | null) => Promise<void>;
  // Ofensiva
  streakEnabled: boolean;
  setStreakEnabled: (enabled: boolean) => Promise<void>;
  loading: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [userName, setUserNameState] = useState('');
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [selectedEditalId, setSelectedEditalIdState] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [targetBanca, setTargetBancaState] = useState<string | null>(null);
  const [streakEnabled, setStreakEnabledState] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.settings.get('theme'),
      db.settings.get('user_name'),
      db.settings.get('exam_date'),
      db.settings.get('selected_edital_id'),
      db.settings.get('notification_settings'),
      db.settings.get('target_banca'),
      db.settings.get('streak_enabled'),
    ])
      .then(([themeR, userR, examR, editalR, notifR, bancaR, streakR]) => {
        if (themeR && (themeR.value === 'light' || themeR.value === 'dark')) setThemeState(themeR.value);
        if (userR) setUserNameState(userR.value);
        if (examR?.value) setExamDateState(examR.value);
        if (editalR?.value) setSelectedEditalIdState(editalR.value);
        if (notifR?.value) {
          try { setNotificationSettingsState(JSON.parse(notifR.value)); } catch {}
        }
        if (bancaR?.value) setTargetBancaState(bancaR.value);
        if (streakR?.value !== undefined) setStreakEnabledState(streakR.value !== 'false');
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

  const setNotificationSettings = async (value: NotificationSettings): Promise<void> => {
    try {
      await db.settings.put({ key: 'notification_settings', value: JSON.stringify(value) });
      setNotificationSettingsState(value);
    } catch (e) { console.error('Failed to save notification_settings', e); }
  };

  const setTargetBanca = async (value: string | null): Promise<void> => {
    try {
      if (value) await db.settings.put({ key: 'target_banca', value });
      else await db.settings.delete('target_banca');
      setTargetBancaState(value);
    } catch (e) { console.error('Failed to save target_banca', e); }
  };

  const setStreakEnabled = async (value: boolean): Promise<void> => {
    try {
      await db.settings.put({ key: 'streak_enabled', value: String(value) });
      setStreakEnabledState(value);
    } catch (e) { console.error('Failed to save streak_enabled', e); }
  };

  return {
    theme, setTheme,
    userName, setUserName,
    examDate, setExamDate,
    selectedEditalId, setSelectedEditalId,
    notificationSettings, setNotificationSettings,
    targetBanca, setTargetBanca,
    streakEnabled, setStreakEnabled,
    loading,
  };
}
