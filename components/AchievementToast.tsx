import React, { useEffect } from 'react';
import { AchievementId } from '../types';
import { ACHIEVEMENT_DEFS } from '../data/achievements';

interface Props {
  achievementId: AchievementId;
  onDismiss: () => void;
}

const AchievementToast: React.FC<Props> = ({ achievementId, onDismiss }) => {
  const def = ACHIEVEMENT_DEFS[achievementId];

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  if (!def) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-4 flex items-center gap-3 pointer-events-auto">
        {/* Icon — monochrome, sóbrio */}
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <i className={`fas ${def.icon} text-gray-600 dark:text-gray-400 text-base`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            Conquista
          </p>
          <p className="text-sm font-black text-gray-800 dark:text-gray-100 leading-tight">
            {def.title}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            {def.description}
          </p>
          {def.reward && (
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">
              {def.reward}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 active:scale-90 transition-transform"
        >
          <i className="fas fa-times text-[9px]" />
        </button>
      </div>
    </div>
  );
};

export default AchievementToast;
