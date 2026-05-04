import React, { useState } from 'react';
import { Subject } from '../types';

const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

interface Props {
  subject: Subject;
  onSave: (data: Pick<Subject, 'title' | 'color' | 'duration' | 'pixelCount'>) => void;
  onClose: () => void;
}

const CicloEditView: React.FC<Props> = ({ subject, onSave, onClose }) => {
  const [title, setTitle] = useState(subject.title);
  const [color, setColor] = useState(subject.color);
  const [duration, setDuration] = useState(subject.duration);
  const [pixelCount, setPixelCount] = useState(subject.pixelCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, color, duration, pixelCount });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
          Editar Matéria
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-7 pb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Nome da Matéria
          </label>
          <input
            required
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Matemática"
            className="w-full bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

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
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          Salvar Alterações
        </button>
      </form>
    </div>
  );
};

export default CicloEditView;
