import { useState, useEffect, useCallback } from 'react';
import { ReviewItem } from '../types';
import { db } from '../db';
import {
  createReviewItem,
  resetReviewItem,
  applyReviewResult,
  isPendingNow,
  normalizeSubtopic,
} from '../utils/reviewAlgorithm';

interface UseReviewsReturn {
  reviewItems: ReviewItem[];
  pendingCount: number;
  createOrUpdateItem: (
    subject: { id: string; title: string; color: string },
    subtopic: string
  ) => Promise<void>;
  applyResult: (itemId: string, correct: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

export function useReviews(): UseReviewsReturn {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  const reload = useCallback(async () => {
    try {
      const items = await db.reviewItems
        .orderBy('nextReviewAt')
        .toArray();
      setReviewItems(items);
    } catch (e) {
      console.error('Failed to load review items', e);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Creates a new ReviewItem for the given subject+subtopic, OR:
   * - If an active (non-consolidated) item already exists → reset to D+1
   * - If a consolidated item exists → un-consolidate and reset to D+1
   */
  const createOrUpdateItem = async (
    subject: { id: string; title: string; color: string },
    subtopic: string
  ): Promise<void> => {
    const normalized = normalizeSubtopic(subtopic);
    try {
      // Check for existing item with same subject + subtopic
      const existing = await db.reviewItems
        .where('[subjectId+subtopic]')
        .equals([subject.id, normalized])
        .first();

      if (existing) {
        // Already exists — reset to D+1 (re-flagging means it still needs work)
        const updated = resetReviewItem(existing);
        await db.reviewItems.put(updated);
        setReviewItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const newItem = createReviewItem(subject, normalized);
        await db.reviewItems.put(newItem);
        setReviewItems(prev => [...prev, newItem].sort((a, b) => a.nextReviewAt - b.nextReviewAt));
      }
    } catch (e) {
      console.error('Failed to create/update review item', e);
    }
  };

  const applyResult = async (itemId: string, correct: boolean): Promise<void> => {
    try {
      const item = await db.reviewItems.get(itemId);
      if (!item) return;

      const updated = applyReviewResult(item, correct);
      await db.reviewItems.put(updated);
      setReviewItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (e) {
      console.error('Failed to apply review result', e);
    }
  };

  const pendingCount = reviewItems.filter(i => isPendingNow(i)).length;

  return { reviewItems, pendingCount, createOrUpdateItem, applyResult, reload };
}
