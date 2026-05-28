import React, { useState } from 'react';
import { RedacaoTheme, RedacaoSession } from '../types';
import { isDevModeUser } from '../utils/devMode';
import RedacaoSetupModal from './RedacaoSetupModal';
import RedacaoEditorView from './RedacaoEditorView';

interface Props {
  userName: string;
  onSaveSession: (session: RedacaoSession) => void;
}

type Phase =
  | { kind: 'picker' }
  | { kind: 'editor'; theme: RedacaoTheme };

const RedacaoView: React.FC<Props> = ({ userName, onSaveSession }) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'picker' });
  const isDevMode = isDevModeUser(userName);

  if (phase.kind === 'picker') {
    return (
      <RedacaoSetupModal
        onStart={theme => setPhase({ kind: 'editor', theme })}
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
