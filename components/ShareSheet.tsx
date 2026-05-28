import React, { useState } from 'react';
import { Subject, BlockLog, StreakState } from '../types';
import {
  generateWeeklySummary,
  generateYearWrap,
  shareOrDownload,
} from '../utils/shareGenerator';
import { toLocalDateKey } from '../utils/dateUtils';
import { useBackButton } from '../hooks/useBackButton';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  userName: string;
  subjects: Subject[];
  blockLogs: BlockLog[];
  streakState: StreakState;
  onClose: () => void;
}

type ShareType = 'week' | 'year';

function getWeekLabel(): string {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(monday)} a ${fmt(sunday)}`;
}

function getWeeklyStats(blockLogs: BlockLog[]) {
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const mondayTs = monday.getTime();

  const weekLogs = blockLogs.filter(l => l.timestamp >= mondayTs);
  const blocos = weekLogs.length;
  const questoes = weekLogs.reduce((a, l) => a + l.questionsTotal, 0);
  const acertos = weekLogs.reduce((a, l) => a + l.questionsCorrect, 0);

  return { blocos, questoes, acertos };
}

const ShareSheet: React.FC<Props> = ({ userName, subjects, blockLogs, streakState, onClose }) => {
  useSecondaryScreen();
  useBackButton(onClose);
  const [generating, setGenerating] = useState<ShareType | null>(null);

  const activeDayKeys = new Set(blockLogs.map(l => toLocalDateKey(l.timestamp)));

  const totalBlocks = subjects.reduce((a, s) => a + s.completedBlocks.length, 0);
  const topSubject = subjects.length > 0
    ? [...subjects].sort((a, b) => b.completedBlocks.length - a.completedBlocks.length)[0].title
    : null;

  const weekStats = getWeeklyStats(blockLogs);

  const handleShare = async (type: ShareType) => {
    setGenerating(type);
    try {
      let blob: Blob;
      if (type === 'week') {
        blob = await generateWeeklySummary({
          userName,
          blocos: weekStats.blocos,
          minutos: subjects.reduce((a, s) => a + s.completedBlocks.length * s.duration, 0),
          questoes: weekStats.questoes,
          acertos: weekStats.acertos,
          streakDays: streakState.currentStreak,
          weekLabel: getWeekLabel(),
        });
      } else {
        blob = await generateYearWrap({
          userName,
          totalBlocks,
          totalStudyDays: streakState.totalStudyDays,
          streakRecord: streakState.longestStreak,
          topSubject,
          activeDayKeys,
        });
      }
      await shareOrDownload(blob, `sprint-${type}-${Date.now()}.png`);
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setGenerating(null);
    }
  };

  const options: { type: ShareType; icon: string; title: string; desc: string }[] = [
    {
      type: 'week',
      icon: 'fa-calendar-week',
      title: 'Minha semana',
      desc: `${weekStats.blocos} blocos · ${weekStats.questoes} questões`,
    },
    {
      type: 'year',
      icon: 'fa-chart-area',
      title: 'Meu ano no Sprint',
      desc: `${totalBlocks} blocos · ${streakState.totalStudyDays} dias de estudo`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
            Compartilhar
          </h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-600">
            <i className="fas fa-times" />
          </button>
        </div>

        {/* PRINCIPLE: always user-initiated, never auto-prompted */}
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4">
          Imagem gerada localmente · Você decide o que compartilha
        </p>

        <div className="space-y-2">
          {options.map(opt => (
            <button
              key={opt.type}
              onClick={() => handleShare(opt.type)}
              disabled={generating !== null}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                {generating === opt.type
                  ? <i className="fas fa-circle-notch fa-spin text-indigo-500 text-sm" />
                  : <i className={`fas ${opt.icon} text-indigo-500 text-sm`} />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-800 dark:text-gray-100">{opt.title}</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-0.5">{opt.desc}</p>
              </div>
              {generating !== opt.type && (
                <i className="fas fa-chevron-right text-gray-300 dark:text-gray-700 text-xs ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
