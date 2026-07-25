import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { colors } from '../lib/theme';

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

  if (!frauncesLoaded || !interLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.canvas }}>
      <AppProvider>
        <EntitlementProvider>
          <StatusBar style="dark" />
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
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="week-unlock" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </EntitlementProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
