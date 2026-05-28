import React, { useState } from 'react';
import { SimuladoTemplate, SimuladoRecord } from '../types';
import { isDevModeUser } from '../utils/devMode';
import SimuladoSetupModal from './SimuladoSetupModal';
import SimuladoRunnerView from './SimuladoRunnerView';
import PostSimuladoModal from './PostSimuladoModal';

interface Props {
  userName: string;
  onSaveRecord: (record: SimuladoRecord) => void;
}

type Phase =
  | { kind: 'picker' }
  | { kind: 'running'; template: SimuladoTemplate; startedAt: number }
  | { kind: 'post'; template: SimuladoTemplate; startedAt: number; actualMinutes: number; completed: boolean };

const SimuladoView: React.FC<Props> = ({ userName, onSaveRecord }) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'picker' });
  const isDevMode = isDevModeUser(userName);

  if (phase.kind === 'picker') {
    return (
      <SimuladoSetupModal
        onStart={template => setPhase({ kind: 'running', template, startedAt: Date.now() })}
      />
    );
  }

  if (phase.kind === 'running') {
    return (
      <SimuladoRunnerView
        template={phase.template}
        isDevMode={isDevMode}
        onFinish={(actualMinutes, completed) =>
          setPhase({
            kind: 'post',
            template: phase.template,
            startedAt: phase.startedAt,
            actualMinutes,
            completed,
          })
        }
      />
    );
  }

  // phase.kind === 'post' — overlay modal sobre a tela de picker
  return (
    <>
      <SimuladoSetupModal onStart={() => { /* bloqueado pelo modal sobreposto */ }} />
      <PostSimuladoModal
        template={phase.template}
        actualDurationMinutes={phase.actualMinutes}
        completed={phase.completed}
        startedAt={phase.startedAt}
        onSave={record => {
          onSaveRecord(record);
          setPhase({ kind: 'picker' });
        }}
        onSkip={() => setPhase({ kind: 'picker' })}
      />
    </>
  );
};

export default SimuladoView;
