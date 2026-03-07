'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { useAuthStore } from '@/lib/auth-store';
import { taskService } from '@/services/task.service';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  AlertTriangle,
  Target,
  Search,
  Plus,
  Trash2,
  Download,
  TrendingUp,
  User,
  Clock,
} from 'lucide-react';
import {
  format,
  isAfter,
  startOfDay,
  parseISO,
  differenceInDays,
  differenceInCalendarDays,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { UserAvatar } from '@/components/ui/user-avatar';

interface WBSViewProps {
  tasks: Task[];
  onUpdate: () => void;
}

interface WBSNode {
  task: Task;
  children: WBSNode[];
  level: number;
  wbsNumber: string;
  isLeaf: boolean;
  rolledUpEstimated: number;
  rolledUpActual: number;
  rolledUpProgress: number;
}

interface EditingCell {
  taskId: string;
  field: 'progress' | 'estimatedHours' | 'actualHours';
  value: string;
}

interface AddingChild {
  parentId: string;
  title: string;
}

interface DeleteConfirm {
  taskId: string;
  taskTitle: string;
}

export function WBSView({ tasks, onUpdate }: WBSViewProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'dueDate' | 'status'>('default');
  const [searchText, setSearchText] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [addingChild, setAddingChild] = useState<AddingChild | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [showEVM, setShowEVM] = useState(false);
  const [savingCell, setSavingCell] = useState(false);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(lower));
    }
    if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus);
    if (filterPriority !== 'all') filtered = filtered.filter(t => t.priority === filterPriority);
    if (showMyTasksOnly) {
      filtered = filtered.filter(t =>
        t.assignee?.id === user?.id || t.assignees?.some(a => a.user.id === user?.id)
      );
    }
    return filtered;
  }, [tasks, filterStatus, filterPriority, showMyTasksOnly, user, searchText]);

  const { wbsTree, wbsNumberMap } = useMemo(() => {
    const nodeMap = new Map<string, WBSNode>();
    const rootNodes: WBSNode[] = [];

    filteredTasks.forEach(task => {
      nodeMap.set(task.id, { task, children: [], level: 0, wbsNumber: '', isLeaf: true, rolledUpEstimated: 0, rolledUpActual: 0, rolledUpProgress: 0 });
    });

    filteredTasks.forEach(task => {
      const node = nodeMap.get(task.id);
      if (!node) return;
      if (task.dependencies && task.dependencies.length > 0) {
        const parentNode = nodeMap.get(task.dependencies[0].dependsOn.id);
        if (parentNode) {
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: WBSNode[]) => {
      if (sortBy === 'priority') {
        const ord: Record<string, number> = { high: 0, medium: 1, low: 2 };
        nodes.sort((a, b) => (ord[a.task.priority] ?? 1) - (ord[b.task.priority] ?? 1));
      } else if (sortBy === 'dueDate') {
        nodes.sort((a, b) => {
          if (!a.task.dueDate) return 1;
          if (!b.task.dueDate) return -1;
          return new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime();
        });
      } else if (sortBy === 'status') {
        const ord: Record<string, number> = { todo: 0, in_progress: 1, done: 2 };
        nodes.sort((a, b) => (ord[a.task.status] ?? 0) - (ord[b.task.status] ?? 0));
      }
      nodes.forEach(n => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    // WBS番号の付与
    const assignWBS = (nodes: WBSNode[], prefix: string) => {
      nodes.forEach((node, i) => {
        node.wbsNumber = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        node.isLeaf = node.children.length === 0;
        assignWBS(node.children, node.wbsNumber);
      });
    };
    assignWBS(rootNodes, '');

    // ロールアップ計算
    const computeRollup = (node: WBSNode): void => {
      node.children.forEach(computeRollup);
      if (node.isLeaf) {
        node.rolledUpEstimated = node.task.estimatedHours ?? 0;
        node.rolledUpActual = node.task.actualHours ?? 0;
        node.rolledUpProgress = node.task.progress ?? 0;
      } else {
        node.rolledUpEstimated = node.children.reduce((s, c) => s + c.rolledUpEstimated, 0);
        node.rolledUpActual = node.children.reduce((s, c) => s + c.rolledUpActual, 0);
        const totalEst = node.rolledUpEstimated;
        if (totalEst > 0) {
          node.rolledUpProgress = node.children.reduce(
            (s, c) => s + c.rolledUpProgress * (c.rolledUpEstimated / totalEst), 0
          );
        } else {
          node.rolledUpProgress = node.children.reduce((s, c) => s + c.rolledUpProgress, 0) / (node.children.length || 1);
        }
      }
    };
    rootNodes.forEach(computeRollup);

    // WBS番号マップ
    const codeMap = new Map<string, string>();
    const buildMap = (nodes: WBSNode[]) => {
      nodes.forEach(n => { codeMap.set(n.task.id, n.wbsNumber); buildMap(n.children); });
    };
    buildMap(rootNodes);

    return { wbsTree: rootNodes, wbsNumberMap: codeMap };
  }, [filteredTasks, sortBy]);

  // 表示用フラット化（展開状態考慮）
  const visibleNodes = useMemo(() => {
    const result: WBSNode[] = [];
    const flatten = (nodes: WBSNode[]) => {
      nodes.forEach(node => {
        result.push(node);
        if (expandedTasks.has(node.task.id) && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(wbsTree);
    return result;
  }, [wbsTree, expandedTasks]);

  // EVM計算（全タスクから）
  const evmMetrics = useMemo(() => {
    const leaves: Task[] = [];
    const collectLeaves = (nodes: WBSNode[]) => {
      nodes.forEach(n => { if (n.isLeaf) leaves.push(n.task); else collectLeaves(n.children); });
    };
    collectLeaves(wbsTree);

    const BAC = leaves.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    const today = new Date();
    const PV = leaves.reduce((s, t) => {
      if (!t.dueDate) return s;
      return parseISO(t.dueDate) <= today ? s + (t.estimatedHours ?? 0) : s;
    }, 0);
    const EV = leaves.reduce((s, t) => s + ((t.progress / 100) * (t.estimatedHours ?? 0)), 0);
    const AC = leaves.reduce((s, t) => s + (t.actualHours ?? 0), 0);
    const CV = EV - AC;
    const SV = EV - PV;
    const CPI = AC > 0 ? EV / AC : null;
    const SPI = PV > 0 ? EV / PV : null;
    const ETC = CPI && CPI > 0 ? (BAC - EV) / CPI : BAC - EV;
    const EAC = AC + ETC;
    const TCPI = BAC - AC > 0 ? (BAC - EV) / (BAC - AC) : null;

    return { BAC, PV, EV, AC, CV, SV, CPI, SPI, ETC, EAC, TCPI };
  }, [wbsTree]);

  // 統計
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => {
      if (t.status === 'done') return false;
      return t.dueDate && isAfter(startOfDay(new Date()), startOfDay(parseISO(t.dueDate)));
    }).length;
    return { total, completed, inProgress, overdue };
  }, [filteredTasks]);

  const toggleExpand = (taskId: string) => {
    const s = new Set(expandedTasks);
    if (s.has(taskId)) s.delete(taskId); else s.add(taskId);
    setExpandedTasks(s);
  };
  const expandAll = () => setExpandedTasks(new Set(tasks.map(t => t.id)));
  const collapseAll = () => setExpandedTasks(new Set());

  const getTaskStatus = (task: Task) => {
    const today = startOfDay(new Date());
    const due = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (task.status === 'done') return { type: 'completed', color: 'text-green-700', bg: 'bg-green-100', label: '完了' };
    if (due && isAfter(today, due)) return { type: 'overdue', color: 'text-red-700', bg: 'bg-red-100', label: '遅延' };
    if (due && differenceInDays(due, today) <= 3) return { type: 'urgent', color: 'text-orange-700', bg: 'bg-orange-100', label: '期限間近' };
    if (task.status === 'in_progress') return { type: 'in-progress', color: 'text-blue-700', bg: 'bg-blue-100', label: '進行中' };
    return { type: 'todo', color: 'text-gray-600', bg: 'bg-gray-100', label: '未着手' };
  };

  const getStatusIcon = (task: Task) => {
    const s = getTaskStatus(task);
    if (s.type === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (s.type === 'overdue') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (s.type === 'urgent') return <Clock className="w-4 h-4 text-orange-500" />;
    if (s.type === 'in-progress') return <Target className="w-4 h-4 text-blue-500" />;
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const cycleStatus = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    try {
      await taskService.update(task.id, { status: next[task.status] });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const getPriority = (p: string) => ({
    high: { label: '高', dot: 'bg-red-500', text: 'text-red-700' },
    medium: { label: '中', dot: 'bg-yellow-500', text: 'text-yellow-700' },
    low: { label: '低', dot: 'bg-green-500', text: 'text-green-700' },
  }[p] ?? { label: '中', dot: 'bg-yellow-500', text: 'text-yellow-700' });

  const getDuration = (task: Task): number | null => {
    if (!task.startDate || !task.dueDate) return null;
    const d = differenceInCalendarDays(parseISO(task.dueDate), parseISO(task.startDate)) + 1;
    return d > 0 ? d : 1;
  };

  // インライン編集
  const startEdit = (e: React.MouseEvent, taskId: string, field: EditingCell['field'], currentValue: number | undefined) => {
    e.stopPropagation();
    setEditingCell({ taskId, field, value: String(currentValue ?? 0) });
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const saveEdit = async () => {
    if (!editingCell || savingCell) return;
    setSavingCell(true);
    try {
      const num = parseFloat(editingCell.value);
      if (!isNaN(num)) {
        if (editingCell.field === 'progress') {
          await taskService.update(editingCell.taskId, { progress: Math.min(100, Math.max(0, Math.round(num))) });
        } else if (editingCell.field === 'estimatedHours') {
          await taskService.update(editingCell.taskId, { estimatedHours: Math.max(0, num) });
        } else if (editingCell.field === 'actualHours') {
          await taskService.update(editingCell.taskId, { actualHours: Math.max(0, num) });
        }
        onUpdate();
      }
    } catch (err) { console.error(err); }
    setEditingCell(null);
    setSavingCell(false);
  };

  // 子タスク追加
  const saveAddChild = async () => {
    if (!addingChild?.title.trim()) { setAddingChild(null); return; }
    const projectId = tasks[0]?.project?.id;
    if (!projectId) { setAddingChild(null); return; }
    try {
      await taskService.create({
        title: addingChild.title.trim(),
        projectId,
        dependsOn: [addingChild.parentId],
        priority: 'medium',
      });
      setExpandedTasks(prev => new Set([...prev, addingChild.parentId]));
      onUpdate();
    } catch (err) { console.error(err); }
    setAddingChild(null);
  };

  // 削除
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await taskService.delete(deleteConfirm.taskId);
      onUpdate();
    } catch (err) { console.error(err); }
    setDeleteConfirm(null);
  };

  // CSVエクスポート
  const exportCSV = () => {
    const headers = ['No.', 'タスク名', 'ステータス', '優先度', '担当者', '開始日', '期限', '期間(日)', '予定工数(h)', '実績工数(h)', '残工数(h)', '進捗(%)', '先行タスク'];
    const flatAll: WBSNode[] = [];
    const flattenAll = (nodes: WBSNode[]) => nodes.forEach(n => { flatAll.push(n); flattenAll(n.children); });
    flattenAll(wbsTree);

    const rows = flatAll.map(n => {
      const t = n.task;
      const remaining = Math.max(0, n.rolledUpEstimated - n.rolledUpActual);
      const dur = getDuration(t);
      const preds = (t.dependencies ?? []).map(d => wbsNumberMap.get(d.dependsOn.id) ?? d.dependsOn.title).join('; ');
      const assigneeName = t.assignee?.name ?? (t.assignees?.[0]?.user.name ?? '');
      return [
        n.wbsNumber,
        `"${'  '.repeat(n.level)}${t.title.replace(/"/g, '""')}"`,
        getTaskStatus(t).label,
        getPriority(t.priority).label,
        assigneeName,
        t.startDate ? format(parseISO(t.startDate), 'yyyy/MM/dd') : '',
        t.dueDate ? format(parseISO(t.dueDate), 'yyyy/MM/dd') : '',
        dur ?? '',
        n.rolledUpEstimated || '',
        n.rolledUpActual || '',
        remaining || '',
        Math.round(n.rolledUpProgress),
        preds,
      ].join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wbs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const renderEditableNumber = (node: WBSNode, field: EditingCell['field'], value: number | undefined, suffix: string = '') => {
    const isEditing = editingCell?.taskId === node.task.id && editingCell?.field === field;
    if (!node.isLeaf) {
      const disp = field === 'estimatedHours' ? node.rolledUpEstimated
        : field === 'actualHours' ? node.rolledUpActual
        : node.rolledUpProgress;
      return <span className="text-xs text-gray-500 italic">{disp > 0 ? `${disp.toFixed(1)}${suffix}` : '-'}</span>;
    }
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="number"
          value={editingCell.value}
          onChange={e => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
          onBlur={saveEdit}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCell(null); }}
          onClick={e => e.stopPropagation()}
          className="w-14 text-right text-xs border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
    }
    const display = value != null && value > 0 ? `${value}${suffix}` : '-';
    return (
      <span
        className="cursor-pointer text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-1 rounded"
        onClick={e => startEdit(e, node.task.id, field, value)}
        title="クリックして編集"
      >
        {display}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">WBS</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEVM(!showEVM)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showEVM ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <TrendingUp className="w-4 h-4" />
              EVM
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button onClick={expandAll} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">すべて展開</button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">折りたたむ</button>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="検索..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="all">全ステータス</option>
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="all">全優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="default">並び順</option>
            <option value="priority">優先度順</option>
            <option value="dueDate">期限順</option>
            <option value="status">ステータス順</option>
          </select>
          <button
            onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${showMyTasksOnly ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <User className="w-3.5 h-3.5" />
            自分のタスク
          </button>
        </div>

        {/* 統計 */}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>全 <b className="text-gray-800">{stats.total}</b> 件</span>
          <span className="text-green-600">完了 <b>{stats.completed}</b></span>
          <span className="text-blue-600">進行中 <b>{stats.inProgress}</b></span>
          <span className="text-red-500">遅延 <b>{stats.overdue}</b></span>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto flex-1">
        <div style={{ minWidth: '1180px' }}>
          {/* ヘッダー行 */}
          <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide sticky top-0 z-10">
            <div className="w-16 px-2 py-2.5 flex-shrink-0 sticky left-0 bg-gray-50 z-20">No.</div>
            <div className="w-8 flex-shrink-0" />
            <div className="w-64 px-2 py-2.5 flex-shrink-0">タスク名</div>
            <div className="w-22 px-2 py-2.5 flex-shrink-0">ステータス</div>
            <div className="w-14 px-2 py-2.5 flex-shrink-0">優先度</div>
            <div className="w-28 px-2 py-2.5 flex-shrink-0">担当者</div>
            <div className="w-20 px-2 py-2.5 flex-shrink-0">開始日</div>
            <div className="w-20 px-2 py-2.5 flex-shrink-0">期限日</div>
            <div className="w-14 px-2 py-2.5 text-right flex-shrink-0">期間</div>
            <div className="w-16 px-2 py-2.5 text-right flex-shrink-0">予定(h)</div>
            <div className="w-16 px-2 py-2.5 text-right flex-shrink-0">実績(h)</div>
            <div className="w-16 px-2 py-2.5 text-right flex-shrink-0">残工数</div>
            <div className="w-32 px-2 py-2.5 flex-shrink-0">進捗</div>
            <div className="w-16 px-2 py-2.5 flex-shrink-0" />
          </div>

          {/* データ行 */}
          <div>
            {visibleNodes.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">表示するタスクがありません</p>
              </div>
            ) : (
              visibleNodes.map(node => {
                const { task, level, wbsNumber, isLeaf, rolledUpEstimated, rolledUpActual, rolledUpProgress } = node;
                const hasChildren = node.children.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                const status = getTaskStatus(task);
                const priority = getPriority(task.priority);
                const duration = getDuration(task);
                const remaining = rolledUpEstimated - rolledUpActual;
                const isMyTask = task.assignee?.id === user?.id || task.assignees?.some(a => a.user.id === user?.id);
                const predecessors = (task.dependencies ?? [])
                  .map(d => wbsNumberMap.get(d.dependsOn.id) ?? null)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div key={task.id}>
                    <div
                      className={`flex items-center border-b border-gray-100 hover:bg-gray-50/80 group transition-colors ${isMyTask ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* WBS No. */}
                      <div className="w-16 px-2 py-2 text-xs text-gray-400 font-mono flex-shrink-0 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                        {wbsNumber}
                      </div>

                      {/* 展開 & ステータスアイコン */}
                      <div
                        className="w-8 flex items-center justify-center flex-shrink-0 py-2"
                        style={{ paddingLeft: `${level * 16}px` }}
                      >
                        {hasChildren ? (
                          <button
                            onClick={e => { e.stopPropagation(); toggleExpand(task.id); }}
                            className="p-0.5 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                          </button>
                        ) : (
                          <button
                            onClick={e => cycleStatus(e, task)}
                            title="クリックでステータス変更"
                            className="hover:scale-110 transition-transform"
                          >
                            {getStatusIcon(task)}
                          </button>
                        )}
                      </div>

                      {/* タスク名 */}
                      <div
                        className="w-64 px-2 py-2 flex-shrink-0 cursor-pointer min-w-0"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex items-center gap-1.5">
                          {hasChildren && (
                            <button
                              onClick={e => cycleStatus(e, task)}
                              title="クリックでステータス変更"
                              className="flex-shrink-0"
                            >
                              {getStatusIcon(task)}
                            </button>
                          )}
                          <span className={`text-sm truncate ${hasChildren ? 'font-semibold text-gray-800' : 'font-medium text-gray-700'}`}>
                            {task.title}
                          </span>
                          {hasChildren && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">({node.children.length})</span>
                          )}
                        </div>
                        {predecessors && (
                          <div className="text-[10px] text-indigo-400 mt-0.5 truncate">先行: {predecessors}</div>
                        )}
                      </div>

                      {/* ステータスバッジ */}
                      <div className="w-22 px-2 py-2 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* 優先度 */}
                      <div className="w-14 px-2 py-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />
                          <span className={`text-xs ${priority.text}`}>{priority.label}</span>
                        </div>
                      </div>

                      {/* 担当者 */}
                      <div className="w-28 px-2 py-2 flex-shrink-0">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
                            <span className="text-xs text-gray-700 truncate">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      {/* 開始日 */}
                      <div className="w-20 px-2 py-2 flex-shrink-0">
                        <span className="text-xs text-gray-600">
                          {task.startDate ? format(parseISO(task.startDate), 'M/d(E)', { locale: ja }) : '-'}
                        </span>
                      </div>

                      {/* 期限日 */}
                      <div className="w-20 px-2 py-2 flex-shrink-0">
                        <span className={`text-xs ${status.type === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {task.dueDate ? format(parseISO(task.dueDate), 'M/d(E)', { locale: ja }) : '-'}
                        </span>
                      </div>

                      {/* 期間 */}
                      <div className="w-14 px-2 py-2 text-right flex-shrink-0">
                        <span className="text-xs text-gray-600">{duration ? `${duration}日` : '-'}</span>
                      </div>

                      {/* 予定工数 */}
                      <div className="w-16 px-2 py-2 text-right flex-shrink-0">
                        {renderEditableNumber(node, 'estimatedHours', task.estimatedHours, 'h')}
                      </div>

                      {/* 実績工数 */}
                      <div className="w-16 px-2 py-2 text-right flex-shrink-0">
                        {renderEditableNumber(node, 'actualHours', task.actualHours, 'h')}
                      </div>

                      {/* 残工数 */}
                      <div className="w-16 px-2 py-2 text-right flex-shrink-0">
                        {rolledUpEstimated > 0 ? (
                          <span className={`text-xs ${remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {remaining.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      {/* 進捗 */}
                      <div className="w-32 px-2 py-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${rolledUpProgress >= 100 ? 'bg-green-500' : rolledUpProgress >= 50 ? 'bg-blue-500' : 'bg-gray-400'}`}
                              style={{ width: `${Math.min(100, rolledUpProgress)}%` }}
                            />
                          </div>
                          <div className="w-10 text-right flex-shrink-0">
                            {isLeaf ? (
                              renderEditableNumber(node, 'progress', task.progress, '%')
                            ) : (
                              <span className="text-xs text-gray-500 italic">{Math.round(rolledUpProgress)}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* アクション */}
                      <div className="w-16 px-2 py-2 flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); setAddingChild({ parentId: task.id, title: '' }); setExpandedTasks(prev => new Set([...prev, task.id])); }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-500"
                          title="子タスクを追加"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm({ taskId: task.id, taskTitle: task.title }); }}
                          className="p-1 hover:bg-red-100 rounded text-red-400"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 子タスク追加行 */}
                    {addingChild?.parentId === task.id && (
                      <div
                        className="flex items-center gap-2 py-2 bg-blue-50 border-b border-blue-200"
                        style={{ paddingLeft: `${(level + 1) * 16 + 80}px` }}
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="子タスクのタイトル..."
                          value={addingChild.title}
                          onChange={e => setAddingChild(prev => prev ? { ...prev, title: e.target.value } : null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveAddChild();
                            if (e.key === 'Escape') setAddingChild(null);
                          }}
                          className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-400"
                        />
                        <button onClick={saveAddChild} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-100 flex-shrink-0">追加</button>
                        <button onClick={() => setAddingChild(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1 flex-shrink-0 mr-2">✕</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EVMパネル */}
      {showEVM && (
        <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-purple-800">アーンドバリュー分析 (EVM)</h4>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {[
              { label: 'BAC', desc: '完成時予算', value: `${evmMetrics.BAC.toFixed(1)}h`, color: 'text-gray-700' },
              { label: 'PV', desc: '計画工数', value: `${evmMetrics.PV.toFixed(1)}h`, color: 'text-blue-700' },
              { label: 'EV', desc: '出来高', value: `${evmMetrics.EV.toFixed(1)}h`, color: 'text-green-700' },
              { label: 'AC', desc: '実績工数', value: `${evmMetrics.AC.toFixed(1)}h`, color: 'text-orange-700' },
              { label: 'CV', desc: 'コスト差異', value: `${evmMetrics.CV >= 0 ? '+' : ''}${evmMetrics.CV.toFixed(1)}h`, color: evmMetrics.CV >= 0 ? 'text-green-700' : 'text-red-700' },
              { label: 'SV', desc: 'スケジュール差異', value: `${evmMetrics.SV >= 0 ? '+' : ''}${evmMetrics.SV.toFixed(1)}h`, color: evmMetrics.SV >= 0 ? 'text-green-700' : 'text-red-700' },
              { label: 'CPI', desc: 'コスト効率', value: evmMetrics.CPI ? evmMetrics.CPI.toFixed(2) : '-', color: !evmMetrics.CPI ? 'text-gray-400' : evmMetrics.CPI >= 1 ? 'text-green-700' : 'text-red-700' },
              { label: 'SPI', desc: 'スケジュール効率', value: evmMetrics.SPI ? evmMetrics.SPI.toFixed(2) : '-', color: !evmMetrics.SPI ? 'text-gray-400' : evmMetrics.SPI >= 1 ? 'text-green-700' : 'text-red-700' },
              { label: 'TCPI', desc: '完成効率指数', value: evmMetrics.TCPI ? evmMetrics.TCPI.toFixed(2) : '-', color: !evmMetrics.TCPI ? 'text-gray-400' : evmMetrics.TCPI <= 1 ? 'text-green-700' : 'text-red-700' },
              { label: 'ETC', desc: '残作業コスト', value: `${evmMetrics.ETC.toFixed(1)}h`, color: 'text-gray-700' },
              { label: 'EAC', desc: '完成時総コスト', value: `${evmMetrics.EAC.toFixed(1)}h`, color: evmMetrics.EAC <= evmMetrics.BAC ? 'text-green-700' : 'text-red-700' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg p-2 border border-purple-100 shadow-sm">
                <div className="text-[10px] text-gray-500 mb-0.5">{item.label}</div>
                <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-gray-400 leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-purple-500">
            CPI≥1: コスト予算内 / SPI≥1: スケジュール順調 / TCPI≤1: 達成可能 / EAC≤BAC: 予算内完成見込み
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">タスクを削除しますか？</h3>
            <p className="text-sm text-gray-600 mb-1">
              「<span className="font-medium">{deleteConfirm.taskTitle}</span>」を削除します。
            </p>
            <p className="text-xs text-red-500 mb-5">この操作は取り消せません。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">削除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
