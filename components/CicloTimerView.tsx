
import React, { useState, useEffect, useRef } from 'react';
import { Subject } from '../types';
import { useBackButton } from '../hooks/useBackButton';

interface Props {
  subject: Subject;
  cycleIndex: number;
  cycleTotal: number;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
}

const CicloTimerView: React.FC<Props> = ({ subject, cycleIndex, cycleTotal, onClose, onComplete, onNext }) => {
  const [secondsLeft, setSecondsLeft] = useState(subject.duration * 60);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const totalSeconds = subject.duration * 60;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0 && !showExitConfirm) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isFinished) {
      setIsFinished(true);
      setIsActive(false);
      onComplete();
      setTimeout(onNext, 2000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, secondsLeft, showExitConfirm, isFinished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = (secondsLeft / totalSeconds) * 100;
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  useBackButton(() => {
    if (showExitConfirm) {
      setShowExitConfirm(false);
    } else {
      setShowExitConfirm(true);
    }
  }, !isFinished);

  const pixelsGained = subject.completedPixels.length;
  const pixelsLeft = subject.pixelCount - pixelsGained;

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 flex flex-col items-center justify-between p-8 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: subject.color }} />
          <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{subject.title}</h2>
        </div>
        <span className="text-xs font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">
          {cycleIndex + 1} / {cycleTotal}
        </span>
        {!isFinished && !showExitConfirm && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fas fa-times text-xl" />
          </button>
        )}
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-72 h-72">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle className="text-gray-100 dark:text-gray-900 stroke-current" strokeWidth="4" fill="transparent" r="45" cx="50" cy="50" />
            <circle
              className="transition-all duration-1000 ease-linear"
              stroke={subject.color}
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
                <i className="fas fa-check-circle text-6xl text-green-500 mb-2" />
                <span className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Pixel Ganho!</span>
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

        {/* Mini pixel progress */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(subject.pixelCount, 12) }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm transition-all"
                style={
                  i < Math.min(pixelsGained, 12)
                    ? { backgroundColor: subject.color }
                    : { backgroundColor: 'transparent', border: `1.5px solid ${subject.color}`, opacity: 0.3 }
                }
              />
            ))}
            {subject.pixelCount > 12 && (
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 self-center ml-1">
                +{subject.pixelCount - 12}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-600">
            {pixelsGained}/{subject.pixelCount}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-3 pb-12">
        {!isFinished && (
          <>
            <button
              onClick={() => setIsActive(!isActive)}
              className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{ backgroundColor: subject.color, color: '#fff' }}
            >
              <i className={`fas ${isActive ? 'fa-pause' : 'fa-play'}`} />
              {isActive ? 'Pausar' : 'Retomar'}
            </button>
            <button
              onClick={onNext}
              className="w-full py-4 text-gray-400 dark:text-gray-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-500 transition-colors"
            >
              {cycleIndex + 1 < cycleTotal ? 'Pular → Próxima Matéria' : 'Pular → Finalizar Ciclo'}
            </button>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-full py-3 text-gray-300 dark:text-gray-700 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              Encerrar Ciclo
            </button>
          </>
        )}
      </div>

      {/* Exit Confirm */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[70] bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <i className="fas fa-exclamation-triangle text-2xl" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Encerrar Ciclo?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                O tempo desta matéria <span className="font-bold text-red-500">não será contabilizado</span> como pixel concluído.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={onClose}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Sim, encerrar ciclo
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Continuar estudando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background decoration */}
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: subject.color }}
      />
    </div>
  );
};

export default CicloTimerView;
