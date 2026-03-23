'use client';

import { useEffect, useState, useMemo } from 'react';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { BurndownChart } from '@/components/reports/burndown-chart';
import { VelocityChart } from '@/components/reports/velocity-chart';
import { MemberProductivity } from '@/components/reports/member-productivity';
import { BarChart3, CheckSquare, Clock, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') return tasks;
    return tasks.filter((t) => t.project?.id === selectedProject);
  }, [tasks, selectedProject]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === 'done').length;
    const inProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
    const totalEstimated = filteredTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = filteredTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    return { total, done, inProgress, completionRate: total > 0 ? Math.round((done / total) * 100) : 0, totalEstimated, totalActual };
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">レポート・分析</h1>
          <p className="text-gray-600 mt-1">プロジェクトの進捗と生産性を分析</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">すべてのプロジェクト</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">全タスク</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">完了率</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">推定工数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalEstimated}h</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">実績工数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalActual}h</p>
        </div>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BurndownChart tasks={filteredTasks} />
        <VelocityChart tasks={filteredTasks} />
      </div>

      <MemberProductivity tasks={filteredTasks} />
    </div>
  );
}
