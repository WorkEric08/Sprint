import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SimuladoRecord } from '../types';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  records: SimuladoRecord[];
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

function overallPct(record: SimuladoRecord): number | null {
  const total   = record.areaResults.reduce((a, r) => a + r.questionsTotal, 0);
  const correct = record.areaResults.reduce((a, r) => a + r.questionsCorrect, 0);
  return total > 0 ? Math.round((correct / total) * 100) : null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

const SimuladoHistoryView: React.FC<Props> = ({ records, onDelete, onClose }) => {
  useSecondaryScreen();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Chart data (only records with score)
  const chartData = useMemo(() => {
    return [...records]
      .reverse()
      .map(r => ({ date: formatDate(r.completedAt), score: overallPct(r) }))
      .filter(d => d.score !== null) as { date: string; score: number }[];
  }, [records]);

  // Stats
  const { recentAvg, prevAvg, estimate } = useMemo(() => {
    const withScore = records.map(r => overallPct(r)).filter(s => s !== null) as number[];
    if (withScore.length === 0) return { recentAvg: null, prevAvg: null, estimate: null };
    const last3 = withScore.slice(0, 3);
    const prev  = withScore.slice(3);
    return {
      recentAvg: Math.round(last3.reduce((a, s) => a + s, 0) / last3.length),
      prevAvg:   prev.length ? Math.round(prev.reduce((a, s) => a + s, 0) / prev.length) : null,
      estimate:  Math.round(last3.reduce((a, s) => a + s, 0) / last3.length),
    };
  }, [records]);

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-950 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 safe-top border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div>
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Histórico de Simulados</h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            {records.length} {records.length === 1 ? 'simulado' : 'simulados'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <i className="fas fa-stopwatch text-gray-300 dark:text-gray-600 text-xl" />
            </div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Nenhum simulado realizado
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[200px] leading-relaxed">
              Inicie um simulado pela tela Ciclo para ver o histórico aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            {recentAvg !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Média (últimos 3)</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{recentAvg}%</p>
                  {prevAvg !== null && (
                    <p className={`text-[10px] font-bold mt-1 ${recentAvg > prevAvg ? 'text-green-500' : recentAvg < prevAvg ? 'text-red-500' : 'text-gray-400'}`}>
                      {recentAvg > prevAvg ? '↑' : recentAvg < prevAvg ? '↓' : '→'} vs {prevAvg}% anteriores
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Estimativa prova</p>
                  <p className="text-3xl font-black text-gray-800 dark:text-white mt-1">~{estimate}%</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">Estimativa, não garantia</p>
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
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 11 }}
                      formatter={(v: number) => [`${v}%`, 'Aproveitamento']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Linha do tempo</p>
              {records.map(r => {
                const pct = overallPct(r);
                const isExpanded = expanded === r.id;
                return (
                  <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Header row: expand button + delete */}
                    <div className="flex items-stretch">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className="flex-1 p-4 text-left flex items-center gap-4 min-w-0"
                      >
                        {/* Date */}
                        <div className="text-center shrink-0 w-12">
                          <p className="text-xs font-black text-gray-800 dark:text-gray-100">
                            {new Date(r.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-600">
                            {new Date(r.completedAt).getFullYear()}
                          </p>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                            {r.templateName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 dark:text-gray-600">{formatDuration(r.actualDurationMinutes)}</span>
                            {!r.completed && <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Interrompido</span>}
                          </div>
                        </div>
                        {/* Score */}
                        <div className="text-right shrink-0">
                          {pct !== null ? (
                            <>
                              <p className="text-xl font-black" style={{ color: pct >= 60 ? '#22c55e' : '#ef4444' }}>{pct}%</p>
                              <p className="text-[9px] text-gray-400 dark:text-gray-600">aproveit.</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-300 dark:text-gray-700">sem nota</p>
                          )}
                        </div>
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] text-gray-300 dark:text-gray-700 shrink-0`} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="px-3 flex items-center justify-center border-l border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shrink-0"
                        title="Excluir simulado"
                      >
                        <i className="fas fa-trash text-[11px]" />
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-50 dark:border-gray-800/60 px-4 pb-4 pt-3 space-y-3 animate-in fade-in duration-200">
                        {/* Area breakdown */}
                        {r.areaResults.length > 0 && (
                          <div className="space-y-2">
                            {r.areaResults.map(a => {
                              const aPct = a.questionsTotal > 0 ? Math.round((a.questionsCorrect / a.questionsTotal) * 100) : null;
                              return (
                                <div key={a.areaName}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{a.areaName}</span>
                                    </div>
                                    <span className="text-xs font-black" style={{ color: aPct !== null && aPct >= 60 ? '#22c55e' : '#ef4444' }}>
                                      {aPct !== null ? `${aPct}%` : '—'}
                                    </span>
                                  </div>
                                  {a.questionsTotal > 0 && (
                                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-3.5">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${aPct ?? 0}%`,
                                          backgroundColor: a.color,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {r.redacaoScore !== null && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-pen text-[9px] text-violet-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Redação: <strong className="text-violet-500">{r.redacaoScore}/1000</strong></span>
                          </div>
                        )}

                        {r.timeControlScore && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-clock text-[9px] text-indigo-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Controle do tempo: <strong className="text-indigo-500">{r.timeControlScore}/5</strong>
                            </span>
                          </div>
                        )}

                        {r.perception && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                            {r.perception}
                          </p>
                        )}

                        {r.redacaoText && (
                          <details className="cursor-pointer">
                            <summary className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Ver redação</summary>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-2 whitespace-pre-wrap">{r.redacaoText}</p>
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
              <h3 className="text-base font-black text-gray-800 dark:text-white uppercase tracking-tight">Excluir simulado?</h3>
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

export default SimuladoHistoryView;
