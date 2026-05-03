
import React from 'react';

interface Props {
  onOpenSettings: () => void;
}

const Header: React.FC<Props> = ({ onOpenSettings }) => {
  return (
    <header className="bg-white dark:bg-gray-950 px-6 pt-8 pb-6 flex items-center justify-end sticky top-0 z-30 border-b border-transparent dark:border-gray-900">
      <button
        onClick={onOpenSettings}
        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all hover:text-indigo-500 dark:hover:text-indigo-400 active:rotate-45"
        aria-label="Configurações"
      >
        <i className="fas fa-gear text-lg"></i>
      </button>
    </header>
  );
};

export default Header;
