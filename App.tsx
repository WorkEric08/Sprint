
import React, { useEffect, useState } from 'react';
import StatsOverview from './components/StatsOverview';
import CicloView from './components/CicloView';
import SettingsPanel from './components/SettingsPanel';
import { useSettings } from './hooks/useSettings';
import { useSubjects } from './hooks/useSubjects';
import { useObjectives } from './hooks/useObjectives';
import { runMigrationIfNeeded } from './services/migration';

const NAV_ITEMS = [
  { id: 'stats' as const, icon: 'fa-chart-line', label: 'Progresso' },
  { id: 'ciclo' as const, icon: 'fa-rotate', label: 'Ciclo' },
  { id: 'settings' as const, icon: 'fa-gear', label: 'Configurações' },
];

// ── AppLoader ──────────────────────────────────────────────────────────────
// Runs migration BEFORE mounting App so hooks read from an already-populated
// IndexedDB. Prevents race condition on first open after localStorage → IDB.
const AppLoader: React.FC = () => {
  const [migrationReady, setMigrationReady] = useState(false);

  useEffect(() => {
    runMigrationIfNeeded().finally(() => setMigrationReady(true));
  }, []);

  if (!migrationReady) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
      document.documentElement.classList.contains('dark');
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: isDark ? '#030712' : '#f9fafb' }}
      >
        <div className="w-10 h-10 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <App />;
};

// ── App ────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'stats' | 'ciclo' | 'settings'>(() => {
    try {
      if (sessionStorage.getItem('pwa-force-update') === '1') return 'settings';
    } catch {}
    return 'ciclo';
  });

  const [isUpdating, setIsUpdating] = React.useState(false);

  const { theme, setTheme, userName, setUserName, loading: settingsLoading } = useSettings();
  const { subjects, setSubjects, loading: subjectsLoading } = useSubjects();
  const { objectives, loading: objectivesLoading } = useObjectives();

  const isLoading = settingsLoading || subjectsLoading || objectivesLoading;

  // Apply theme to document
  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      themeColor?.setAttribute('content', '#030712');
    } else {
      document.documentElement.classList.remove('dark');
      themeColor?.setAttribute('content', '#f9fafb');
    }
  }, [theme]);

  // Handle PWA force-update flag
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

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleUserNameChange = (name: string) => {
    setUserName(name);
  };

  // Minimal loading screen while IndexedDB loads
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme === 'dark' ? '#030712' : '#f9fafb' }}
      >
        <div className="w-10 h-10 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

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
          {activeTab === 'stats' && <StatsOverview objectives={objectives} subjects={subjects} />}
          {activeTab === 'ciclo' && (
            <CicloView
              userName={userName}
              subjects={subjects}
              onSubjectsChange={setSubjects}
            />
          )}
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

export default AppLoader;
