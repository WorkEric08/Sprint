import React, { useState, useEffect, useRef } from 'react';
import { PostBlockData, BANCAS } from '../types';
import { getSubtopicsForSubject } from '../hooks/useBlockLogs';

interface Props {
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  onSubmit: (data: PostBlockData) => void;
  onSkip: () => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Ok',
  4: 'Bom',
  5: 'Ótimo',
};

const SCORE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#6366f1',
};

const PostBlockModal: React.FC<Props> = ({
  subjectId,
  subjectTitle,
  subjectColor,
  onSubmit,
  onSkip,
}) => {
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [subtopic, setSubtopic] = useState('');
  const [selfScore, setSelfScore] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [flaggedForReview, setFlaggedForReview] = useState(false);
  const [banca, setBanca] = useState<string>('');
  const [showBancaPicker, setShowBancaPicker] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const subtopicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSubtopicsForSubject(subjectId).then(setSuggestions);
  }, [subjectId]);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(subtopic.toLowerCase()) && s !== subtopic
  );

  const handleTotalChange = (delta: number) => {
    const next = Math.max(0, questionsTotal + delta);
    setQuestionsTotal(next);
    if (questionsCorrect > next) setQuestionsCorrect(next);
  };

  const handleCorrectChange = (delta: number) => {
    setQuestionsCorrect(prev =>
      Math.min(questionsTotal, Math.max(0, prev + delta))
    );
  };

  const handleSubmit = () => {
    onSubmit({
      questionsTotal,
      questionsCorrect,
      subtopic: subtopic.trim(),
      selfScore,
      flaggedForReview,
      banca: banca || undefined,
    });
  };

  const wrongCount = questionsTotal - questionsCorrect;
  const accuracy = questionsTotal > 0
    ? Math.round((questionsCorrect / questionsTotal) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end md:justify-center md:items-center md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Sheet (mobile) / centered modal (desktop) */}
      <div className="relative w-full md:max-w-2xl bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 max-h-[90vh] md:max-h-[88vh] overflow-y-auto">

        {/* Handle + header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-2 px-5 z-10 border-b border-gray-100 dark:border-gray-800 md:rounded-t-3xl">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3 md:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subjectColor }} />
              <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                {subjectTitle}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-indigo-500 transition-colors px-2 py-1 shrink-0"
            >
              Pular
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5 pb-8">

          {/* ── Auto-avaliação ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Como você se saiu?
            </label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(score => (
                <button
                  key={score}
                  onClick={() => setSelfScore(score)}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 border-2 ${
                    selfScore === score
                      ? 'border-transparent text-white shadow-md'
                      : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/40'
                  }`}
                  style={selfScore === score ? { backgroundColor: SCORE_COLORS[score] } : {}}
                >
                  {score}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-bold text-center" style={{ color: SCORE_COLORS[selfScore] }}>
              {SCORE_LABELS[selfScore]}
            </p>
          </div>

          {/* ── Questões ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Questões
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Resolvidas */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                  Resolvidas
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTotalChange(-1)}
                    disabled={questionsTotal === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <i className="fas fa-minus text-[9px]" />
                  </button>
                  <span className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">
                    {questionsTotal}
                  </span>
                  <button
                    onClick={() => handleTotalChange(1)}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                  >
                    <i className="fas fa-plus text-[9px]" />
                  </button>
                </div>
              </div>

              {/* Corretas */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                  Corretas
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCorrectChange(-1)}
                    disabled={questionsCorrect === 0 || questionsTotal === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <i className="fas fa-minus text-[9px]" />
                  </button>
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{
                      color: questionsTotal === 0
                        ? undefined
                        : accuracy !== null && accuracy >= 70
                        ? '#22c55e'
                        : '#ef4444',
                    }}
                  >
                    {questionsCorrect}
                  </span>
                  <button
                    onClick={() => handleCorrectChange(1)}
                    disabled={questionsCorrect >= questionsTotal || questionsTotal === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <i className="fas fa-plus text-[9px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Accuracy indicator */}
            {accuracy !== null && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[11px] font-black" style={{ color: accuracy >= 70 ? '#22c55e' : '#ef4444' }}>
                  {accuracy}% de acerto
                </span>
                {wrongCount > 0 && (
                  <span className="text-[10px] font-bold text-red-400 dark:text-red-600">
                    · {wrongCount} {wrongCount === 1 ? 'erro' : 'erros'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Subtópico ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Subtópico <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span>
            </label>
            <div className="relative">
              <input
                ref={subtopicRef}
                type="text"
                value={subtopic}
                onChange={e => {
                  setSubtopic(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Ex: Funções, Direito Constitucional…"
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors"
              />
              {subtopic.length > 0 && (
                <button
                  onClick={() => setSubtopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <i className="fas fa-times text-[8px] text-gray-500" />
                </button>
              )}
            </div>

            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                {filteredSuggestions.slice(0, 5).map(s => (
                  <button
                    key={s}
                    onMouseDown={() => {
                      setSubtopic(s);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                  >
                    <i className="fas fa-history text-[9px] text-gray-300 dark:text-gray-700 mr-2" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Existing subtopics as chips (when input empty) */}
            {!subtopic && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => setSubtopic(s)}
                    className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 active:scale-95 transition-transform"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Banca (Feature 2 Fase 5 — sempre opcional) ── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Banca <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowBancaPicker(p => !p)}
                className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-sm text-left"
              >
                <span className={banca ? 'text-gray-800 dark:text-gray-100 font-bold' : 'text-gray-400 dark:text-gray-600'}>
                  {banca || 'Nenhuma selecionada'}
                </span>
                <i className={`fas fa-chevron-${showBancaPicker ? 'up' : 'down'} text-[10px] text-gray-400`} />
              </button>
              {showBancaPicker && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setBanca(''); setShowBancaPicker(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800/60"
                  >
                    Nenhuma
                  </button>
                  {BANCAS.map(b => (
                    <button
                      key={b}
                      onClick={() => { setBanca(b); setShowBancaPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800/60 last:border-0 ${
                        banca === b ? 'font-black text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Marcar pra revisar ── */}
          <button
            onClick={() => setFlaggedForReview(prev => !prev)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              flaggedForReview
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              flaggedForReview
                ? 'bg-amber-400'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
              <i className={`fas fa-bookmark text-sm ${
                flaggedForReview ? 'text-white' : 'text-gray-400 dark:text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <p className={`text-sm font-black uppercase tracking-tight ${
                flaggedForReview ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Marcar pra revisar
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                {flaggedForReview ? 'Será lembrado em breve' : 'Sinalizar este conteúdo'}
              </p>
            </div>
          </button>

          {/* ── CTA ── */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white shadow-lg"
            style={{ backgroundColor: subjectColor }}
          >
            <i className="fas fa-check" />
            Salvar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostBlockModal;
