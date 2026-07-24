import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import {
  Household,
  Pregnancy,
  Profile,
  fetchActivePregnancy,
  fetchHouseholdFor,
  fetchProfile,
} from './db';
import { currentWeek } from './weeks';

interface AppState {
  session: Session | null;
  profile: Profile | null;
  household: Household | null;
  pregnancy: Pregnancy | null;
  week: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (s: Session | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      setHousehold(null);
      setPregnancy(null);
      return;
    }
    try {
      const p = await fetchProfile(s.user.id);
      setProfile(p);
      const h = await fetchHouseholdFor(s.user.id);
      setHousehold(h);
      if (h) {
        const preg = await fetchActivePregnancy(h.id);
        setPregnancy(preg);
      } else {
        setPregnancy(null);
      }
    } catch (e) {
      console.warn('AppContext load failed', e);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await load(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => {
    await load(session);
  }, [load, session]);

  const week = useMemo(() => (pregnancy ? currentWeek(pregnancy.due_date) : null), [pregnancy]);

  const value = useMemo(
    () => ({ session, profile, household, pregnancy, week, loading, refresh, setSession }),
    [session, profile, household, pregnancy, week, loading, refresh]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
