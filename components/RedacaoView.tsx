import React, { useState } from 'react';
import { RedacaoTheme, RedacaoSession } from '../types';
import { isDevModeUser } from '../utils/devMode';
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

  if (phase.kind === 'picker') {
    return (
      <RedacaoSetupModal
        onStart={theme => setPhase({ kind: 'mode-picker', theme })}
      />
    );
  }

  if (phase.kind === 'mode-picker') {
    return (
      <>
        {/* Keep the picker visible behind the modal */}
        <RedacaoSetupModal onStart={theme => setPhase({ kind: 'mode-picker', theme })} />
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
        onSave={onSaveSession}
        onClose={() => setPhase({ kind: 'picker' })}
      />
    );
  }

  return (
    <RedacaoEditorView
      theme={phase.theme}
      isDevMode={isDevMode}
      onSave={onSaveSession}
      onClose={() => setPhase({ kind: 'picker' })}
    />
  );
};

export default RedacaoView;
