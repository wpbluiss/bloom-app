import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Client error capture → error_reports table (panel flag 3: real users must
 * never be invisible). Fire-and-forget by design — reporting must never crash,
 * block, or change the app it watches.
 */

let installed = false;

async function report(message: string, stack?: string | null, context: Record<string, unknown> = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    await supabase.from('error_reports').insert({
      user_id: uid,
      message: message.slice(0, 2000),
      stack: (stack ?? '').slice(0, 8000) || null,
      context: { platform: Platform.OS, ...context },
    });
  } catch {
    // never let reporting throw
  }
}

/** Manually report a caught error worth knowing about. */
export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  const e = error as Error;
  void report(e?.message ?? String(error), e?.stack, { source: 'caught', ...context });
}

/** Install the global JS error handler once (root layout, on cold start). */
export function initErrorReporting(): void {
  if (installed) return;
  installed = true;
  const eu = (global as { ErrorUtils?: {
    getGlobalHandler?: () => (e: Error, f?: boolean) => void;
    setGlobalHandler?: (h: (e: Error, f?: boolean) => void) => void;
  } }).ErrorUtils;
  if (!eu?.setGlobalHandler) return;
  const previous = eu.getGlobalHandler?.();
  eu.setGlobalHandler((error: Error, isFatal?: boolean) => {
    void report(error?.message ?? 'unknown', error?.stack, { fatal: !!isFatal, source: 'global' });
    previous?.(error, isFatal);
  });
}
