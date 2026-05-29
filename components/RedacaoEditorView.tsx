import React, { useState, useRef, useCallback } from 'react';
import { RedacaoTheme, RedacaoSession, RedacaoCompetencyScores } from '../types';
import { AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import TabPageHeader from './TabPageHeader';
import RedacaoTimerCard, { RedacaoTimerHandle } from './RedacaoTimerCard';
import RedacaoScoringModal from './RedacaoScoringModal';
import { useRegisterNavigationGuard } from '../contexts/NavigationGuardContext';

interface Props {
  theme: RedacaoTheme;
  existingSession?: RedacaoSession;
  onSave: (session: RedacaoSession) => void;
  onClose: () => void;
  isDevMode?: boolean;
}

const TOTAL_MS = 90 * 60 * 1000;
const TOTAL_MINUTES = 90;
const AUTOSAVE_DELAY = 5000;

const COMPETENCIES = [
  { key: 'c1', label: 'C1', title: 'Domínio da modalidade escrita', desc: 'Gramática, ortografia, pontuação e vocabulário.' },
  { key: 'c2', label: 'C2', title: 'Compreensão do tema', desc: 'Demonstrar domínio do tema sem fugir da proposta.' },
  { key: 'c3', label: 'C3', title: 'Seleção de argumentos', desc: 'Organizar informações e argumentos coerentes.' },
  { key: 'c4', label: 'C4', title: 'Coesão e coerência', desc: 'Articular as partes do texto com mecanismos linguísticos.' },
  { key: 'c5', label: 'C5', title: 'Proposta de intervenção', desc: 'Elaborar proposta detalhada, respeitando direitos humanos.' },
] as const;

const CHECKLIST_ITEMS = [
  'Parágrafo introdutório com contextualização',
  'Pelo menos 2 argumentos com repertório',
  'Conectivos de coesão entre parágrafos',
  'Proposta de intervenção detalhada (C5)',
  'Agente, ação, modo e finalidade na proposta',
  'Revisão gramatical e ortográfica',
];

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const RedacaoEditorView: React.FC<Props> = ({ theme, existingSession, onSave, onClose, isDevMode }) => {
  const axisColor = AXIS_COLORS[theme.axis];
  const sessionId = useRef(existingSession?.id ?? uid());
  const startedAt = useRef(existingSession?.startedAt ?? Date.now());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<RedacaoTimerHandle>(null);

  const [text, setText] = useState(existingSession?.text ?? '');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(existingSession?.lastSavedAt ?? null);
  const [timerRunning, setTimerRunning] = useState(false);

  // Bloqueia troca de aba enquanto o cronômetro estiver rodando
  useRegisterNavigationGuard(timerRunning, {
    title: 'Sair da redação?',
    message: 'O cronômetro está rodando e sua redação ainda não foi concluída. Se sair, o progresso fica salvo como rascunho.',
    cancelLabel: 'Continuar redação',
    confirmLabel: 'Sair mesmo assim',
  });

  const wordCount = countWords(text);

  const triggerAutoSave = useCallback((currentText: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
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
      onSave(session);
      setLastSaved(Date.now());
      setIsSaving(false);
    }, AUTOSAVE_DELAY);
  }, [theme.id, theme.title, onSave]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    triggerAutoSave(e.target.value);
  };

  const handleFinish = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    timerRef.current?.pause();
    setShowScoring(true);
  };

  const handleSaveWithScores = (scores: RedacaoCompetencyScores, notes: string) => {
    const elapsedMin = Math.round((Date.now() - startedAt.current) / 60000);
    const durationMinutes = isDevMode ? TOTAL_MINUTES : elapsedMin;
    const totalScore = scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;
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

  const saveStatus = isSaving ? 'Salvando…' : lastSaved ? '✓ Salvo' : 'Rascunho';
  const wordStatus = wordCount < 150 ? '⚠️ Muito curto' : wordCount > 500 ? '⚠️ Muito longo' : '✓ Tamanho ideal';

  return (
    <div className="space-y-4">
      <TabPageHeader
        icon="laptop"
        title="Escrever aqui"
        subtitle={`${saveStatus} · ${wordCount} palavras`}
        accent="violet"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklist(p => !p)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                showChecklist
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
              aria-label="Alternar checklist"
              title="Checklist"
            >
              <i className="fas fa-list-check text-xs" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Voltar"
            >
              <i className="fas fa-arrow-left text-xs" />
            </button>
          </div>
        }
      />

      <RedacaoTimerCard
        ref={timerRef}
        totalMs={TOTAL_MS}
        autoStart={true}
        onTimeUp={() => setShowScoring(true)}
        onRunningChange={setTimerRunning}
        suppressTimeUpModal
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,18rem]">
        {/* Editor card — mirrors paper mode's support text card */}
        <div className="-mx-4 md:mx-0">
          <article className="bg-white dark:bg-gray-900 border-y md:border md:rounded-2xl border-violet-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Theme header — same layout as paper mode */}
            <div className="flex items-center gap-2 px-4 md:px-6 pt-4 pb-3">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
                style={{ background: axisColor }}
              >
                {AXIS_LABELS[theme.axis]}
              </span>
              {theme.year && (
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                  ENEM {theme.year}
                </span>
              )}
            </div>

            <h1 className="px-4 md:px-6 text-base md:text-lg font-black text-gray-800 dark:text-gray-100 leading-snug">
              {theme.title}
            </h1>

            <div className="mx-4 md:mx-6 my-3 border-t border-violet-100 dark:border-gray-800" />

            <div className="px-4 md:px-6 pb-3">
              <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">
                <i className="fas fa-pen mr-1" /> Sua redação
              </p>
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
                className="w-full min-h-[55vh] text-[15px] md:text-base leading-7 text-gray-800 dark:text-gray-100 bg-transparent resize-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 font-mono"
                style={{ letterSpacing: '0.01em' }}
                autoFocus
              />
            </div>

            {/* Footer: word count + Concluir — same button as paper mode */}
            <div className="px-4 md:px-6 py-3 border-t border-violet-50 dark:border-gray-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {wordStatus} · {wordCount} palavras
              </span>
              <button
                onClick={handleFinish}
                className="w-full md:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <i className="fas fa-check" />
                Concluir Redação
              </button>
            </div>
          </article>
        </div>

        {/* Checklist side panel */}
        {showChecklist && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
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
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer mb-1.5">
                  <input type="checkbox" className="mt-0.5 accent-violet-500" />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <RedacaoScoringModal
        isOpen={showScoring}
        initialScores={existingSession?.competencyScores ?? undefined}
        initialNotes={existingSession?.notes}
        onSave={handleSaveWithScores}
      />
    </div>
  );
};

export default RedacaoEditorView;
