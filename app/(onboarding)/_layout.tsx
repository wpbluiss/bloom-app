import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../lib/OnboardingContext';
import { colors } from '../../lib/theme';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.canvas },
          animation: 'fade',
        }}
      />
    </OnboardingProvider>
  );
}
