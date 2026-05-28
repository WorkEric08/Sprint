
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Objective } from '../types';

interface Props {
  objective: Objective;
  onClose: () => void;
  onComplete: () => void;
}

const TimerView: React.FC<Props> = ({ objective, onClose, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(objective.duration * 60);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const totalSeconds = objective.duration * 60;
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0 && !showExitConfirm) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isFinished) {
      handleSuccess();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft, showExitConfirm, isFinished]);

  const handleSuccess = () => {
    setIsFinished(true);
    setIsActive(false);
    onComplete();
    // Delay para feedback visual de sucesso
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleManualExitAttempt = () => {
    setShowExitConfirm(true);
    // Pausar o timer enquanto decide
  };

  const confirmExit = () => {
    onClose(); // Fecha sem chamar onComplete
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (secondsLeft / totalSeconds) * 100;
  const strokeDasharray = 283; 
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 flex flex-col items-center justify-between px-8 pb-8 animate-in fade-in zoom-in duration-300"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2rem)' }}
    >
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: objective.color }}></div>
          <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{objective.title}</h2>
        </div>
        {!isFinished && !showExitConfirm && (
          <button 
            onClick={handleManualExitAttempt}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        )}
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center w-72 h-72">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            className="text-gray-100 dark:text-gray-900 stroke-current"
            strokeWidth="4"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="transition-all duration-1000 ease-linear"
            stroke={objective.color}
            strokeWidth="4"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isFinished ? (
            <div className="flex flex-col items-center animate-bounce">
              <i className="fas fa-check-circle text-6xl text-green-500 mb-2"></i>
              <span className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Concluído!</span>
            </div>
          ) : (
            <>
              <span className="text-6xl font-black text-gray-800 dark:text-white tabular-nums tracking-tighter">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-2">restantes</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4 pb-12">
        {!isFinished && (
          <>
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{ backgroundColor: objective.color, color: '#fff' }}
            >
              <i className={`fas ${isActive ? 'fa-pause' : 'fa-play'}`}></i>
              {isActive ? 'Pausar Sprint' : 'Retomar Sprint'}
            </button>
            <button 
              onClick={handleManualExitAttempt}
              className="w-full py-4 text-gray-400 dark:text-gray-600 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Finalizar Agora
            </button>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[70] bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Interromper Sprint?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Se você finalizar agora, este sprint será <span className="font-bold text-red-500">zerado</span> e não será contabilizado como concluído.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button 
                onClick={confirmExit}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Sim, finalizar sem salvar
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Não, continuar focado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decorative Element */}
      <div 
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: objective.color }}
      ></div>
    </div>,
    document.body
  );
};

export default TimerView;
