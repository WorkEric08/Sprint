import React from 'react';
import { createPortal } from 'react-dom';
import { RedacaoTheme } from '../types';

interface Props {
  theme: RedacaoTheme;
  onChooseDigital: () => void;
  onChoosePaper: () => void;
  onBack: () => void;
}

const RedacaoModeModal: React.FC<Props> = ({ theme, onChooseDigital, onChoosePaper, onBack }) => {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onBack} />

      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1.5 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <i className="fas fa-chevron-left text-[8px]" />
            Trocar tema
          </button>

          <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-1">Tema selecionado</p>
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 leading-snug">{theme.title}</h2>
        </div>

        <div className="px-6 pb-2">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3">
            Como vai fazer a redação?
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-8 flex flex-col gap-3">
          <button
            onClick={onChooseDigital}
            className="w-full flex items-center gap-4 p-4 bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-200 dark:border-violet-800 rounded-2xl text-left hover:border-violet-400 dark:hover:border-violet-600 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 shrink-0 bg-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-laptop text-white text-lg" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">Escrever aqui</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Editor com cronômetro de 90min, auto-save e checklist das competências
              </p>
            </div>
            <i className="fas fa-chevron-right text-violet-400 text-xs ml-auto shrink-0" />
          </button>

          <button
            onClick={onChoosePaper}
            className="w-full flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-2xl text-left hover:border-amber-400 dark:hover:border-amber-600 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 shrink-0 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-pencil text-white text-lg" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">Escrever no papel</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Exibe o texto de apoio do tema para você consultar enquanto escreve à mão
              </p>
            </div>
            <i className="fas fa-chevron-right text-amber-400 text-xs ml-auto shrink-0" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RedacaoModeModal;
