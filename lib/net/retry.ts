/**
 * Retry an async operation with exponential backoff + jitter.
 *
 * `shouldRetry` decides which errors are worth retrying (default: all). Errors
 * that are normal outcomes (e.g. an optimistic-concurrency conflict returned as
 * a value, not thrown) are never seen here, so they won't be retried.
 */
export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  factor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    baseMs = 400,
    factor = 2,
    shouldRetry = () => true,
  } = opts;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries || !shouldRetry(error)) throw error;
      const delay =
        baseMs * Math.pow(factor, attempt - 1) + Math.floor(Math.random() * 120);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Heuristic for "transient" failures worth retrying — dropped connections,
 * timeouts, and 5xx responses. Auth errors and 4xx (incl. conflicts) are NOT
 * transient and must be handled by the caller instead.
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: string; code?: string; status?: number };
  const msg = String(e.message ?? error).toLowerCase();
  if (
    /failed to fetch|network ?error|fetch failed|load failed|timeout|timed out|econnreset|socket hang up/.test(
      msg
    )
  ) {
    return true;
  }
  const status =
    typeof e.status === "number"
      ? e.status
      : typeof e.code === "string"
        ? parseInt(e.code, 10)
        : NaN;
  return Number.isFinite(status) && status >= 500;
}
