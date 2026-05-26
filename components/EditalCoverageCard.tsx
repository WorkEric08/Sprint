import React, { useMemo, useState } from 'react';
import { Edital, Subject, BlockLog } from '../types';

interface Props {
  edital: Edital;
  subjects: Subject[];
  blockLogs: BlockLog[];
}

interface SubjectCoverage {
  editalSubjectName: string;
  color: string;
  appSubject: Subject | null;
  covered: boolean;              // at least 1 block completed
  subtopicsTotal: number;
  subtopicsCovered: number;      // matched via BlockLog.subtopic
  untouchedSubtopics: string[];
}

const EditalCoverageCard: React.FC<Props> = ({ edital, subjects, blockLogs }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUntouched, setShowUntouched] = useState(false);

  const coverage = useMemo<SubjectCoverage[]>(() => {
    return edital.subjects.map(es => {
      // Match app subject by name (case-insensitive)
      const appSubject = subjects.find(
        s => s.title.toLowerCase() === es.name.toLowerCase()
      ) ?? null;

      const covered = appSubject !== null && appSubject.completedBlocks.length > 0;

      // Check which subtopics appear in BlockLogs for this subject
      const subjectBlockLogs = appSubject
        ? blockLogs.filter(log => log.subjectId === appSubject.id)
        : [];
      const loggedSubtopics = new Set(subjectBlockLogs.map(l => l.subtopic.toLowerCase().trim()).filter(Boolean));

      const subtopicsCovered = es.subtopics.filter(
        st => loggedSubtopics.has(st.name.toLowerCase().trim())
      ).length;

      const untouchedSubtopics = es.subtopics
        .filter(st => !loggedSubtopics.has(st.name.toLowerCase().trim()))
        .map(st => st.name);

      return {
        editalSubjectName: es.name,
        color: es.color,
        appSubject,
        covered,
        subtopicsTotal: es.subtopics.length,
        subtopicsCovered,
        untouchedSubtopics,
      };
    });
  }, [edital, subjects, blockLogs]);

  const totalSubjects = coverage.length;
  const coveredSubjects = coverage.filter(c => c.covered).length;
  const pct = totalSubjects > 0 ? Math.round((coveredSubjects / totalSubjects) * 100) : 0;

  const totalSubtopics = coverage.reduce((a, c) => a + c.subtopicsTotal, 0);
  const coveredSubtopics = coverage.reduce((a, c) => a + c.subtopicsCovered, 0);
  const subtopicPct = totalSubtopics > 0 ? Math.round((coveredSubtopics / totalSubtopics) * 100) : 0;

  const allUntouched = coverage
    .filter(c => c.untouchedSubtopics.length > 0)
    .map(c => ({ subject: c.editalSubjectName, color: c.color, subtopics: c.untouchedSubtopics }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Edital coberto
            </p>
            <p className="text-sm font-black text-gray-600 dark:text-gray-400 uppercase tracking-tight mt-0.5">
              {edital.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{pct}%</p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 mt-0.5">matérias</p>
          </div>
        </div>

        {/* Dual bar: matérias e subtópicos */}
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Matérias ({coveredSubjects}/{totalSubjects})</span>
              <span className="text-[9px] font-black text-indigo-500">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {totalSubtopics > 0 && (
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600">Subtópicos ({coveredSubtopics}/{totalSubtopics})</span>
                <span className="text-[9px] font-black text-violet-500">{subtopicPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${subtopicPct}%` }} />
              </div>
            </div>
          )}
        </div>

        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 mt-2 flex items-center gap-1">
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-[8px]`} />
          {expanded ? 'Recolher' : 'Ver por matéria'}
        </p>
      </button>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/60">
          {coverage.map(c => (
            <div key={c.editalSubjectName} className="px-4 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${c.covered ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}>
                  {c.editalSubjectName}
                </p>
                {c.subtopicsTotal > 0 && (
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5">
                    {c.subtopicsCovered}/{c.subtopicsTotal} subtópicos
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {c.covered ? (
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <i className="fas fa-check text-[8px]" />
                    Coberto
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest">
                    Não tocado
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Subtópicos não tocados */}
          {allUntouched.length > 0 && (
            <div className="px-4 py-3">
              <button
                onClick={() => setShowUntouched(p => !p)}
                className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                <i className="fas fa-exclamation-circle mr-1 text-[9px]" />
                {showUntouched ? 'Ocultar' : 'Ver'} subtópicos nunca estudados
              </button>
              {showUntouched && (
                <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                  {allUntouched.map(g => (
                    <div key={g.subject}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">{g.subject}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-3.5">
                        {g.subtopics.map(st => (
                          <span key={st} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-full text-[9px] font-bold text-red-700 dark:text-red-400">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditalCoverageCard;
