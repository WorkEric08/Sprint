import React from 'react';
import { RedacaoTheme } from '../types';
import { AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';

interface Props {
  theme: RedacaoTheme;
  onClose: () => void;
}

const RedacaoPaperView: React.FC<Props> = ({ theme, onClose }) => {
  const axisColor = AXIS_COLORS[theme.axis];

  return (
    <div className="min-h-screen flex flex-col bg-amber-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-amber-50/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-amber-100 dark:border-gray-800 px-3 py-3 flex items-center gap-2">
        <button
          onClick={onClose}
          className="w-9 h-9 shrink-0 rounded-full bg-white dark:bg-gray-800 border border-amber-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform shadow-sm"
          aria-label="Voltar"
        >
          <i className="fas fa-arrow-left text-xs" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 leading-none mb-0.5">
            Modo papel
          </p>
          {/* Title — wraps instead of truncating */}
          <p className="text-xs font-black text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
            {theme.title}
          </p>
        </div>

        <span
          className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
          style={{ background: axisColor }}
        >
          {AXIS_LABELS[theme.axis]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-4 w-full max-w-2xl mx-auto md:px-6 md:py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-100 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-50 dark:border-gray-800">
            <i className="fas fa-file-lines text-amber-500 text-sm" />
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Texto de apoio
            </p>
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
              style={{ background: axisColor }}
            >
              {AXIS_LABELS[theme.axis]}
            </span>
          </div>

          <div className="px-4 py-4 space-y-3 md:px-6">
            {/* Full title, never truncated */}
            <h1 className="text-base font-black text-gray-800 dark:text-gray-100 leading-snug">
              {theme.title}
            </h1>

            {theme.context ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {theme.context}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                Nenhum texto de apoio disponível para este tema.
              </p>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-amber-500 dark:text-amber-600 font-bold">
          Boa redação! ✏️
        </p>
      </div>
    </div>
  );
};

export default RedacaoPaperView;
