import Dexie, { Table } from 'dexie';
import { Subject, Objective, BlockLog, ErrorEntry } from './types';

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

  constructor() {
    super('SprintDB');
    this.version(1).stores({
      subjects: 'id',
      objectives: 'id',
      settings: 'key',
    });
    this.version(2).stores({
      blockLogs: 'id, subjectId, timestamp',
      errorEntries: 'id, subjectId, blockLogId, timestamp',
    });
  }
}

export const db = new SprintDB();
