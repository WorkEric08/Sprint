
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
