import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { ARTICLE_CATEGORIES, FEATURED_ARTICLES, articlesByCategory, heroWeekFor } from '../../lib/articles';
import { copy } from '../../lib/copy';
import { weekIllustration } from '../../lib/illustrations';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

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

        <FadeIn index={1}>
          <Text style={[styles.eyebrow, styles.sectionEyebrow]}>{copy.learn.mostRead}</Text>
        </FadeIn>

        <View style={styles.railWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {FEATURED_ARTICLES.map((a) => (
              <PressScale key={a.id} style={styles.ringItem} onPress={() => openArticle(a.id)}>
                <View style={styles.ringOuter}>
                  <View style={styles.ringInner}>
                    <Image source={weekIllustration(heroWeekFor(a.title, a.category))} style={styles.ringImg} resizeMode="contain" />
                  </View>
                </View>
                <Text style={styles.ringTitle} numberOfLines={2}>{a.title}</Text>
              </PressScale>
            ))}
          </ScrollView>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  scroll: { paddingBottom: spacing.xxl },
  title: { ...type.displayLG, color: colors.ink.primary, marginHorizontal: spacing.lg, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { ...type.bodyMD, color: colors.ink.secondary, marginHorizontal: spacing.lg, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: 'center' },
  eyebrow: { ...type.labelCaps, color: colors.ink.tertiary, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionEyebrow: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.lg, textAlign: 'center' },
  railWrap: { alignItems: 'center' },
  rail: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  ringItem: { alignItems: 'center', marginRight: spacing.lg, width: 88 },
  ringOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.accent.terracotta, padding: 3, justifyContent: 'center', alignItems: 'center' },
  ringInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.bg.paper, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  ringImg: { width: 60, height: 60 },
  ringTitle: { ...type.caption, color: colors.ink.primary, marginTop: spacing.sm, textAlign: 'center', width: 88 },
  categoryTitle: { ...type.titleMD, color: colors.ink.primary, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.paper, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, ...shadow.card },
  rowText: { flex: 1 },
  rowTitle: { ...type.bodyMD, color: colors.ink.primary, fontWeight: '600' },
  rowSource: { ...type.caption, color: colors.ink.tertiary, marginTop: 2 },
});
