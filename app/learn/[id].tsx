import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { PressScale } from '../../components/PressScale';
import { ARTICLE_CATEGORIES, FEATURED_ARTICLES, articlesByCategory, storyArtFor } from '../../lib/articles';
import { copy } from '../../lib/copy';
import { track } from '../../lib/events';
import { weekIllustration } from '../../lib/illustrations';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

/**
 * Learn, told as VISUAL stories (Luis QA: text-only cards "killed the whole
 * idea"). Each article becomes a short deck — cover, one idea per card, source
 * — and every card leads with a watercolor from the week-illustration set
 * (storyArtFor curates the sequence per article). Art is dominant, the caption
 * is short. Tap the right edge (or the card) to continue, the left edge to go
 * back, swipe down to leave. No auto-advance — reading pace is hers.
 */

/** A card never exceeds this many characters, so the art stays the hero. */
const MAX_CARD = 260;

/** Split a long paragraph at sentence boundaries — never mid-sentence. */
function splitSentences(p: string): string[] {
  // Split where terminal punctuation is followed by a new sentence
  // (whitespace + capital/quote). Abbreviations like "2 a.m." survive because
  // what follows them is lowercase.
  return p.replace(/([.!?])\s+(?=[A-Z"“'‘(])/g, '$1\u0001').split('\u0001');
}

/** Group sentences into glanceable caption cards — one idea per screen. */
function buildCards(body: string): string[] {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const cards: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= MAX_CARD) {
      cards.push(p);
      continue;
    }
    let current = '';
    for (const s of splitSentences(p)) {
      const candidate = current ? `${current} ${s}` : s;
      if (current && candidate.length > MAX_CARD) {
        cards.push(current);
        current = s;
      } else {
        current = candidate;
      }
    }
    if (current) cards.push(current);
  }
  return cards;
}

export default function ArticleStory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const article = useMemo(() => {
    const all = [...FEATURED_ARTICLES, ...ARTICLE_CATEGORIES.flatMap((c) => articlesByCategory(c))];
    return all.find((a) => a.id === id) ?? null;
  }, [id]);

  const cards = useMemo(() => (article ? buildCards(article.body) : []), [article]);
  const deck = useMemo(() => (article ? storyArtFor(article) : [12]), [article]);
  // Deck = cover + content cards + source card.
  const total = cards.length + 2;
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;

  // Content analytics: which topics actually get read (drives the Learn roadmap).
  useEffect(() => {
    if (article) track('learn_open', { article: article.id, category: article.category });
  }, [article]);

  // Card-change motion: quick fade + rise, every tap (Luis: "motion everywhere").
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  const finishRef = useRef(false);
  const next = () => {
    if (index >= total - 1) {
      router.back();
      return;
    }
    if (index + 1 === total - 1 && !finishRef.current && article) {
      finishRef.current = true;
      track('learn_complete', { article: article.id, category: article.category });
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  };
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <PressScale onPress={() => router.back()} hitSlop={8} style={{ padding: spacing.screen }}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
      </SafeAreaView>
    );
  }

  const onCover = index === 0;
  const onSource = index === total - 1;
  const body = !onCover && !onSource ? cards[index - 1] : null;
  const cardAnim = {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Progress segments — the story grammar every thumb already knows */}
      <View style={styles.segmentsRow}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i <= index && styles.segmentDone]} />
        ))}
      </View>
      <View style={styles.topBar}>
        <Text style={styles.topLabel} numberOfLines={1}>
          {article.category.toUpperCase()}
        </Text>
        <PressScale onPress={() => router.back()} hitSlop={8} accessibilityLabel={copy.learn.close}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
      </View>

      <View style={styles.stage}>
        {/* Back tap zone */}
        {index > 0 ? (
          <PressScale onPress={prev} style={styles.backZone} accessibilityLabel="Back">
            <View />
          </PressScale>
        ) : null}

        <View style={styles.cardWrap}>
          <Animated.View style={[{ flex: 1 }, cardAnim]}>
            {onCover ? (
              <View style={styles.cover}>
                <View style={styles.artFrame}>
                  <Image source={weekIllustration(deck[0])} style={styles.artImg} resizeMode="cover" />
                </View>
                <Text style={styles.coverTitle}>{article.title}</Text>
                <View style={styles.bylineChip}>
                  <Text style={styles.bylineText}>{copy.learn.byline(article.source)}</Text>
                </View>
                <Text style={styles.tapHint}>Tap to read — one idea at a time</Text>
              </View>
            ) : onSource ? (
              <View style={styles.sourceCard}>
                <View style={styles.sourceIconWrap}>
                  <Ionicons name="checkmark" size={26} color={colors.sage.primary} />
                </View>
                <Text style={styles.sourceTitle}>That's the whole story.</Text>
                <Text style={styles.sourceBody}>{copy.learn.disclaimer}</Text>
                <PressScale
                  onPress={() => Linking.openURL(article.sourceUrl).catch(() => {})}
                  hitSlop={8}
                  style={styles.sourceLink}
                >
                  <Text style={styles.sourceLinkText}>{copy.learn.readSource(article.source)}</Text>
                  <Ionicons name="open-outline" size={14} color={colors.accent.terracotta} />
                </PressScale>
                <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
              </View>
            ) : (
              <PressScale onPress={next} style={styles.bodyCard} accessibilityLabel="Continue">
                <View style={[styles.artFrame, { transform: [{ rotate: index % 2 === 0 ? '1.1deg' : '-1.2deg' }] }]}>
                  <Image
                    source={weekIllustration(deck[(index - 1) % deck.length])}
                    style={styles.artImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.bodyText}>{body}</Text>
                <Text style={styles.tapHintBody}>Tap for the next one</Text>
              </PressScale>
            )}
          </Animated.View>
        </View>

        {/* Forward tap zone */}
        <PressScale onPress={next} style={styles.forwardZone} accessibilityLabel="Continue">
          <View />
        </PressScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  segmentsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border.subtle },
  segmentDone: { backgroundColor: colors.accent.terracotta },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  topLabel: { ...type.labelCaps, color: colors.ink.tertiary, flex: 1, marginRight: spacing.md },
  stage: { flex: 1, flexDirection: 'row' },
  backZone: { width: 54, justifyContent: 'center' },
  forwardZone: { width: 54, justifyContent: 'center' },
  cardWrap: { flex: 1, paddingBottom: spacing.xl },
  // Watercolor, framed like a print — the hero of every card.
  artFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.card,
  },
  artImg: { flex: 1, borderRadius: radius.sm },
  cover: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  coverTitle: { ...type.displayMD, color: colors.ink.primary, textAlign: 'center', marginTop: spacing.lg },
  bylineChip: {
    backgroundColor: colors.sage.soft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  bylineText: { ...type.caption, color: colors.sage.primary },
  tapHint: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xl },
  tapHintBody: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.lg, textAlign: 'center' },
  bodyCard: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xs },
  bodyText: {
    ...type.serifQuote,
    fontSize: 19,
    lineHeight: 30,
    color: colors.ink.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  sourceCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  sourceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sage.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.lg, textAlign: 'center' },
  sourceBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.md, textAlign: 'center' },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg, minHeight: 32 },
  sourceLinkText: { ...type.titleSM, color: colors.accent.terracotta },
});
