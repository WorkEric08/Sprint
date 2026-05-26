import { db } from '../db';
import { Subject, Objective, CompletedBlock } from '../types';

export async function runMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem('sprint_migrated_v1') === 'true') return;

  try {
    // Migrate subjects — write CompletedBlock[] (v3 format) directly
    const subjectsRaw = localStorage.getItem('sprint_ciclo_subjects');
    if (subjectsRaw) {
      const parsed = JSON.parse(subjectsRaw) as any[];
      const normalized: Subject[] = parsed.map(s => {
        const rawBlocks: any[] = s.completedBlocks ?? s.completedPixels ?? [];
        const completedBlocks: CompletedBlock[] = rawBlocks.map(b =>
          typeof b === 'number'
            ? { timestamp: b, type: 'study' as const }
            : { timestamp: b.timestamp ?? b, type: b.type ?? 'study' }
        );
        return {
          id: s.id,
          title: s.title,
          color: s.color,
          duration: s.duration,
          blockCount: s.blockCount ?? s.pixelCount ?? 20,
          completedBlocks,
        };
      });
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
  }
}
