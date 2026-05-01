
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Objective, Frequency } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (objective: Omit<Objective, 'id' | 'createdAt' | 'completions'>) => void;
  initialData?: Objective | null;
}

const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' }
];

const AddObjectiveModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  // Começa vazio para exibir o placeholder "0" como sombra
  const [targetCount, setTargetCount] = useState<number | string>('');
  const [duration, setDuration] = useState(60);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setTargetCount('');
    setDuration(60);
    setSelectedColor(COLORS[0]);
    setIsDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setFrequency(initialData.frequency);
      setTargetCount(initialData.targetCount);
      setDuration(initialData.duration);
      setSelectedColor(initialData.color);
    } else {
      reset();
    }
  }, [initialData, isOpen, reset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    // Se estiver vazio (sombra), salva como 0
    const finalCount = targetCount === '' ? 0 : Number(targetCount);
    // Garante duração mínima de 1 minuto se for 0 no slider
    const finalDuration = duration === 0 ? 1 : duration;
    
    onSubmit({ 
      title, 
      description, 
      frequency, 
      targetCount: finalCount, 
      duration: finalDuration, 
      color: selectedColor 
    });
    if (!initialData) reset();
  };

  const currentFrequencyLabel = FREQUENCY_OPTIONS.find(opt => opt.value === frequency)?.label;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight uppercase">
            {initialData ? 'Editar Objetivo' : 'Novo Objetivo'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-7 overflow-y-auto max-h-[70vh] px-1 no-scrollbar pb-2">
          {/* Título */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Título do Objetivo</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Estudar React"
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          {/* Frequência e Vezes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Frequência</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 border ${isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-gray-200 dark:border-gray-800'} rounded-2xl px-5 py-3.5 text-left transition-all`}
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">{currentFrequencyLabel}</span>
                  <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFrequency(opt.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-2.5 text-left font-bold transition-colors flex items-center justify-between ${
                          frequency === opt.value 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {opt.label}
                        {frequency === opt.value && <i className="fas fa-check text-[10px]"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Vezes</label>
              <input 
                type="number"
                min="0"
                value={targetCount}
                placeholder="0"
                onChange={e => setTargetCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black placeholder:text-gray-400/40 dark:placeholder:text-gray-600/40 transition-all text-center"
              />
            </div>
          </div>

          {/* Duração do Sprint */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Duração do Sprint</label>
            <div className="px-0 pt-2">
              <input 
                type="range"
                min="0"
                max="120"
                step="5"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tighter text-center pt-1">
              {duration} min
            </div>
          </div>

          {/* Cor Identificadora */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Cor Identificadora</label>
            <div className="flex flex-wrap gap-3 items-center justify-center py-2">
              {COLORS.map(c => (
                <button 
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-9 h-9 rounded-full transition-all duration-300 border-2 flex items-center justify-center ${selectedColor === c ? 'scale-110 border-gray-400 dark:border-white ring-4 ring-indigo-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                >
                   {selectedColor === c && <i className="fas fa-check text-[10px] text-white"></i>}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
          >
            {initialData ? 'Salvar Alterações' : 'Criar Objetivo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddObjectiveModal;
