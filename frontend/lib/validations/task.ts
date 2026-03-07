import { z } from 'zod';

// タスク作成スキーマ
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(200, 'タイトルは200文字以内で入力してください')
    .regex(
      /^[^<>]*$/,
      'タイトルに不正な文字が含まれています'
    ),
  description: z
    .string()
    .max(5000, '説明は5000文字以内で入力してください')
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid('無効なプロジェクトIDです'),
  milestoneId: z.string().uuid('無効なマイルストーンIDです').optional().nullable(),
  parentId: z.string().uuid('無効な親タスクIDです').optional().nullable(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// タスク更新スキーマ
export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// コメント作成スキーマ
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(2000, 'コメントは2000文字以内で入力してください'),
  taskId: z.string().uuid('無効なタスクIDです'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
