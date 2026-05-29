import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RedacaoCompetencyScores } from '../types';

const COMPETENCIES = [
  { key: 'c1' as const, label: 'C1', title: 'Domínio da modalidade escrita', desc: 'Gramática, ortografia, pontuação e vocabulário.' },
  { key: 'c2' as const, label: 'C2', title: 'Compreensão do tema', desc: 'Demonstrar domínio do tema sem fugir da proposta.' },
  { key: 'c3' as const, label: 'C3', title: 'Seleção de argumentos', desc: 'Organizar informações e argumentos coerentes.' },
  { key: 'c4' as const, label: 'C4', title: 'Coesão e coerência', desc: 'Articular as partes do texto com mecanismos linguísticos.' },
  { key: 'c5' as const, label: 'C5', title: 'Proposta de intervenção', desc: 'Elaborar proposta detalhada, respeitando direitos humanos.' },
] as const;

const SCORE_STEPS = [0, 40, 80, 120, 160, 200];

interface Props {
  isOpen: boolean;
  initialScores?: RedacaoCompetencyScores;
  initialNotes?: string;
  onSave: (scores: RedacaoCompetencyScores, notes: string) => void;
  onClose?: () => void;
  saveLabel?: string;
}

const RedacaoScoringModal: React.FC<Props> = ({
  isOpen,
  initialScores,
  initialNotes,
  onSave,
  onClose,
  saveLabel = 'Salvar Redação',
}) => {
  const [scores, setScores] = useState<RedacaoCompetencyScores>(
    initialScores ?? { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
  );
  const [notes, setNotes] = useState(initialNotes ?? '');

  if (!isOpen) return null;

  const totalScore = scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto md:max-w-2xl md:mx-auto md:rounded-3xl md:mb-8">
        <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-3 px-5 border-b border-gray-100 dark:border-gray-800 z-10">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
              Auto-avaliação
            </h3>
            <div className="text-right">
              <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{totalScore}</p>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600">de 1000</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 pb-8">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Avalie cada competência (0–200)
          </p>

          {COMPETENCIES.map(c => (
            <div key={c.key} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-gray-700 dark:text-gray-300">{c.label}: {c.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed mt-0.5">{c.desc}</p>
                </div>
                <span className="text-lg font-black text-violet-600 dark:text-violet-400 ml-3 shrink-0">{scores[c.key]}</span>
              </div>
              <div className="flex gap-1.5">
                {SCORE_STEPS.map(step => (
                  <button
                    key={step}
                    onClick={() => setScores(prev => ({ ...prev, [c.key]: step }))}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 ${
                      scores[c.key] === step
                        ? 'bg-violet-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Observações <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span>
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="O que melhorar na próxima vez…"
              rows={3}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none focus:outline-none focus:border-violet-300 transition-colors"
            />
          </div>

          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 border border-violet-100 dark:border-violet-900/30">
            <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2">Nota estimada</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-violet-600 dark:text-violet-400">{totalScore}</span>
              <span className="text-lg font-bold text-violet-400 mb-1">/ 1000</span>
            </div>
            <div className="h-2 bg-violet-100 dark:bg-violet-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${(totalScore / 1000) * 100}%` }} />
            </div>
          </div>

          <button
            onClick={() => onSave(scores, notes)}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
          >
            <i className="fas fa-save" />
            {saveLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RedacaoScoringModal;
