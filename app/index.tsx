import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { IntroSplash } from '../components/IntroSplash';
import { useApp } from '../lib/AppContext';

/** Gate: no session → login; no household → onboarding; no pregnancy → due date; else tabs. */
export default function Index() {
  const { session, household, pregnancy, loading } = useApp();
  const [introDone, setIntroDone] = useState(false);

  if (loading || !introDone) {
    return <IntroSplash onDone={() => setIntroDone(true)} />;
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!household) return <Redirect href="/(onboarding)" />;
  if (!pregnancy) return <Redirect href="/(onboarding)/due-date" />;
  return <Redirect href="/(tabs)" />;
}
