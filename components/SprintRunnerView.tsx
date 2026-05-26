import React, { useState } from 'react';
import { Subject, SprintResolvedItem, PostBlockData } from '../types';
import CicloTimerView from './CicloTimerView';
import BreakTimerView from './BreakTimerView';
import { useBlockLogs } from '../hooks/useBlockLogs';

interface Props {
  items: SprintResolvedItem[];
  onBlockComplete: (subjectId: string) => void;
  onClose: () => void;
  isDevMode?: boolean;
}

const SprintRunnerView: React.FC<Props> = ({ items, onBlockComplete, onClose, isDevMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { saveBlockLog } = useBlockLogs();

  const advance = () => {
    const next = currentIndex + 1;
    if (next >= items.length) {
      onClose();
    } else {
      setCurrentIndex(next);
    }
  };

  const current = items[currentIndex];
  if (!current) return null;

  // Study blocks only — for progress counter
  const studyItems = items.filter((i): i is { type: 'study'; subject: Subject } => i.type === 'study');
  const studysSoFar = items.slice(0, currentIndex + 1).filter(i => i.type === 'study').length;

  // Breaks only — for break progress counter
  const breakItems = items.filter(i => i.type === 'break');
  const breaksSoFar = items.slice(0, currentIndex + 1).filter(i => i.type === 'break').length;

  // Next subject after current position (skip breaks)
  const nextSubject = items.slice(currentIndex + 1).find(
    (i): i is { type: 'study'; subject: Subject } => i.type === 'study'
  )?.subject ?? null;

  const handleBlockLogSave = (subject: Subject) => (data: PostBlockData) => {
    saveBlockLog(
      { id: subject.id, title: subject.title, color: subject.color },
      data
    );
  };

  if (current.type === 'break') {
    return (
      <BreakTimerView
        key={`break-${currentIndex}`}
        duration={current.duration}
        nextSubject={nextSubject}
        onComplete={advance}
        onSkip={advance}
        breakIndex={breaksSoFar}
        totalBreaks={breakItems.length}
      />
    );
  }

  return (
    <CicloTimerView
      key={`study-${currentIndex}-${current.subject.id}`}
      subject={current.subject}
      cycleIndex={studysSoFar - 1}
      cycleTotal={studyItems.length}
      onClose={onClose}
      onComplete={() => onBlockComplete(current.subject.id)}
      onNext={advance}
      onBlockLogSave={handleBlockLogSave(current.subject)}
      isDevMode={isDevMode}
    />
  );
};

export default SprintRunnerView;
