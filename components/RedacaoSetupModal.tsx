import React, { useState, useMemo } from 'react';
import { RedacaoTheme, RedacaoThemeAxis } from '../types';
import { REDACAO_THEMES, AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';

interface Props {
  onStart: (theme: RedacaoTheme) => void;
}

const RedacaoSetupModal: React.FC<Props> = ({ onStart }) => {
  const [selectedTheme, setSelectedTheme] = useState<RedacaoTheme | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<RedacaoThemeAxis | 'all'>('all');
  const [search, setSearch] = useState('');

  // Tópicos disponíveis (apenas os que possuem temas), com contagem.
  const axes = useMemo(() => {
    const counts = new Map<RedacaoThemeAxis, number>();
    REDACAO_THEMES.forEach(t => counts.set(t.axis, (counts.get(t.axis) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => AXIS_LABELS[a[0]].localeCompare(AXIS_LABELS[b[0]]))
      .map(([axis, count]) => ({ axis, count }));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REDACAO_THEMES.filter(t => {
      if (selectedAxis !== 'all' && t.axis !== selectedAxis) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [selectedAxis, search]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight md:text-xl">
          Praticar Redação
        </h2>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">
          90min · Auto-save · 5 competências
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tema…"
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700"
        />
      </div>

      {/* Filtro por tópico */}
      <div className="overflow-x-scroll-area flex gap-2 pb-1">
        <button
          onClick={() => setSelectedAxis('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            selectedAxis === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          Todos · {REDACAO_THEMES.length}
        </button>
        {axes.map(({ axis, count }) => {
          const active = selectedAxis === axis;
          const color = AXIS_COLORS[axis];
          return (
            <button
              key={axis}
              onClick={() => setSelectedAxis(axis)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                active ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
              style={active ? { backgroundColor: color } : {}}
            >
              {AXIS_LABELS[axis]} · {count}
            </button>
          );
        })}
      </div>

      {/* Theme list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm">Nenhum tema encontrado</div>
        )}
        {filtered.map(theme => {
          const isSelected = selectedTheme?.id === theme.id;
          const contextPreview = theme.context
            ? (isSelected ? theme.context : theme.context.slice(0, 130) + (theme.context.length > 130 ? '…' : ''))
            : null;
          return (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(isSelected ? null : theme)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5"
                    style={{ backgroundColor: AXIS_COLORS[theme.axis] + '20', color: AXIS_COLORS[theme.axis] }}
                  >
                    {AXIS_LABELS[theme.axis]}
                  </span>
                  <p className={`text-sm font-bold leading-snug ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {theme.title}
                  </p>
                  {contextPreview && (
                    <p className={`text-[11px] mt-2 leading-relaxed transition-all ${
                      isSelected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {contextPreview}
                    </p>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {isSelected && <i className="fas fa-check text-white text-[9px]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA — sticky no rodapé com fade-out gradiente para suavizar a transição */}
      <div className="sticky bottom-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-8 pb-3 pointer-events-none">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-950"
        />
        <div className="relative bg-gray-50/85 dark:bg-gray-950/85 backdrop-blur-md rounded-2xl pointer-events-auto">
          <button
            onClick={() => selectedTheme && onStart(selectedTheme)}
            disabled={!selectedTheme}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              selectedTheme
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700'
                : 'bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <i className={`fas ${selectedTheme ? 'fa-pen' : 'fa-hand-pointer'}`} />
            {selectedTheme ? 'Começar Redação · 90min' : 'Selecione um tema acima'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedacaoSetupModal;
