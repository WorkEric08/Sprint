import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RedacaoTheme, RedacaoSession, RedacaoCompetencyScores } from '../types';
import TabPageHeader from './TabPageHeader';

interface Props {
  theme: RedacaoTheme;
  existingSession?: RedacaoSession;
  onSave: (session: RedacaoSession) => void;
  onClose: () => void;
  isDevMode?: boolean;
}

// Competency metadata
const COMPETENCIES = [
  { key: 'c1' as const, label: 'C1', title: 'Domínio da modalidade escrita', desc: 'Gramática, ortografia, pontuação e vocabulário.' },
  { key: 'c2' as const, label: 'C2', title: 'Compreensão do tema', desc: 'Demonstrar domínio do tema sem fugir da proposta.' },
  { key: 'c3' as const, label: 'C3', title: 'Seleção de argumentos', desc: 'Organizar informações e argumentos coerentes.' },
  { key: 'c4' as const, label: 'C4', title: 'Coesão e coerência', desc: 'Articular as partes do texto com mecanismos linguísticos.' },
  { key: 'c5' as const, label: 'C5', title: 'Proposta de intervenção', desc: 'Elaborar proposta detalhada, respeitando direitos humanos.' },
] as const;

const SCORE_STEPS = [0, 40, 80, 120, 160, 200];

const TOTAL_MINUTES = 90;
const AUTOSAVE_DELAY = 5000; // 5 seconds

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatMS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const RedacaoEditorView: React.FC<Props> = ({ theme, existingSession, onSave, onClose, isDevMode }) => {
  const sessionId = useRef(existingSession?.id ?? uid());
  const startedAt = useRef(existingSession?.startedAt ?? Date.now());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState(existingSession?.text ?? '');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(existingSession?.lastSavedAt ?? null);

  // Timer (countdown from 90min)
  const [displayMs, setDisplayMs] = useState(
    existingSession
      ? Math.max(0, TOTAL_MINUTES * 60 * 1000 - (Date.now() - existingSession.startedAt))
      : TOTAL_MINUTES * 60 * 1000
  );
  const [timerExpired, setTimerExpired] = useState(false);

  const [scores, setScores] = useState<RedacaoCompetencyScores>(
    existingSession?.competencyScores ?? { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
  );
  const [notes, setNotes] = useState(existingSession?.notes ?? '');

  const totalScore = scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;
  const wordCount = countWords(text);

  // Timer tick
  useEffect(() => {
    if (timerExpired) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const remaining = TOTAL_MINUTES * 60 * 1000 - elapsed;
      if (remaining <= 0) {
        setDisplayMs(0);
        setTimerExpired(true);
        setShowScoring(true);
      } else {
        setDisplayMs(remaining);
      }
    }, 500);
    return () => clearInterval(id);
  }, [timerExpired]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback((currentText: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const session: RedacaoSession = {
        id: sessionId.current,
        themeId: theme.id,
        themeTitle: theme.title,
        startedAt: startedAt.current,
        lastSavedAt: Date.now(),
        completedAt: null,
        durationMinutes: Math.round((Date.now() - startedAt.current) / 60000),
        text: currentText,
        wordCount: countWords(currentText),
        competencyScores: null,
        estimatedScore: null,
        notes: '',
      };
      onSave(session); // saves to DB via parent hook
      setLastSaved(Date.now());
      setIsSaving(false);
    }, AUTOSAVE_DELAY);
  }, [theme.id, theme.title, onSave]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    triggerAutoSave(newText);
  };

  const handleFinish = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setShowScoring(true);
  };

  const handleSaveWithScores = () => {
    // Em modo DevInfo, concluir manualmente conta como redação feita no tempo
    // total (90min) — como se o cronômetro tivesse rodado por inteiro.
    const elapsedMin = Math.round((Date.now() - startedAt.current) / 60000);
    const durationMinutes = isDevMode ? TOTAL_MINUTES : elapsedMin;
    const session: RedacaoSession = {
      id: sessionId.current,
      themeId: theme.id,
      themeTitle: theme.title,
      startedAt: startedAt.current,
      lastSavedAt: Date.now(),
      completedAt: Date.now(),
      durationMinutes,
      text,
      wordCount,
      competencyScores: scores,
      estimatedScore: totalScore,
      notes,
    };
    onSave(session);
    onClose();
  };

  const timerColor = displayMs <= 10 * 60 * 1000 ? '#ef4444'
    : displayMs <= 30 * 60 * 1000 ? '#f59e0b'
    : '#6366f1';

  const saveStatus = isSaving ? 'Salvando…' : lastSaved ? '✓ Salvo' : 'Rascunho';

  return (
    <div className="space-y-4">
      <TabPageHeader
        icon="pen"
        title={theme.title}
        subtitle={`${saveStatus} · ${wordCount} palavras`}
        accent="violet"
        action={
          <div className="flex items-center gap-3">
            <div className="text-xl md:text-2xl font-black tabular-nums" style={{ color: timerColor }}>
              {formatMS(displayMs)}
            </div>
            <button
              onClick={() => setShowChecklist(p => !p)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                showChecklist ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}
              aria-label="Alternar checklist"
            >
              <i className="fas fa-list-check text-sm" />
            </button>
          </div>
        }
      />

      {/* Editor + checklist */}
      <div className="grid gap-4 lg:grid-cols-[1fr,18rem]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder="Escreva sua redação aqui…

Introdução:
• Apresente o tema e contextualize o problema

Desenvolvimento:
• Argumento 1 com repertório sociocultural
• Argumento 2 com repertório sociocultural

Conclusão:
• Proposta de intervenção (agente, ação, modo, finalidade, detalhamento)"
            className="w-full min-h-[60vh] p-4 md:p-6 text-sm leading-7 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 resize-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 font-mono"
            style={{ letterSpacing: '0.01em' }}
            autoFocus
          />
          {/* Word count + Concluir */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-bold shrink-0">
            <span className="text-gray-400 dark:text-gray-600">
              {wordCount < 150 ? '⚠️ Muito curto' : wordCount > 500 ? '⚠️ Muito longo' : '✓ Tamanho ideal'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-600">{wordCount} palavras</span>
              {!timerExpired && (
                <button
                  onClick={handleFinish}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Checklist panel */}
        {showChecklist && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">

            {/* Contextualização do tema */}
            {theme.context && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 space-y-1 border border-violet-100 dark:border-violet-900/30">
                <p className="text-[9px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1.5">
                  Sobre o tema
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {theme.context}
                </p>
              </div>
            )}

            <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">5 Competências ENEM</p>
            {COMPETENCIES.map(c => (
              <div key={c.key} className="bg-white dark:bg-gray-800 rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{c.label}: {c.title}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">Checklist de escrita</p>
              {[
                'Parágrafo introdutório com contextualização',
                'Pelo menos 2 argumentos com repertório',
                'Conectivos de coesão entre parágrafos',
                'Proposta de intervenção detalhada (C5)',
                'Agente, ação, modo e finalidade na proposta',
                'Revisão gramatical e ortográfica',
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer mb-1.5">
                  <input type="checkbox" className="mt-0.5 accent-violet-500" />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scoring modal (portal to escape any layout constraints) */}
      {showScoring && createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto md:max-w-2xl md:mx-auto md:rounded-3xl md:mb-8">
            <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-3 px-5 border-b border-gray-100 dark:border-gray-800 z-10">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Auto-avaliação</h3>
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

              {/* Notes */}
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

              {/* Score bar */}
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
                onClick={handleSaveWithScores}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
              >
                <i className="fas fa-save" />
                Salvar Redação
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RedacaoEditorView;
