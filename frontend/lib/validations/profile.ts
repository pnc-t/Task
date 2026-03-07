import { z } from 'zod';

// プロフィール更新スキーマ
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, '名前は2文字以上で入力してください')
    .max(50, '名前は50文字以内で入力してください')
    .regex(
      /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/,
      '名前に使用できない文字が含まれています'
    )
    .optional(),
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional(),
  avatar: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// パスワード変更スキーマ
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, '現在のパスワードを入力してください'),
    newPassword: z
      .string()
      .min(8, '新しいパスワードは8文字以上で入力してください')
      .max(100, 'パスワードは100文字以内で入力してください')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードは大文字、小文字、数字を含む必要があります'
      ),
    confirmPassword: z
      .string()
      .min(1, '確認パスワードを入力してください'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新しいパスワードは現在のパスワードと異なる必要があります',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
