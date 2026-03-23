'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { subDays, startOfDay, format, parseISO, isBefore, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BurndownChartProps {
  tasks: Task[];
  days?: number;
}

export function BurndownChart({ tasks, days = 30 }: BurndownChartProps) {
  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const totalTasks = tasks.length;
    const points = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const completedByDay = tasks.filter((t) => {
        if (t.status !== 'done') return false;
        const updated = startOfDay(parseISO(t.updatedAt));
        return isBefore(updated, day) || isSameDay(updated, day);
      }).length;

      const remaining = totalTasks - completedByDay;
      const idealRemaining = Math.round(totalTasks * (i / (days - 1)));

      points.push({
        date: format(day, 'M/d', { locale: ja }),
        remaining,
        ideal: idealRemaining,
      });
    }

    return points;
  }, [tasks, days]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">バーンダウンチャート</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={2} name="残タスク" dot={false} />
            <Line type="monotone" dataKey="ideal" stroke="#d1d5db" strokeWidth={1} strokeDasharray="5 5" name="理想" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
