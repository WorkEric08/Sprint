import { useState, useEffect, useCallback } from 'react';
import { SimuladoRecord } from '../types';
import { db } from '../db';

interface UseSimuladosReturn {
  records: SimuladoRecord[];
  loading: boolean;
  saveRecord: (record: SimuladoRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useSimulados(): UseSimuladosReturn {
  const [records, setRecords] = useState<SimuladoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const all = await db.simuladoRecords.orderBy('completedAt').reverse().toArray();
      setRecords(all);
    } catch (e) {
      console.error('Failed to load simulado records', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveRecord = async (record: SimuladoRecord): Promise<void> => {
    try {
      await db.simuladoRecords.put(record);
      setRecords(prev => {
        const without = prev.filter(r => r.id !== record.id);
        return [record, ...without].sort((a, b) => b.completedAt - a.completedAt);
      });
    } catch (e) {
      console.error('Failed to save simulado record', e);
    }
  };

  const deleteRecord = async (id: string): Promise<void> => {
    try {
      await db.simuladoRecords.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete simulado record', e);
    }
  };

  return { records, loading, saveRecord, deleteRecord, reload };
}
