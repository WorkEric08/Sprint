import Dexie, { Table } from 'dexie';
import { Subject, Objective, BlockLog, ErrorEntry, ReviewItem, SimuladoRecord, RedacaoSession, AchievementRecord } from './types';

interface SettingRecord {
  key: string;
  value: string;
}

class SprintDB extends Dexie {
  subjects!: Table<Subject>;
  objectives!: Table<Objective>;
  settings!: Table<SettingRecord>;
  blockLogs!: Table<BlockLog>;
  errorEntries!: Table<ErrorEntry>;
  reviewItems!: Table<ReviewItem>;
  simuladoRecords!: Table<SimuladoRecord>;
  redacaoSessions!: Table<RedacaoSession>;
  achievements!: Table<AchievementRecord>;

  constructor() {
    super('SprintDB');

    // v1 — core tables
    this.version(1).stores({
      subjects: 'id',
      objectives: 'id',
      settings: 'key',
    });

    // v2 — performance tracking
    this.version(2).stores({
      blockLogs: 'id, subjectId, timestamp',
      errorEntries: 'id, subjectId, blockLogId, timestamp',
    });

    // v3 — spaced repetition + block types
    // Compound index [subjectId+subtopic] prevents duplicate review items
    this.version(3)
      .stores({
        reviewItems: 'id, subjectId, [subjectId+subtopic], nextReviewAt, consolidated',
      })
      .upgrade(tx =>
        // Convert subjects.completedBlocks from number[] to CompletedBlock[]
        tx.table('subjects').toCollection().modify((subject: any) => {
          if (!Array.isArray(subject.completedBlocks)) return;
          if (subject.completedBlocks.length === 0) return;
          if (typeof subject.completedBlocks[0] === 'number') {
            subject.completedBlocks = subject.completedBlocks.map((ts: number) => ({
              timestamp: ts,
              type: 'study',
            }));
          }
        })
      );

    // v4 — simulados
    this.version(4).stores({
      simuladoRecords: 'id, completedAt, templateId',
    });

    // v5 — redação
    this.version(5).stores({
      redacaoSessions: 'id, completedAt, themeId',
    });

    // v6 — conquistas
    this.version(6).stores({
      achievements: 'id, unlockedAt',
    });
  }
}

export const db = new SprintDB();
