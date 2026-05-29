import React from 'react';
import { RedacaoTheme } from '../types';
import { AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import TabPageHeader from './TabPageHeader';

interface Props {
  theme: RedacaoTheme;
  onClose: () => void;
}

const RedacaoPaperView: React.FC<Props> = ({ theme, onClose }) => {
  const axisColor = AXIS_COLORS[theme.axis];

  return (
    <div className="space-y-4">
      <TabPageHeader
        icon="pencil"
        title="Modo papel"
        subtitle={`Texto de apoio · ${AXIS_LABELS[theme.axis]}`}
        accent="amber"
        action={
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Voltar"
          >
            <i className="fas fa-arrow-left text-xs" />
          </button>
        }
      />

      {/* Edge-to-edge on mobile (breaks out of the parent <main>'s p-4),
          contained on tablet+ */}
      <div className="-mx-4 md:mx-0">
        <article className="bg-white dark:bg-gray-900 border-y md:border md:rounded-2xl border-amber-100 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* Topic badge */}
          <div className="flex items-center gap-2 px-4 md:px-6 pt-4 pb-3">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
              style={{ background: axisColor }}
            >
              {AXIS_LABELS[theme.axis]}
            </span>
            {theme.year && (
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                ENEM {theme.year}
              </span>
            )}
          </div>

          {/* Full title (never truncated) */}
          <h1 className="px-4 md:px-6 text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 leading-tight">
            {theme.title}
          </h1>

          {/* Divider */}
          <div className="mx-4 md:mx-6 my-4 border-t border-amber-100 dark:border-gray-800" />

          {/* Support text — fills to the edges on mobile */}
          <div className="px-4 md:px-6 pb-6">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              <i className="fas fa-file-lines mr-1" /> Texto de apoio
            </p>
            {theme.context ? (
              <p className="text-[15px] md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {theme.context}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                Nenhum texto de apoio disponível para este tema.
              </p>
            )}
          </div>
        </article>
      </div>

      <p className="text-center text-[10px] text-amber-500 dark:text-amber-600 font-bold">
        Boa redação! ✏️
      </p>
    </div>
  );
};

export default RedacaoPaperView;
