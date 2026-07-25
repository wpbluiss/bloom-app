import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'sunny', inactive: 'sunny-outline' },
  journey: { active: 'git-commit', inactive: 'git-commit-outline' },
  learn: { active: 'library', inactive: 'library-outline' },
  journal: { active: 'book', inactive: 'book-outline' },
  wishlist: { active: 'gift', inactive: 'gift-outline' },
  food: { active: 'leaf', inactive: 'leaf-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent.terracotta,
        tabBarInactiveTintColor: colors.ink.tertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          // No fixed height: the bar sizes itself around the home-indicator
          // safe-area inset on every device, so labels are never clipped.
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          const set = icons[route.name] ?? icons.index;
          const name = focused ? set.active : set.inactive;
          if (route.name === 'journal') {
            return (
              <View style={[styles.journalIcon, focused && styles.journalIconActive]}>
                <Ionicons name={name} size={24} color={focused ? colors.accent.terracottaDeep : color} />
              </View>
            );
          }
          return <Ionicons name={name} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="journey" options={{ title: 'Journey' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />
      <Tabs.Screen name="food" options={{ title: 'Food' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  journalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalIconActive: { backgroundColor: colors.accent.terracottaSoft },
});
