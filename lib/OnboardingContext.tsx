import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Role } from './db';

/**
 * Scratch state for the multi-step keepsake onboarding. Screens write here as
 * the parent answers; the final screens persist everything (pregnancy row,
 * profile role, onboarding_answers blob) in one go.
 */
export interface OnboardingData {
  role: Role | null;
  dueDate: string | null; // ISO
  lmp: string | null; // ISO, optional
  firstBaby: 'yes' | 'no' | 'declined' | null;
  vitamins: 'yes' | 'not-yet' | 'different' | null;
  appointment: string | 'not-yet' | null; // ISO date or flag
  feelings: string[];
  nickname: string;
}

const EMPTY: OnboardingData = {
  role: null,
  dueDate: null,
  lmp: null,
  firstBaby: null,
  vitamins: null,
  appointment: null,
  feelings: [],
  nickname: '',
};

interface OnboardingState extends OnboardingData {
  patch: (p: Partial<OnboardingData>) => void;
  reset: () => void;
}

const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(EMPTY);
  const patch = useCallback((p: Partial<OnboardingData>) => setData((d) => ({ ...d, ...p })), []);
  const reset = useCallback(() => setData(EMPTY), []);
  const value = useMemo(() => ({ ...data, patch, reset }), [data, patch, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return v;
}
