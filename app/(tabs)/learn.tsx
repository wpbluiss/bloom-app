import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { ARTICLE_CATEGORIES, FEATURED_ARTICLES, articlesByCategory } from '../../lib/articles';
import { copy } from '../../lib/copy';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

/**
 * Learn — calm, institution-sourced reading. A "Most read" rail of featured
 * articles, then category sections. Tapping any article opens the reader as a
 * native modal page (swipe down to dismiss).
 */
export default function LearnScreen() {
  const router = useRouter();

  const openArticle = (id: string) => router.push(`/learn/${id}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeIn index={0}>
          <Text style={styles.title}>{copy.learn.title}</Text>
          <Text style={styles.subtitle}>{copy.learn.subtitle}</Text>
        </FadeIn>

        {/* Most read — featured rail */}
        <FadeIn index={1}>
          <Text style={[styles.eyebrow, styles.sectionEyebrow]}>{copy.learn.mostRead}</Text>
        </FadeIn>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          style={styles.railScroll}
        >
          {FEATURED_ARTICLES.map((a) => (
            <PressScale key={a.id} style={styles.featureCard} onPress={() => openArticle(a.id)}>
              <Text style={styles.featureCaps}>{a.category.toUpperCase()}</Text>
              <Text style={styles.featureTitle}>{a.title}</Text>
              <View style={styles.bylineChip}>
                <Text style={styles.bylineText}>{copy.learn.byline(a.source)}</Text>
              </View>
            </PressScale>
          ))}
        </ScrollView>

        {/* Category sections */}
        {ARTICLE_CATEGORIES.map((cat, ci) => {
          const items = articlesByCategory(cat);
          if (items.length === 0) return null;
          return (
            <FadeIn key={cat} index={2 + ci}>
              <Text style={styles.categoryTitle}>{cat}</Text>
              {items.map((a) => (
                <PressScale key={a.id} style={styles.rowCard} onPress={() => openArticle(a.id)}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{a.title}</Text>
                    <Text style={styles.rowSource}>{copy.learn.byline(a.source)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink.tertiary} />
                </PressScale>
              ))}
            </FadeIn>
          );
        })}

        <Text style={styles.disclaimer}>{copy.learn.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  scroll: { paddingBottom: spacing.hero },
  title: {
    ...type.displayLG,
    color: colors.ink.primary,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...type.bodySM,
    color: colors.ink.secondary,
    paddingHorizontal: spacing.screen,
    marginTop: spacing.sm,
  },
  eyebrow: { ...type.labelCaps, color: colors.ink.tertiary },
  sectionEyebrow: { paddingHorizontal: spacing.screen, marginTop: spacing.section },
  railScroll: { marginTop: spacing.md },
  rail: { paddingHorizontal: spacing.screen, gap: spacing.md },
  featureCard: {
    width: 236,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    ...shadow.card,
  },
  featureCaps: { ...type.labelCaps, fontSize: 9, color: colors.accent.terracotta },
  featureTitle: { ...type.displayMD, fontSize: 19, lineHeight: 24, color: colors.ink.primary, marginTop: spacing.sm },
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
  categoryTitle: {
    ...type.displayMD,
    color: colors.ink.primary,
    paddingHorizontal: spacing.screen,
    marginTop: spacing.section,
    marginBottom: spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginHorizontal: spacing.screen,
    marginTop: spacing.sm,
    ...shadow.card,
  },
  rowText: { flex: 1 },
  rowTitle: { ...type.titleSM, color: colors.ink.primary },
  rowSource: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  disclaimer: {
    ...type.caption,
    color: colors.ink.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.screen,
    marginTop: spacing.section,
  },
});
