import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/Button';
import { FadeIn } from '../../components/FadeIn';
import { copy } from '../../lib/copy';
import { colors, spacing, type } from '../../lib/theme';

function Sprout() {
  // Thin line illustration: a sprouting stem in terracotta
  return (
    <Svg width={72} height={96} viewBox="0 0 72 96" fill="none">
      <Path
        d="M36 92V44M36 44C36 30 28 22 12 20C14 36 22 44 36 44ZM36 44C36 30 44 22 60 20C58 36 50 44 36 44Z"
        stroke={colors.accent.terracotta}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M24 92H48" stroke={colors.accent.terracotta} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <FadeIn index={0}>
          <View style={styles.sprout}>
            <Sprout />
          </View>
        </FadeIn>
        <FadeIn index={1}>
          <Text style={styles.wordmark}>{copy.welcome.wordmark}</Text>
        </FadeIn>
        <FadeIn index={2}>
          <Text style={styles.subline}>"{copy.welcome.subline}"</Text>
        </FadeIn>
      </View>
      <FadeIn index={3}>
        <View style={styles.footer}>
          <Button label={copy.welcome.primary} onPress={() => router.push('/(onboarding)/role')} />
          <Button
            label={copy.welcome.secondary}
            variant="secondary"
            onPress={() => router.push('/(onboarding)/role')}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screen },
  sprout: { marginBottom: spacing.xxl },
  wordmark: { ...type.displayXL, fontSize: 44, lineHeight: 50, color: colors.ink.primary },
  subline: {
    ...type.serifQuote,
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: { padding: spacing.screen, paddingBottom: spacing.section },
});
