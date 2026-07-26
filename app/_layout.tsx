import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  useFonts as useFraunces,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { AppProvider } from '../lib/AppContext';
import { EntitlementProvider } from '../lib/entitlements';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initErrorReporting } from '../lib/errorReporting';
import { track } from '../lib/events';
import { colors } from '../lib/theme';

/**
 * One light, warm navigation theme for the whole app (Luis QA: dismissing a
 * modal flashed an ugly system-gray backdrop). React Navigation's default
 * theme owns the pixels *behind* and *between* screens — modal swipe-downs,
 * fades, the lot — so it now wears Bloom's canvas instead of gray.
 */
const BloomNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg.canvas,
    card: colors.bg.canvas,
    text: colors.ink.primary,
    border: colors.border.subtle,
    primary: colors.accent.terracotta,
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [frauncesLoaded] = useFraunces({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  useEffect(() => {
    if (frauncesLoaded && interLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [frauncesLoaded, interLoaded]);

  // One heartbeat per cold start — the DAU/WAU/MAU denominator — and the safety
  // net that makes real-user errors visible from day one.
  useEffect(() => {
    initErrorReporting();
    track('app_open');
  }, []);

  if (!frauncesLoaded || !interLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.canvas }}>
      <AppProvider>
        <EntitlementProvider>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <ThemeProvider value={BloomNavTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.canvas },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="journal/compose" options={{ presentation: 'modal' }} />
              <Stack.Screen name="journal/player" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="wishlist/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="wishlist/[id]" />
              <Stack.Screen name="learn/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="week-unlock" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            </Stack>
            </ThemeProvider>
          </ErrorBoundary>
        </EntitlementProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
