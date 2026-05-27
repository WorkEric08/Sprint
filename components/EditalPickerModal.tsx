import React, { useState } from 'react';
import { Edital, Subject } from '../types';
import { EDITAIS } from '../data/editais';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  currentEditalId: string | null;
  currentSubjects: Subject[];
  onSelect: (editalId: string) => void;
  onApplySubjects: (newSubjects: Subject[]) => void;
  onClose: () => void;
}

const ENEM = EDITAIS.find(e => e.id === 'enem')!;

const FAST_COLORS = [
  '#ff5d15', '#eb761d', '#d8a800', '#8ec81c', '#22b77a', '#1aa9a5', '#09a9d1',
  '#0997e5', '#3170e5', '#635bd6', '#934de5', '#c942c7', '#dc437e', '#e3445e',
];

const CUSTOM_KEY = 'sprint_custom_edital';

interface CustomSubject { name: string; color: string; }
interface CustomData    { name: string; subjects: CustomSubject[]; }

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

type Step = 'pick' | 'confirm-enem' | 'create-custom';

const EditalPickerModal: React.FC<Props> = ({
  currentEditalId,
  currentSubjects,
  onSelect,
  onApplySubjects,
  onClose,
}) => {
  useSecondaryScreen();

  const [step, setStep] = useState<Step>('pick');

  // ── ENEM confirm ──────────────────────────────────────────────────────────
  const toCreateEnem = ENEM.subjects.filter(
    es => !currentSubjects.some(s => s.title.toLowerCase() === es.name.toLowerCase())
  );

  const handleConfirmEnem = () => {
    onSelect(ENEM.id);
    const newSubjects: Subject[] = toCreateEnem.map(es => ({
      id: uid(),
      title: es.name,
      color: es.color,
      duration: 50,
      blockCount: Math.max(10, Math.round(es.weight / 5)),
      completedBlocks: [],
    }));
    if (newSubjects.length > 0) onApplySubjects([...currentSubjects, ...newSubjects]);
    onClose();
  };

  // ── Custom edital ─────────────────────────────────────────────────────────
  const [customName, setCustomName] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY);
      return stored ? (JSON.parse(stored) as CustomData).name : '';
    } catch { return ''; }
  });
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY);
      return stored ? (JSON.parse(stored) as CustomData).subjects : [];
    } catch { return []; }
  });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(FAST_COLORS[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  const addCustomSubject = () => {
    if (!newSubjectName.trim()) return;
    setCustomSubjects(prev => [...prev, { name: newSubjectName.trim(), color: newSubjectColor }]);
    setNewSubjectName('');
    setNewSubjectColor(FAST_COLORS[0]);
    setShowAddForm(false);
  };

  const removeCustomSubject = (idx: number) =>
    setCustomSubjects(prev => prev.filter((_, i) => i !== idx));

  const handleConfirmCustom = () => {
    if (!customName.trim()) return;
    const data: CustomData = { name: customName.trim(), subjects: customSubjects };
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(data));
    onSelect('custom');
    const toAdd = customSubjects.filter(
      cs => !currentSubjects.some(s => s.title.toLowerCase() === cs.name.toLowerCase())
    );
    if (toAdd.length > 0) {
      onApplySubjects([
        ...currentSubjects,
        ...toAdd.map(cs => ({
          id: uid(),
          title: cs.name,
          color: cs.color,
          duration: 50,
          blockCount: 20,
          completedBlocks: [],
        })),
      ]);
    }
    onClose();
  };

  // ── Header title ──────────────────────────────────────────────────────────
  const headerTitle =
    step === 'pick' ? 'Selecionar Edital' :
    step === 'confirm-enem' ? 'Confirmar ENEM' :
    'Edital Personalizado';

  const handleBack = () => {
    if (step !== 'pick') { setStep('pick'); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-200">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }}
      >
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
          {headerTitle}
        </h2>
      </div>

      {/* ── Step: pick ─────────────────────────────────────────────────────── */}
      {step === 'pick' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* ENEM */}
          <button
            onClick={() => setStep('confirm-enem')}
            className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              currentEditalId === 'enem'
                ? 'border-indigo-300 dark:border-indigo-700'
                : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    INEP/MEC
                  </span>
                  {currentEditalId === 'enem' && (
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight">
                  ENEM
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                  {ENEM.subjects.length} matérias · Matriz de Referência oficial
                </p>
              </div>
              <div className="flex -space-x-1 shrink-0">
                {ENEM.subjects.slice(0, 5).map((s, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"
                    style={{ backgroundColor: s.color }}
                  />
                ))}
              </div>
            </div>
          </button>

          {/* Customizado */}
          <button
            onClick={() => setStep('create-custom')}
            className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              currentEditalId === 'custom'
                ? 'border-indigo-300 dark:border-indigo-700'
                : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    Personalizado
                  </span>
                  {currentEditalId === 'custom' && (
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight">
                  Customizado
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                  {customName
                    ? `${customName} · ${customSubjects.length} matéria${customSubjects.length !== 1 ? 's' : ''}`
                    : 'Crie seu próprio edital com matérias personalizadas'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                <i className="fas fa-sliders text-indigo-500 text-sm" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Step: confirm ENEM ─────────────────────────────────────────────── */}
      {step === 'confirm-enem' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
              INEP/MEC · Novembro
            </p>
            <p className="font-black text-gray-800 dark:text-gray-100 text-base uppercase tracking-tight">ENEM</p>
          </div>

          <div className="rounded-2xl p-3.5 text-xs leading-relaxed bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300">
            {ENEM.disclaimer}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {toCreateEnem.length > 0
                ? `${toCreateEnem.length} matérias serão criadas`
                : 'Todas as matérias já existem'}
            </p>
            {ENEM.subjects.map(es => {
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

          <div className="space-y-2 pb-4">
            <button
              onClick={handleConfirmEnem}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20"
            >
              <i className="fas fa-check" />
              Aplicar ENEM
            </button>
            <button
              onClick={() => { onSelect(ENEM.id); onClose(); }}
              className="w-full py-3 text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest"
            >
              Selecionar sem criar matérias
            </button>
          </div>
        </div>
      )}

      {/* ── Step: create custom ────────────────────────────────────────────── */}
      {step === 'create-custom' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Nome */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Nome do concurso / prova
            </p>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Ex: OAB, ANATEL, Minha Prova..."
                maxLength={50}
                className="w-full bg-transparent text-sm font-black text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal focus:outline-none"
              />
            </div>
          </div>

          {/* Matérias */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Matérias ({customSubjects.length})
            </p>

            {customSubjects.map((cs, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cs.color }} />
                <span className="flex-1 text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                  {cs.name}
                </span>
                <button
                  onClick={() => removeCustomSubject(idx)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 active:scale-90 transition-transform"
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              </div>
            ))}

            {/* Add form */}
            {showAddForm ? (
              <div className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="Nome da matéria"
                  maxLength={40}
                  className="w-full bg-transparent text-sm font-black text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal focus:outline-none border-b border-gray-100 dark:border-gray-800 pb-2"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {FAST_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewSubjectColor(c)}
                      className="w-7 h-7 rounded-full transition-transform active:scale-90"
                      style={{
                        backgroundColor: c,
                        outline: newSubjectColor === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCustomSubject}
                    disabled={!newSubjectName.trim()}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewSubjectName(''); }}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:border-indigo-300 dark:hover:border-indigo-800 hover:text-indigo-500 transition-all"
              >
                <i className="fas fa-plus text-[9px]" />
                Adicionar matéria
              </button>
            )}
          </div>

          {/* CTA */}
          <div className="pb-4">
            <button
              onClick={handleConfirmCustom}
              disabled={!customName.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:shadow-none"
            >
              <i className="fas fa-check" />
              Salvar Edital
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditalPickerModal;
