import Dexie, { Table } from 'dexie';
import { Subject, Objective } from './types';

interface SettingRecord {
  key: string;
  value: string;
}

class SprintDB extends Dexie {
  subjects!: Table<Subject>;
  objectives!: Table<Objective>;
  settings!: Table<SettingRecord>;

  constructor() {
    super('SprintDB');
    this.version(1).stores({
      subjects: 'id',
      objectives: 'id',
      settings: 'key',
    });
  }
}

export const db = new SprintDB();
