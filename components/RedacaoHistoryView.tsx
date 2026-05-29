import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { RedacaoSession } from '../types';
import { REDACAO_THEMES, AXIS_LABELS, AXIS_COLORS } from '../data/redacaoThemes';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useBackButton } from '../hooks/useBackButton';
import { useAnimatedClose } from '../hooks/useAnimatedClose';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  sessions: RedacaoSession[];
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const COMPETENCY_LABELS: Record<'c1'|'c2'|'c3'|'c4'|'c5', string> = {
  c1: 'Norma culta',
  c2: 'Compreensão',
  c3: 'Argumentação',
  c4: 'Coesão',
  c5: 'Proposta',
};

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

const RedacaoHistoryView: React.FC<Props> = ({ sessions, onDelete, onClose }) => {
  useSecondaryScreen();
  const { closing, handleClose } = useAnimatedClose(onClose);
  useBackButton(handleClose);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Apenas sessões realmente concluídas com nota
  const completed = useMemo(
    () => sessions.filter(s => s.completedAt !== null && s.estimatedScore !== null),
    [sessions]
  );

  const chartData = useMemo(() => {
    return [...completed]
      .reverse()
      .filter(s => s.estimatedScore !== null)
      .map(s => ({
        date: formatShortDate(s.completedAt ?? s.startedAt),
        score: s.estimatedScore as number,
      }));
  }, [completed]);

  const { recentAvg, prevAvg, best } = useMemo(() => {
    const withScore = completed.map(s => s.estimatedScore as number);
    if (withScore.length === 0) return { recentAvg: null, prevAvg: null, best: null };
    const last3 = withScore.slice(0, 3);
    const prev  = withScore.slice(3);
    return {
      recentAvg: Math.round(last3.reduce((a, s) => a + s, 0) / last3.length),
      prevAvg:   prev.length ? Math.round(prev.reduce((a, s) => a + s, 0) / prev.length) : null,
      best:      Math.max(...withScore),
    };
  }, [completed]);

  const themeMap = useMemo(() => {
    const m = new Map<string, typeof REDACAO_THEMES[number]>();
    REDACAO_THEMES.forEach(t => m.set(t.id, t));
    return m;
  }, []);

  return createPortal(
    <div className={`fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-950 flex flex-col ${closing ? 'animate-out fade-out slide-out-to-bottom-4 duration-[200ms]' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 safe-top border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div>
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Histórico de Redações</h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            {sessions.length} {sessions.length === 1 ? 'redação' : 'redações'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <i className="fas fa-pen text-gray-300 dark:text-gray-600 text-xl" />
            </div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Nenhuma redação realizada
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[220px] leading-relaxed">
              Escreva sua primeira redação pela tela Redação para ver o histórico aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            {recentAvg !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Média (últimas 3)</p>
                  <p className="text-3xl font-black text-violet-600 dark:text-violet-400 mt-1">{recentAvg}</p>
                  {prevAvg !== null ? (
                    <p className={`text-[10px] font-bold mt-1 ${recentAvg > prevAvg ? 'text-green-500' : recentAvg < prevAvg ? 'text-red-500' : 'text-gray-400'}`}>
                      {recentAvg > prevAvg ? '↑' : recentAvg < prevAvg ? '↓' : '→'} vs {prevAvg} anteriores
                    </p>
                  ) : (
                    <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">de 1000</p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Melhor nota</p>
                  <p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{best}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">de 1000</p>
                </div>
              </div>
            )}

            {/* Line chart */}
            {chartData.length > 1 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Evolução</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <YAxis domain={[0, 1000]} tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 11 }}
                      formatter={(v: number) => [`${v}`, 'Nota']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Linha do tempo</p>
              {sessions.map(s => {
                const isExpanded = expanded === s.id;
                const theme = themeMap.get(s.themeId);
                const axisLabel = theme ? AXIS_LABELS[theme.axis] : null;
                const axisColor = theme ? AXIS_COLORS[theme.axis] : '#6b7280';
                const isPaper = (s.notes ?? '').startsWith('[Modo papel]');
                const isDraft = s.completedAt === null;
                const score = s.estimatedScore;
                const refDate = s.completedAt ?? s.startedAt;
                return (
                  <div key={s.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Header row: expand button + delete */}
                    <div className="flex items-stretch">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : s.id)}
                        className="flex-1 p-4 text-left flex items-center gap-4 min-w-0"
                      >
                        {/* Date */}
                        <div className="text-center shrink-0 w-12">
                          <p className="text-xs font-black text-gray-800 dark:text-gray-100">
                            {new Date(refDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-600">
                            {new Date(refDate).getFullYear()}
                          </p>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                            {s.themeTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {axisLabel && (
                              <span
                                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: axisColor + '20', color: axisColor }}
                              >
                                {axisLabel}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 dark:text-gray-600">{formatDuration(s.durationMinutes)}</span>
                            {isPaper && (
                              <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Papel
                              </span>
                            )}
                            {isDraft && (
                              <span className="text-[9px] font-black text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Rascunho
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Score */}
                        <div className="text-right shrink-0">
                          {score !== null ? (
                            <>
                              <p className="text-xl font-black" style={{ color: score >= 600 ? '#22c55e' : score >= 400 ? '#f59e0b' : '#ef4444' }}>
                                {score}
                              </p>
                              <p className="text-[9px] text-gray-400 dark:text-gray-600">de 1000</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-300 dark:text-gray-700">sem nota</p>
                          )}
                        </div>
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] text-gray-300 dark:text-gray-700 shrink-0`} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDelete(s.id)}
                        className="px-3 flex items-center justify-center border-l border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shrink-0"
                        title="Excluir redação"
                      >
                        <i className="fas fa-trash text-[11px]" />
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-50 dark:border-gray-800/60 px-4 pb-4 pt-3 space-y-3 animate-in fade-in duration-200">
                        {/* 5 Competencies breakdown */}
                        {s.competencyScores ? (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                              Auto-avaliação · 5 competências
                            </p>
                            {(['c1','c2','c3','c4','c5'] as const).map(k => {
                              const val = s.competencyScores![k];
                              const pct = (val / 200) * 100;
                              const color = val >= 120 ? '#22c55e' : val >= 80 ? '#f59e0b' : '#ef4444';
                              return (
                                <div key={k}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-black text-violet-500">{k.toUpperCase()}</span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{COMPETENCY_LABELS[k]}</span>
                                    </div>
                                    <span className="text-xs font-black" style={{ color }}>
                                      {val}/200
                                    </span>
                                  </div>
                                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-6">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 dark:text-gray-600 italic">
                            Sem auto-avaliação registrada para esta sessão.
                          </p>
                        )}

                        {/* Word count / mode */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-1">
                          {!isPaper && (
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-align-left text-[9px] text-violet-500" />
                              {s.wordCount} palavras
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-clock text-[9px] text-violet-500" />
                            {formatDuration(s.durationMinutes)}
                          </span>
                        </div>

                        {/* Notes (strip [Modo papel] prefix when present) */}
                        {(() => {
                          const raw = s.notes ?? '';
                          const cleaned = isPaper
                            ? raw.replace(/^\[Modo papel\]\s*/, '').trim()
                            : raw.trim();
                          if (!cleaned) return null;
                          return (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed border-l-2 border-violet-200 dark:border-violet-900/40 pl-3">
                              {cleaned}
                            </p>
                          );
                        })()}

                        {/* Full text (digital mode) */}
                        {!isPaper && s.text && (
                          <details className="cursor-pointer">
                            <summary className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Ver texto da redação</summary>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-2 whitespace-pre-wrap font-mono">
                              {s.text}
                            </p>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm border border-gray-100 dark:border-gray-800 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-trash text-xl text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-white uppercase tracking-tight">Excluir redação?</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                Este registro será removido permanentemente e não poderá ser recuperado.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await onDelete(confirmDelete);
                  setConfirmDelete(null);
                  if (expanded === confirmDelete) setExpanded(null);
                }}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors active:scale-[0.98]"
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default RedacaoHistoryView;
