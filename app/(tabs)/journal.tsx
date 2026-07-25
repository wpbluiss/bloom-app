import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { JournalEntry, fetchJournalEntries } from '../../lib/db';
import { formatISODate } from '../../lib/weeks';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  note: 'pencil-outline',
  milestone: 'star-outline',
  craving: 'ice-cream-outline',
  ultrasound: 'heart-outline',
};

type ViewMode = 'timeline' | 'calendar';
const VIEW_LABELS: Record<ViewMode, string> = { timeline: 'Timeline', calendar: 'Calendar' };
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function JournalScreen() {
  const router = useRouter();
  const { household } = useApp();
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

  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    (entries ?? []).forEach((e) => {
      const d = new Date(e.entry_date + 'T12:00:00');
      const month = d.toLocaleDateString(undefined, { month: 'long' }).toUpperCase();
      const key = e.week_number ? `WEEK ${e.week_number} · ${month}` : month;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return [...map.entries()];
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

  const renderEntryCard = (e: JournalEntry, i: number) => (
    <FadeIn key={e.id} index={Math.min(i, 5)}>
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.entryHeader}>
          <View style={styles.typeChip}>
            <Ionicons
              name={TYPE_ICONS[e.entry_type] ?? 'pencil-outline'}
              size={14}
              color={colors.accent.terracottaDeep}
            />
          </View>
          {e.title ? <Text style={styles.entryTitle}>{e.title}</Text> : <View style={{ flex: 1 }} />}
          <PressScale onPress={() => editEntry(e)} hitSlop={8} style={styles.editButton}>
            <Ionicons name="pencil-outline" size={15} color={colors.ink.tertiary} />
          </PressScale>
        </View>
        {e.body ? <Text style={styles.entryBody}>{e.body}</Text> : null}
        {e.media && e.media.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md }}>
            {e.media.map((m) =>
              m.signedUrl && m.media_type === 'photo' ? (
                <Image key={m.id} source={{ uri: m.signedUrl }} style={styles.thumb} />
              ) : m.signedUrl ? (
                <Pressable
                  key={m.id}
                  style={[styles.thumb, styles.videoThumb]}
                  onPress={() => router.push({ pathname: '/journal/player', params: { uri: m.signedUrl! } })}
                  accessibilityLabel="Play video"
                  accessibilityRole="button"
                >
                  <Ionicons name="play" size={22} color={colors.accent.onAccent} />
                </Pressable>
              ) : null
            )}
          </ScrollView>
        ) : null}
        <Text style={styles.timestamp}>
          {new Date(e.entry_date + 'T12:00:00').toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </Card>
    </FadeIn>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        {entries && entries.length > 0 ? (
          <View style={styles.segmented}>
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
              <PressScale
                key={v}
                onPress={() => setView(v)}
                style={[styles.segment, view === v && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, view === v && styles.segmentLabelActive]}>{VIEW_LABELS[v]}</Text>
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
        <EmptyState
          icon="book-outline"
          headline={copy.empty.journal.headline}
          body={copy.empty.journal.body}
          cta={copy.empty.journal.cta}
          onCta={() => router.push('/journal/compose')}
        />
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
              tintColor={colors.accent.terracotta}
            />
          }
        >
          {view === 'calendar' ? (
            <View>
              <View style={styles.calCard}>
                <View style={styles.calHeader}>
                  <PressScale onPress={() => shiftMonth(-1)} hitSlop={8} style={styles.calNav}>
                    <Ionicons name="chevron-back" size={18} color={colors.ink.secondary} />
                  </PressScale>
                  <Text style={styles.calTitle}>
                    {calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                  <PressScale onPress={() => shiftMonth(1)} hitSlop={8} style={styles.calNav}>
                    <Ionicons name="chevron-forward" size={18} color={colors.ink.secondary} />
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
                            isToday && !isSelected && styles.calDayToday,
                            isSelected && styles.calDaySelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calDayText,
                              isToday && !isSelected && { color: colors.accent.terracottaDeep },
                              isSelected && styles.calDayTextSelected,
                            ]}
                          >
                            {Number(iso.slice(8))}
                          </Text>
                        </View>
                        <View style={styles.calDotWrap}>
                          {count > 1 ? (
                            <Text style={styles.calCount}>{count}</Text>
                          ) : count === 1 ? (
                            <View style={styles.calDot} />
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
                    {entriesForDay.map((e, i) => renderEntryCard(e, i))}
                  </View>
                ) : (
                  <Text style={styles.emptyDay}>Nothing kept on this day yet.</Text>
                )
              ) : (
                <Text style={styles.emptyDay}>Tap a day to see its moments.</Text>
              )}
            </View>
          ) : (
            groups.map(([label, items], gi) => (
              <View key={label}>
                <Text style={[styles.groupHeader, gi > 0 && { marginTop: spacing.section }]}>{label}</Text>
                {items.map((e, i) => renderEntryCard(e, i))}
              </View>
            ))
          )}
        </ScrollView>
      )}
      <PressScale style={styles.fab} onPress={() => router.push('/journal/compose')}>
        <Ionicons name="add" size={28} color={colors.accent.onAccent} />
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.full,
    padding: 4,
    marginTop: spacing.lg,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  segmentActive: { backgroundColor: colors.accent.terracotta, ...shadow.card },
  segmentLabel: { ...type.labelMD, color: colors.ink.secondary, textAlign: 'center' },
  segmentLabelActive: { color: colors.accent.onAccent, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: spacing.screen, paddingBottom: 120 },
  groupHeader: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.lg },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: { ...type.titleMD, color: colors.ink.primary, flex: 1 },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surfaceWarm,
  },
  entryBody: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.sm },
  thumb: { width: 180, height: 135, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: colors.bg.surfaceWarm },
  videoThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink.secondary },
  timestamp: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.md },
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
    backgroundColor: colors.bg.surfaceWarm,
  },
  calTitle: { ...type.titleMD, color: colors.ink.primary },
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
  calDayToday: { borderWidth: 1.5, borderColor: colors.accent.blush },
  calDaySelected: { backgroundColor: colors.accent.terracotta },
  calDayText: { ...type.labelMD, color: colors.ink.primary },
  calDayTextSelected: { color: colors.accent.onAccent, fontFamily: 'Inter_600SemiBold' },
  calDotWrap: { height: 12, alignItems: 'center', justifyContent: 'center' },
  calDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent.terracotta },
  calCount: { ...type.labelCaps, fontSize: 9, letterSpacing: 0, color: colors.accent.terracottaDeep },
  dayHeader: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xl },
  emptyDay: {
    ...type.bodySM,
    color: colors.ink.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: spacing.screen,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
});
