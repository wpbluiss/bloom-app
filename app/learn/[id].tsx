import React, { useMemo } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressScale } from '../../components/PressScale';
import { ARTICLE_CATEGORIES, FEATURED_ARTICLES, articlesByCategory } from '../../lib/articles';
import { copy } from '../../lib/copy';
import { weekIllustration } from '../../lib/illustrations';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

/** Article-topic → the week watercolor that best illustrates it. */
const HERO_RULES: { re: RegExp; week: number }[] = [
  { re: /nausea|morning sickness|sick/i, week: 8 },
  { re: /prenatal|appointment|visit|provider/i, week: 10 },
  { re: /building season|growth|grows|growing/i, week: 12 },
  { re: /food|caffeine|eat|nutrition/i, week: 9 },
  { re: /worried|mind|calm|anxious|anxiety/i, week: 6 },
  { re: /sleep|insomnia|rest/i, week: 16 },
  { re: /kick|movement|flutter/i, week: 20 },
  { re: /birth|hospital|labor|labour|delivery/i, week: 38 },
];

function heroWeekFor(title: string, category: string): number {
  const hay = `${title} ${category}`;
  for (const rule of HERO_RULES) if (rule.re.test(hay)) return rule.week;
  return 12;
}

/**
 * Article reader — a native modal page (swipe down to dismiss), with a
 * watercolor hero, a comfortable serif-led measure, the source byline chip,
 * and a link out to the original public guidance.
 */
export default function ArticleReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const article = useMemo(() => {
    const all = [...FEATURED_ARTICLES, ...ARTICLE_CATEGORIES.flatMap((c) => articlesByCategory(c))];
    return all.find((a) => a.id === id) ?? null;
  }, [id]);

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <PressScale onPress={() => router.back()} hitSlop={8} style={{ padding: spacing.screen }}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={{ width: 26 }} />
        <Text style={styles.topLabel}>{article.category.toUpperCase()}</Text>
        <PressScale onPress={() => router.back()} hitSlop={8} accessibilityLabel={copy.learn.close}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image
            source={weekIllustration(heroWeekFor(article.title, article.category))}
            style={styles.heroImg}
            resizeMode="contain"
            accessibilityLabel={`Watercolor illustration for ${article.title}`}
          />
        </View>
        <Text style={styles.caps}>{article.category.toUpperCase()}</Text>
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.bylineChip}>
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.sage.primary} />
          <Text style={styles.bylineText}>{copy.learn.byline(article.source)}</Text>
        </View>
        {article.body.split('\n\n').map((para, i) => (
          <Text key={i} style={styles.body}>
            {para}
          </Text>
        ))}
        <PressScale
          style={styles.sourceCard}
          onPress={() => Linking.openURL(article.sourceUrl).catch(() => {})}
          hitSlop={8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceLabel}>THE ORIGINAL GUIDANCE</Text>
            <Text style={styles.sourceText}>{copy.learn.readSource(article.source)}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.accent.terracotta} />
        </PressScale>
        <Text style={styles.disclaimer}>{copy.learn.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  topLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  heroCard: {
    backgroundColor: colors.bg.paper,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    ...shadow.card,
  },
  heroImg: { width: '100%', height: 190 },
  caps: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.xxl },
  title: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm },
  bylineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sage.soft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  bylineText: { ...type.labelCaps, fontSize: 8.5, letterSpacing: 0.8, color: colors.sage.primary },
  body: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.xl },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  sourceLabel: { ...type.labelCaps, fontSize: 9, color: colors.ink.tertiary },
  sourceText: { ...type.titleSM, color: colors.accent.terracottaDeep, marginTop: spacing.xs },
  disclaimer: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xl, textAlign: 'center' },
});
