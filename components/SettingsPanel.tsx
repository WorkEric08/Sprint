import React, { useState, useRef } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { EDITAIS } from '../data/editais';
import DatePickerModal from './DatePickerModal';
import TabPageHeader from './TabPageHeader';
import { isDevModeUser } from '../utils/devMode';

const CUSTOM_KEY = 'sprint_custom_edital';
function getEditalName(id: string | null): string {
  if (!id) return 'Selecionar edital';
  if (id === 'custom') {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY);
      return stored ? JSON.parse(stored).name : 'Customizado';
    } catch { return 'Customizado'; }
  }
  return EDITAIS.find(e => e.id === id)?.name ?? 'Edital selecionado';
}

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUpdateStart: () => void;
  userName: string;
  onUserNameChange: (name: string) => void;
  // Fase 3
  selectedEditalId: string | null;
  examDate: string | null;
  onOpenEditalPicker: () => void;
  onSetExamDate: (date: string | null) => void;
  // Ofensiva
  streakEnabled: boolean;
  onSetStreakEnabled: (enabled: boolean) => Promise<void>;
}

type UpdateStatus = 'idle' | 'clearing' | 'reloading' | 'error';

const SettingsPanel: React.FC<Props> = ({
  theme, onToggleTheme, onUpdateStart, userName, onUserNameChange,
  selectedEditalId, examDate, onOpenEditalPicker, onSetExamDate,
  streakEnabled, onSetStreakEnabled,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [toast, setToast] = useState<{ msg: string; type: 'on' | 'off' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDevMode = isDevModeUser(userName);

  const handleNameChange = (name: string) => {
    const wasDevMode = isDevModeUser(userName);
    const nowDevMode = isDevModeUser(name);
    if (!wasDevMode && nowDevMode) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ msg: 'Modo desenvolvedor ativado', type: 'on' });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    } else if (wasDevMode && !nowDevMode) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ msg: 'Modo desenvolvedor desativado', type: 'off' });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
    onUserNameChange(name);
  };

  const commitHash = __BUILD_COMMIT_HASH__;
  const commitMsg = __BUILD_COMMIT_MSG__;

  const handleForceUpdate = async () => {
    onUpdateStart();
    setUpdateStatus('clearing');
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));

        const waiting = regs.map(r => r.waiting).find(Boolean);
        if (waiting) {
          await new Promise<void>((resolve) => {
            let done = false;
            const finish = () => { if (!done) { done = true; resolve(); } };
            navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
            setTimeout(finish, 2000);
            waiting.postMessage({ type: 'SKIP_WAITING' });
          });
        }
      }
      setUpdateStatus('reloading');
      sessionStorage.setItem('pwa-force-update', '1');
      await new Promise(r => setTimeout(r, 250));
      window.location.reload();
    } catch (e) {
      console.error('Falha ao atualizar:', e);
      sessionStorage.removeItem('pwa-force-update');
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  // Formata a data para exibição em pt-BR
  const formatExamDate = (date: string | null) => {
    if (!date) return 'Não definida';
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const installDisabled = isInstalled || isInstalling || !canInstall;

  return (
    <div className="space-y-6">
      <TabPageHeader
        icon="gear"
        title="Configurações"
        subtitle={userName ? `Perfil: ${userName}` : 'Personalize seu app'}
        accent="slate"
      />

      {/* Perfil + Aparência lado a lado no desktop */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Perfil */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Perfil
          </label>
          <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <i className="fas fa-user text-sm text-indigo-600 dark:text-indigo-400" />
            </div>
            <input
              type="text"
              value={userName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Seu nome"
              maxLength={30}
              className="flex-1 bg-transparent text-sm font-black text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal focus:outline-none"
            />
          </div>
        </div>

        {/* Aparência */}
        <div className="space-y-2">
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
      </div>

      {/* ── Fase 3: Edital + Data da prova ── */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Concurso / Prova
        </label>

        {/* Edital */}
        <button
          onClick={onOpenEditalPicker}
          className="w-full flex items-center justify-between p-3 rounded-2xl border bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <i className="fas fa-file-alt text-sm text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                {getEditalName(selectedEditalId)}
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                {selectedEditalId ? 'Toque para trocar' : 'Pré-popula matérias automaticamente'}
              </p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs" />
        </button>

        {/* Data da prova — abre DatePickerModal */}
        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl border bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <i className="fas fa-calendar-day text-sm text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">Data da prova</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                examDate
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {formatExamDate(examDate)}
              </p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs" />
        </button>

      </div>

      {/* ── Ofensiva ── */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Ofensiva
        </label>

        <div className={`rounded-2xl border p-4 transition-all ${
          streakEnabled
            ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            {/* Ícone */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              streakEnabled
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <i className={`fas fa-fire text-base transition-colors ${
                streakEnabled ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'
              }`} />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-black transition-colors ${
                streakEnabled ? 'text-orange-800 dark:text-orange-300' : 'text-gray-800 dark:text-gray-100'
              }`}>
                Sequência de dias
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                {streakEnabled
                  ? 'Streak, bônus e card de boas-vindas ativos'
                  : 'Oculto em toda a interface'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => onSetStreakEnabled(!streakEnabled)}
              className={`w-12 h-6 rounded-full transition-colors shrink-0 relative ${
                streakEnabled ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              aria-label={streakEnabled ? 'Desativar ofensiva' : 'Ativar ofensiva'}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                streakEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Nota quando desativado */}
          {!streakEnabled && (
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3 leading-relaxed animate-in fade-in duration-200">
              O registro de dias estudados continua acontecendo internamente.
              Ao reativar, sua sequência será recalculada normalmente.
            </p>
          )}
        </div>
      </div>

      {/* Aplicativo */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Aplicativo
        </label>
        <button
          onClick={install}
          disabled={installDisabled}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] ${
            isInstalled
              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 cursor-default'
              : !canInstall
              ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
              : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
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

      {/* Sistema — visível apenas em modo desenvolvedor */}
      {isDevMode && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Sistema
          </label>

          {/* Versão / último commit */}
          <div className="w-full flex items-center justify-between p-3 rounded-2xl border bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
                <i className="fas fa-code-branch text-sm text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                  {commitHash !== 'unknown' ? `Commit ${commitHash}` : 'Versão desconhecida'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
                  {commitHash !== 'unknown' ? commitMsg : 'Não disponível'}
                </p>
              </div>
            </div>
          </div>

          {/* Forçar atualização */}
          <button
            onClick={handleForceUpdate}
            disabled={updateStatus !== 'idle'}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
              updateStatus === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                : updateStatus !== 'idle'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30'
                : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
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
      )}

      {/* Toast de modo desenvolvedor */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl ${
            toast.type === 'on'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 dark:bg-gray-600 text-white'
          }`}>
            <i className={`fas ${toast.type === 'on' ? 'fa-terminal' : 'fa-times-circle'} text-xs`} />
            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              {toast.msg}
            </span>
          </div>
        </div>
      )}

      {/* DatePickerModal — centralizado com blur */}
      {showDatePicker && (
        <DatePickerModal
          value={examDate}
          onSelect={onSetExamDate}
          onClear={() => onSetExamDate(null)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
