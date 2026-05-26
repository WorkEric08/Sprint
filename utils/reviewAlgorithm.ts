/**
 * Spaced-repetition algorithm for Sprint.
 *
 * Intervals (days): D+1 → D+3 → D+7 → D+15 → D+30 → D+60 → Consolidado
 * intervalIndex 0-5 maps to REVIEW_INTERVALS[index].
 * intervalIndex 6 means consolidated (graduated).
 *
 * Rules:
 *   - Acertou → advance intervalIndex; if index reaches 6, mark consolidated
 *   - Errou   → reset to intervalIndex 0 (D+1)
 *   - Overdue → item stays in queue with visual warning; no state change until reviewed
 *
 * Edge cases handled:
 *   - Duplicate flag: existing active item for same subject+subtopic → reset to D+1
 *   - Empty subtopic: normalized to '(geral)'
 *   - Consolidated item re-flagged: un-consolidates and resets to D+1
 *   - nextReviewAt is always START OF LOCAL DAY (midnight), never mid-day
 */

import { ReviewItem, REVIEW_INTERVALS } from '../types';

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

/** Returns midnight (local time) of the day that is `daysAhead` days from `fromMs`. */
export function reviewDateAfterDays(fromMs: number, daysAhead: number): number {
  const d = new Date(fromMs);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Midnight of today in local time. */
export function todayMidnight(now: number = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Normalizes a subtopic string (trims, defaults to '(geral)' when blank). */
export function normalizeSubtopic(subtopic: string): string {
  const trimmed = subtopic.trim();
  return trimmed.length > 0 ? trimmed : '(geral)';
}

/** Creates a brand-new ReviewItem at interval index 0 (D+1). */
export function createReviewItem(
  subject: { id: string; title: string; color: string },
  subtopic: string,
  now: number = Date.now()
): ReviewItem {
  return {
    id: uid(),
    subjectId: subject.id,
    subjectTitle: subject.title,
    subjectColor: subject.color,
    subtopic: normalizeSubtopic(subtopic),
    createdAt: now,
    lastReviewedAt: null,
    nextReviewAt: reviewDateAfterDays(now, REVIEW_INTERVALS[0]),
    intervalIndex: 0,
    consolidated: false,
    reviewCount: 0,
  };
}

/**
 * Resets an existing ReviewItem to D+1.
 * Used when a user re-flags an already-active item, or after a wrong answer.
 */
export function resetReviewItem(item: ReviewItem, now: number = Date.now()): ReviewItem {
  return {
    ...item,
    intervalIndex: 0,
    lastReviewedAt: now,
    nextReviewAt: reviewDateAfterDays(now, REVIEW_INTERVALS[0]),
    consolidated: false,
    reviewCount: item.reviewCount + 1,
  };
}

/**
 * Applies a review result (correct=true → advance; correct=false → reset).
 * Returns the updated ReviewItem. Does NOT persist — caller handles DB write.
 */
export function applyReviewResult(
  item: ReviewItem,
  correct: boolean,
  now: number = Date.now()
): ReviewItem {
  if (!correct) {
    return resetReviewItem(item, now);
  }

  const nextIndex = item.intervalIndex + 1;

  if (nextIndex >= REVIEW_INTERVALS.length) {
    // Graduated — item is consolidated
    return {
      ...item,
      intervalIndex: nextIndex,
      lastReviewedAt: now,
      nextReviewAt: now, // irrelevant after consolidation
      consolidated: true,
      reviewCount: item.reviewCount + 1,
    };
  }

  return {
    ...item,
    intervalIndex: nextIndex,
    lastReviewedAt: now,
    nextReviewAt: reviewDateAfterDays(now, REVIEW_INTERVALS[nextIndex]),
    consolidated: false,
    reviewCount: item.reviewCount + 1,
  };
}

/** True if the item is due for review (due date has started, not consolidated). */
export function isPendingNow(item: ReviewItem, now: number = Date.now()): boolean {
  if (item.consolidated) return false;
  return item.nextReviewAt <= now;
}

/** True if the item was due on a PREVIOUS day (missed review). */
export function isOverdue(item: ReviewItem, now: number = Date.now()): boolean {
  if (item.consolidated) return false;
  return item.nextReviewAt < todayMidnight(now);
}

/** Human-readable current interval label, e.g. "D+7". */
export function currentIntervalLabel(item: ReviewItem): string {
  if (item.consolidated) return 'Consolidado';
  const days = REVIEW_INTERVALS[item.intervalIndex] ?? 1;
  return `D+${days}`;
}

/** Human-readable next interval label after a correct review. */
export function nextIntervalLabel(item: ReviewItem): string {
  if (item.consolidated) return '—';
  const nextIndex = item.intervalIndex + 1;
  if (nextIndex >= REVIEW_INTERVALS.length) return 'Consolidar';
  return `D+${REVIEW_INTERVALS[nextIndex]}`;
}

/** Days until the item is due (negative = overdue, 0 = today). */
export function daysUntilDue(item: ReviewItem, now: number = Date.now()): number {
  const today = todayMidnight(now);
  return Math.round((item.nextReviewAt - today) / 86_400_000);
}
