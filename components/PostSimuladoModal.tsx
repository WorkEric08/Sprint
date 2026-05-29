import React, { useState } from 'react';
import { SimuladoTemplate, SimuladoAreaResult, SimuladoRecord } from '../types';
import { useBackButton } from '../hooks/useBackButton';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  template: SimuladoTemplate;
  actualDurationMinutes: number;
  completed: boolean;
  startedAt: number;
  onSave: (record: SimuladoRecord) => void;
  onSkip: () => void;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const TIME_CONTROL_LABELS: Record<number, string> = {
  1: 'Perdi o controle',
  2: 'Não administrei bem',
  3: 'Ok, podia melhorar',
  4: 'Administrei bem',
  5: 'Controle total',
};

const PostSimuladoModal: React.FC<Props> = ({
  template, actualDurationMinutes, completed, startedAt, onSave, onSkip
}) => {
  useSecondaryScreen();
  useBackButton(onSkip);
  const [timeControlScore, setTimeControlScore] = useState<1|2|3|4|5|null>(null);
  const [perception, setPerception] = useState('');
  const [redacaoScore, setRedacaoScore] = useState<string>('');
  const [areaResults, setAreaResults] = useState<SimuladoAreaResult[]>(
    template.areas.map(a => ({
      areaName: a.name,
      color: a.color,
      questionsTotal: a.questionCount ?? 0,
      questionsCorrect: 0,
    }))
  );

  const updateAreaResult = (idx: number, field: 'questionsTotal' | 'questionsCorrect', delta: number) => {
    setAreaResults(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const val = Math.max(0, r[field] + delta);
      if (field === 'questionsCorrect') return { ...r, questionsCorrect: Math.min(r.questionsTotal, val) };
      if (field === 'questionsTotal') return { ...r, questionsTotal: val, questionsCorrect: Math.min(r.questionsCorrect, val) };
      return r;
    }));
  };

  const totalCorrect = areaResults.reduce((a, r) => a + r.questionsCorrect, 0);
  const totalQuestions = areaResults.reduce((a, r) => a + r.questionsTotal, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;

  const handleSave = () => {
    const record: SimuladoRecord = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      startedAt,
      completedAt: Date.now(),
      plannedDurationMinutes: template.durationMinutes,
      actualDurationMinutes,
      completed,
      areaResults,
      timeControlScore,
      perception: perception.trim(),
      redacaoText: '',
      redacaoScore: redacaoScore ? Number(redacaoScore) : null,
    };
    onSave(record);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end md:justify-center md:items-center md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onSkip} />

      <div className="relative w-full md:max-w-2xl bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] md:max-h-[88vh] overflow-y-auto modal-scroll animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        {/* Handle */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-3 px-5 z-10 border-b border-gray-100 dark:border-gray-800 md:rounded-t-3xl">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3 md:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                Registrar Simulado
              </h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-0.5">
                {template.name} · {actualDurationMinutes}min {!completed && '(interrompido)'}
              </p>
            </div>
            <button onClick={onSkip} className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 px-2 py-1">
              Pular
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6 pb-8">
          {/* Overall score (derived) */}
          {overallPct !== null && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-center border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Aproveitamento Geral</p>
              <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{overallPct}%</p>
              <p className="text-xs text-indigo-400 mt-0.5">{totalCorrect} de {totalQuestions} questões</p>
            </div>
          )}

          {/* Per-area results */}
          {template.areas.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Resultado por área
              </p>
              {areaResults.map((r, idx) => {
                const pct = r.questionsTotal > 0 ? Math.round((r.questionsCorrect / r.questionsTotal) * 100) : null;
                const isRedacao = r.areaName === 'Redação';
                return (
                  <div key={r.areaName} className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{r.areaName}</span>
                      </div>
                      {pct !== null && !isRedacao && (
                        <span className="text-sm font-black" style={{ color: pct >= 60 ? '#22c55e' : '#ef4444' }}>
                          {pct}%
                        </span>
                      )}
                    </div>

                    {isRedacao ? (
                      /* Redação: nota 0-1000 manual */
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Nota (0–1000)</span>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          step="40"
                          value={redacaoScore}
                          onChange={e => setRedacaoScore(e.target.value)}
                          placeholder="—"
                          className="w-24 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:border-indigo-300"
                        />
                      </div>
                    ) : (
                      /* Regular area: questions */
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { label: 'Questões', field: 'questionsTotal' as const },
                          { label: 'Corretas', field: 'questionsCorrect' as const },
                        ]).map(({ label, field }) => (
                          <div key={field} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">{label}</p>
                            <div className="flex items-center justify-between">
                              <button onClick={() => updateAreaResult(idx, field, -1)} disabled={r[field] === 0} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90">
                                <i className="fas fa-minus text-[9px]" />
                              </button>
                              <span className="text-xl font-black text-gray-800 dark:text-white tabular-nums">{r[field]}</span>
                              <button onClick={() => updateAreaResult(idx, field, 1)} disabled={field === 'questionsCorrect' && r.questionsCorrect >= r.questionsTotal} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90">
                                <i className="fas fa-plus text-[9px]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}


          {/* Time control */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Controle do tempo
            </p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(score => (
                <button
                  key={score}
                  onClick={() => setTimeControlScore(score)}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 border-2 ${
                    timeControlScore === score
                      ? 'border-transparent bg-indigo-500 text-white shadow-md'
                      : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/40'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            {timeControlScore && (
              <p className="text-[10px] font-bold text-center text-gray-500 dark:text-gray-400">
                {TIME_CONTROL_LABELS[timeControlScore]}
              </p>
            )}
          </div>

          {/* Free perception */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Como foi? <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span>
            </p>
            <textarea
              value={perception}
              onChange={e => setPerception(e.target.value)}
              placeholder="Dificuldades, pontos de atenção, sensação geral…"
              rows={3}
              className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20"
          >
            <i className="fas fa-save" />
            Salvar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSimuladoModal;
