import React, { useState } from 'react';
import { Edital, Subject } from '../types';
import { EDITAIS, EDITAL_CATEGORIES } from '../data/editais';

interface Props {
  currentEditalId: string | null;
  currentSubjects: Subject[];
  onSelect: (editalId: string) => void;
  onApplySubjects: (newSubjects: Subject[]) => void;
  onClose: () => void;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

type Step = 'pick' | 'confirm';

const EditalPickerModal: React.FC<Props> = ({
  currentEditalId,
  currentSubjects,
  onSelect,
  onApplySubjects,
  onClose,
}) => {
  const [step, setStep] = useState<Step>('pick');
  const [chosen, setChosen] = useState<Edital | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = Object.entries(EDITAL_CATEGORIES);
  const filtered = filterCategory === 'all'
    ? EDITAIS
    : EDITAIS.filter(e => e.category === filterCategory);

  // Subjects that will be CREATED (not already in currentSubjects by name)
  const toCreate = (edital: Edital) =>
    edital.subjects.filter(
      es => !currentSubjects.some(s => s.title.toLowerCase() === es.name.toLowerCase())
    );

  const handleConfirm = () => {
    if (!chosen) return;
    onSelect(chosen.id);

    const newSubjects: Subject[] = toCreate(chosen).map(es => ({
      id: uid(),
      title: es.name,
      color: es.color,
      duration: 50,
      blockCount: Math.max(10, Math.round(es.weight / 5)), // weight → blockCount proporcionalmente
      completedBlocks: [],
    }));

    if (newSubjects.length > 0) {
      onApplySubjects([...currentSubjects, ...newSubjects]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={step === 'confirm' ? () => setStep('pick') : onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
            {step === 'pick' ? 'Selecionar Edital' : 'Confirmar Aplicação'}
          </h2>
          {step === 'pick' && (
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Pré-popula matérias automaticamente
            </p>
          )}
        </div>
      </div>

      {step === 'pick' && (
        <>
          {/* Category filter */}
          <div className="overflow-x-scroll-area flex gap-2 px-4 pt-3 pb-2 shrink-0">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${
                filterCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              Todos
            </button>
            {categories.map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${
                  filterCategory === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <i className={`fas ${cat.icon} text-[9px]`} />
                {cat.label}
              </button>
            ))}
            {/* Spacer: garante que o último chip fica totalmente visível */}
            <div className="w-4 shrink-0" />
          </div>

          {/* Edital list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filtered.map(edital => {
              const isActive = edital.id === currentEditalId;
              return (
                <button
                  key={edital.id}
                  onClick={() => { setChosen(edital); setStep('confirm'); }}
                  className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                    isActive
                      ? 'border-indigo-300 dark:border-indigo-700'
                      : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                          {EDITAL_CATEGORIES[edital.category as keyof typeof EDITAL_CATEGORIES].label}
                          {' · '}
                          {edital.organizer}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight">
                        {edital.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        {edital.subjects.length} matérias · Prova: {edital.typicalMonth}
                      </p>
                    </div>
                    <div className="flex -space-x-1 shrink-0">
                      {edital.subjects.slice(0, 5).map((s, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"
                          style={{ backgroundColor: s.color }}
                        />
                      ))}
                      {edital.subjects.length > 5 && (
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <span className="text-[7px] font-black text-gray-500">+{edital.subjects.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {edital.disclaimer.startsWith('⚠️') && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                      <i className="fas fa-triangle-exclamation text-[9px]" />
                      <span className="text-[9px] font-bold">Dados incompletos — pesquisa manual necessária</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 'confirm' && chosen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Edital info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
              {chosen.organizer} · {chosen.typicalMonth}
            </p>
            <p className="font-black text-gray-800 dark:text-gray-100 text-base uppercase tracking-tight">
              {chosen.name}
            </p>
          </div>

          {/* Disclaimer */}
          {chosen.disclaimer && (
            <div className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
              chosen.disclaimer.startsWith('⚠️')
                ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
                : 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300'
            }`}>
              {chosen.disclaimer}
            </div>
          )}

          {/* Subjects to create */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {toCreate(chosen).length > 0
                ? `${toCreate(chosen).length} matérias serão criadas`
                : 'Todas as matérias já existem'}
            </p>
            {chosen.subjects.map(es => {
              const exists = currentSubjects.some(s => s.title.toLowerCase() === es.name.toLowerCase());
              return (
                <div
                  key={es.name}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    exists
                      ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: es.color }} />
                  <span className="flex-1 text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                    {es.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">{es.weight}%</span>
                    {exists
                      ? <span className="text-[9px] font-black text-gray-400 uppercase">Já existe</span>
                      : <i className="fas fa-plus text-[9px] text-indigo-500" />
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="space-y-2 pb-4">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20"
            >
              <i className="fas fa-check" />
              Aplicar Edital
            </button>
            <button
              onClick={() => { onSelect(chosen.id); onClose(); }}
              className="w-full py-3 text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest"
            >
              Selecionar sem criar matérias
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditalPickerModal;
