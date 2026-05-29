import React, { useState, useEffect, useRef } from 'react';
import { SimuladoTemplate } from '../types';
import { WakeLockManager } from '../utils/wakeLock';
import TabPageHeader from './TabPageHeader';

interface Props {
  template: SimuladoTemplate;
  onFinish: (actualDurationMinutes: number, completed: boolean) => void;
  isDevMode?: boolean;
}

const MILESTONES = [
  { seconds: 3600, label: 'Falta 1 hora' },
  { seconds: 1800, label: 'Faltam 30 minutos' },
  { seconds: 600,  label: 'Faltam 10 minutos' },
];

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function urgencyColor(secondsLeft: number): string {
  if (secondsLeft <= 600) return '#ef4444';
  if (secondsLeft <= 1800) return '#f59e0b';
  if (secondsLeft <= 3600) return '#6366f1';
  return '#6366f1';
}

const SimuladoRunnerView: React.FC<Props> = ({ template, onFinish, isDevMode }) => {
  const totalSeconds = template.durationMinutes * 60;
  const startedAtRef = useRef(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const triggeredMilestonesRef = useRef(new Set<number>());
  const wakeLockRef = useRef(new WakeLockManager());

  const [displaySeconds, setDisplaySeconds] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [milestoneAlert, setMilestoneAlert] = useState<string | null>(null);

  useEffect(() => {
    const wl = wakeLockRef.current;
    wl.request();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') wl.request();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wl.destroy();
    };
  }, []);

  useEffect(() => {
    if (isPaused || isFinished) return;
    const tick = () => {
      const elapsed = Date.now() - startedAtRef.current - totalPausedMsRef.current;
      const remaining = Math.max(0, totalSeconds * 1000 - elapsed);
      const secs = Math.ceil(remaining / 1000);
      setDisplaySeconds(secs);

      MILESTONES.forEach(m => {
        if (secs <= m.seconds && !triggeredMilestonesRef.current.has(m.seconds)) {
          triggeredMilestonesRef.current.add(m.seconds);
          setMilestoneAlert(m.label);
          setTimeout(() => setMilestoneAlert(null), 3000);
        }
      });

      if (remaining <= 0 && !isFinished) {
        setIsFinished(true);
        const actualMin = Math.round((Date.now() - startedAtRef.current - totalPausedMsRef.current) / 60000);
        wakeLockRef.current.release();
        onFinish(actualMin, true);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [isPaused, isFinished, totalSeconds, onFinish]);

  const togglePause = () => {
    if (template.strictMode) return;
    if (isPaused) {
      const pausedDuration = Date.now() - (pausedAtRef.current ?? Date.now());
      totalPausedMsRef.current += pausedDuration;
      pausedAtRef.current = null;
      setIsPaused(false);
    } else {
      pausedAtRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const handleExit = () => {
    wakeLockRef.current.release();
    if (isDevMode) {
      onFinish(template.durationMinutes, true);
      return;
    }
    const elapsed = Date.now() - startedAtRef.current - totalPausedMsRef.current;
    const actualMin = Math.round(elapsed / 60000);
    onFinish(actualMin, false);
  };

  const progress = ((totalSeconds - displaySeconds) / totalSeconds) * 100;
  const color = urgencyColor(displaySeconds);
  const strokeDasharray = 565;
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  return (
    <div className="h-full flex flex-col">
      <TabPageHeader
        icon="stopwatch"
        title={template.name}
        subtitle={`Iniciado às ${new Date(startedAtRef.current).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        accent="indigo"
        className="flex items-center justify-between gap-4 mb-3"
        action={template.strictMode ? (
          <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
            <i className="fas fa-lock text-red-500 text-[9px]" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Strict</span>
          </div>
        ) : undefined}
      />

      {/* Timer card — fills remaining space, centers contents */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 md:p-6 flex flex-col items-center justify-center gap-4 md:gap-6">
        {/* Responsive circle — caps at 320px, shrinks to fit available height */}
        <div
          className="relative flex items-center justify-center aspect-square"
          style={{ width: 'min(320px, 100%, 48vh)' }}
        >
          <svg className="w-full h-full -rotate-90 absolute" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
              style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
            />
          </svg>
          <div className="flex flex-col items-center gap-1 z-10">
            <span
              className="text-4xl md:text-5xl lg:text-6xl font-black tabular-nums tracking-tighter leading-none"
              style={{ color }}
            >
              {formatHMS(displaySeconds)}
            </span>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {isPaused ? 'Pausado' : 'restantes'}
            </span>
          </div>
        </div>

        {/* Areas + progress, compact */}
        <div className="flex flex-col items-center gap-2 w-full">
          {template.areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
              {template.areas.map(a => (
                <span
                  key={a.name}
                  className="text-[9px] md:text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: a.color + '20', color: a.color }}
                >
                  {a.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            {Math.round(progress)}% concluído
          </p>
        </div>
      </div>

      {/* Controls — pinned at bottom */}
      <div className="mt-3 flex flex-col gap-2 shrink-0">
        {!template.strictMode && (
          <button
            onClick={togglePause}
            className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`} />
            {isPaused ? 'Retomar' : 'Pausar'}
          </button>
        )}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="w-full py-2 text-gray-400 dark:text-gray-600 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          Encerrar simulado
        </button>
      </div>

      {milestoneAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            <i className="fas fa-bell text-sm" />
            <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{milestoneAlert}</span>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm border border-gray-100 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Encerrar simulado?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                {isDevMode
                  ? `Modo DEV: o simulado será registrado como concluído com a duração total (${template.durationMinutes}min).`
                  : 'O tempo decorrido será registrado como duração real. Você ainda poderá inserir o gabarito depois.'}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExit}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform hover:bg-red-600"
              >
                Sim, encerrar
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Continuar simulado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimuladoRunnerView;
