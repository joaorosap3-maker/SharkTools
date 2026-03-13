/**
 * sanitize.ts — Input sanitization & validation utilities
 * Protects against XSS, SQL injection hints, and malformed data.
 */

/**
 * Strip HTML tags and dangerous characters to prevent XSS.
 * Use on any user-supplied string before rendering or storing.
 */
export function sanitizeText(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as T;
  for (const key in result) {
    const val = result[key];
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeText(val);
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(val as Record<string, unknown>);
    }
  }
  return result;
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate password strength.
 * Rules: min 8 chars, at least 1 letter and 1 number.
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  return { valid: true, message: '' };
}

/**
 * Sanitize a search string (strip special SQL-like chars).
 */
export function sanitizeSearch(value: string): string {
  return value.replace(/[;'"\\%_]/g, '').trim().slice(0, 200);
}

/**
 * Truncate a string to max length (prevents oversized payloads).
 */
export function truncate(value: string, maxLength = 500): string {
  return value.slice(0, maxLength);
}
