import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';

/** Gate: no session → login; no household → onboarding; no pregnancy → due date; else tabs. */
export default function Index() {
  const { session, household, pregnancy, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.canvas }}>
        <ActivityIndicator color={colors.accent.terracotta} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!household) return <Redirect href="/(onboarding)" />;
  if (!pregnancy) return <Redirect href="/(onboarding)/due-date" />;
  return <Redirect href="/(tabs)" />;
}
