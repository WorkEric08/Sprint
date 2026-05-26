import React from 'react';
import { StreakState } from '../types';

interface Props {
  state: StreakState;
  userName: string;
  onDismiss: () => void;
}

/**
 * Exibido quando o usuário retorna após ausência ≥3 dias com histórico de estudo.
 *
 * COPY PRINCIPLE: acolhedor, sem culpa, sem referência ao que "perdeu".
 * Foco no que vem a seguir, não no que ficou pra trás.
 */
const WelcomeBackCard: React.FC<Props> = ({ state, userName, onDismiss }) => {
  const daysAbsent = state.lastStudyDate
    ? Math.round((Date.now() - new Date(state.lastStudyDate + 'T12:00:00').getTime()) / 86_400_000)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onDismiss} />

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 mb-2 animate-in slide-in-from-bottom-4 duration-300">
        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
          <i className="fas fa-hand-wave text-indigo-500 text-2xl" />
        </div>

        {/* Copy: acolhedora, sem culpa */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
            Bem-vindo de volta{userName ? `, ${userName.split(' ')[0]}` : ''}!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {daysAbsent && daysAbsent > 0
              ? `Faz ${daysAbsent} dia${daysAbsent > 1 ? 's' : ''} desde o último estudo. O importante é estar aqui agora.`
              : 'O importante é estar aqui. Vamos retomar onde paramos.'}
          </p>
          {state.longestStreak > 0 && (
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
              Seu recorde: {state.longestStreak} dias seguidos — ainda é seu.
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20"
        >
          Vamos estudar
        </button>

        <button
          onClick={onDismiss}
          className="w-full py-2 text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest"
        >
          Só estou olhando por agora
        </button>
      </div>
    </div>
  );
};

export default WelcomeBackCard;
