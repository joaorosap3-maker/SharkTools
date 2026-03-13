/**
 * rateLimiter.ts — Client-side rate limiting for login attempts.
 * Blocks repeated requests before they hit Supabase Auth.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}

const WINDOW_MS = 60_000;      // 1 minute sliding window
const MAX_ATTEMPTS = 5;        // max attempts per window
const BLOCK_DURATION_MS = 60_000; // 1 minute block

const loginAttempts: Map<string, AttemptRecord> = new Map();

/**
 * Check if an identifier (email) is rate-limited.
 * Returns { allowed: true } when OK, or { allowed: false, retryAfterSeconds } when blocked.
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (record) {
    // Still in block period?
    if (record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    // Window expired? Reset.
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(identifier);
    } else if (record.count >= MAX_ATTEMPTS) {
      // Exceeded within window — block
      record.blockedUntil = now + BLOCK_DURATION_MS;
      loginAttempts.set(identifier, record);
      return { allowed: false, retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000) };
    }
  }

  return { allowed: true };
}

/**
 * Register a failed login attempt for an identifier.
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now, blockedUntil: 0 });
  } else {
    record.count += 1;
    loginAttempts.set(identifier, record);
  }
}

/**
 * Clear rate limit record on successful login.
 */
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Get remaining attempts before block.
 */
export function getRemainingAttempts(identifier: string): number {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record || now - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
