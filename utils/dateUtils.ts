/**
 * Date utilities for the heatmap and streak calculation.
 * All operations use LOCAL timezone to avoid UTC drift issues.
 */

/** Returns a YYYY-MM-DD string for a given timestamp, in local time. */
export function toLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns a YYYY-MM-DD string for today (local). */
export function todayKey(): string {
  return toLocalDateKey(Date.now());
}

/**
 * Returns the Monday of the ISO week that contains `date` (local time).
 * Handles year boundaries correctly: Jan 1 of year N might belong to
 * week 52/53 of year N-1.
 */
export function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun, 1=Mon…6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generates the 52 Monday keys (YYYY-MM-DD) ending on the Monday of
 * the current week, going backwards. Returns them in ascending order
 * (oldest first → newest last).
 */
export function last52WeekMondays(): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonday = mondayOfWeek(today);

  const mondays: string[] = [];
  for (let i = 51; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - i * 7);
    mondays.push(toLocalDateKey(d.valueOf()));
  }
  return mondays;
}

/** Adds `days` calendar days to a YYYY-MM-DD key and returns the new key. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date.valueOf());
}

/** Difference in calendar days between two YYYY-MM-DD keys. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((db - da) / 86_400_000);
}

/**
 * Computes a tolerant streak (forgives 1 gap day per week of streak).
 *
 * Algorithm:
 * 1. Sort active day-keys descending (newest first).
 * 2. Walk backwards from today. A "gap" of 1 day is forgiven per
 *    7 consecutive days of streak built. Track a forgiveness token:
 *    starts at 0, earns +1 every 7 active days, can absorb 1 gap.
 * 3. Stop when gap > forgiveness budget or gap > 2 (hard cap).
 */
export function computeToleratedStreak(activeDayKeys: Set<string>): number {
  const today = todayKey();
  const yesterday = addDays(today, -1);

  // Must have activity today or yesterday to have an active streak
  if (!activeDayKeys.has(today) && !activeDayKeys.has(yesterday)) return 0;

  const sortedDesc = [...activeDayKeys].sort((a, b) => (a < b ? 1 : -1));

  let streak = 0;
  let forgiveness = 0; // available gap forgiveness tokens
  let cursor = today;

  for (const dayKey of sortedDesc) {
    const gap = daysBetween(dayKey, cursor);

    if (gap === 0) {
      // Same day (shouldn't happen with a Set, but handle gracefully)
      continue;
    }

    if (gap === 1) {
      // Consecutive day
      streak++;
      cursor = dayKey;
      // Earn a forgiveness token every 7 active days
      if (streak % 7 === 0) forgiveness++;
    } else if (gap === 2 && forgiveness > 0) {
      // One-day gap, forgiven
      forgiveness--;
      streak++;
      cursor = dayKey;
    } else {
      // Gap too large or no forgiveness — streak broken
      break;
    }
  }

  // Count the anchor day (today or yesterday) itself
  return streak + (activeDayKeys.has(cursor) ? 1 : 0);
}
