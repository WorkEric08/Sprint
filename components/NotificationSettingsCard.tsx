import React, { useState } from 'react';
import { NotificationSettings } from '../types';
import { requestNotificationPermission, getNotificationPermission } from '../services/notificationService';

interface Props {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
}

const NOTIF_ITEMS: {
  key: keyof Omit<NotificationSettings, 'enabled'>;
  icon: string;
  title: string;
  desc: string;
  optIn?: boolean;
}[] = [
  {
    key: 'morningReview',
    icon: 'fa-sun',
    title: 'Revisões da manhã',
    desc: 'Avisa quantas revisões estão pendentes hoje (só se houver)',
  },
  {
    key: 'eveningStreak',
    icon: 'fa-fire',
    title: 'Sequência no fim do dia',
    desc: 'Celebra os blocos feitos e motiva a continuar amanhã',
  },
  {
    key: 'weekendSimulado',
    icon: 'fa-stopwatch',
    title: 'Simulado no fim de semana',
    desc: 'Sugere simulado na sexta, se faz 7+ dias sem fazer um',
  },
  {
    key: 'examProximity',
    icon: 'fa-calendar-day',
    title: 'Proximidade da prova',
    desc: 'Alertas em marcos: 90, 60, 30, 14, 7, 3 e 1 dia(s) antes',
  },
  {
    key: 'streakRisk',
    icon: 'fa-triangle-exclamation',
    title: 'Sequência em risco',
    desc: 'Avisa após as 22h se você ainda não estudou (opt-in)',
    optIn: true,
  },
];

const NotificationSettingsCard: React.FC<Props> = ({ settings, onChange }) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const perm = await requestNotificationPermission();
    setPermission(perm);
    setRequesting(false);
    if (perm === 'granted') {
      onChange({ ...settings, enabled: true });
    }
  };

  const toggle = (key: keyof Omit<NotificationSettings, 'enabled'>) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  const toggleEnabled = () => {
    onChange({ ...settings, enabled: !settings.enabled });
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        Notificações
      </label>

      {/* Permission banner */}
      {permission !== 'granted' && (
        <div className={`rounded-2xl p-3.5 border flex items-center gap-3 ${
          permission === 'denied'
            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
        }`}>
          <i className={`fas ${permission === 'denied' ? 'fa-ban text-red-500' : 'fa-bell text-amber-500'} text-sm`} />
          <div className="flex-1">
            <p className="text-xs font-black text-gray-700 dark:text-gray-300">
              {permission === 'denied' ? 'Permissão negada pelo sistema' : 'Permissão de notificação necessária'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {permission === 'denied'
                ? 'Reative em Configurações do sistema → Notificações.'
                : 'Ative para receber lembretes contextuais.'}
            </p>
          </div>
          {permission !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              disabled={requesting}
              className="shrink-0 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-60"
            >
              {requesting ? '…' : 'Ativar'}
            </button>
          )}
        </div>
      )}

      {/* Master toggle */}
      <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          settings.enabled ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <i className={`fas fa-bell text-sm ${settings.enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-gray-800 dark:text-gray-100">Notificações ativas</p>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
            {settings.enabled ? 'Lembretes contextuais ligados' : 'Todas as notificações pausadas'}
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={permission !== 'granted'}
          className={`w-12 h-6 rounded-full transition-colors shrink-0 relative ${
            settings.enabled && permission === 'granted' ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
          } disabled:opacity-50`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
            settings.enabled && permission === 'granted' ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Individual toggles */}
      {settings.enabled && permission === 'granted' && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {NOTIF_ITEMS.map(item => (
            <div
              key={item.key}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                settings[item.key] ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-800'
              }`}>
                <i className={`fas ${item.icon} text-xs ${settings[item.key] ? 'text-indigo-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-gray-700 dark:text-gray-300">{item.title}</p>
                  {item.optIn && (
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                      Opt-in
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 dark:text-gray-600 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`w-10 h-5 rounded-full transition-colors shrink-0 relative ${
                  settings[item.key] ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}

          <p className="text-[9px] text-gray-400 dark:text-gray-600 px-1 leading-relaxed">
            Notificações disparam ao abrir o app. Sem servidor de push — não funcionam com o app completamente fechado.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsCard;
