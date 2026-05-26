
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ── Feature 4 (Fase 2): Tipos de bloco ───────────────────────────────────

export type BlockType = 'study' | 'review' | 'questions';

export interface CompletedBlock {
  timestamp: number;
  type: BlockType;
}

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  study:     '#6366f1', // indigo — replaced by subject.color at render time
  review:    '#f59e0b', // amber
  questions: '#22c55e', // green
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  study:     'Estudo',
  review:    'Revisão',
  questions: 'Questões',
};

// ── Feature 1 (Fase 1): Modal pós-bloco ──────────────────────────────────

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
  blockType: BlockType;
}

// ── Feature 2 (Fase 1): Caderno de Erros ─────────────────────────────────

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

// ── Feature 1 (Fase 2): Revisão Espaçada ─────────────────────────────────
// Intervals in days: D+1, D+3, D+7, D+15, D+30, D+60

export const REVIEW_INTERVALS = [1, 3, 7, 15, 30, 60] as const;

export interface ReviewItem {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  subtopic: string;          // '(geral)' when empty
  createdAt: number;
  lastReviewedAt: number | null;
  nextReviewAt: number;      // midnight of due date (local TZ)
  intervalIndex: number;     // 0-5, index into REVIEW_INTERVALS
  consolidated: boolean;     // graduated after D+60
  reviewCount: number;
}

// ── Legacy / Objectives ───────────────────────────────────────────────────

export interface Completion {
  timestamp: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  frequency: Frequency;
  targetCount: number;
  duration: number;
  color: string;
  createdAt: number;
  completions: Completion[];
}

export interface UserStats {
  totalSprints: number;
  longestStreak: number;
  currentStreak: number;
}

// ── Subject ───────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  title: string;
  color: string;
  duration: number;   // minutes per block
  blockCount: number;
  completedBlocks: CompletedBlock[];  // was number[] — migrated in Dexie v3
}

// ── Sprint queue/runner ───────────────────────────────────────────────────

export type SprintQueueItem =
  | { id: string; type: 'study'; subjectId: string; blockType: BlockType }
  | { id: string; type: 'break'; duration: number }
  | { id: string; type: 'review-break'; duration: number; pendingSubtopics: string[] }

export type SprintResolvedItem =
  | { type: 'study'; subject: Subject; blockType: BlockType }
  | { type: 'break'; duration: number }
  | { type: 'review-break'; duration: number; pendingSubtopics: string[] }
