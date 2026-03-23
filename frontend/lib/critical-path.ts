import { Task } from '@/types/task';
import { differenceInDays, parseISO } from 'date-fns';

interface CpmNode {
  taskId: string;
  duration: number; // days
  es: number; // earliest start
  ef: number; // earliest finish
  ls: number; // latest start
  lf: number; // latest finish
  float: number;
  successors: string[];
  predecessors: string[];
}

/**
 * Critical Path Method (CPM) calculation.
 * Returns a Set of task IDs that are on the critical path (float === 0).
 */
export function computeCriticalPath(tasks: Task[]): Set<string> {
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // Build adjacency
  const nodes = new Map<string, CpmNode>();

  for (const task of tasks) {
    const startDate = task.startDate ? parseISO(task.startDate) : null;
    const endDate = task.dueDate ? parseISO(task.dueDate) : null;

    let duration = 1;
    if (startDate && endDate) {
      duration = Math.max(1, differenceInDays(endDate, startDate));
    }

    const predecessors: string[] = [];
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        if (taskMap.has(dep.dependsOn.id)) {
          predecessors.push(dep.dependsOn.id);
        }
      }
    }

    nodes.set(task.id, {
      taskId: task.id,
      duration,
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0,
      float: 0,
      successors: [],
      predecessors,
    });
  }

  // Build successors from predecessors
  for (const [id, node] of nodes) {
    for (const predId of node.predecessors) {
      const predNode = nodes.get(predId);
      if (predNode) {
        predNode.successors.push(id);
      }
    }
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  for (const [id, node] of nodes) {
    inDegree.set(id, node.predecessors.filter((p) => nodes.has(p)).length);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    const node = nodes.get(id)!;
    for (const succId of node.successors) {
      const newDeg = (inDegree.get(succId) || 0) - 1;
      inDegree.set(succId, newDeg);
      if (newDeg === 0) queue.push(succId);
    }
  }

  // If there's a cycle or no tasks with dependencies, return empty
  if (topoOrder.length === 0) return new Set();

  // Forward pass: compute ES and EF
  for (const id of topoOrder) {
    const node = nodes.get(id)!;
    let maxPredEf = 0;
    for (const predId of node.predecessors) {
      const predNode = nodes.get(predId);
      if (predNode) {
        maxPredEf = Math.max(maxPredEf, predNode.ef);
      }
    }
    node.es = maxPredEf;
    node.ef = node.es + node.duration;
  }

  // Find project end time
  let projectEnd = 0;
  for (const [, node] of nodes) {
    projectEnd = Math.max(projectEnd, node.ef);
  }

  // Backward pass: compute LS and LF
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const node = nodes.get(topoOrder[i])!;

    if (node.successors.length === 0) {
      node.lf = projectEnd;
    } else {
      let minSuccLs = Infinity;
      for (const succId of node.successors) {
        const succNode = nodes.get(succId);
        if (succNode) {
          minSuccLs = Math.min(minSuccLs, succNode.ls);
        }
      }
      node.lf = minSuccLs;
    }
    node.ls = node.lf - node.duration;
    node.float = node.ls - node.es;
  }

  // Critical path = tasks with float === 0
  const criticalTaskIds = new Set<string>();
  for (const [id, node] of nodes) {
    if (node.float === 0 && node.predecessors.length + node.successors.length > 0) {
      criticalTaskIds.add(id);
    }
  }

  return criticalTaskIds;
}
