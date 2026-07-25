import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { type Router } from 'expo-router';
import { useApp } from './AppContext';
import { copy } from './copy';
import {
  Entitlements,
  configurePurchases,
  fetchCustomerEntitlements,
  isPurchasesConfigured,
  onCustomerInfo,
} from './revenuecat';

/**
 * Entitlement state for the whole app, and the free-tier limits the gates
 * enforce. In dev mode (no RevenueCat API key in app.json, or the native
 * module missing — Expo Go, pre-IAP TestFlight builds) every flag reads true
 * and no gate ever fires, so behavior is unchanged until purchases go live.
 */

/** Free tier: journal media items (photos + videos) before the Pass is needed. */
export const FREE_MEDIA_LIMIT = 25;
/** Free tier: one-tap +Moment captures per calendar month. */
export const FREE_MOMENTS_PER_MONTH = 10;

export interface EntitlementState {
  loading: boolean;
  /** True when purchases are not wired up — everything reads entitled. */
  devMode: boolean;
  pregnancyPass: boolean;
  plus: boolean;
  memoryBook: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<EntitlementState | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { session } = useApp();
  const userId = session?.user.id ?? null;
  const live = isPurchasesConfigured();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(live);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    void (async () => {
      const ok = await configurePurchases(userId);
      if (cancelled) return;
      if (ok) {
        const current = await fetchCustomerEntitlements();
        if (cancelled) return;
        if (current) setEntitlements(current);
        unsubscribe = onCustomerInfo(setEntitlements);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [live, userId]);

  const refresh = useCallback(async () => {
    const current = await fetchCustomerEntitlements();
    if (current) setEntitlements(current);
  }, []);

  const value = useMemo<EntitlementState>(() => {
    const devMode = !live;
    return {
      loading,
      devMode,
      // Dev mode: everything is entitled — the pre-monetization TestFlight
      // behavior, unchanged.
      pregnancyPass: devMode ? true : entitlements?.pregnancyPass ?? false,
      plus: devMode ? true : entitlements?.plus ?? false,
      memoryBook: devMode ? true : entitlements?.memoryBook ?? false,
      refresh,
    };
  }, [live, loading, entitlements, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEntitlement(): EntitlementState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEntitlement must be used inside EntitlementProvider');
  return v;
}

/**
 * The respectful upgrade prompt every gate uses: a warm explanation, one path
 * to the paywall, and an easy out. Never a hard wall, never guilt.
 */
export function promptForPass(router: Router, gate: { title: string; body: string }): void {
  Alert.alert(gate.title, gate.body, [
    { text: copy.paywall.gateCta, onPress: () => router.push('/paywall') },
    { text: copy.paywall.gateDismiss, style: 'cancel' },
  ]);
}
