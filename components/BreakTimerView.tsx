import React, { useState, useEffect, useRef } from 'react';
import { Subject } from '../types';
import { useBackButton } from '../hooks/useBackButton';

interface Props {
  duration: number;      // minutes
  nextSubject: Subject | null;
  onComplete: () => void;
  onSkip: () => void;
  breakIndex: number;    // for progress display
  totalBreaks: number;
}

const BreakTimerView: React.FC<Props> = ({ duration, nextSubject, onComplete, onSkip, breakIndex, totalBreaks }) => {
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const totalSeconds = duration * 60;
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useBackButton(onSkip);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!doneRef.current) { doneRef.current = true; setTimeout(onComplete, 600); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 flex flex-col items-center justify-between p-8 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fas fa-mug-hot text-gray-400 dark:text-gray-600 text-sm" />
          <span className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Intervalo
          </span>
        </div>
        <span className="text-xs font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">
          Pausa {breakIndex} / {totalBreaks}
        </span>
        <button
          onClick={onSkip}
          className="text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          <i className="fas fa-times text-xl" />
        </button>
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-72 h-72">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="stroke-current text-gray-100 dark:text-gray-900"
              strokeWidth="4" fill="transparent" r="45" cx="50" cy="50"
            />
            <circle
              className="transition-all duration-1000 ease-linear"
              stroke="#6366f1"
              strokeWidth="4"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r="45" cx="50" cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-6xl font-black text-gray-800 dark:text-white tabular-nums tracking-tighter">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              descanso
            </span>
          </div>
        </div>

        {/* Next up pill */}
        {nextSubject ? (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              A seguir
            </span>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: nextSubject.color }} />
            <span className="text-[11px] font-black uppercase tracking-tight" style={{ color: nextSubject.color }}>
              {nextSubject.title}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-600">
              {nextSubject.duration}min
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
            <i className="fas fa-flag-checkered text-green-500 text-xs" />
            <span className="text-[11px] font-black text-green-500 uppercase tracking-tight">
              Último intervalo
            </span>
          </div>
        )}
      </div>

      {/* Skip button */}
      <div className="w-full max-w-xs space-y-3 pb-12">
        <button
          onClick={onSkip}
          className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <i className="fas fa-forward" />
          Pular Intervalo
        </button>
      </div>

      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none bg-indigo-500" />
    </div>
  );
};

export default BreakTimerView;
