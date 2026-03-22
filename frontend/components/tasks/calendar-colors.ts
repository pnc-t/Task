import { Task } from '@/types/task';
import { isAfter, startOfDay, parseISO } from 'date-fns';

// Google Calendar 11色パレット（タスクごとに異なる色を割り当て）
const PALETTE = [
  { bg: '#039BE5', hover: '#0288D1', text: 'white' },  // Peacock
  { bg: '#7986CB', hover: '#6872B8', text: 'white' },  // Lavender
  { bg: '#33B679', hover: '#2AA36B', text: 'white' },  // Sage
  { bg: '#8E24AA', hover: '#7B1FA2', text: 'white' },  // Grape
  { bg: '#E67C73', hover: '#D96B62', text: 'white' },  // Flamingo
  { bg: '#F4511E', hover: '#E64A19', text: 'white' },  // Tangerine
  { bg: '#F6BF26', hover: '#F0B200', text: '#333' },   // Banana
  { bg: '#0B8043', hover: '#097138', text: 'white' },   // Basil
  { bg: '#3F51B5', hover: '#3949AB', text: 'white' },   // Blueberry
  { bg: '#616161', hover: '#525252', text: 'white' },   // Graphite
  { bg: '#D81B60', hover: '#C2185B', text: 'white' },   // Cherry
] as const;

const OVERDUE_COLOR = { bg: '#D50000', hover: '#C62828', text: 'white' };
const DONE_COLOR = { bg: '#0B8043', hover: '#097138', text: 'white' };

/** タスクIDから安定したハッシュ値を生成 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isOverdue(task: Task): boolean {
  if (task.status === 'done') return false;
  if (!task.dueDate) return false;
  return isAfter(startOfDay(new Date()), startOfDay(parseISO(task.dueDate)));
}

export function getEventColor(task: Task) {
  if (isOverdue(task)) return OVERDUE_COLOR;
  if (task.status === 'done') return DONE_COLOR;
  // タスクIDに基づいて色を割り当て（同じタスクは常に同じ色）
  const index = hashCode(task.id) % PALETTE.length;
  return PALETTE[index];
}

/** 月ビュー用: ソリッドpillスタイル */
export function getEventPillStyle(task: Task): React.CSSProperties {
  const color = getEventColor(task);
  return {
    backgroundColor: color.bg,
    color: color.text,
  };
}

/** 月ビュー用: ホバー時 */
export function getEventPillHoverBg(task: Task): string {
  return getEventColor(task).hover;
}

/** 週/日ビュー用: ソリッドブロックスタイル */
export function getEventBlockStyle(task: Task): React.CSSProperties {
  const color = getEventColor(task);
  return {
    backgroundColor: color.bg,
    color: color.text,
    borderRadius: '8px',
  };
}

/** 優先度のドットカラー */
export function getPriorityDotColor(priority: string): string {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#22C55E';
    default: return '#9CA3AF';
  }
}
