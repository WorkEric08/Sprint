import React, { useState, useRef } from 'react';
import { RedacaoTheme, RedacaoSession, RedacaoCompetencyScores } from '../types';
import { AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import TabPageHeader from './TabPageHeader';
import RedacaoTimerCard, { RedacaoTimerHandle } from './RedacaoTimerCard';
import RedacaoScoringModal from './RedacaoScoringModal';
import { useRegisterNavigationGuard } from '../contexts/NavigationGuardContext';

interface Props {
  theme: RedacaoTheme;
  onSave: (session: RedacaoSession) => void;
  onClose: () => void;
}

const TOTAL_MS = 90 * 60 * 1000;

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const RedacaoPaperView: React.FC<Props> = ({ theme, onSave, onClose }) => {
  const axisColor = AXIS_COLORS[theme.axis];
  const sessionId = useRef(uid());
  const startedAt = useRef(Date.now());
  const timerRef = useRef<RedacaoTimerHandle>(null);

  const [showScoring, setShowScoring] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  useRegisterNavigationGuard(timerRunning, {
    title: 'Sair da redação?',
    message: 'O cronômetro está rodando. Se sair agora, o tempo será perdido e a redação não será registrada.',
    cancelLabel: 'Continuar redação',
    confirmLabel: 'Sair mesmo assim',
  });

  const handleFinish = () => {
    timerRef.current?.pause();
    setShowScoring(true);
  };

  const handleSaveWithScores = (scores: RedacaoCompetencyScores, notes: string) => {
    const elapsedMs = timerRef.current?.getElapsedMs() ?? 0;
    const total = scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;
    const session: RedacaoSession = {
      id: sessionId.current,
      themeId: theme.id,
      themeTitle: theme.title,
      startedAt: startedAt.current,
      lastSavedAt: Date.now(),
      completedAt: Date.now(),
      durationMinutes: Math.round(elapsedMs / 60000),
      text: '',
      wordCount: 0,
      competencyScores: scores,
      estimatedScore: total,
      notes: notes ? `[Modo papel] ${notes}` : '[Modo papel]',
    };
    onSave(session);
    onClose();
  };

  return (
    <div className="space-y-4">
      <TabPageHeader
        icon="pencil"
        title="Modo papel"
        subtitle={`Texto de apoio · ${AXIS_LABELS[theme.axis]}`}
        accent="amber"
        action={
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Voltar"
          >
            <i className="fas fa-arrow-left text-xs" />
          </button>
        }
      />

      <RedacaoTimerCard
        ref={timerRef}
        totalMs={TOTAL_MS}
        autoStart={false}
        onTimeUp={() => setShowScoring(true)}
        onRunningChange={setTimerRunning}
        suppressTimeUpModal
      />

      {/* Support text card */}
      <div className="-mx-4 md:mx-0">
        <article className="bg-white dark:bg-gray-900 border-y md:border md:rounded-2xl border-amber-100 dark:border-gray-800 shadow-sm overflow-hidden">
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

          <h1 className="px-4 md:px-6 text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 leading-tight">
            {theme.title}
          </h1>

          <div className="mx-4 md:mx-6 my-4 border-t border-amber-100 dark:border-gray-800" />

          <div className="px-4 md:px-6 pb-6">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              <i className="fas fa-file-lines mr-1" /> Texto de apoio
            </p>
            {theme.context ? (
              <p className="text-[15px] md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {theme.context}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                Nenhum texto de apoio disponível para este tema.
              </p>
            )}
          </div>

          {/* Concluir redação — same pattern as editor mode */}
          <div className="px-4 md:px-6 pb-5 pt-1 border-t border-amber-50 dark:border-gray-800/60 flex justify-end">
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

      <p className="text-center text-[10px] text-amber-500 dark:text-amber-600 font-bold pb-2">
        Boa redação! ✏️
      </p>

      <RedacaoScoringModal
        isOpen={showScoring}
        onSave={handleSaveWithScores}
        onClose={() => setShowScoring(false)}
      />
    </div>
  );
};

export default RedacaoPaperView;
