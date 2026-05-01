
import React from 'react';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Header: React.FC<Props> = ({ theme, onToggleTheme }) => {
  return (
    <header className="bg-white dark:bg-gray-950 px-6 pt-8 pb-6 flex items-center justify-between sticky top-0 z-30 border-b border-transparent dark:border-gray-900">
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-[#5D5FEF] to-[#A559FF] rounded-[30%] flex items-center justify-center text-white text-[10px] shadow-sm">
            <i className="fas fa-bolt"></i>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
            SPRINT
          </h1>
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Eleve seu desenvolvimento</p>
      </div>
      <button 
        onClick={onToggleTheme}
        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all active:rotate-45 hover:text-indigo-500 dark:hover:text-indigo-400"
        aria-label="Alternar tema"
      >
        <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
      </button>
    </header>
  );
};

export default Header;
