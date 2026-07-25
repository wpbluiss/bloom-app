import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PressScale } from '../../components/PressScale';
import { WeekArt } from '../../components/WeekArt';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { weekIllustration } from '../../lib/illustrations';
import { WEEKS, WeekInfo, dailyTip, formatLength, formatWeight, trimesterOf } from '../../lib/weeks';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const TRIMESTER_TITLES = ['The first trimester', 'The second trimester', 'The third trimester'];
const TRIMESTER_RANGES = ['Weeks 4 – 13', 'Weeks 14 – 27', 'Weeks 28 – 40'];

export default function JourneyScreen() {
  const router = useRouter();
  const { pregnancy, week } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<WeekInfo | null>(null);
  const rowY = useRef<Record<number, number>>({});

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.35, { duration: 1200 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1.6 - pulse.value * 0.6,
  }));

  const grouped = useMemo(() => {
    const map = new Map<number, WeekInfo[]>();
    WEEKS.forEach((w) => {
      const t = trimesterOf(w.week);
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(w);
    });
    return map;
  }, []);

  if (!pregnancy) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="map-outline"
          headline={copy.empty.journey.headline}
          body={copy.empty.journey.body}
          cta={copy.empty.journey.cta}
          onCta={() => router.push('/settings')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Journey</Text>
        <Text style={styles.weekCounter}>{copy.global.weekCounter(week ?? 4)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, ((week ?? 4) / 40) * 100)}%` }]} />
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        onContentSizeChange={() => {
          const y = rowY.current[week ?? 4];
          if (y) scrollRef.current?.scrollTo({ y: Math.max(0, y - 200), animated: false });
        }}
      >
        {[1, 2, 3].map((t) => (
          <View key={t}>
            <Text style={styles.trimesterTitle}>{TRIMESTER_TITLES[t - 1]}</Text>
            <Text style={styles.trimesterRange}>{TRIMESTER_RANGES[t - 1]}</Text>
            <View style={styles.timeline}>
              <View style={styles.spine} />
              {(grouped.get(t) ?? []).map((w) => {
                const isPast = w.week < (week ?? 4);
                const isCurrent = w.week === week;
                return (
                  <View
                    key={w.week}
                    style={styles.row}
                    onLayout={(e) => {
                      rowY.current[w.week] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.rail}>
                      {isCurrent ? (
                        <View style={styles.currentNodeWrap}>
                          <Animated.View style={[styles.pulseRing, pulseStyle]} />
                          <View style={styles.currentNode} />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.node,
                            isPast
                              ? { backgroundColor: colors.sage.primary, borderColor: colors.sage.primary }
                              : { borderColor: colors.ink.tertiary },
                          ]}
                        />
                      )}
                    </View>
                    {isCurrent ? (
                      <PressScale style={styles.currentCard} onPress={() => setSelected(w)}>
                        <WeekArt week={w.week} height={132} />
                        <Text style={styles.currentCaps}>WEEK {w.week} · NOW</Text>
                        <Text style={styles.currentHeadline}>{w.headline}</Text>
                        <Text style={styles.currentSize}>Size of {w.sizeComparison}</Text>
                        <View style={styles.currentStats}>
                          <Text style={styles.currentStat}>{formatLength(w.sizeLengthCm)}</Text>
                          <View style={styles.currentStatDivider} />
                          <Text style={styles.currentStat}>{formatWeight(w.sizeWeightG)}</Text>
                        </View>
                      </PressScale>
                    ) : (
                      <PressScale style={styles.weekCard} onPress={() => setSelected(w)}>
                        <View style={styles.thumbPaper}>
                          <Image source={weekIllustration(w.week)} style={styles.thumb} resizeMode="contain" />
                        </View>
                        <View style={styles.weekText}>
                          <Text style={[styles.weekCaps, isPast && { color: colors.sage.primary }]}>
                            WEEK {w.week}
                          </Text>
                          <Text style={styles.weekTitle}>{w.headline}</Text>
                          <Text style={styles.weekSize}>Size of {w.sizeComparison}</Text>
                        </View>
                      </PressScale>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Week detail sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.scrim}>
          <PressScale style={styles.scrimTouch} onPress={() => setSelected(null)} />
          <View style={styles.sheet}>
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: spacing.xxl + insets.bottom }}>
                <View style={styles.grabber} />
                <Text style={styles.eyebrow}>
                  WEEK {selected.week} · TRIMESTER {trimesterOf(selected.week)}
                </Text>
                <Text style={styles.sheetHeadline}>{selected.headline}</Text>
                <WeekArt week={selected.week} height={200} style={{ marginTop: spacing.lg }} />
                <Text style={styles.sizeQuote}>Size of {selected.sizeComparison}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{formatLength(selected.sizeLengthCm)}</Text>
                    <Text style={styles.statLabel}>LENGTH</Text>
                  </View>
                  <View style={styles.statSheetDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{formatWeight(selected.sizeWeightG)}</Text>
                    <Text style={styles.statLabel}>WEIGHT</Text>
                  </View>
                </View>
                <Text style={styles.sectionLabel}>YOUR BABY</Text>
                <Text style={styles.body}>{selected.development}</Text>
                <Text style={styles.sectionLabel}>FOR YOU</Text>
                <Text style={styles.body}>{dailyTip(selected.momTips, pregnancy.due_date)}</Text>
                <Text style={styles.sectionLabel}>FOR YOUR PARTNER</Text>
                <Text style={styles.body}>{dailyTip(selected.partnerTips, pregnancy.due_date)}</Text>
                <Button label="Close" variant="secondary" onPress={() => setSelected(null)} style={{ marginTop: spacing.xxl }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  weekCounter: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.sm },
  progressTrack: { height: 2, backgroundColor: colors.border.subtle, borderRadius: 1, marginTop: spacing.sm },
  progressFill: { height: 2, backgroundColor: colors.accent.terracotta },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  trimesterTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.section },
  trimesterRange: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xs, marginBottom: spacing.lg },
  timeline: { position: 'relative' },
  spine: {
    position: 'absolute',
    left: 15,
    top: 8,
    bottom: 8,
    width: 1.5,
    backgroundColor: colors.border.strong,
    opacity: 0.6,
  },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  rail: { width: 32, alignItems: 'center' },
  node: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: colors.bg.canvas, marginTop: 26 },
  currentNodeWrap: { marginTop: 18, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  currentNode: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.accent.terracotta, backgroundColor: colors.bg.canvas },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent.terracotta,
  },
  weekCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  thumbPaper: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.bg.paper,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { width: 48, height: 48 },
  weekText: { flex: 1 },
  weekCaps: { ...type.labelCaps, color: colors.ink.tertiary },
  weekTitle: { ...type.titleSM, color: colors.ink.primary, marginTop: 2 },
  weekSize: { ...type.caption, color: colors.ink.secondary, marginTop: 2 },
  currentCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent.terracotta,
    padding: spacing.lg,
    ...shadow.glow,
  },
  currentCaps: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.md },
  currentHeadline: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.xs },
  currentSize: { ...type.serifQuote, color: colors.ink.secondary, marginTop: spacing.xs },
  currentStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  currentStat: { ...type.labelMD, color: colors.ink.secondary },
  currentStatDivider: { width: 1, height: 14, backgroundColor: colors.border.subtle },
  scrim: { flex: 1, backgroundColor: colors.overlay.scrim, justifyContent: 'flex-end' },
  scrimTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.bg.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  sheetHeadline: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm },
  sizeQuote: { ...type.serifQuote, color: colors.ink.secondary, marginTop: spacing.md, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  stat: { alignItems: 'center', paddingHorizontal: spacing.xxl },
  statValue: { ...type.displayMD, color: colors.ink.primary },
  statLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xs },
  statSheetDivider: { width: 1, height: 36, backgroundColor: colors.border.subtle },
  sectionLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xxl },
  body: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
});
