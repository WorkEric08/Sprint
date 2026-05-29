import React, { useState } from 'react';
import { SimuladoTemplate } from '../types';
import { SIMULADO_TEMPLATES } from '../data/simuladoTemplates';
import TabPageHeader from './TabPageHeader';

interface Props {
  onStart: (template: SimuladoTemplate) => void;
}

const CUSTOM_DURATION_STEPS = [60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 480];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const SimuladoSetupModal: React.FC<Props> = ({ onStart }) => {
  const [selected, setSelected] = useState<SimuladoTemplate>(SIMULADO_TEMPLATES[0]);
  const [customDuration, setCustomDuration] = useState(180);
  const [customStrict, setCustomStrict] = useState(false);

  const isCustom = selected.id === 'custom';

  const finalTemplate: SimuladoTemplate = isCustom
    ? { ...selected, durationMinutes: customDuration, strictMode: customStrict }
    : selected;

  const handleStart = () => onStart(finalTemplate);

  const templates = SIMULADO_TEMPLATES.filter(t =>
    t.id === 'enem-dia1' || t.id === 'enem-dia2' || t.id === 'custom'
  );

  return (
    <div className="h-full flex flex-col">
      <TabPageHeader
        icon="stopwatch"
        title="Simulado"
        subtitle="Modo foco máximo"
        accent="indigo"
        className="flex items-center justify-between gap-4 mb-3"
      />

      {/* Templates + custom options — flex-1 so CTA stays at bottom */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Modelo
        </p>

        <div className="flex flex-col gap-2">
          {templates.map(t => {
            const isSel = selected.id === t.id;
            const areaLabels = t.areas.map(a => a.name.split(' ')[0]).join(' · ');
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isSel
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    isSel ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    {isSel && <i className="fas fa-check text-white text-[9px]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight truncate">
                      {t.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500">
                        {t.id === 'custom' ? 'Personalizado' : formatDuration(t.durationMinutes)}
                      </span>
                      {t.strictMode && (
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                          · Strict
                        </span>
                      )}
                      {t.hasRedacao && (
                        <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">
                          · Redação
                        </span>
                      )}
                      {areaLabels && (
                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 truncate">
                          · {areaLabels}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom options — compact, only when applicable */}
        {isCustom && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            {/* Duration row */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3">
              <button
                onClick={() => {
                  const idx = CUSTOM_DURATION_STEPS.indexOf(customDuration);
                  if (idx > 0) setCustomDuration(CUSTOM_DURATION_STEPS[idx - 1]);
                }}
                disabled={CUSTOM_DURATION_STEPS.indexOf(customDuration) === 0}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                aria-label="Diminuir duração"
              >
                <i className="fas fa-minus text-xs" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-none">Duração</p>
                <p className="text-xl font-black text-gray-800 dark:text-white leading-tight">
                  {formatDuration(customDuration)}
                </p>
              </div>
              <button
                onClick={() => {
                  const idx = CUSTOM_DURATION_STEPS.indexOf(customDuration);
                  if (idx < CUSTOM_DURATION_STEPS.length - 1) setCustomDuration(CUSTOM_DURATION_STEPS[idx + 1]);
                }}
                disabled={CUSTOM_DURATION_STEPS.indexOf(customDuration) === CUSTOM_DURATION_STEPS.length - 1}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-90 transition-transform"
                aria-label="Aumentar duração"
              >
                <i className="fas fa-plus text-xs" />
              </button>
            </div>

            {/* Strict mode toggle — compact switch row */}
            <button
              onClick={() => setCustomStrict(p => !p)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                customStrict
                  ? 'border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                customStrict ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <i className={`fas fa-lock text-xs ${customStrict ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className={`text-xs font-black uppercase tracking-tight ${customStrict ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Modo estrito
                </p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 leading-tight">
                  Sem pausas durante o simulado
                </p>
              </div>
              <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${customStrict ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${customStrict ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* CTA — always at the bottom */}
      <button
        onClick={handleStart}
        className="mt-3 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
      >
        <i className="fas fa-play" />
        Começar · {formatDuration(finalTemplate.durationMinutes)}
      </button>
    </div>
  );
};

export default SimuladoSetupModal;
