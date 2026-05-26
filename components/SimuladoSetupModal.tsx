import React, { useState } from 'react';
import { SimuladoTemplate } from '../types';
import { SIMULADO_TEMPLATES } from '../data/simuladoTemplates';

interface Props {
  onStart: (template: SimuladoTemplate) => void;
  onClose: () => void;
}

const CUSTOM_DURATION_STEPS = [60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 480];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const SimuladoSetupModal: React.FC<Props> = ({ onStart, onClose }) => {
  const [selected, setSelected] = useState<SimuladoTemplate>(SIMULADO_TEMPLATES[0]);
  const [customDuration, setCustomDuration] = useState(180);
  const [customStrict, setCustomStrict] = useState(false);

  const isCustom = selected.id === 'custom';

  const finalTemplate: SimuladoTemplate = isCustom
    ? { ...selected, durationMinutes: customDuration, strictMode: customStrict }
    : selected;

  const handleStart = () => onStart(finalTemplate);

  const templates = SIMULADO_TEMPLATES;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div>
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
            Iniciar Simulado
          </h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            Modo foco máximo · Wake Lock ativo
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Template selection */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Modelo
          </p>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                selected.id === t.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight">
                    {t.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600">
                      {t.id === 'custom' ? 'Duração personalizada' : formatDuration(t.durationMinutes)}
                    </span>
                    {t.strictMode && (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                        Strict
                      </span>
                    )}
                    {t.hasRedacao && (
                      <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
                        Redação
                      </span>
                    )}
                  </div>
                  {t.areas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.areas.map(a => (
                        <span
                          key={a.name}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: a.color + '20', color: a.color }}
                        >
                          {a.name}{a.questionCount ? ` (${a.questionCount}q)` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                  selected.id === t.id
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {selected.id === t.id && <i className="fas fa-check text-white text-[9px]" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom options */}
        {isCustom && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Duração
            </p>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
              <button
                onClick={() => {
                  const idx = CUSTOM_DURATION_STEPS.indexOf(customDuration);
                  if (idx > 0) setCustomDuration(CUSTOM_DURATION_STEPS[idx - 1]);
                }}
                disabled={CUSTOM_DURATION_STEPS.indexOf(customDuration) === 0}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
              >
                <i className="fas fa-minus text-sm" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-3xl font-black text-gray-800 dark:text-white">
                  {formatDuration(customDuration)}
                </p>
              </div>
              <button
                onClick={() => {
                  const idx = CUSTOM_DURATION_STEPS.indexOf(customDuration);
                  if (idx < CUSTOM_DURATION_STEPS.length - 1) setCustomDuration(CUSTOM_DURATION_STEPS[idx + 1]);
                }}
                disabled={CUSTOM_DURATION_STEPS.indexOf(customDuration) === CUSTOM_DURATION_STEPS.length - 1}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
              >
                <i className="fas fa-plus text-sm" />
              </button>
            </div>

            {/* Strict mode toggle */}
            <button
              onClick={() => setCustomStrict(p => !p)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                customStrict
                  ? 'border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                customStrict ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <i className={`fas fa-lock text-sm ${customStrict ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-black uppercase tracking-tight ${customStrict ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Modo estrito {customStrict ? '(ativo)' : '(desativado)'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-0.5">
                  Sem pausas durante o simulado
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Wake Lock info */}
        <div className="flex items-center gap-2 px-1">
          <i className="fas fa-mobile-screen text-indigo-400 text-xs" />
          <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
            Wake Lock ativado automaticamente para impedir tela apagar. Teste em dispositivo real.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <button
          onClick={handleStart}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <i className="fas fa-play" />
          Começar Simulado · {formatDuration(finalTemplate.durationMinutes)}
        </button>
      </div>
    </div>
  );
};

export default SimuladoSetupModal;
