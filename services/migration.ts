import { db } from '../db';
import { Subject, Objective } from '../types';

export async function runMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem('sprint_migrated_v1') === 'true') return;

  try {
    // Migrate subjects
    const subjectsRaw = localStorage.getItem('sprint_ciclo_subjects');
    if (subjectsRaw) {
      const parsed = JSON.parse(subjectsRaw) as any[];
      const normalized: Subject[] = parsed.map(s => ({
        id: s.id,
        title: s.title,
        color: s.color,
        duration: s.duration,
        blockCount: s.blockCount ?? s.pixelCount ?? 20,
        completedBlocks: s.completedBlocks ?? s.completedPixels ?? [],
      }));
      await db.subjects.bulkPut(normalized);
    }

    // Migrate objectives
    const objectivesRaw = localStorage.getItem('sprint_objectives');
    if (objectivesRaw) {
      const objectives = JSON.parse(objectivesRaw) as Objective[];
      await db.objectives.bulkPut(objectives);
    }

    // Migrate user name
    const userName = localStorage.getItem('sprint_user_name');
    if (userName) {
      await db.settings.put({ key: 'user_name', value: userName });
    }

    // Migrate theme
    const theme = localStorage.getItem('sprint_theme');
    if (theme === 'light' || theme === 'dark') {
      await db.settings.put({ key: 'theme', value: theme });
    }

    localStorage.setItem('sprint_migrated_v1', 'true');
  } catch (e) {
    console.error('Sprint migration failed', e);
    // Flag not set — will retry on next app open
  }
}
