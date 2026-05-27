import React, { useState } from 'react';
import { Subject, SprintResolvedItem, BlockType, ReviewItem, BLOCK_TYPE_COLORS, Edital, SimuladoTemplate, SimuladoRecord } from '../types';
import CicloEditView from './CicloEditView';
import CicloAddView from './CicloAddView';
import SprintBuilderView from './SprintBuilderView';
import SprintRunnerView from './SprintRunnerView';
import CountdownWidget from './CountdownWidget';
import SimuladoSetupModal from './SimuladoSetupModal';
import SimuladoRunnerView from './SimuladoRunnerView';
import PostSimuladoModal from './PostSimuladoModal';
import RedacaoSetupModal from './RedacaoSetupModal';
import RedacaoEditorView from './RedacaoEditorView';
import StreakWidget from './StreakWidget';
import { useBackButton } from '../hooks/useBackButton';
import { useSimulados } from '../hooks/useSimulados';
import { useRedacao } from '../hooks/useRedacao';
import { RedacaoTheme, StreakState } from '../types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Block color: study → subject.color, review → amber, questions → green
function blockColor(type: BlockType, subjectColor: string): string {
  if (type === 'study') return subjectColor;
  return BLOCK_TYPE_COLORS[type];
}

interface Props {
  userName: string;
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
  pendingReviewCount: number;
  reviewItems: ReviewItem[];
  edital: Edital | null;
  examDate: string | null;
  onEditExamDate: () => void;
  streakState: StreakState;
  streakEnabled?: boolean;
}

const CicloView: React.FC<Props> = ({
  userName,
  subjects,
  onSubjectsChange,
  pendingReviewCount,
  reviewItems,
  edital,
  examDate,
  onEditExamDate,
  streakState,
  streakEnabled = true,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSprintBuilderOpen, setIsSprintBuilderOpen] = useState(false);
  const [sprintItems, setSprintItems] = useState<SprintResolvedItem[] | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Simulado flow
  const [showSimuladoSetup, setShowSimuladoSetup] = useState(false);
  const [activeSimulado, setActiveSimulado] = useState<{
    template: SimuladoTemplate;
    startedAt: number;
  } | null>(null);
  const [postSimulado, setPostSimulado] = useState<{
    template: SimuladoTemplate;
    actualMinutes: number;
    completed: boolean;
    startedAt: number;
  } | null>(null);
  const { saveRecord: saveSimuladoRecord } = useSimulados();

  // Redação flow
  const [showRedacaoSetup, setShowRedacaoSetup] = useState(false);
  const [activeRedacaoTheme, setActiveRedacaoTheme] = useState<RedacaoTheme | null>(null);
  const { saveSession: saveRedacaoSession } = useRedacao();

  const handleAddSave = (data: Pick<Subject, 'title' | 'color' | 'duration' | 'blockCount'>) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      ...data,
      completedBlocks: [],
    };
    onSubjectsChange([...subjects, newSubject]);
    setIsAdding(false);
  };

  const handleEditSave = (data: Pick<Subject, 'title' | 'color' | 'duration' | 'blockCount'>) => {
    if (!editingSubject) return;
    onSubjectsChange(subjects.map(s => s.id === editingSubject.id ? { ...s, ...data } : s));
    setEditingSubject(null);
  };

  const deleteSubject = (id: string) => {
    onSubjectsChange(subjects.filter(s => s.id !== id));
    setConfirmDelete(null);
  };

  const resetBlocks = (id: string) => {
    onSubjectsChange(subjects.map(s => s.id === id ? { ...s, completedBlocks: [] } : s));
    setConfirmReset(null);
  };

  // Feature 4: blockType is now tracked per completed block
  const handleBlockComplete = (subjectId: string, blockType: BlockType = 'study') => {
    onSubjectsChange(
      subjects.map(s => {
        if (s.id === subjectId && s.completedBlocks.length < s.blockCount) {
          return {
            ...s,
            completedBlocks: [...s.completedBlocks, { timestamp: Date.now(), type: blockType }],
          };
        }
        return s;
      })
    );
  };

  const subjectToReset = confirmReset ? subjects.find(s => s.id === confirmReset) : null;
  const subjectToDelete = confirmDelete ? subjects.find(s => s.id === confirmDelete) : null;

  const hasOverlay = !!confirmReset || !!confirmDelete;
  useBackButton(() => {
    if (confirmReset) { setConfirmReset(null); return; }
    setConfirmDelete(null);
  }, hasOverlay);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {getGreeting()}
          </p>
          <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
            {userName || 'Estudante'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {streakEnabled && <StreakWidget state={streakState} compact />}
          <button
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors active:scale-90"
          >
            <i className="fas fa-plus" />
          </button>
        </div>
      </div>

      {/* Fase 3: Contagem regressiva */}
      {examDate && (
        <CountdownWidget
          examDate={examDate}
          examName={edital?.name}
          onEditDate={onEditExamDate}
        />
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm md:max-w-lg md:mx-auto">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book-open text-indigo-400 text-3xl" />
          </div>
          <h3 className="text-gray-700 dark:text-gray-200 font-medium text-xl">Nenhuma matéria ainda</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Adicione suas matérias e comece a construir seu mapa de blocos de estudo.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold active:scale-95 transition-transform hover:bg-indigo-700"
          >
            Adicionar Matéria
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map(subject => {
              const completed = subject.completedBlocks.length;
              const total = subject.blockCount;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const allDone = completed >= total;
              const isResetting = confirmReset === subject.id;
              const isDeleting = confirmDelete === subject.id;

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  <div className="h-1 w-full" style={{ backgroundColor: subject.color }} />

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                        <span className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-tight truncate">
                          {subject.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">{subject.duration}min</span>
                        <button
                          onClick={() => setConfirmReset(subject.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                            isResetting ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                          title="Resetar blocos"
                        >
                          <i className="fas fa-rotate-left text-[10px]" />
                        </button>
                        <button
                          onClick={() => setEditingSubject(subject)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          <i className="fas fa-pencil text-[10px]" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(subject.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                            isDeleting ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                        >
                          <i className="fas fa-trash text-[10px]" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-3xl font-black tracking-tighter leading-none" style={{ color: allDone ? '#22c55e' : subject.color }}>
                            {pct}
                          </span>
                          <span className="text-base font-black leading-none" style={{ color: allDone ? '#22c55e' : subject.color }}>%</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                            {completed} / {total}
                          </p>
                          <p className="text-[9px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-wider mt-0.5">blocos</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: allDone ? '#22c55e' : subject.color,
                            boxShadow: pct > 0 ? `0 0 8px ${allDone ? '#22c55e' : subject.color}66` : undefined,
                          }}
                        />
                      </div>
                    </div>

                    {/* Feature 4: quadradinhos coloridos por tipo */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: total }).map((_, i) => {
                        const block = subject.completedBlocks[i];
                        const color = block ? blockColor(block.type, subject.color) : undefined;
                        return (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm transition-all duration-500"
                            style={
                              block
                                ? { backgroundColor: color, boxShadow: `0 0 0 1px ${color}22` }
                                : { backgroundColor: 'transparent', border: '1.5px solid', borderColor: 'currentColor', opacity: 0.15 }
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsSprintBuilderOpen(true)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-list-ul" />
            Montar Sprint
          </button>

          {/* Fase 4: Botão Simulado */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowSimuladoSetup(true)}
              className="py-3.5 bg-gray-900 dark:bg-white/5 text-white dark:text-gray-200 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-gray-800 dark:hover:bg-white/10"
            >
              <i className="fas fa-stopwatch text-sm" />
              Simulado
            </button>
            {/* Fase 5: Botão Redação */}
            <button
              onClick={() => setShowRedacaoSetup(true)}
              className="py-3.5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-violet-700 shadow-lg shadow-violet-500/20"
            >
              <i className="fas fa-pen text-sm" />
              Redação
            </button>
          </div>
        </>
      )}

      {isAdding && <CicloAddView onSave={handleAddSave} onClose={() => setIsAdding(false)} />}

      {/* Reset confirm */}
      {confirmReset && subjectToReset && (
        <div className="fixed inset-0 z-[60] bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-rotate-left text-2xl text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Resetar Blocos?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Todos os blocos concluídos de{' '}
                <span className="font-bold" style={{ color: subjectToReset.color }}>{subjectToReset.title}</span>{' '}
                serão apagados. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button onClick={() => resetBlocks(confirmReset)} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-colors active:scale-[0.98]">
                Sim, resetar blocos
              </button>
              <button onClick={() => setConfirmReset(null)} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && subjectToDelete && (
        <div className="fixed inset-0 z-[60] bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-trash text-2xl text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Excluir Matéria?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-bold" style={{ color: subjectToDelete.color }}>{subjectToDelete.title}</span>{' '}
                e todos os seus blocos serão excluídos permanentemente.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button onClick={() => deleteSubject(confirmDelete)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors active:scale-[0.98]">
                Sim, excluir matéria
              </button>
              <button onClick={() => setConfirmDelete(null)} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubject && (
        <CicloEditView subject={editingSubject} onSave={handleEditSave} onClose={() => setEditingSubject(null)} />
      )}

      {/* Sprint Builder — Feature 3: banner de revisões via prop */}
      {isSprintBuilderOpen && (
        <SprintBuilderView
          subjects={subjects}
          pendingReviewCount={pendingReviewCount}
          pendingReviewItems={reviewItems.filter(i => !i.consolidated)}
          onStart={items => { setIsSprintBuilderOpen(false); setSprintItems(items); }}
          onClose={() => setIsSprintBuilderOpen(false)}
        />
      )}

      {/* Sprint Runner — Feature 4: blockType propagado via handleBlockComplete */}
      {sprintItems && (
        <SprintRunnerView
          items={sprintItems}
          onBlockComplete={handleBlockComplete}
          onClose={() => setSprintItems(null)}
          isDevMode={userName.trim().toLowerCase() === 'devinfo'}
        />
      )}

      {/* Simulado Setup */}
      {showSimuladoSetup && (
        <SimuladoSetupModal
          onStart={template => {
            setShowSimuladoSetup(false);
            setActiveSimulado({ template, startedAt: Date.now() });
          }}
          onClose={() => setShowSimuladoSetup(false)}
        />
      )}

      {/* Simulado Runner */}
      {activeSimulado && (
        <SimuladoRunnerView
          template={activeSimulado.template}
          onFinish={(actualMinutes, completed) => {
            setPostSimulado({
              template: activeSimulado.template,
              actualMinutes,
              completed,
              startedAt: activeSimulado.startedAt,
            });
            setActiveSimulado(null);
          }}
        />
      )}

      {/* Redação Setup */}
      {showRedacaoSetup && (
        <RedacaoSetupModal
          onStart={theme => {
            setShowRedacaoSetup(false);
            setActiveRedacaoTheme(theme);
          }}
          onClose={() => setShowRedacaoSetup(false)}
        />
      )}

      {/* Redação Editor */}
      {activeRedacaoTheme && (
        <RedacaoEditorView
          theme={activeRedacaoTheme}
          onSave={saveRedacaoSession}
          onClose={() => setActiveRedacaoTheme(null)}
        />
      )}

      {/* Post-simulado modal */}
      {postSimulado && (
        <PostSimuladoModal
          template={postSimulado.template}
          actualDurationMinutes={postSimulado.actualMinutes}
          completed={postSimulado.completed}
          startedAt={postSimulado.startedAt}
          onSave={record => {
            saveSimuladoRecord(record);
            setPostSimulado(null);
          }}
          onSkip={() => setPostSimulado(null)}
        />
      )}
    </div>
  );
};

export default CicloView;
