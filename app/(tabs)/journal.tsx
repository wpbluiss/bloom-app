import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { JournalEntry, fetchJournalEntries } from '../../lib/db';
import { weekIllustration } from '../../lib/illustrations';
import { formatISODate } from '../../lib/weeks';
import { GenderAccent, colors, genderAccent, radius, shadow, spacing, type } from '../../lib/theme';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  note: 'pencil-outline',
  milestone: 'star-outline',
  craving: 'ice-cream-outline',
  ultrasound: 'heart-outline',
};

type ViewMode = 'timeline' | 'calendar';
const VIEW_LABELS: Record<ViewMode, string> = { timeline: 'Pages', calendar: 'Calendar' };
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Chapter ornament — hairline, gem, hairline. */
function ChapterMark({ accent }: { accent: GenderAccent }) {
  return (
    <View style={styles.chapterRuleRow}>
      <View style={styles.chapterRule} />
      <View style={[styles.chapterGem, { backgroundColor: accent.primary }]} />
      <View style={styles.chapterRule} />
    </View>
  );
}

/** Diary-style body: a serif drop cap opens longer entries, like a real book. */
function PageBody({ body, accent }: { body: string; accent: GenderAccent }) {
  const first = body.charAt(0);
  if (!/[A-Za-z]/.test(first) || body.length < 30) {
    return <Text style={styles.pageBody}>{body}</Text>;
  }
  return (
    <View style={styles.dropCapRow}>
      <Text style={[styles.dropCap, { color: accent.primary }]}>{first}</Text>
      <Text style={[styles.pageBody, styles.dropCapRest]}>{body.slice(1)}</Text>
    </View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const { household, pregnancy, week } = useApp();
  const accent = genderAccent(pregnancy?.baby_sex);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<ViewMode>('timeline');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!household) return;
    try {
      setEntries(await fetchJournalEntries(household.id));
    } catch (e) {
      console.warn(e);
      setEntries([]);
    }
  }, [household]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /** Entries grouped into chapters — one per week of the pregnancy. */
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, JournalEntry[]>();
    (entries ?? []).forEach((e) => {
      const d = new Date(e.entry_date + 'T12:00:00');
      const month = d.toLocaleDateString(undefined, { month: 'long' });
      const key = e.week_number ? `W${e.week_number}|${month}` : `M|${month} ${d.getFullYear()}`;
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(e);
    });
    return order.map((key) => {
      const [w, month] = key.split('|');
      return { week: w.startsWith('W') ? Number(w.slice(1)) : null, month, items: map.get(key)! };
    });
  }, [entries]);

  // Date → moment count, for the calendar dots and badges.
  const entryDates = useMemo(() => {
    const map = new Map<string, number>();
    (entries ?? []).forEach((e) => map.set(e.entry_date, (map.get(e.entry_date) ?? 0) + 1));
    return map;
  }, [entries]);

  const todayStr = useMemo(() => formatISODate(new Date()), []);

  /** Leading blanks + ISO date strings for the displayed month grid. */
  const calendarCells = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(formatISODate(new Date(y, m, d)));
    return cells;
  }, [calMonth]);

  const entriesForDay = useMemo(
    () => (selectedDay ? (entries ?? []).filter((e) => e.entry_date === selectedDay) : []),
    [entries, selectedDay]
  );

  const shiftMonth = (delta: number) => {
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const editEntry = (e: JournalEntry) =>
    router.push({
      pathname: '/journal/compose',
      params: { id: e.id, type: e.entry_type, title: e.title ?? '', body: e.body ?? '' },
    });

  /** One entry = one page of the book. */
  const renderPage = (e: JournalEntry, i: number) => (
    <FadeIn key={e.id} index={Math.min(i, 5)}>
      <View style={styles.page}>
        <View style={styles.pageTop}>
          <Text style={styles.pageDate}>
            {new Date(e.entry_date + 'T12:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.pageTopRight}>
            <View style={[styles.typeChip, { backgroundColor: accent.soft }]}>
              <Ionicons
                name={TYPE_ICONS[e.entry_type] ?? 'pencil-outline'}
                size={13}
                color={accent.deep}
              />
            </View>
            <PressScale onPress={() => editEntry(e)} hitSlop={8} style={styles.editButton}>
              <Ionicons name="pencil-outline" size={14} color={colors.ink.tertiary} />
            </PressScale>
          </View>
        </View>
        {e.title ? <Text style={styles.pageTitle}>{e.title}</Text> : null}
        {e.body ? <PageBody body={e.body} accent={accent} /> : null}
        {e.media && e.media.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrapRow}
            contentContainerStyle={{ paddingTop: 10, paddingRight: spacing.sm }}
          >
            {e.media.map((m, mi) =>
              m.signedUrl && m.media_type === 'photo' ? (
                <View
                  key={m.id}
                  style={[styles.photoFrame, { transform: [{ rotate: mi % 2 === 0 ? '-1.3deg' : '1.1deg' }] }]}
                >
                  {mi === 0 ? <View style={styles.tape} /> : null}
                  <Image source={{ uri: m.signedUrl }} style={styles.thumb} />
                </View>
              ) : m.signedUrl ? (
                <Pressable
                  key={m.id}
                  style={[styles.photoFrame, { transform: [{ rotate: mi % 2 === 0 ? '-1.3deg' : '1.1deg' }] }]}
                  onPress={() => router.push({ pathname: '/journal/player', params: { uri: m.signedUrl! } })}
                  accessibilityLabel="Play video"
                  accessibilityRole="button"
                >
                  {mi === 0 ? <View style={styles.tape} /> : null}
                  <View style={[styles.thumb, styles.videoThumb]}>
                    <Ionicons name="play" size={22} color={colors.accent.onAccent} />
                  </View>
                </Pressable>
              ) : null
            )}
          </ScrollView>
        ) : null}
      </View>
    </FadeIn>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          {week ? `Week ${week} — the story so far` : 'The story so far'}
        </Text>
        {entries && entries.length > 0 ? (
          <View style={styles.tabs}>
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
              <PressScale key={v} onPress={() => setView(v)} style={styles.tab} hitSlop={6}>
                <Text style={[styles.tabLabel, view === v && { color: accent.deep }]}>{VIEW_LABELS[v]}</Text>
                {view === v ? <View style={[styles.tabUnderline, { backgroundColor: accent.primary }]} /> : null}
              </PressScale>
            ))}
          </View>
        ) : null}
      </View>
      {entries === null ? (
        <View style={{ padding: spacing.screen, gap: spacing.lg }}>
          <CardSkeleton height={140} />
          <CardSkeleton height={140} />
        </View>
      ) : entries.length === 0 ? (
        // The book before page one — the journal look must be unmistakable
        // even with zero entries (Luis QA: empty journal read as "the old app").
        <ScrollView contentContainerStyle={styles.emptyScroll}>
          <View style={styles.emptyPage}>
            <ChapterMark accent={accent} />
            <Text style={styles.chapterEyebrow}>{week ? `WEEK ${week}` : 'KEEPSAKES'}</Text>
            <Text style={styles.chapterTitle}>Chapter one</Text>
            <View style={[styles.photoFrame, styles.emptyArtFrame, { transform: [{ rotate: '-1.4deg' }] }]}>
              <View style={styles.tape} />
              <Image source={weekIllustration(week ?? 8)} style={styles.emptyArtImg} resizeMode="cover" />
            </View>
            <Text style={styles.emptyHeadline}>{copy.empty.journal.headline}</Text>
            <Text style={styles.emptyBody}>{copy.empty.journal.body}</Text>
            <Button
              label={copy.empty.journal.cta}
              onPress={() => router.push('/journal/compose')}
              style={styles.emptyCta}
            />
            {!pregnancy?.baby_sex ? <Text style={styles.emptyTint}>{copy.empty.journal.tint}</Text> : null}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={accent.primary}
            />
          }
        >
          {view === 'calendar' ? (
            <View>
              <View style={styles.calCard}>
                <View style={styles.calHeader}>
                  <PressScale onPress={() => shiftMonth(-1)} hitSlop={8} style={[styles.calNav, { backgroundColor: accent.soft }]}>
                    <Ionicons name="chevron-back" size={18} color={accent.deep} />
                  </PressScale>
                  <Text style={styles.calTitle}>
                    {calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                  <PressScale onPress={() => shiftMonth(1)} hitSlop={8} style={[styles.calNav, { backgroundColor: accent.soft }]}>
                    <Ionicons name="chevron-forward" size={18} color={accent.deep} />
                  </PressScale>
                </View>
                <View style={styles.calRow}>
                  {WEEKDAY_LETTERS.map((d, i) => (
                    <Text key={i} style={styles.calWeekday}>
                      {d}
                    </Text>
                  ))}
                </View>
                <View style={styles.calGrid}>
                  {calendarCells.map((iso, i) => {
                    if (!iso) return <View key={`blank-${i}`} style={styles.calCell} />;
                    const count = entryDates.get(iso) ?? 0;
                    const isToday = iso === todayStr;
                    const isSelected = iso === selectedDay;
                    return (
                      <PressScale
                        key={iso}
                        onPress={() => setSelectedDay(isSelected ? null : iso)}
                        style={styles.calCell}
                      >
                        <View
                          style={[
                            styles.calDay,
                            isToday && !isSelected && { borderWidth: 1.5, borderColor: accent.primary },
                            isSelected && { backgroundColor: accent.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.calDayText,
                              isToday && !isSelected && { color: accent.deep },
                              isSelected && styles.calDayTextSelected,
                            ]}
                          >
                            {Number(iso.slice(8))}
                          </Text>
                        </View>
                        <View style={styles.calDotWrap}>
                          {count > 1 ? (
                            <Text style={[styles.calCount, { color: accent.deep }]}>{count}</Text>
                          ) : count === 1 ? (
                            <View style={[styles.calDot, { backgroundColor: accent.primary }]} />
                          ) : null}
                        </View>
                      </PressScale>
                    );
                  })}
                </View>
              </View>
              {selectedDay ? (
                entriesForDay.length > 0 ? (
                  <View>
                    <Text style={styles.dayHeader}>
                      {new Date(selectedDay + 'T12:00:00')
                        .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                        .toUpperCase()}
                    </Text>
                    {entriesForDay.map((e, i) => renderPage(e, i))}
                  </View>
                ) : (
                  <Text style={styles.emptyDay}>Nothing kept on this day yet.</Text>
                )
              ) : (
                <Text style={styles.emptyDay}>Tap a day to see its moments.</Text>
              )}
            </View>
          ) : (
            groups.map((g, gi) => (
              <View key={`${g.week ?? 'm'}-${g.month}`}>
                <View style={[styles.chapter, gi > 0 && { marginTop: spacing.hero }]}>
                  <ChapterMark accent={accent} />
                  <Text style={styles.chapterEyebrow}>{g.week ? g.month.toUpperCase() : 'KEEPSAKES'}</Text>
                  <Text style={styles.chapterTitle}>{g.week ? `Week ${g.week}` : g.month}</Text>
                </View>
                {g.items.map((e, i) => renderPage(e, i))}
              </View>
            ))
          )}
        </ScrollView>
      )}
      <PressScale style={[styles.fab, { backgroundColor: accent.primary }]} onPress={() => router.push('/journal/compose')}>
        <Ionicons name="add" size={28} color={colors.accent.onAccent} />
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.paper },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  subtitle: {
    ...type.serifQuote,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink.tertiary,
    marginTop: spacing.xs,
  },
  // ── Book tabs ──────────────────────────────────────────────
  tabs: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  tab: { paddingBottom: spacing.xs },
  tabLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: spacing.xs },
  scroll: { padding: spacing.screen, paddingBottom: 120 },
  // ── Chapters ───────────────────────────────────────────────
  chapter: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xs },
  chapterRuleRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: spacing.sm },
  chapterRule: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  chapterGem: { width: 6, height: 6, borderRadius: 1, transform: [{ rotate: '45deg' }] },
  chapterEyebrow: { ...type.labelCaps, fontSize: 10, color: colors.ink.tertiary, marginTop: spacing.md },
  chapterTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.xs },
  // ── Empty book ─────────────────────────────────────────────
  emptyScroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen, paddingBottom: 140 },
  emptyPage: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyArtFrame: { marginRight: 0, marginTop: spacing.xl },
  emptyArtImg: { width: 188, height: 188, borderRadius: 2, backgroundColor: colors.bg.surfaceWarm },
  emptyHeadline: {
    ...type.serifQuote,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyBody: { ...type.bodySM, color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 280 },
  emptyCta: { marginTop: spacing.lg, alignSelf: 'stretch' },
  emptyTint: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.lg, maxWidth: 260 },
  // ── Pages ──────────────────────────────────────────────────
  page: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  pageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageDate: { ...type.labelCaps, fontSize: 10, color: colors.ink.tertiary },
  pageTopRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surfaceWarm,
  },
  pageTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.ink.primary,
    marginTop: spacing.sm,
  },
  pageBody: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.sm },
  dropCapRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  dropCap: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 44,
    lineHeight: 44,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  dropCapRest: { flex: 1, marginTop: 0 },
  // ── Scrapbook media ────────────────────────────────────────
  scrapRow: { marginTop: spacing.md },
  photoFrame: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.sm,
    padding: 5,
    paddingBottom: 12,
    marginRight: spacing.md,
    ...shadow.card,
  },
  tape: {
    position: 'absolute',
    top: -9,
    alignSelf: 'center',
    width: 62,
    height: 18,
    backgroundColor: 'rgba(228, 216, 196, 0.92)',
    borderRadius: 2,
    transform: [{ rotate: '-4deg' }],
    zIndex: 1,
  },
  thumb: { width: 168, height: 126, borderRadius: 2, backgroundColor: colors.bg.surfaceWarm },
  videoThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink.secondary },
  // ── Calendar (the book's index page) ───────────────────────
  calCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTitle: { ...type.displayMD, fontSize: 20, lineHeight: 26, color: colors.ink.primary },
  calRow: { flexDirection: 'row', marginTop: spacing.md },
  calWeekday: {
    width: '14.2857%',
    textAlign: 'center',
    ...type.labelCaps,
    fontSize: 10,
    color: colors.ink.tertiary,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  calCell: { width: '14.2857%', alignItems: 'center', paddingVertical: 2 },
  calDay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayText: { ...type.labelMD, color: colors.ink.primary },
  calDayTextSelected: { color: colors.accent.onAccent, fontFamily: 'Inter_600SemiBold' },
  calDotWrap: { height: 12, alignItems: 'center', justifyContent: 'center' },
  calDot: { width: 5, height: 5, borderRadius: 2.5 },
  calCount: { ...type.labelCaps, fontSize: 9, letterSpacing: 0 },
  dayHeader: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xl },
  emptyDay: {
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.screen,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
});
