import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { FadeIn } from '../components/FadeIn';
import { WeekArt } from '../components/WeekArt';
import { copy } from '../lib/copy';
import { useApp } from '../lib/AppContext';
import { formatLength, formatWeight, weekInfo } from '../lib/weeks';
import { colors, spacing, type } from '../lib/theme';

/**
 * The weekly unlock ceremony: a full-screen keepsake moment when a new
 * pregnancy week begins. Elegant fade/rise only — no confetti.
 */
export default function WeekUnlockScreen() {
  const router = useRouter();
  const { week, pregnancy } = useApp();
  const w = week ?? 4;
  const info = weekInfo(w);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <FadeIn index={0}>
          <Text style={styles.eyebrow}>{copy.weekUnlock.eyebrow}</Text>
        </FadeIn>
        <FadeIn index={1}>
          <Text style={styles.title}>{copy.weekUnlock.title(w)}</Text>
        </FadeIn>
        <FadeIn index={2}>
          <WeekArt week={w} height={300} style={{ marginTop: spacing.xxl }} />
        </FadeIn>
        <FadeIn index={3}>
          <Text style={styles.size}>Size of {info.sizeComparison}</Text>
          <Text style={styles.stats}>
            {formatLength(info.sizeLengthCm)} · {formatWeight(info.sizeWeightG)}
          </Text>
        </FadeIn>
        <FadeIn index={4}>
          <Text style={styles.development} numberOfLines={4}>
            {info.development}
          </Text>
          {pregnancy?.baby_nickname ? (
            <Text style={styles.nickname}>For {pregnancy.baby_nickname}, week by week.</Text>
          ) : null}
        </FadeIn>
      </View>
      <FadeIn index={5}>
        <View style={styles.footer}>
          <Button label={copy.weekUnlock.cta(w)} onPress={() => router.back()} />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  body: { flex: 1, padding: spacing.screen, justifyContent: 'center' },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta, textAlign: 'center' },
  title: { ...type.displayXL, fontSize: 38, lineHeight: 44, color: colors.ink.primary, marginTop: spacing.sm, textAlign: 'center' },
  size: { ...type.serifQuote, color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.xl },
  stats: { ...type.labelCaps, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.sm },
  development: { ...type.bodySM, color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.xl },
  nickname: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.lg },
  footer: { padding: spacing.screen, paddingBottom: spacing.section },
});
