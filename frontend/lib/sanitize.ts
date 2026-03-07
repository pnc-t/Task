import DOMPurify from 'dompurify';

/**
 * HTML コンテンツをサニタイズしてセキュアな形式に変換
 * XSS 攻撃から保護します
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * プレーンテキストのみを許可（全HTML タグを削除）
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * URL をサニタイズして安全性を確認
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // http/https のみ許可
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}
