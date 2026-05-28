import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RedacaoTheme, RedacaoThemeAxis } from '../types';
import { REDACAO_THEMES, AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import { useBackButton } from '../hooks/useBackButton';
import { useAnimatedClose } from '../hooks/useAnimatedClose';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  onStart: (theme: RedacaoTheme) => void;
  onClose: () => void;
}

const RedacaoSetupModal: React.FC<Props> = ({ onStart, onClose }) => {
  useSecondaryScreen();
  const { closing, handleClose } = useAnimatedClose(onClose);
  useBackButton(handleClose);
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

  // Sincroniza theme-color com o fundo do modal (corrige status bar no Android PWA)
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prev = meta?.getAttribute('content') ?? '#f9fafb';
    const isDark = document.documentElement.classList.contains('dark');
    meta?.setAttribute('content', isDark ? '#030712' : '#f9fafb');
    return () => { meta?.setAttribute('content', prev); };
  }, []);

  return createPortal(
    <div className={`fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-gray-950 ${closing ? 'animate-out fade-out slide-out-to-bottom-4 duration-[200ms]' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'}`}>
      {/* Header — padding absorve safe area do topo */}
      <div
        className="flex items-center gap-3 px-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }}
      >
        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90">
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div>
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Praticar Redação</h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">90min · Auto-save · 5 competências</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 shrink-0">
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
      </div>

      {/* Filtro por tópico */}
      <div className="overflow-x-scroll-area flex gap-2 px-4 pt-3 pb-1 shrink-0">
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
        <div className="w-4 shrink-0" />
      </div>

      {/* Theme list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
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

      {/* CTA */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <button
          onClick={() => selectedTheme && onStart(selectedTheme)}
          disabled={!selectedTheme}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
            selectedTheme
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <i className="fas fa-pen" />
          {selectedTheme ? 'Começar Redação · 90min' : 'Selecione um tema'}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default RedacaoSetupModal;
