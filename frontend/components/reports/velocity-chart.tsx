'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { subWeeks, startOfWeek, endOfWeek, format, parseISO, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VelocityChartProps {
  tasks: Task[];
  weeks?: number;
}

export function VelocityChart({ tasks, weeks = 8 }: VelocityChartProps) {
  const data = useMemo(() => {
    const points = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { locale: ja });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { locale: ja });

      const completedInWeek = tasks.filter((t) => {
        if (t.status !== 'done') return false;
        const updated = parseISO(t.updatedAt);
        return isWithinInterval(updated, { start: weekStart, end: weekEnd });
      }).length;

      points.push({
        week: format(weekStart, 'M/d', { locale: ja }),
        completed: completedInWeek,
      });
    }

    return points;
  }, [tasks, weeks]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">ベロシティ（週別完了数）</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [`${v}件`, '完了']} />
            <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
