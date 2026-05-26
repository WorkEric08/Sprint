import { useState, useEffect } from 'react';
import { Subject } from '../types';
import { db } from '../db';

interface UseSubjectsReturn {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => Promise<void>;
  loading: boolean;
}

export function useSubjects(): UseSubjectsReturn {
  const [subjects, setSubjectsState] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.subjects.toArray()
      .then(data => {
        setSubjectsState(data);
      })
      .catch(e => {
        console.error('Failed to load subjects from IndexedDB', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setSubjects = async (newSubjects: Subject[]): Promise<void> => {
    try {
      await db.transaction('rw', db.subjects, async () => {
        await db.subjects.clear();
        await db.subjects.bulkPut(newSubjects);
      });
      setSubjectsState(newSubjects);
    } catch (e) {
      console.error('Failed to save subjects to IndexedDB', e);
    }
  };

  return { subjects, setSubjects, loading };
}
