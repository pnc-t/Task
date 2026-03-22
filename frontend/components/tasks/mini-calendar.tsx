'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isWeekend,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  taskDates?: Set<string>;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function MiniCalendar({ currentDate, onDateSelect, taskDates }: MiniCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(currentDate));

  const days = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const calStart = startOfWeek(monthStart, { locale: ja });
    const calEnd = endOfWeek(monthEnd, { locale: ja });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [displayMonth]);

  const today = new Date();

  return (
    <div className="w-56 select-none">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-medium text-gray-700">
          {format(displayMonth, 'yyyy年 M月', { locale: ja })}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-[10px] font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, displayMonth);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, currentDate);
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasTask = taskDates?.has(dateStr);
          const isSun = day.getDay() === 0;
          const isSat = day.getDay() === 6;

          return (
            <button
              key={dateStr}
              onClick={() => {
                onDateSelect(day);
                if (!isSameMonth(day, displayMonth)) {
                  setDisplayMonth(startOfMonth(day));
                }
              }}
              className={`relative w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors mx-auto
                ${isToday && !isSelected ? 'bg-blue-600 text-white font-bold' : ''}
                ${isSelected && !isToday ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                ${isSelected && isToday ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300' : ''}
                ${!isToday && !isSelected && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                ${!isToday && !isSelected && !isCurrentMonth ? 'text-gray-300' : ''}
                ${!isToday && !isSelected && isCurrentMonth && isSun ? 'text-red-500' : ''}
                ${!isToday && !isSelected && isCurrentMonth && isSat ? 'text-blue-500' : ''}
                ${!isToday && !isSelected && isCurrentMonth && !isSun && !isSat ? 'text-gray-700' : ''}
              `}
            >
              {format(day, 'd')}
              {hasTask && !isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
