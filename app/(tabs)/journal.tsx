import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { JournalEntry, fetchJournalEntries } from '../../lib/db';
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

function ChapterMark({ accent }: { accent: GenderAccent }) {
  return (
    <View style={styles.chapterRuleRow}>
      <View style={styles.chapterRule} />
      <View style={[styles.chapterGem, { backgroundColor: accent.primary }]} />
      <View style={styles.chapterRule} />
    </View>
  );
}

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

function MoodSticker({ mood }: { mood?: string | null }) {
  if (!mood) return null;
  const moodColors: Record<string, string> = {
    happy: '#7C8B6F', calm: '#5B84A8', tired: '#A29484', anxious: '#C97B92',
    excited: '#C4603C', overwhelmed: '#9C4A38', grateful: '#B8862F',
  };
  return (
    <View style={[styles.moodSticker, { backgroundColor: moodColors[mood] ?? colors.ink.tertiary }]}>
      <Text style={styles.moodStickerText}>{mood}</Text>
    </View>
  );
}

function ChapterOneEmpty({ accent, onWrite }: { accent: GenderAccent; onWrite: () => void }) {
  return (
    <View style={styles.bookEmpty}>
      <View style={styles.bookCover}>
        <Text style={styles.bookChapterLabel}>Chapter One</Text>
        <ChapterMark accent={accent} />
        <Text style={styles.bookTitle}>My Pregnancy Journal</Text>
        <View style={styles.bookPolaroid}>
          <View style={styles.bookTape} />
          <View style={styles.bookPolaroidInner}>
            <Ionicons name="book-outline" size={48} color={colors.ink.tertiary} />
          </View>
        </View>
        <Text style={styles.bookPrompt}>The story begins with a single sentence.</Text>
        <PressScale onPress={onWrite}>
          <View style={[styles.bookCta, { backgroundColor: accent.primary }]}>
            <Text style={styles.bookCtaText}>Write the first entry</Text>
          </View>
        </PressScale>
      </View>
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
  const [calMonth, setCalMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!household) return;
    try { setEntries(await fetchJournalEntries(household.id)); }
    catch (e) { console.warn(e); setEntries([]); }
  }, [household]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const chapters = useMemo(() => {
    if (!entries?.length) return [];
    const map = new Map<string, { month: string; week: number | null; items: JournalEntry[] }>();
    entries.forEach((e) => {
      const d = new Date(e.entry_date + 'T12:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key);
      if (existing) { existing.items.push(e); }
      else { map.set(key, { month: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), week: e.week_number ?? null, items: [e] }); }
    });
    return Array.from(map.entries()).map(([key, { month, week, items }]) => {
      const w = items.find((i) => i.week_number)?.week_number;
      return { key, month, week: w ?? null, items };
    });
  }, [entries]);

  const entryDates = useMemo(() => {
    const map = new Map<string, number>();
    (entries ?? []).forEach((e) => map.set(e.entry_date, (map.get(e.entry_date) ?? 0) + 1));
    return map;
  }, [entries]);

  const todayStr = useMemo(() => formatISODate(new Date()), []);

  const calendarCells = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(formatISODate(new Date(y, m, d)));
    return cells;
  }, [calMonth]);

  const entriesForDay = useMemo(() => (selectedDay ? (entries ?? []).filter((e) => e.entry_date === selectedDay) : []), [entries, selectedDay]);

  const shiftMonth = (delta: number) => { setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)); setSelectedDay(null); };

  const editEntry = (e: JournalEntry) => router.push({ pathname: '/journal/compose', params: { id: e.id, type: e.entry_type, title: e.title ?? '', body: e.body ?? '' } });

  const renderPage = (e: JournalEntry, i: number) => {
    const dateObj = new Date(e.entry_date + 'T12:00:00');
    const dayNum = dateObj.getDate();
    const monthShort = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const rotation = i % 2 === 0 ? -1.5 : 1.2;
    return (
      <FadeIn key={e.id} index={Math.min(i, 5)}>
        <View style={[styles.scrapPage, { transform: [{ rotate: `${rotation}deg` }] }]}>
          <View style={styles.dateStamp}>
            <Text style={styles.dateStampMonth}>{monthShort}</Text>
            <Text style={styles.dateStampDay}>{dayNum}</Text>
            <Text style={styles.dateStampWeekday}>{weekday}</Text>
          </View>
          {e.media && e.media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrapRow}>
              {e.media.map((m, mi) => m.signedUrl && m.media_type === 'photo' ? (
                <View key={m.id} style={[styles.polaroid, { transform: [{ rotate: mi % 2 === 0 ? '-2deg' : '2deg' }] }]}>
                  {mi === 0 && <View style={styles.tapeCorner} />}
                  <Image source={{ uri: m.signedUrl }} style={styles.polaroidImg} />
                </View>
              ) : null)}
            </ScrollView>
          )}
          <View style={styles.pageContent}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageDateHandwritten}>{dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              <View style={styles.pageActions}>
                <View style={[styles.typeChip, { backgroundColor: accent.soft }]}>
                  <Ionicons name={TYPE_ICONS[e.entry_type] ?? 'pencil-outline'} size={13} color={accent.deep} />
                </View>
                <PressScale onPress={() => editEntry(e)} hitSlop={8} style={styles.editButton}>
                  <Ionicons name="pencil-outline" size={14} color={colors.ink.tertiary} />
                </PressScale>
              </View>
            </View>
            {e.title ? <Text style={styles.pageTitle}>{e.title}</Text> : null}
            {e.body ? <PageBody body={e.body} accent={accent} /> : null}
            <MoodSticker mood={e.mood} />
          </View>
        </View>
      </FadeIn>
    );
  };

  const renderTimeline = () => {
    if (!entries?.length) return <ChapterOneEmpty accent={accent} onWrite={() => router.push('/journal/compose')} />;
    return (
      <View>
        {chapters.map((ch, ci) => (
          <View key={ch.key}>
            <View style={styles.chapter}>
              <ChapterMark accent={accent} />
              <Text style={styles.chapterEyebrow}>{ch.month.toUpperCase()}</Text>
              {ch.week ? <Text style={styles.chapterTitle}>Week {ch.week}</Text> : null}
            </View>
            {ch.items.map((e, ei) => renderPage(e, ci * 10 + ei))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={accent.primary} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>{week ? `Week ${week} — the story so far` : 'The story so far'}</Text>
          <View style={styles.tabs}>
            {(['timeline', 'calendar'] as ViewMode[]).map((v) => (
              <Pressable key={v} onPress={() => setView(v)} style={styles.tab}>
                <Text style={[styles.tabLabel, view === v && { color: accent.primary }]}>{VIEW_LABELS[v]}</Text>
                {view === v && <View style={[styles.tabUnderline, { backgroundColor: accent.primary }]} />}
              </Pressable>
            ))}
          </View>
        </View>
        {entries === null ? (
          <View style={{ padding: spacing.lg }}><CardSkeleton height={180} /><CardSkeleton height={180} /></View>
        ) : view === 'timeline' ? (
          renderTimeline()
        ) : (
          <View>
            <View style={styles.calCard}>
              <View style={styles.calHeader}>
                <PressScale onPress={() => shiftMonth(-1)} hitSlop={8}><Ionicons name="chevron-back" size={20} color={colors.ink.secondary} /></PressScale>
                <Text style={styles.calMonth}>{calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
                <PressScale onPress={() => shiftMonth(1)} hitSlop={8}><Ionicons name="chevron-forward" size={20} color={colors.ink.secondary} /></PressScale>
              </View>
              <View style={styles.calGrid}>
                {WEEKDAY_LETTERS.map((d) => <Text key={d} style={styles.calWeekday}>{d}</Text>)}
                {calendarCells.map((cell, i) => {
                  const hasEntry = cell && entryDates.has(cell);
                  const isSelected = cell === selectedDay;
                  const isToday = cell === todayStr;
                  return (
                    <Pressable key={i} onPress={() => setSelectedDay(cell)} style={[styles.calCell, isSelected && { backgroundColor: accent.soft }]}>
                      {cell ? (
                        <>
                          <Text style={[styles.calCellNum, isToday && { color: accent.primary, fontWeight: '700' }]}>{Number(cell.slice(8))}</Text>
                          {hasEntry && <View style={[styles.calDot, { backgroundColor: accent.primary }]} />}
                        </>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {selectedDay && (
              <View style={{ padding: spacing.lg }}>
                <Text style={styles.calSelectedDate}>{new Date(selectedDay + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                {entriesForDay.length === 0 ? <Text style={styles.calEmpty}>No entries</Text> : entriesForDay.map((e, i) => renderPage(e, i))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <PressScale style={styles.fab} onPress={() => router.push('/journal/compose')}>
        <View style={[styles.fabInner, { backgroundColor: accent.primary }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  subtitle: { ...type.serifQuote, fontSize: 15, lineHeight: 20, color: colors.ink.tertiary, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  tab: { paddingBottom: spacing.xs },
  tabLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: spacing.xs },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  bookEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  bookCover: { width: 280, height: 380, borderRadius: radius.lg, backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  bookChapterLabel: { ...type.labelCaps, color: colors.ink.tertiary, letterSpacing: 2 },
  bookTitle: { ...type.displayMD, color: colors.ink.primary, textAlign: 'center', marginTop: spacing.sm },
  bookPolaroid: { width: 120, height: 140, backgroundColor: colors.bg.paper, borderRadius: spacing.xs, padding: spacing.xs, marginTop: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, transform: [{ rotate: '-3deg' }] },
  bookTape: { position: 'absolute', top: -8, left: '30%', width: 40, height: 14, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2, transform: [{ rotate: '-8deg' }] },
  bookPolaroidInner: { flex: 1, backgroundColor: colors.bg.canvas, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  bookPrompt: { ...type.bodyMD, color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
  bookCta: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.md },
  bookCtaText: { ...type.bodyMD, color: '#fff', fontWeight: '600' },
  chapter: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xs },
  chapterRuleRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: spacing.sm },
  chapterRule: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  chapterGem: { width: 6, height: 6, borderRadius: 1, transform: [{ rotate: '45deg' }] },
  chapterEyebrow: { ...type.labelCaps, fontSize: 10, color: colors.ink.tertiary, marginTop: spacing.md },
  chapterTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.xs },
  scrapPage: { backgroundColor: colors.bg.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing.lg, marginTop: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  dateStamp: { position: 'absolute', top: -10, right: spacing.lg, backgroundColor: colors.bg.paper, borderRadius: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border.subtle, transform: [{ rotate: '8deg' }], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  dateStampMonth: { ...type.labelCaps, fontSize: 9, color: colors.ink.tertiary },
  dateStampDay: { ...type.displayMD, fontSize: 20, color: colors.ink.primary, textAlign: 'center', lineHeight: 24 },
  dateStampWeekday: { ...type.caption, fontSize: 9, color: colors.ink.tertiary, textAlign: 'center' },
  scrapRow: { marginTop: spacing.md, marginLeft: -spacing.sm },
  polaroid: { width: 140, height: 170, backgroundColor: colors.bg.paper, borderRadius: spacing.xs, padding: spacing.xs, marginRight: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tapeCorner: { position: 'absolute', top: -6, left: '25%', width: 36, height: 12, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 2, transform: [{ rotate: '-6deg' }], zIndex: 10 },
  polaroidImg: { flex: 1, borderRadius: 2, backgroundColor: colors.bg.canvas },
  pageContent: { marginTop: spacing.md },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageDateHandwritten: { fontFamily: 'Fraunces_400Regular_Italic', fontSize: 14, color: colors.ink.tertiary },
  pageActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeChip: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.surfaceWarm },
  pageTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 20, lineHeight: 26, letterSpacing: -0.3, color: colors.ink.primary, marginTop: spacing.sm },
  pageBody: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.sm },
  dropCapRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  dropCap: { fontFamily: 'Fraunces_500Medium', fontSize: 36, lineHeight: 40, marginRight: spacing.xs },
  dropCapRest: { flex: 1, marginTop: 4 },
  moodSticker: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  moodStickerText: { ...type.caption, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  calCard: { backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadow.card },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  calMonth: { ...type.titleMD, color: colors.ink.primary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calWeekday: { width: `${100/7}%`, textAlign: 'center', ...type.labelCaps, fontSize: 10, color: colors.ink.tertiary, marginBottom: spacing.xs },
  calCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  calCellNum: { ...type.bodySM, color: colors.ink.secondary },
  calDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  calSelectedDate: { ...type.titleMD, color: colors.ink.primary, marginBottom: spacing.md },
  calEmpty: { ...type.bodyMD, color: colors.ink.tertiary },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xxl + 20 },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
});
