import React, { useState } from 'react';
import { Subject, SprintResolvedItem, PostBlockData, BlockType } from '../types';
import CicloTimerView from './CicloTimerView';
import BreakTimerView from './BreakTimerView';
import ReviewBreakTimerView from './ReviewBreakTimerView';
import { useBlockLogs } from '../hooks/useBlockLogs';
import { useReviews } from '../hooks/useReviews';

interface Props {
  items: SprintResolvedItem[];
  onBlockComplete: (subjectId: string, blockType: BlockType) => void;
  onClose: () => void;
  isDevMode?: boolean;
}

const SprintRunnerView: React.FC<Props> = ({ items, onBlockComplete, onClose, isDevMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { saveBlockLog } = useBlockLogs();
  const { createOrUpdateItem } = useReviews();

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

  const studyItems = items.filter((i): i is { type: 'study'; subject: Subject; blockType: BlockType } => i.type === 'study');
  const studysSoFar = items.slice(0, currentIndex + 1).filter(i => i.type === 'study').length;

  const breakItems = items.filter(i => i.type === 'break' || i.type === 'review-break');
  const breaksSoFar = items.slice(0, currentIndex + 1).filter(i => i.type === 'break' || i.type === 'review-break').length;

  const nextSubject = items.slice(currentIndex + 1).find(
    (i): i is { type: 'study'; subject: Subject; blockType: BlockType } => i.type === 'study'
  )?.subject ?? null;

  const handleBlockLogSave = (subject: Subject, blockType: BlockType) => (data: PostBlockData) => {
    saveBlockLog({ id: subject.id, title: subject.title, color: subject.color }, { ...data, blockType });

    // Feature 1 (Fase 2): create/update review item when flagged
    if (data.flaggedForReview) {
      createOrUpdateItem(
        { id: subject.id, title: subject.title, color: subject.color },
        data.subtopic
      );
    }
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

  if (current.type === 'review-break') {
    return (
      <ReviewBreakTimerView
        key={`review-break-${currentIndex}`}
        duration={current.duration}
        pendingSubtopics={current.pendingSubtopics}
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
      blockType={current.blockType}
      cycleIndex={studysSoFar - 1}
      cycleTotal={studyItems.length}
      onClose={onClose}
      onComplete={() => onBlockComplete(current.subject.id, current.blockType)}
      onNext={advance}
      onBlockLogSave={handleBlockLogSave(current.subject, current.blockType)}
      isDevMode={isDevMode}
    />
  );
};

export default SprintRunnerView;
