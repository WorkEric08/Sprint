import React from 'react';

export type TabAccent = 'indigo' | 'amber' | 'violet' | 'slate';

interface Props {
  icon: string;          // FontAwesome class (sem o "fa-")
  title: string;
  subtitle?: string;
  accent?: TabAccent;
  action?: React.ReactNode;
}

const ACCENT_CLASSES: Record<TabAccent, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600 dark:text-amber-400'  },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  slate:  { bg: 'bg-gray-100 dark:bg-gray-800/60',    text: 'text-gray-600 dark:text-gray-400'    },
};

const TabPageHeader: React.FC<Props> = ({ icon, title, subtitle, accent = 'indigo', action }) => {
  const c = ACCENT_CLASSES[accent];
  return (
    <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl ${c.bg} flex items-center justify-center shrink-0`}>
          <i className={`fas fa-${icon} ${c.text} text-base md:text-lg`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default TabPageHeader;
