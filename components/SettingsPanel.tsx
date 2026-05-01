import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { pwa } from '../services/pwa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type UpdateStatus = 'idle' | 'clearing' | 'reloading' | 'error';

const SettingsPanel: React.FC<Props> = ({ isOpen, onClose, theme, onToggleTheme }) => {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');

  const handleForceUpdate = async () => {
    setUpdateStatus('clearing');
    try {
      await pwa.forceUpdate();
      setUpdateStatus('reloading');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      console.error('Falha ao atualizar:', e);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  const installDisabled = isInstalled || isInstalling || !canInstall;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-400 border-t border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-2">
          <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        <div className="px-6 pb-10 pt-4 space-y-6 overflow-y-auto max-h-[75vh] no-scrollbar">
          {/* Aparência */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Aparência
            </label>
            <div className="bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-1 flex gap-1">
              <button
                onClick={() => theme === 'dark' && onToggleTheme()}
                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                <i className="fas fa-sun" />
                Claro
              </button>
              <button
                onClick={() => theme === 'light' && onToggleTheme()}
                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                <i className="fas fa-moon" />
                Escuro
              </button>
            </div>
          </div>

          {/* Aplicativo */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Aplicativo
            </label>
            <button
              onClick={install}
              disabled={installDisabled}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                isInstalled
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 cursor-default'
                  : !canInstall
                  ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isInstalled
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-indigo-100 dark:bg-indigo-900/30'
                }`}>
                  <i className={`fas ${
                    isInstalling ? 'fa-circle-notch fa-spin' : isInstalled ? 'fa-check' : 'fa-download'
                  } text-sm ${
                    isInstalled ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                    {isInstalled
                      ? 'App Instalado'
                      : isInstalling
                      ? 'Instalando...'
                      : canInstall
                      ? 'Instalar PWA'
                      : 'Instalação indisponível'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                    {isInstalled
                      ? 'Pronto para uso offline'
                      : canInstall
                      ? 'Adicionar à tela de início'
                      : 'Aguardando navegador habilitar'}
                  </p>
                </div>
              </div>
              {!isInstalled && !isInstalling && canInstall && (
                <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs" />
              )}
            </button>
          </div>

          {/* Sistema */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Sistema
            </label>
            <button
              onClick={handleForceUpdate}
              disabled={updateStatus !== 'idle'}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                updateStatus === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                  : updateStatus !== 'idle'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  updateStatus === 'error'
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : updateStatus !== 'idle'
                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <i className={`fas text-sm ${
                    updateStatus === 'error'
                      ? 'fa-exclamation-triangle text-red-500'
                      : updateStatus !== 'idle'
                      ? 'fa-circle-notch fa-spin text-indigo-600 dark:text-indigo-400'
                      : 'fa-cloud-arrow-down text-gray-500 dark:text-gray-400'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                    {updateStatus === 'idle' && 'Forçar Atualização'}
                    {updateStatus === 'clearing' && 'Limpando cache...'}
                    {updateStatus === 'reloading' && 'Aplicando atualização...'}
                    {updateStatus === 'error' && 'Falha na atualização'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                    {updateStatus === 'idle' && 'Busca o último deploy na Vercel'}
                    {updateStatus === 'clearing' && 'Removendo dados em cache...'}
                    {updateStatus === 'reloading' && 'Carregando nova versão...'}
                    {updateStatus === 'error' && 'Tente novamente mais tarde'}
                  </p>
                </div>
              </div>
              {updateStatus === 'idle' && (
                <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs" />
              )}
            </button>

            {(updateStatus === 'clearing' || updateStatus === 'reloading') && (
              <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: updateStatus === 'clearing' ? '50%' : '95%' }}
                  />
                </div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest shrink-0">
                  {updateStatus === 'clearing' ? '50%' : '95%'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
