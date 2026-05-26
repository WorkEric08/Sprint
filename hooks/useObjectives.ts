import { useState, useEffect } from 'react';
import { Objective } from '../types';
import { db } from '../db';

interface UseObjectivesReturn {
  objectives: Objective[];
  setObjectives: (objectives: Objective[]) => Promise<void>;
  loading: boolean;
}

export function useObjectives(): UseObjectivesReturn {
  const [objectives, setObjectivesState] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.objectives.toArray()
      .then(data => {
        setObjectivesState(data);
      })
      .catch(e => {
        console.error('Failed to load objectives from IndexedDB', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setObjectives = async (newObjectives: Objective[]): Promise<void> => {
    try {
      await db.transaction('rw', db.objectives, async () => {
        await db.objectives.clear();
        await db.objectives.bulkPut(newObjectives);
      });
      setObjectivesState(newObjectives);
    } catch (e) {
      console.error('Failed to save objectives to IndexedDB', e);
    }
  };

  return { objectives, setObjectives, loading };
}
