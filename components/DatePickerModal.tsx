import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackButton } from '../hooks/useBackButton';

interface Props {
  value: string | null; // "YYYY-MM-DD"
  onSelect: (date: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseLocalDate(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m: m - 1, d };
}

const DatePickerModal: React.FC<Props> = ({ value, onSelect, onClear, onClose }) => {
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = value ? parseLocalDate(value) : { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };

  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  useBackButton(onClose);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build grid: nulls for empty slots + day numbers
  const cells: (number | null)[] = Array.from({ length: firstDayOfWeek }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDay = (day: number) => {
    onSelect(toDateKey(viewYear, viewMonth, day));
    onClose();
  };

  const handleToday = () => {
    onSelect(todayKey);
    onClose();
  };

  const handleClear = () => {
    onClear?.();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-xs animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
          >
            <i className="fas fa-chevron-left text-xs" />
          </button>

          <div className="text-center select-none">
            <p className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">
              {MONTHS_PT[viewMonth]}
            </p>
            <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
              {viewYear}
            </p>
          </div>

          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
          >
            <i className="fas fa-chevron-right text-xs" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 px-4 pb-2 border-b border-gray-50 dark:border-gray-800">
          {DAYS_PT.map(d => (
            <div key={d} className="flex items-center justify-center py-1">
              <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-wider">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 px-3 py-3 gap-y-0.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;

            const key = toDateKey(viewYear, viewMonth, day);
            const isSelected = key === value;
            const isToday = key === todayKey;

            return (
              <div key={key} className="flex items-center justify-center">
                <button
                  onClick={() => handleDay(day)}
                  className={`
                    w-9 h-9 rounded-full text-sm transition-all active:scale-90 flex items-center justify-center relative
                    ${isSelected
                      ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/30'
                      : isToday
                      ? 'text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {day}
                  {/* Dot for today (when not selected) */}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest active:opacity-70 transition-opacity"
            >
              Hoje
            </button>
            {value && onClear && (
              <button
                onClick={handleClear}
                className="text-[11px] font-black text-red-400 dark:text-red-500 uppercase tracking-widest active:opacity-70 transition-opacity"
              >
                Limpar
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest active:opacity-70 transition-opacity"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DatePickerModal;
