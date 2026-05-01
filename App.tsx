
import React, { useState, useEffect } from 'react';
import { Objective } from './types';
import ObjectiveCard from './components/ObjectiveCard';
import AddObjectiveModal from './components/AddObjectiveModal';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import TimerView from './components/TimerView';
import ProfileView from './components/ProfileView';

const App: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [activeSprint, setActiveSprint] = useState<Objective | null>(null);
  const [activeTab, setActiveTab] = useState<'objectives' | 'stats' | 'profile'>('objectives');
  
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
    // Registro do Service Worker movido para o App para garantir que o DOM esteja pronto
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registrado:', reg.scope))
          .catch(err => console.warn('Falha no SW:', err));
      });
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
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="scroll-container p-4 space-y-6 pb-24">
        {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Seus Objetivos</h2>
                <button 
                  onClick={openAddModal}
                  className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors active:scale-90"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              
              {objectives.length === 0 ? (
                <div className="text-center py-12 px-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-bullseye text-indigo-400 text-2xl"></i>
                  </div>
                  <h3 className="text-gray-700 dark:text-gray-200 font-medium text-lg">Nenhum objetivo ainda</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Adicione seu primeiro objetivo para começar sua jornada de desenvolvimento.</p>
                  <button 
                    onClick={openAddModal}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold active:scale-95 transition-transform"
                  >
                    Adicionar Objetivo
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {objectives.map(obj => (
                    <ObjectiveCard 
                      key={obj.id} 
                      objective={obj} 
                      onComplete={() => startSprintTimer(obj)}
                      onDelete={() => deleteObjective(obj.id)}
                      onEdit={() => openEditModal(obj)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && <StatsOverview objectives={objectives} />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        <nav className="shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-around items-center max-w-2xl mx-auto w-full z-40">
          <button 
            onClick={() => setActiveTab('objectives')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'objectives' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <i className="fas fa-list-check text-xl"></i>
            <span className="text-[10px] font-semibold">Sprint</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <i className="fas fa-chart-line text-xl"></i>
            <span className="text-[10px] font-semibold">Progresso</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <i className="fas fa-user text-xl"></i>
            <span className="text-[10px] font-semibold">Perfil</span>
          </button>
        </nav>

        <AddObjectiveModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          onSubmit={handleModalSubmit} 
          initialData={editingObjective}
        />

        {activeSprint && (
          <TimerView 
            objective={activeSprint}
            onClose={() => setActiveSprint(null)}
            onComplete={() => completeSprint(activeSprint.id)}
          />
        )}
    </div>
  );
};

export default App;
