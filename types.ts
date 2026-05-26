
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ── Feature 1: Modal pós-bloco ────────────────────────────────────────────

export interface PostBlockData {
  questionsTotal: number;
  questionsCorrect: number;
  subtopic: string;
  selfScore: 1 | 2 | 3 | 4 | 5;
  flaggedForReview: boolean;
}

export interface BlockLog {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  timestamp: number;
  questionsTotal: number;
  questionsCorrect: number;
  subtopic: string;
  selfScore: 1 | 2 | 3 | 4 | 5;
  flaggedForReview: boolean;
}

// ── Feature 2: Caderno de Erros ───────────────────────────────────────────

export interface ErrorEntry {
  id: string;
  blockLogId: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  subtopic: string;
  timestamp: number;
  questionsTotal: number;
  questionsCorrect: number;
  questionsWrong: number;
  note: string;
}

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
