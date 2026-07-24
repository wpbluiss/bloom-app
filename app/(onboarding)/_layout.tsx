import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.canvas },
        animation: 'fade',
      }}
    />
  );
}
