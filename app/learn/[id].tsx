import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressScale } from '../../components/PressScale';
import { ARTICLE_CATEGORIES, FEATURED_ARTICLES, articlesByCategory } from '../../lib/articles';
import { ArticleArtSVG, artKeyForArticle, articleArtUrl } from '../../lib/articleArt';
import { copy } from '../../lib/copy';
import { track } from '../../lib/events';
import { weekIllustration } from '../../lib/illustrations';
import { colors, radius, spacing, type } from '../../lib/theme';

function buildCards(body: string): string[] {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const cards: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && (current + '\n\n' + p).length > 280) {
      cards.push(current);
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) cards.push(current);
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
  const total = cards.length + 2;
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (article) track('learn_open', { article: article.id, category: article.category });
  }, [article]);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 300,
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
    setIndex((i) => i + 1);
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const artKey = article ? artKeyForArticle(article.id) : 'default';
  const pngUrl = article ? articleArtUrl(artKey) : null;
  const isGrowthArticle = article?.category === "Baby's growth";
  const heroWeek = article?.id.includes('weeks') ? 10 : null;
  const heroSource = isGrowthArticle && heroWeek ? weekIllustration(heroWeek) : null;

  const cardAnim = {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  if (!article) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{copy.learn.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.tapZone} pointerEvents="box-none">
        <PressScale style={styles.tapLeft} onPress={prev}><View /></PressScale>
        <PressScale style={styles.tapRight} onPress={next}><View /></PressScale>
      </View>

      <Animated.View style={[styles.cardWrap, cardAnim]}>
        {index === 0 && (
          <View style={styles.cover}>
            <View style={styles.artFrame}>
              {pngUrl ? (
                <Image source={{ uri: pngUrl }} style={styles.artImg} resizeMode="contain" />
              ) : isGrowthArticle && heroSource ? (
                <Image source={heroSource} style={styles.artImg} resizeMode="contain" />
              ) : (
                <View style={styles.artSvg}>
                  <ArticleArtSVG art={artKey} size={180} />
                </View>
              )}
            </View>
            <View style={styles.coverText}>
              <Text style={styles.coverTitle}>{article.title}</Text>
              <View style={styles.sourceChip}>
                <Text style={styles.sourceChipText}>{copy.learn.byline(article.source)}</Text>
              </View>
            </View>
          </View>
        )}

        {index > 0 && index < total - 1 && (
          <View style={styles.contentCard}>
            <View style={styles.artFrameSmall}>
              {pngUrl ? (
                <Image source={{ uri: pngUrl }} style={styles.artImgSmall} resizeMode="contain" />
              ) : (
                <View style={styles.artSvgSmall}>
                  <ArticleArtSVG art={artKey} size={140} />
                </View>
              )}
            </View>
            <View style={styles.captionBox}>
              <Text style={styles.caption}>{cards[index - 1]}</Text>
            </View>
          </View>
        )}

        {index === total - 1 && (
          <View style={styles.sourceCard}>
            <View style={styles.artFrameSmall}>
              <View style={styles.artSvgSmall}>
                <ArticleArtSVG art={artKey} size={120} />
              </View>
            </View>
            <Text style={styles.sourceTitle}>{article.title}</Text>
            <Text style={styles.sourceBody}>{copy.learn.byline(article.source)}</Text>
            <PressScale onPress={() => router.back()}>
              <View style={styles.doneBtn}>
                <Text style={styles.doneText}>{copy.common.done}</Text>
              </View>
            </PressScale>
          </View>
        )}
      </Animated.View>

      <PressScale style={styles.close} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={colors.ink.primary} />
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...type.bodyMD, color: colors.ink.secondary },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink.tertiary, opacity: 0.35 },
  dotActive: { opacity: 1, backgroundColor: colors.accent.terracotta },
  tapZone: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '25%' },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '25%' },
  cardWrap: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  cover: { flex: 1, width: '100%', borderRadius: radius.lg, backgroundColor: colors.bg.paper, overflow: 'hidden', alignItems: 'center', padding: spacing.lg },
  artFrame: { width: 220, height: 220, borderRadius: radius.lg, backgroundColor: colors.bg.canvas, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  artImg: { width: 200, height: 200 },
  artSvg: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  coverText: { alignItems: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
  coverTitle: { ...type.displayMD, color: colors.ink.primary, textAlign: 'center' },
  sourceChip: { marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent.terracottaSoft },
  sourceChipText: { ...type.caption, color: colors.accent.terracottaDeep },
  contentCard: { flex: 1, width: '100%', borderRadius: radius.lg, backgroundColor: colors.bg.paper, overflow: 'hidden', alignItems: 'center', padding: spacing.lg },
  artFrameSmall: { width: 160, height: 160, borderRadius: radius.md, backgroundColor: colors.bg.canvas, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  artImgSmall: { width: 140, height: 140 },
  artSvgSmall: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  captionBox: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  caption: { ...type.bodyMD, color: colors.ink.primary, lineHeight: 24, textAlign: 'center' },
  sourceCard: { flex: 1, width: '100%', borderRadius: radius.lg, backgroundColor: colors.bg.paper, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  sourceTitle: { ...type.titleMD, color: colors.ink.primary, textAlign: 'center' },
  sourceBody: { ...type.caption, color: colors.ink.secondary, textAlign: 'center' },
  doneBtn: { marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.md, backgroundColor: colors.accent.terracotta },
  doneText: { ...type.bodyMD, color: '#fff', fontWeight: '600' },
  close: { position: 'absolute', top: spacing.sm, right: spacing.lg, zIndex: 20, padding: spacing.xs },
});
