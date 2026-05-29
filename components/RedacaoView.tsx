import React, { useCallback, useState } from 'react';
import { RedacaoTheme, RedacaoSession } from '../types';
import { isDevModeUser } from '../utils/devMode';
import { useCompletedThemes } from '../hooks/useCompletedThemes';
import RedacaoSetupModal from './RedacaoSetupModal';
import RedacaoModeModal from './RedacaoModeModal';
import RedacaoEditorView from './RedacaoEditorView';
import RedacaoPaperView from './RedacaoPaperView';

interface Props {
  userName: string;
  onSaveSession: (session: RedacaoSession) => void;
}

type Phase =
  | { kind: 'picker' }
  | { kind: 'mode-picker'; theme: RedacaoTheme }
  | { kind: 'editor'; theme: RedacaoTheme }
  | { kind: 'paper'; theme: RedacaoTheme };

const RedacaoView: React.FC<Props> = ({ userName, onSaveSession }) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'picker' });
  const isDevMode = isDevModeUser(userName);
  const { completedIds, markCompleted, resetAll } = useCompletedThemes();

  // Wraps the persisted save so that any session marked as completed also
  // tags its theme as "feita" (moves it out of the regular filters).
  const handleSave = useCallback((session: RedacaoSession) => {
    onSaveSession(session);
    if (session.completedAt !== null) {
      markCompleted(session.themeId);
    }
  }, [onSaveSession, markCompleted]);

  if (phase.kind === 'picker') {
    return (
      <RedacaoSetupModal
        onStart={theme => setPhase({ kind: 'mode-picker', theme })}
        completedIds={completedIds}
        onResetCompleted={resetAll}
      />
    );
  }

  if (phase.kind === 'mode-picker') {
    return (
      <>
        {/* Keep the picker visible behind the modal */}
        <RedacaoSetupModal
          onStart={theme => setPhase({ kind: 'mode-picker', theme })}
          completedIds={completedIds}
          onResetCompleted={resetAll}
        />
        <RedacaoModeModal
          theme={phase.theme}
          onChooseDigital={() => setPhase({ kind: 'editor', theme: phase.theme })}
          onChoosePaper={() => setPhase({ kind: 'paper', theme: phase.theme })}
          onBack={() => setPhase({ kind: 'picker' })}
        />
      </>
    );
  }

  if (phase.kind === 'paper') {
    return (
      <RedacaoPaperView
        theme={phase.theme}
        onSave={handleSave}
        onClose={() => setPhase({ kind: 'picker' })}
      />
    );
  }

  return (
    <RedacaoEditorView
      theme={phase.theme}
      isDevMode={isDevMode}
      onSave={handleSave}
      onClose={() => setPhase({ kind: 'picker' })}
    />
  );
};

export default RedacaoView;
