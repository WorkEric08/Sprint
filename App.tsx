
import React, { useState, useEffect } from 'react';
import { Objective } from './types';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import CicloView from './components/CicloView';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [activeSprint, setActiveSprint] = useState<Objective | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'ciclo'>('stats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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
      if (saved) {
        setObjectives(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse objectives", e);
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

  const handleModalSubmit = (data: Omit<Objective, 'id' | 'createdAt' | 'completions'>) => {
    if (editingObjective) {
      setObjectives(prev => prev.map(obj => 
        obj.id === editingObjective.id ? { ...obj, ...data } : obj
      ));
    } else {
      const obj: Objective = {
        ...data,
        id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        createdAt: Date.now(),
        completions: []
      };
      setObjectives(prev => [...prev, obj]);
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingObjective(null);
    setIsModalOpen(true);
  };

  const openEditModal = (obj: Objective) => {
    setEditingObjective(obj);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingObjective(null);
  };

  const deleteObjective = (id: string) => {
    if (confirm('Deseja realmente excluir este objetivo?')) {
      setObjectives(prev => prev.filter(o => o.id !== id));
    }
  };

  const completeSprint = (id: string) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === id) {
        return {
          ...obj,
          completions: [...obj.completions, { timestamp: Date.now() }]
        };
      }
      return obj;
    }));
  };

  const startSprintTimer = (obj: Objective) => {
    setActiveSprint(obj);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 max-w-2xl mx-auto shadow-xl dark:shadow-none w-full relative overflow-hidden transition-theme">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="scroll-container p-4 space-y-6 pb-24">
          {activeTab === 'stats' && <StatsOverview objectives={objectives} />}
          {activeTab === 'ciclo' && <CicloView />}
        </main>

        <nav className="shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-around items-center max-w-2xl mx-auto w-full z-40">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <i className="fas fa-chart-line text-xl"></i>
            <span className="text-[10px] font-semibold">Progresso</span>
          </button>
          <button
            onClick={() => setActiveTab('ciclo')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ciclo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <i className="fas fa-rotate text-xl"></i>
            <span className="text-[10px] font-semibold">Ciclo</span>
          </button>
        </nav>

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
    </div>
  );
};

export default App;
