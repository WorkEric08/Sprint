
import React, { useMemo } from 'react';
import { Objective, Frequency } from '../types';

interface Props {
  objective: Objective;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const ObjectiveCard: React.FC<Props> = ({ objective, onComplete, onDelete, onEdit }) => {
  const currentProgress = useMemo(() => {
    const startOfPeriod = new Date();

    if (objective.frequency === 'daily') startOfPeriod.setHours(0, 0, 0, 0);
    else if (objective.frequency === 'weekly') {
      const day = startOfPeriod.getDay();
      const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
      startOfPeriod.setDate(diff);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (objective.frequency === 'monthly') {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else {
      startOfPeriod.setMonth(0, 1);
      startOfPeriod.setHours(0, 0, 0, 0);
    }

    return objective.completions.filter(c => c.timestamp >= startOfPeriod.getTime()).length;
  }, [objective.completions, objective.frequency]);

  const progressPercentage = objective.targetCount > 0 
    ? Math.min((currentProgress / objective.targetCount) * 100, 100)
    : 0;

  const getFreqLabel = (f: Frequency) => {
    switch(f) {
      case 'daily': return 'dia';
      case 'weekly': return 'semana';
      case 'monthly': return 'mês';
      case 'yearly': return 'ano';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div 
          className="flex gap-3 items-center cursor-pointer active:opacity-70 transition-opacity" 
          onClick={onEdit}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none" style={{ backgroundColor: objective.color }}>
            {objective.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">{objective.title}</h3>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-medium uppercase tracking-wider">
              {objective.targetCount}x por {getFreqLabel(objective.frequency)} • {objective.duration} min
            </p>
          </div>
        </div>
        <button onClick={onDelete} className="text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors p-1">
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Progresso atual</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentProgress} / {objective.targetCount}</span>
        </div>
        
        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="pt-2">
          <button 
            onClick={onComplete}
            disabled={currentProgress >= objective.targetCount && objective.targetCount > 0}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              (currentProgress >= objective.targetCount && objective.targetCount > 0)
              ? 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400 border border-green-100 dark:border-green-800/50' 
              : 'bg-indigo-600 text-white active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none'
            }`}
          >
            {(currentProgress >= objective.targetCount && objective.targetCount > 0) ? (
              <><i className="fas fa-check-circle"></i> Concluído!</>
            ) : (
              <><i className="fas fa-play"></i> Iniciar Sprint</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveCard;
