/**
 * Tiny safe logger. Never pass raw objects: only allowlisted, primitive context
 * is printed, so weight/logs/photos/tokens/emails cannot leak by accident.
 */
const SAFE_KEYS = new Set(['code', 'screen', 'route', 'status', 'day', 'op']);

type Primitive = string | number | boolean;
export type LogContext = Record<string, Primitive | null | undefined>;

function format(message: string, context?: LogContext): string {
  if (!context) return message;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(context)) {
    if (!SAFE_KEYS.has(k) || v == null) continue;
    parts.push(`${k}=${String(v).slice(0, 80)}`);
  }
  return parts.length ? `${message} ${parts.join(' ')}` : message;
}

export function warn(message: string, context?: LogContext): void {
  console.warn(format(message, context));
}

export function error(message: string, context?: LogContext): void {
  console.error(format(message, context));
}
