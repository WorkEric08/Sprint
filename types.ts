
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Completion {
  timestamp: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  frequency: Frequency;
  targetCount: number;
  duration: number; // in minutes
  color: string;
  createdAt: number;
  completions: Completion[];
}

export interface UserStats {
  totalSprints: number;
  longestStreak: number;
  currentStreak: number;
}

export interface Subject {
  id: string;
  title: string;
  color: string;
  duration: number;   // minutes per block
  blockCount: number;
  completedBlocks: number[];
}

export type SprintQueueItem =
  | { id: string; type: 'study'; subjectId: string }
  | { id: string; type: 'break'; duration: number }

export type SprintResolvedItem =
  | { type: 'study'; subject: Subject }
  | { type: 'break'; duration: number }
