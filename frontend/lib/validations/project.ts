import { z } from 'zod';

// プロジェクト作成スキーマ
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'プロジェクト名を入力してください')
    .max(100, 'プロジェクト名は100文字以内で入力してください')
    .regex(
      /^[^<>]*$/,
      'プロジェクト名に不正な文字が含まれています'
    ),
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください')
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// プロジェクト更新スキーマ
export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// マイルストーン作成スキーマ
export const createMilestoneSchema = z.object({
  title: z
    .string()
    .min(1, 'マイルストーン名を入力してください')
    .max(200, 'マイルストーン名は200文字以内で入力してください'),
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid('無効なプロジェクトIDです'),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

// タグ作成スキーマ
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名を入力してください')
    .max(50, 'タグ名は50文字以内で入力してください')
    .regex(
      /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]+$/,
      'タグ名に使用できない文字が含まれています'
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください'),
  projectId: z.string().uuid('無効なプロジェクトIDです'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
