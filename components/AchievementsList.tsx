import React from 'react';
import { AchievementRecord } from '../types';
import { ACHIEVEMENT_DEFS, ACHIEVEMENT_ORDER } from '../data/achievements';

interface Props {
  unlocked: AchievementRecord[];
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Conquistas ocultas: só aparecem após desbloqueadas.
 * NÃO mostra conquistas "trancadas" — evita gamificação forçada.
 */
const AchievementsList: React.FC<Props> = ({ unlocked }) => {
  const unlockedMap = new Map(unlocked.map(a => [a.id, a]));
  const unlockedItems = ACHIEVEMENT_ORDER
    .filter(id => unlockedMap.has(id))
    .map(id => ({ def: ACHIEVEMENT_DEFS[id], record: unlockedMap.get(id)! }));

  if (unlockedItems.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800/60">
        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Conquistas
        </p>
        <p className="text-sm font-black text-gray-700 dark:text-gray-300 mt-0.5">
          {unlockedItems.length} {unlockedItems.length === 1 ? 'conquistada' : 'conquistadas'}
        </p>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {unlockedItems.map(({ def, record }) => (
          <div key={def.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <i className={`fas ${def.icon} text-gray-600 dark:text-gray-400 text-sm`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">{def.title}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 leading-snug">{def.detail}</p>
              {def.reward && (
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">{def.reward}</p>
              )}
            </div>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 shrink-0 text-right">
              {formatDate(record.unlockedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsList;
