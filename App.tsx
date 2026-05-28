
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import StatsOverview from './components/StatsOverview';
import CicloView from './components/CicloView';
import SettingsPanel from './components/SettingsPanel';
import ReviewQueueView from './components/ReviewQueueView';
import EditalPickerModal from './components/EditalPickerModal';
import { useSettings } from './hooks/useSettings';
import { useSubjects } from './hooks/useSubjects';
import { useObjectives } from './hooks/useObjectives';
import { useBlockLogs } from './hooks/useBlockLogs';
import { useReviews } from './hooks/useReviews';
import { EDITAIS } from './data/editais';
import { runMigrationIfNeeded } from './services/migration';
import { checkAndFireNotifications } from './services/notificationService';
import { useSimulados } from './hooks/useSimulados';
import { toLocalDateKey } from './utils/dateUtils';
import { computeFullStreak, shouldShowWelcomeBack } from './utils/streakUtils';
import { useAchievements } from './hooks/useAchievements';
import AchievementToast from './components/AchievementToast';
import WelcomeBackCard from './components/WelcomeBackCard';
import { OverlayProvider, useHasSecondaryScreen } from './contexts/OverlayContext';

type TabId = 'stats' | 'ciclo' | 'reviews' | 'settings';

const NAV_ITEMS: { id: TabId; icon: string; label: string }[] = [
  { id: 'stats',    icon: 'fa-chart-line', label: 'Progresso' },
  { id: 'ciclo',    icon: 'fa-rotate',     label: 'Ciclo' },
  { id: 'reviews',  icon: 'fa-bookmark',   label: 'Revisões' },
  { id: 'settings', icon: 'fa-gear',       label: 'Config' },
];

// ── AppLoader ──────────────────────────────────────────────────────────────
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

  return (
    <OverlayProvider>
      <App />
    </OverlayProvider>
  );
};

// ── App ────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      if (sessionStorage.getItem('pwa-force-update') === '1') return 'settings';
    } catch {}
    return 'ciclo';
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditalPicker, setShowEditalPicker] = useState(false);

  // Oculta a bottom nav quando qualquer tela secundária full-screen está aberta
  const hasSecondaryScreen = useHasSecondaryScreen();

  // Refs para medição da nav — declarados cedo para manter ordem de hooks estável.
  // sessionStorage persiste no reload do force-update (window.location.reload),
  // então na próxima carga o padding já está correto desde o primeiro render.
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState<number>(() => {
    try { return parseInt(sessionStorage.getItem('sprint_nav_h') || '0', 10) || 0; }
    catch { return 0; }
  });

  const {
    theme, setTheme, userName, setUserName,
    examDate, setExamDate, selectedEditalId, setSelectedEditalId,
    notificationSettings,
    targetBanca, setTargetBanca,
    streakEnabled, setStreakEnabled,
    loading: settingsLoading,
  } = useSettings();
  const { subjects, setSubjects, loading: subjectsLoading } = useSubjects();
  const { objectives, loading: objectivesLoading } = useObjectives();
  const { blockLogs } = useBlockLogs();
  const { reviewItems, pendingCount, createOrUpdateItem, applyResult } = useReviews();
  const { records: simuladoRecords } = useSimulados();
  const { unlocked: achievements, newlyUnlocked, clearNewlyUnlocked, checkAll: checkAchievements } = useAchievements();
  const selectedEdital = React.useMemo(() => {
    if (selectedEditalId === 'custom') {
      try {
        const stored = localStorage.getItem('sprint_custom_edital');
        if (stored) {
          const data = JSON.parse(stored);
          return { id: 'custom', name: data.name, organizer: 'Customizado', category: 'municipal' as const, typicalMonth: '', disclaimer: '', subjects: [] } as import('./types').Edital;
        }
      } catch {}
      return null;
    }
    return EDITAIS.find(e => e.id === selectedEditalId) ?? null;
  }, [selectedEditalId]);
  const isLoading = settingsLoading || subjectsLoading || objectivesLoading;

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Streak state (computed from block data)
  const streakState = React.useMemo(() => {
    const activeDays = new Set(
      subjects.flatMap(s => s.completedBlocks.map(b => toLocalDateKey(b.timestamp)))
    );
    return computeFullStreak(activeDays);
  }, [subjects]);

  // On data loaded: notifications + achievements + welcome back
  useEffect(() => {
    if (isLoading) return;
    const today = toLocalDateKey(Date.now());
    const completedToday = subjects.reduce(
      (a, s) => a + s.completedBlocks.filter(b => toLocalDateKey(b.timestamp) === today).length,
      0
    );
    const lastSimulado = simuladoRecords[0] ?? null;

    // Notifications
    checkAndFireNotifications({
      settings: notificationSettings,
      pendingReviews: reviewItems,
      completedBlocksToday: completedToday,
      streakDays: streakState.currentStreak,
      lastSimulado,
      examDate,
      examName: selectedEdital?.name ?? null,
    });

    // Achievements
    checkAchievements({
      blockLogs,
      simuladoRecords,
      redacaoSessions: [],
      totalStudyDays: streakState.totalStudyDays,
    });

    // Welcome back
    if (shouldShowWelcomeBack(streakState)) {
      setShowWelcomeBack(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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

  // Handle PWA force-update flag — só faz o fade quando isLoading=false para que
  // a nav real já esteja no DOM antes do HTML overlay sumir.
  useEffect(() => {
    if (isLoading) return;
    if (sessionStorage.getItem('pwa-force-update') === '1') {
      sessionStorage.removeItem('pwa-force-update');
    }
    const overlay = document.getElementById('pwa-update-overlay');
    if (overlay && overlay.style.display !== 'none') {
      overlay.style.transition = 'opacity 0.2s';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; }, 200);
    }
  }, [isLoading]);

  // Mede a altura real da nav após o carregamento dos dados (quando a nav aparece no DOM).
  // Usa [isLoading] para re-executar assim que isLoading passar para false e a nav for montada.
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      setNavHeight(h);
      try { sessionStorage.setItem('sprint_nav_h', String(h)); } catch {}
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

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
          className="fixed inset-0 z-[39] flex items-center justify-center"
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

        {/* ── Sidebar (tablet / desktop) — escalada por breakpoint ── */}
        <aside className="hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 w-16 lg:w-56 xl:w-64 2xl:w-72 shrink-0">
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 gap-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
              <i className="fas fa-rotate text-white text-sm" />
            </div>
            <span className="hidden lg:block font-black text-gray-800 dark:text-white text-sm uppercase tracking-[0.15em]">
              Sprint
            </span>
          </div>

          <nav className="flex-1 p-2 space-y-1 pt-4 overflow-y-auto sidebar-scroll">
            {NAV_ITEMS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 py-3 lg:px-3 xl:px-4 rounded-xl transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="relative">
                  <i className={`fas ${tab.icon} text-[15px] xl:text-base w-5 text-center`} />
                  {tab.id === 'reviews' && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-[11px] xl:text-xs font-black uppercase tracking-widest">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

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

        {/* ── Conteúdo principal — padding escalado + max-width em telas grandes ── */}
        <main
          className="scroll-container flex-1 p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12"
          style={navHeight > 0 ? { paddingBottom: `${navHeight + 16}px` } : undefined}
        >
          {activeTab === 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 2xl:max-w-[1600px] 2xl:mx-auto">
              <StatsOverview
                objectives={objectives}
                subjects={subjects}
                  edital={selectedEdital}
                blockLogs={blockLogs}
                targetBanca={targetBanca}
                streakState={streakState}
                achievements={achievements}
                userName={userName}
                streakEnabled={streakEnabled}
              />
            </div>
          )}
          {activeTab === 'ciclo' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 2xl:max-w-[1600px] 2xl:mx-auto">
              <CicloView
                userName={userName}
                subjects={subjects}
                onSubjectsChange={setSubjects}
                pendingReviewCount={pendingCount}
                reviewItems={reviewItems}
                edital={selectedEdital}
                examDate={examDate}
                onEditExamDate={() => setActiveTab('settings')}
                streakState={streakState}
                streakEnabled={streakEnabled}
              />
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl lg:mx-auto">
              <h2 className="text-lg lg:text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-4 lg:mb-6">
                Revisões
              </h2>
              <ReviewQueueView
                reviewItems={reviewItems}
                onApplyResult={applyResult}
              />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 lg:max-w-3xl xl:max-w-4xl lg:mx-auto">
              <SettingsPanel
                theme={theme}
                onToggleTheme={toggleTheme}
                onUpdateStart={() => setIsUpdating(true)}
                userName={userName}
                onUserNameChange={setUserName}
                selectedEditalId={selectedEditalId}
                examDate={examDate}
                onOpenEditalPicker={() => setShowEditalPicker(true)}
                onSetExamDate={setExamDate}
                streakEnabled={streakEnabled}
                onSetStreakEnabled={setStreakEnabled}
              />
            </div>
          )}
        </main>

        {/* ── Nav inferior (mobile only) — some em telas secundárias ── */}
        <nav
          ref={navRef}
          className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center z-40 transition-opacity duration-200 ${
            hasSecondaryScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {NAV_ITEMS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 transition-all active:scale-90 relative ${
                activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <div className="relative">
                <i className={`fas ${tab.icon} text-xl`} />
                {tab.id === 'reviews' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Fase 6: Achievement toast (non-blocking) */}
      {newlyUnlocked && (
        <AchievementToast
          achievementId={newlyUnlocked}
          onDismiss={clearNewlyUnlocked}
        />
      )}

      {/* Fase 6: Welcome back — só aparece se ofensiva habilitada */}
      {streakEnabled && showWelcomeBack && (
        <WelcomeBackCard
          state={streakState}
          userName={userName}
          onDismiss={() => setShowWelcomeBack(false)}
        />
      )}

      {/* Seletor de edital */}
      {showEditalPicker && (
        <EditalPickerModal
          currentEditalId={selectedEditalId}
          currentSubjects={subjects}
          onSelect={setSelectedEditalId}
          onApplySubjects={setSubjects}
          onClose={() => setShowEditalPicker(false)}
        />
      )}
    </>
  );
};

export default AppLoader;
