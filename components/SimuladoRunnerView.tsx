import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SimuladoTemplate } from '../types';
import { WakeLockManager } from '../utils/wakeLock';

interface Props {
  template: SimuladoTemplate;
  onFinish: (actualDurationMinutes: number, completed: boolean) => void;
}

// Milestone alerts (seconds remaining)
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
  if (secondsLeft <= 600) return '#ef4444';  // <10min → red
  if (secondsLeft <= 1800) return '#f59e0b'; // <30min → amber
  if (secondsLeft <= 3600) return '#6366f1'; // <1h → indigo
  return '#6366f1';                           // normal → indigo
}

const SimuladoRunnerView: React.FC<Props> = ({ template, onFinish }) => {
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

  // Activate Wake Lock on mount (silent — sem badge)
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

  // Sincroniza theme-color com o fundo escuro do simulado (corrige status bar no Android PWA)
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prev = meta?.getAttribute('content') ?? '#f9fafb';
    meta?.setAttribute('content', '#030712');
    return () => { meta?.setAttribute('content', prev); };
  }, []);

  // Timestamp-based countdown — survives tab switches
  useEffect(() => {
    if (isPaused || isFinished) return;

    const tick = () => {
      const elapsed = Date.now() - startedAtRef.current - totalPausedMsRef.current;
      const remaining = Math.max(0, totalSeconds * 1000 - elapsed);
      const secs = Math.ceil(remaining / 1000);
      setDisplaySeconds(secs);

      // Milestone detection
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

    tick(); // immediate
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
    const elapsed = Date.now() - startedAtRef.current - totalPausedMsRef.current;
    const actualMin = Math.round(elapsed / 60000);
    wakeLockRef.current.release();
    onFinish(actualMin, false);
  };

  const progress = ((totalSeconds - displaySeconds) / totalSeconds) * 100;
  const color = urgencyColor(displaySeconds);
  const strokeDasharray = 565; // 2π × r(90)
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-gray-950 flex flex-col items-center justify-between select-none">
      {/* Status bar — padding sobe até o limite do notch/status bar */}
      <div
        className="w-full flex items-center justify-between px-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)' }}
      >
        <div className="flex items-center gap-2">
          {template.strictMode && (
            <div className="flex items-center gap-1 bg-red-900/30 px-2.5 py-1 rounded-full">
              <i className="fas fa-lock text-red-400 text-[8px]" />
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Strict</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{template.name}</p>
        </div>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          <i className="fas fa-times text-xl" />
        </button>
      </div>

      {/* Main timer */}
      <div className="flex flex-col items-center gap-8">
        {/* Circle */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 absolute" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#1f2937" strokeWidth="6" />
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
          <div className="flex flex-col items-center gap-2 z-10">
            <span
              className="text-6xl font-black tabular-nums tracking-tighter leading-none"
              style={{ color }}
            >
              {formatHMS(displaySeconds)}
            </span>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              {isPaused ? 'Pausado' : 'restantes'}
            </span>
          </div>
        </div>

        {/* Areas */}
        {template.areas.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-xs">
            {template.areas.map(a => (
              <span
                key={a.name}
                className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: a.color + '20', color: a.color }}
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        {/* Progress text */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            {Math.round(progress)}% concluído
          </p>
          <p className="text-[10px] text-gray-700">
            Iniciado às {new Date(startedAtRef.current).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs px-4 pb-12 space-y-3">
        {!template.strictMode && (
          <button
            onClick={togglePause}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`} />
            {isPaused ? 'Retomar' : 'Pausar'}
          </button>
        )}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="w-full py-3 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:text-red-400 transition-colors"
        >
          Encerrar simulado
        </button>
      </div>

      {/* Milestone alert overlay */}
      {milestoneAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            <i className="fas fa-bell text-sm" />
            <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{milestoneAlert}</span>
          </div>
        </div>
      )}

      {/* Exit confirm */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm border border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Encerrar simulado?</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                O tempo decorrido será registrado como duração real. Você ainda poderá inserir o gabarito depois.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExit}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform"
              >
                Sim, encerrar
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-800 text-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Continuar simulado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default SimuladoRunnerView;
