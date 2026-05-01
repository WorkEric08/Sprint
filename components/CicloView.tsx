
import React, { useState, useEffect, useCallback } from 'react';
import { Subject } from '../types';
import CicloTimerView from './CicloTimerView';

const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const CicloView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('sprint_ciclo_subjects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Modal form state
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [duration, setDuration] = useState(25);
  const [pixelCount, setPixelCount] = useState(20);

  // Active cycle: ordered list of subject IDs + current position
  const [activeCycle, setActiveCycle] = useState<{ subjectIds: string[]; currentIndex: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sprint_ciclo_subjects', JSON.stringify(subjects));
    } catch (e) {
      console.warn('Failed to save subjects', e);
    }
  }, [subjects]);

  const resetModalForm = useCallback(() => {
    setTitle('');
    setColor(COLORS[0]);
    setDuration(25);
    setPixelCount(20);
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    resetModalForm();
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setTitle(subject.title);
    setColor(subject.color);
    setDuration(subject.duration);
    setPixelCount(subject.pixelCount);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    resetModalForm();
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingSubject) {
      setSubjects(prev =>
        prev.map(s =>
          s.id === editingSubject.id
            ? { ...s, title, color, duration, pixelCount }
            : s
        )
      );
    } else {
      const newSubject: Subject = {
        id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        title,
        color,
        duration,
        pixelCount,
        completedPixels: [],
      };
      setSubjects(prev => [...prev, newSubject]);
    }
    closeModal();
  };

  const deleteSubject = (id: string) => {
    if (confirm('Deseja excluir esta matéria e todos seus pixels?')) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const resetPixels = (id: string) => {
    if (confirm('Deseja resetar todos os pixels desta matéria?')) {
      setSubjects(prev =>
        prev.map(s => s.id === id ? { ...s, completedPixels: [] } : s)
      );
    }
  };

  const startCycle = () => {
    if (subjects.length === 0) return;
    setActiveCycle({ subjectIds: subjects.map(s => s.id), currentIndex: 0 });
  };

  const handlePixelComplete = (subjectId: string) => {
    setSubjects(prev =>
      prev.map(s => {
        if (s.id === subjectId && s.completedPixels.length < s.pixelCount) {
          return { ...s, completedPixels: [...s.completedPixels, Date.now()] };
        }
        return s;
      })
    );
  };

  const handleAdvanceCycle = () => {
    if (!activeCycle) return;
    const nextIndex = activeCycle.currentIndex + 1;
    if (nextIndex >= activeCycle.subjectIds.length) {
      setActiveCycle(null);
    } else {
      setActiveCycle({ ...activeCycle, currentIndex: nextIndex });
    }
  };

  const currentSubject = activeCycle
    ? subjects.find(s => s.id === activeCycle.subjectIds[activeCycle.currentIndex]) ?? null
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ciclo de Estudos</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Estude cada matéria, ganhe pixels</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors active:scale-90"
        >
          <i className="fas fa-plus" />
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book-open text-indigo-400 text-2xl" />
          </div>
          <h3 className="text-gray-700 dark:text-gray-200 font-medium text-lg">Nenhuma matéria ainda</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Adicione suas matérias e comece a construir seu mapa de pixels de estudo.
          </p>
          <button
            onClick={openAddModal}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold active:scale-95 transition-transform"
          >
            Adicionar Matéria
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {subjects.map(subject => {
              const completed = subject.completedPixels.length;
              const total = subject.pixelCount;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const allDone = completed >= total;

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Color accent bar */}
                  <div className="h-1 w-full" style={{ backgroundColor: subject.color }} />

                  <div className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                        <span className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight truncate">
                          {subject.title}
                        </span>
                        {allDone && (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                            Completo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">{subject.duration}min</span>
                        <button
                          onClick={() => resetPixels(subject.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-amber-500 transition-colors"
                          title="Resetar pixels"
                        >
                          <i className="fas fa-rotate-left text-[10px]" />
                        </button>
                        <button
                          onClick={() => openEditModal(subject)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          <i className="fas fa-pencil text-[10px]" />
                        </button>
                        <button
                          onClick={() => deleteSubject(subject.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <i className="fas fa-trash text-[10px]" />
                        </button>
                      </div>
                    </div>

                    {/* Progress text */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-600">
                        {completed} de {total} pixels
                      </span>
                      <span
                        className="text-xs font-black"
                        style={{ color: allDone ? '#22c55e' : subject.color }}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* Pixel grid */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-sm transition-all duration-500"
                          style={
                            i < completed
                              ? { backgroundColor: subject.color, boxShadow: `0 0 0 1px ${subject.color}22` }
                              : { backgroundColor: 'transparent', border: '1.5px solid', borderColor: 'currentColor', opacity: 0.15 }
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start cycle */}
          <button
            onClick={startCycle}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-rotate" />
            Iniciar Ciclo · {subjects.length} {subjects.length === 1 ? 'matéria' : 'matérias'}
          </button>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight uppercase">
                {editingSubject ? 'Editar Matéria' : 'Nova Matéria'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-7 overflow-y-auto max-h-[70vh] px-1 no-scrollbar pb-2">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Nome da Matéria
                </label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Matemática"
                  className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                  Tempo por Sessão
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full appearance-none cursor-pointer"
                />
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tighter text-center">
                  {duration} min
                </div>
              </div>

              {/* Pixel count */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                  Pixels de Estudo
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={pixelCount}
                  onChange={e => setPixelCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full appearance-none cursor-pointer"
                />
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tighter text-center">
                  {pixelCount} pixels
                </div>
                {/* Pixel preview */}
                <div className="flex flex-wrap gap-1 pt-1 justify-center max-h-20 overflow-hidden">
                  {Array.from({ length: Math.min(pixelCount, 35) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-sm opacity-30"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {pixelCount > 35 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 font-bold self-center">
                      +{pixelCount - 35}
                    </span>
                  )}
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                  Cor da Matéria
                </label>
                <div className="flex flex-wrap gap-3 items-center justify-center py-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full transition-all duration-300 border-2 flex items-center justify-center ${
                        color === c
                          ? 'scale-110 border-gray-400 dark:border-white ring-4 ring-indigo-500/20'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <i className="fas fa-check text-[10px] text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
              >
                {editingSubject ? 'Salvar Alterações' : 'Criar Matéria'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Active cycle timer overlay */}
      {activeCycle && currentSubject && (
        <CicloTimerView
          key={`${activeCycle.currentIndex}-${currentSubject.id}`}
          subject={currentSubject}
          cycleIndex={activeCycle.currentIndex}
          cycleTotal={activeCycle.subjectIds.length}
          onClose={() => setActiveCycle(null)}
          onComplete={() => handlePixelComplete(currentSubject.id)}
          onNext={handleAdvanceCycle}
        />
      )}
    </div>
  );
};

export default CicloView;
