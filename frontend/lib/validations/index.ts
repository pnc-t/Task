import { z, ZodError, ZodSchema } from 'zod';

// バリデーション結果の型
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * データをZodスキーマでバリデーションする
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'バリデーションエラーが発生しました' } };
  }
}

/**
 * 非同期でデータをZodスキーマでバリデーションする
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果のPromise
 */
export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'バリデーションエラーが発生しました' } };
  }
}

/**
 * ZodErrorからエラーメッセージを抽出する
 * @param error ZodError
 * @returns エラーメッセージのRecord
 */
export function extractZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

// 各スキーマをエクスポート
export * from './auth';
export * from './task';
export * from './project';
export * from './profile';
