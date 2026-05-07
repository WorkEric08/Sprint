
import React, { useState, useEffect } from 'react';
import { Objective } from './types';
import StatsOverview from './components/StatsOverview';
import CicloView from './components/CicloView';
import SettingsPanel from './components/SettingsPanel';

const NAV_ITEMS = [
  { id: 'stats' as const, icon: 'fa-chart-line', label: 'Progresso' },
  { id: 'ciclo' as const, icon: 'fa-rotate', label: 'Ciclo' },
  { id: 'settings' as const, icon: 'fa-gear', label: 'Configurações' },
];

const App: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'ciclo' | 'settings'>(() => {
    try {
      if (sessionStorage.getItem('pwa-force-update') === '1') return 'settings';
    } catch {}
    return 'ciclo';
  });

  const [userName, setUserName] = useState<string>(() => {
    try { return localStorage.getItem('sprint_user_name') ?? ''; } catch { return ''; }
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sprint_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.warn('LocalStorage access failed', e);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (sessionStorage.getItem('pwa-force-update') === '1') {
      sessionStorage.removeItem('pwa-force-update');
      const overlay = document.getElementById('pwa-update-overlay');
      if (overlay) {
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
      }
    }
  }, []);

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      themeColor?.setAttribute('content', '#030712');
    } else {
      document.documentElement.classList.remove('dark');
      themeColor?.setAttribute('content', '#f9fafb');
    }
    try {
      localStorage.setItem('sprint_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sprint_objectives');
      if (saved) setObjectives(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse objectives', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sprint_objectives', JSON.stringify(objectives));
    } catch (e) {
      console.warn('Failed to save objectives', e);
    }
  }, [objectives]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleUserNameChange = (name: string) => {
    setUserName(name);
    try { localStorage.setItem('sprint_user_name', name); } catch {}
  };

  return (
    <>
      {isUpdating && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: theme === 'dark' ? '#030712' : '#f9fafb' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
            <span
              className="text-[11px] font-black uppercase tracking-[0.1em]"
              style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
            >
              Atualizando...
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-gray-950 w-full relative overflow-hidden transition-theme">

        {/* ── Sidebar (tablet / desktop) ── */}
        <aside className="hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 w-16 lg:w-60 shrink-0">
          {/* Brand */}
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 gap-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
              <i className="fas fa-rotate text-white text-sm" />
            </div>
            <span className="hidden lg:block font-black text-gray-800 dark:text-white text-sm uppercase tracking-[0.15em]">
              Sprint
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-1 pt-4">
            {NAV_ITEMS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 py-3 lg:px-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <i className={`fas ${tab.icon} text-[15px] w-5 text-center`} />
                <span className="hidden lg:block text-[11px] font-black uppercase tracking-widest">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          {/* User info */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 py-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <i className="fas fa-user text-[10px] text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="hidden lg:block text-xs font-bold text-gray-500 dark:text-gray-500 truncate max-w-[140px]">
                {userName || 'Estudante'}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="scroll-container flex-1 p-4 md:p-6 lg:p-8 main-content">
          {activeTab === 'stats' && <StatsOverview objectives={objectives} />}
          {activeTab === 'ciclo' && <CicloView userName={userName} />}
          {activeTab === 'settings' && (
            <SettingsPanel
              theme={theme}
              onToggleTheme={toggleTheme}
              onUpdateStart={() => setIsUpdating(true)}
              userName={userName}
              onUserNameChange={handleUserNameChange}
            />
          )}
        </main>

        {/* ── Nav inferior (mobile only) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center z-40"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {NAV_ITEMS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <i className={`fas ${tab.icon} text-xl`} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

export default App;
