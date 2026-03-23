'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MemberProductivityProps {
  tasks: Task[];
}

export function MemberProductivity({ tasks }: MemberProductivityProps) {
  const data = useMemo(() => {
    const memberMap = new Map<string, { name: string; done: number; inProgress: number; todo: number }>();

    for (const task of tasks) {
      const assignees = task.assignees || [];
      if (assignees.length === 0) continue;

      for (const a of assignees) {
        const key = a.user.id;
        if (!memberMap.has(key)) {
          memberMap.set(key, { name: a.user.name, done: 0, inProgress: 0, todo: 0 });
        }
        const m = memberMap.get(key)!;
        if (task.status === 'done') m.done++;
        else if (task.status === 'in_progress') m.inProgress++;
        else m.todo++;
      }
    }

    return Array.from(memberMap.values()).sort((a, b) => (b.done + b.inProgress + b.todo) - (a.done + a.inProgress + a.todo));
  }, [tasks]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-400">メンバー別データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">メンバー別タスク状況</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="done" stackId="a" fill="#22c55e" name="完了" />
            <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="進行中" />
            <Bar dataKey="todo" stackId="a" fill="#d1d5db" name="未着手" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
