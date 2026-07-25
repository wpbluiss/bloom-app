import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat plumbing for Bloom monetization.
 *
 * Two products (App Store Connect):
 *   - bloom_pregnancy_pass_v1  — $49.99 non-consumable, the flagship
 *   - bloom_plus_monthly_v1    — $4.99/mo auto-renewable, post-pregnancy continuity
 * Three entitlements (RevenueCat dashboard): pregnancy_pass, plus, memory_book.
 *
 * CRITICAL: this module must never break a build that ships without purchases.
 * The iOS API key lives in app.json → expo.extra.revenueCatAppleKey. While it is
 * still the placeholder (REVENUECAT_API_KEY_HERE) — or the native module is
 * missing (Expo Go, or a build made before `npx expo install
 * react-native-purchases`) — everything here no-ops and useEntitlement()
 * reports devMode, where every feature is free. Tonight's TestFlight build is
 * therefore byte-for-byte behavior-identical until Luis pastes a real key.
 */

export const ENTITLEMENT_IDS = {
  pregnancyPass: 'pregnancy_pass',
  plus: 'plus',
  memoryBook: 'memory_book',
} as const;

export const PRODUCT_IDS = {
  pregnancyPass: 'bloom_pregnancy_pass_v1',
  plusMonthly: 'bloom_plus_monthly_v1',
} as const;

export const API_KEY_PLACEHOLDER = 'REVENUECAT_API_KEY_HERE';

/** Client-facing entitlement flags (keys are ours; values come from RevenueCat). */
export interface Entitlements {
  pregnancyPass: boolean;
  plus: boolean;
  memoryBook: boolean;
}

type PurchasesStatic = typeof import('react-native-purchases').default;

let purchases: PurchasesStatic | null = null;
let loadAttempted = false;
let configured = false;

/**
 * Lazily require react-native-purchases. A static `import` would crash the whole
 * bundle at startup in Expo Go (native module absent); a lazy require inside
 * try/catch degrades to dev mode instead.
 */
export function getPurchases(): PurchasesStatic | null {
  if (loadAttempted) return purchases;
  loadAttempted = true;
  try {
    // Metro bundles this literal require; at runtime it throws when the native
    // side is missing, and we catch it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases') as typeof import('react-native-purchases');
    purchases = mod.default ?? null;
  } catch (e) {
    console.warn('RevenueCat native module unavailable — dev mode (everything free).', e);
    purchases = null;
  }
  return purchases;
}

/** The iOS API key from app.json extra, or null while the placeholder stands. */
export function readApiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as { revenueCatAppleKey?: string };
  const key = extra.revenueCatAppleKey;
  if (!key || key === API_KEY_PLACEHOLDER) return null;
  return key;
}

/** True only when a real key exists AND the native module loaded (iOS only). */
export function isPurchasesConfigured(): boolean {
  return Platform.OS === 'ios' && readApiKey() !== null && getPurchases() !== null;
}

/** Idempotent configure; safe to call on every cold start. */
export async function configurePurchases(appUserId: string | null): Promise<boolean> {
  const Purchases = getPurchases();
  const apiKey = readApiKey();
  if (!Purchases || !apiKey || Platform.OS !== 'ios') return false;
  try {
    if (!configured) {
      Purchases.configure({ apiKey });
      configured = true;
    }
    if (appUserId) {
      await Purchases.logIn(appUserId);
    }
    return true;
  } catch (e) {
    console.warn('RevenueCat configure failed', e);
    return false;
  }
}

export function entitlementsFrom(info: CustomerInfo): Entitlements {
  const active = info.entitlements.active;
  return {
    pregnancyPass: Boolean(active[ENTITLEMENT_IDS.pregnancyPass]),
    plus: Boolean(active[ENTITLEMENT_IDS.plus]),
    memoryBook: Boolean(active[ENTITLEMENT_IDS.memoryBook]),
  };
}

/** Current entitlements, or null when purchases are unavailable. */
export async function fetchCustomerEntitlements(): Promise<Entitlements | null> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return entitlementsFrom(info);
  } catch (e) {
    console.warn('RevenueCat getCustomerInfo failed', e);
    return null;
  }
}

/** Subscribe to entitlement changes (e.g. after a purchase renews). Returns unsubscribe. */
export function onCustomerInfo(cb: (entitlements: Entitlements) => void): (() => void) | null {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return null;
  const listener = (info: CustomerInfo) => cb(entitlementsFrom(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export interface PassOfferings {
  passPackage: PurchasesPackage | null;
  plusPackage: PurchasesPackage | null;
  passPrice: string | null;
  plusPrice: string | null;
}

const EMPTY_OFFERINGS: PassOfferings = {
  passPackage: null,
  plusPackage: null,
  passPrice: null,
  plusPrice: null,
};

/** Live StoreKit prices/packages via RevenueCat offerings; nulls when offline/unconfigured. */
export async function fetchPassOfferings(): Promise<PassOfferings> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return EMPTY_OFFERINGS;
  try {
    const offerings = await Purchases.getOfferings();
    const packages = Object.values(offerings.all).flatMap((o) => o.availablePackages);
    if (offerings.current) packages.push(...offerings.current.availablePackages);
    const passPackage = packages.find((p) => p.product.identifier === PRODUCT_IDS.pregnancyPass) ?? null;
    const plusPackage = packages.find((p) => p.product.identifier === PRODUCT_IDS.plusMonthly) ?? null;
    return {
      passPackage,
      plusPackage,
      passPrice: passPackage?.product.priceString ?? null,
      plusPrice: plusPackage?.product.priceString ?? null,
    };
  } catch (e) {
    console.warn('RevenueCat offerings failed', e);
    return EMPTY_OFFERINGS;
  }
}

export type PurchaseOutcome = 'success' | 'cancelled' | 'error' | 'unavailable';

export interface PurchaseResult {
  outcome: PurchaseOutcome;
  entitlements: Entitlements | null;
}

/** Purchase a package from the current offering. Never throws. */
export async function purchasePackage(pkg: PurchasesPackage | null): Promise<PurchaseResult> {
  const Purchases = getPurchases();
  if (!Purchases || !configured || !pkg) return { outcome: 'unavailable', entitlements: null };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { outcome: 'success', entitlements: entitlementsFrom(customerInfo) };
  } catch (e) {
    if ((e as { userCancelled?: boolean } | null)?.userCancelled) {
      return { outcome: 'cancelled', entitlements: null };
    }
    console.warn('RevenueCat purchase failed', e);
    return { outcome: 'error', entitlements: null };
  }
}

/** Apple-required restore path. Null when unavailable; check flags otherwise. */
export async function restorePurchases(): Promise<Entitlements | null> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return null;
  try {
    const info = await Purchases.restorePurchases();
    return entitlementsFrom(info);
  } catch (e) {
    console.warn('RevenueCat restore failed', e);
    return null;
  }
}
