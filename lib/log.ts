/**
 * Lightweight, env-gated logger.
 *
 * Dev instrumentation (`console.log`/`console.warn`) was spamming the console in
 * both development and production. Route that noise through here instead: it is
 * SILENT by default and only emits when `NEXT_PUBLIC_DEBUG_LOGS=true`. Errors
 * always surface so real failures are never hidden.
 *
 * Usage:
 *   import { log } from "@/lib/log";
 *   log.debug("[Cache HIT]", userId);
 *   log.warn("element not ready");
 *   log.error("save failed", err); // always logged
 */
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";

export const log = {
  debug: (...args: unknown[]): void => {
    if (DEBUG) console.log(...args);
  },
  info: (...args: unknown[]): void => {
    if (DEBUG) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (DEBUG) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

export default log;
