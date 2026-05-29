import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RedacaoTheme } from '../types';
import { AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import TabPageHeader from './TabPageHeader';

interface Props {
  theme: RedacaoTheme;
  onClose: () => void;
}

const TOTAL_MS = 90 * 60 * 1000;

function formatMS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const RedacaoPaperView: React.FC<Props> = ({ theme, onClose }) => {
  const axisColor = AXIS_COLORS[theme.axis];

  // --- Timer state ---
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [timeUp, setTimeUp] = useState(false);

  const liveElapsed = elapsedMs + (runningSince ? now - runningSince : 0);
  const remaining = Math.max(0, TOTAL_MS - liveElapsed);
  const isRunning = runningSince !== null;
  const hasStarted = elapsedMs > 0 || runningSince !== null;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && remaining <= 0 && !timeUp) {
      // Stop and signal time up
      setElapsedMs(TOTAL_MS);
      setRunningSince(null);
      setTimeUp(true);
    }
  }, [isRunning, remaining, timeUp]);

  const start = () => setRunningSince(Date.now());
  const pause = () => {
    if (!runningSince) return;
    setElapsedMs(prev => prev + (Date.now() - runningSince));
    setRunningSince(null);
  };
  const reset = () => {
    if (hasStarted && !window.confirm('Reiniciar o cronômetro de 90min?')) return;
    setElapsedMs(0);
    setRunningSince(null);
    setTimeUp(false);
  };

  // Color depending on remaining time
  const timerColor = remaining <= 10 * 60 * 1000 ? '#ef4444'
    : remaining <= 30 * 60 * 1000 ? '#f59e0b'
    : '#d97706'; // amber-600
  const progressPct = (liveElapsed / TOTAL_MS) * 100;

  return (
    <div className="space-y-4">
      <TabPageHeader
        icon="pencil"
        title="Modo papel"
        subtitle={`Texto de apoio · ${AXIS_LABELS[theme.axis]}`}
        accent="amber"
        action={
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Voltar"
          >
            <i className="fas fa-arrow-left text-xs" />
          </button>
        }
      />

      {/* --- Timer card (inline, prominent) ---
          Mobile: edge-to-edge, big numbers centered above controls
          Desktop: contained, time on left, controls on right
      */}
      <div className="-mx-4 md:mx-0">
        <div className="bg-white dark:bg-gray-900 border-y md:border md:rounded-2xl border-amber-200 dark:border-amber-900/40 shadow-sm overflow-hidden">
          {/* Progress strip */}
          <div className="h-1 bg-amber-100 dark:bg-amber-900/30">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: timerColor }}
            />
          </div>

          <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Time display */}
            <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-0.5">
                  {timeUp ? 'Tempo esgotado' : isRunning ? 'Cronômetro · 90min' : hasStarted ? 'Pausado' : 'Pronto para começar'}
                </p>
                <p
                  className="text-4xl md:text-5xl font-black tabular-nums leading-none"
                  style={{ color: timerColor }}
                >
                  {formatMS(remaining)}
                </p>
              </div>

              {/* Reset (mobile inline with time, right-aligned) */}
              {hasStarted && (
                <button
                  onClick={reset}
                  className="md:hidden w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90"
                  aria-label="Reiniciar"
                >
                  <i className="fas fa-rotate-left text-xs" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!timeUp && (
                isRunning ? (
                  <button
                    onClick={pause}
                    className="flex-1 md:flex-none px-5 py-3 md:py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-pause" />
                    Pausar
                  </button>
                ) : (
                  <button
                    onClick={start}
                    className="flex-1 md:flex-none px-5 py-3 md:py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-play" />
                    {hasStarted ? 'Continuar' : 'Iniciar'}
                  </button>
                )
              )}

              {/* Reset (desktop, alongside main control) */}
              {hasStarted && (
                <button
                  onClick={reset}
                  className="hidden md:flex w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 items-center justify-center active:scale-90"
                  aria-label="Reiniciar"
                  title="Reiniciar"
                >
                  <i className="fas fa-rotate-left text-xs" />
                </button>
              )}

              {timeUp && (
                <button
                  onClick={reset}
                  className="flex-1 md:flex-none px-5 py-3 md:py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-rotate-left" />
                  Reiniciar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="-mx-4 md:mx-0">
        <article className="bg-white dark:bg-gray-900 border-y md:border md:rounded-2xl border-amber-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 md:px-6 pt-4 pb-3">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
              style={{ background: axisColor }}
            >
              {AXIS_LABELS[theme.axis]}
            </span>
            {theme.year && (
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                ENEM {theme.year}
              </span>
            )}
          </div>

          <h1 className="px-4 md:px-6 text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 leading-tight">
            {theme.title}
          </h1>

          <div className="mx-4 md:mx-6 my-4 border-t border-amber-100 dark:border-gray-800" />

          <div className="px-4 md:px-6 pb-6">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              <i className="fas fa-file-lines mr-1" /> Texto de apoio
            </p>
            {theme.context ? (
              <p className="text-[15px] md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {theme.context}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                Nenhum texto de apoio disponível para este tema.
              </p>
            )}
          </div>
        </article>
      </div>

      <p className="text-center text-[10px] text-amber-500 dark:text-amber-600 font-bold pb-2">
        Boa redação! ✏️
      </p>

      {/* --- Floating mini-timer (mobile only, appears when running) ---
          Stays visible while user scrolls the support text. Tap to pause.
      */}
      {isRunning && createPortal(
        <button
          onClick={pause}
          className="md:hidden fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0)+5rem)] z-40 flex items-center gap-2 pl-3 pr-4 py-2 rounded-full shadow-xl active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ background: timerColor, color: 'white' }}
          aria-label="Pausar cronômetro"
        >
          <i className="fas fa-pause text-[10px]" />
          <span className="text-sm font-black tabular-nums tracking-wide">{formatMS(remaining)}</span>
        </button>,
        document.body
      )}

      {/* --- Time-up modal --- */}
      {timeUp && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full md:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 md:hidden" />
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-clock text-red-500 text-xl" />
            </div>
            <h3 className="text-base font-black text-gray-800 dark:text-gray-100 mb-1">Tempo esgotado</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Os 90 minutos da redação acabaram.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setTimeUp(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95"
              >
                Continuar lendo
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RedacaoPaperView;
