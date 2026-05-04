import React, { useState } from 'react';
import { Subject } from '../types';
import { HexColorPicker } from 'react-colorful';
import { useBackButton } from '../hooks/useBackButton';

const FAST_COLORS = [
  '#ff5d15', '#eb761d', '#d8a800', '#8ec81c', '#22b77a', '#1aa9a5', '#09a9d1',
  '#0997e5', '#3170e5', '#635bd6', '#934de5', '#c942c7', '#dc437e', '#e3445e'
];

interface Props {
  onSave: (data: Pick<Subject, 'title' | 'color' | 'duration' | 'pixelCount'>) => void;
  onClose: () => void;
}

const CicloAddView: React.FC<Props> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(FAST_COLORS[0]);
  const [duration, setDuration] = useState(25);
  const [pixelCount, setPixelCount] = useState(20);

  useBackButton(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, color, duration, pixelCount });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
          Nova Matéria
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

        <div className="space-y-6">
          <div className="bg-[#1a1c23] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-transparent">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Personalizada
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300 uppercase">
                  {color}
                </span>
                <div
                  className="w-4 h-4 rounded-md shadow-sm border border-white/10"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
            <HexColorPicker
              color={color}
              onChange={setColor}
              style={{ width: '100%', height: '160px' }}
            />
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block px-1">
              Cores Rápidas
            </span>
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 justify-items-center">
              {FAST_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${
                    color.toLowerCase() === c.toLowerCase()
                      ? 'outline outline-2 outline-offset-[3px] scale-105'
                      : 'opacity-90'
                  }`}
                  style={{
                    backgroundColor: c,
                    outlineColor: color.toLowerCase() === c.toLowerCase() ? c : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          Criar Matéria
        </button>
      </form>
    </div>
  );
};

export default CicloAddView;
