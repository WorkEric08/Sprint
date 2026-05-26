import React, { useState, useMemo, useRef } from 'react';
import { ErrorEntry } from '../types';

interface Props {
  errorEntries: ErrorEntry[];
  onUpdateNote: (entryId: string, note: string) => Promise<void>;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((correct / total) * 100)}%`;
}

const ErrorNotebookView: React.FC<Props> = ({ errorEntries, onUpdateNote, onClose }) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterSubtopic, setFilterSubtopic] = useState<string>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Derived filter options
  const subjects = useMemo(() => {
    const map = new Map<string, { id: string; title: string; color: string }>();
    errorEntries.forEach(e => {
      if (!map.has(e.subjectId)) {
        map.set(e.subjectId, { id: e.subjectId, title: e.subjectTitle, color: e.subjectColor });
      }
    });
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [errorEntries]);

  const subtopics = useMemo(() => {
    const source = filterSubject === 'all'
      ? errorEntries
      : errorEntries.filter(e => e.subjectId === filterSubject);
    return [...new Set(source.map(e => e.subtopic).filter(Boolean))].sort();
  }, [errorEntries, filterSubject]);

  // Filtered entries
  const filtered = useMemo(() => {
    return errorEntries.filter(e => {
      if (filterSubject !== 'all' && e.subjectId !== filterSubject) return false;
      if (filterSubtopic !== 'all' && e.subtopic !== filterSubtopic) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.subjectTitle.toLowerCase().includes(q) ||
          e.subtopic.toLowerCase().includes(q) ||
          e.note.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [errorEntries, filterSubject, filterSubtopic, search]);

  const startEditNote = (entry: ErrorEntry) => {
    setEditingNoteId(entry.id);
    setNoteText(entry.note);
    setTimeout(() => noteRef.current?.focus(), 50);
  };

  const saveNote = async (entryId: string) => {
    await onUpdateNote(entryId, noteText);
    setEditingNoteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform shrink-0"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
            Caderno de Erros
          </h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="px-4 pt-3 pb-2 space-y-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        {/* Search */}
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por matéria, subtópico ou anotação…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <i className="fas fa-times text-xs" />
            </button>
          )}
        </div>

        {/* Subject + Subtopic filters */}
        <div className="overflow-x-scroll-area flex gap-2 pb-1">
          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={e => { setFilterSubject(e.target.value); setFilterSubtopic('all'); }}
            className="shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide focus:outline-none"
          >
            <option value="all">Todas matérias</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>

          {/* Subtopic filter */}
          {subtopics.length > 0 && (
            <select
              value={filterSubtopic}
              onChange={e => setFilterSubtopic(e.target.value)}
              className="shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide focus:outline-none"
            >
              <option value="all">Todos subtópicos</option>
              {subtopics.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
              <i className="fas fa-book text-gray-300 dark:text-gray-600 text-xl" />
            </div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {errorEntries.length === 0 ? 'Nenhum erro registrado' : 'Nenhum resultado'}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-700 max-w-[200px] leading-relaxed">
              {errorEntries.length === 0
                ? 'Os erros registrados no modal pós-bloco aparecem aqui automaticamente.'
                : 'Tente remover os filtros ou alterar a busca.'}
            </p>
          </div>
        ) : (
          filtered.map(entry => (
            <div
              key={entry.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
            >
              {/* Color accent */}
              <div className="h-1 w-full" style={{ backgroundColor: entry.subjectColor }} />

              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.subjectColor }} />
                      <span className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate">
                        {entry.subjectTitle}
                      </span>
                    </div>
                    {entry.subtopic && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-3.5">
                        {entry.subtopic}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 shrink-0">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 rounded-full px-3 py-1">
                    <i className="fas fa-times text-red-500 text-[9px]" />
                    <span className="text-[11px] font-black text-red-600 dark:text-red-400">
                      {entry.questionsWrong} {entry.questionsWrong === 1 ? 'erro' : 'erros'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-full px-3 py-1">
                    <i className="fas fa-percent text-gray-400 text-[9px]" />
                    <span className="text-[11px] font-black text-gray-600 dark:text-gray-400">
                      {formatAccuracy(entry.questionsCorrect, entry.questionsTotal)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300 dark:text-gray-700">
                    {entry.questionsCorrect}/{entry.questionsTotal} certas
                  </span>
                </div>

                {/* Note */}
                {editingNoteId === entry.id ? (
                  <div className="space-y-2">
                    <textarea
                      ref={noteRef}
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Anote o que errou, o conceito correto…"
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveNote(entry.id)}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditNote(entry)}
                    className="w-full text-left group"
                  >
                    {entry.note ? (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl px-3 py-2">
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{entry.note}</p>
                        <p className="text-[9px] font-black text-amber-400 dark:text-amber-600 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Toque para editar
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-300 dark:text-gray-700 hover:text-indigo-400 dark:hover:text-indigo-600 transition-colors">
                        <i className="fas fa-pen text-[9px]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Adicionar anotação</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ErrorNotebookView;
