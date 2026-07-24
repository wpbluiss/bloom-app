import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { copy, dailyPrompt } from '../../lib/copy';
import { Checkin, fetchTodayCheckin, upsertCheckin } from '../../lib/db';
import { scheduleGentleReminders } from '../../lib/notifications';
import { daysUntilDue, formatISODate, formatLength, formatWeight, trimesterOf, weekInfo } from '../../lib/weeks';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const SYMPTOMS = ['Nausea', 'Fatigue', 'Heartburn', 'Headache', 'Swelling', 'Cramping', 'Insomnia', 'Backache'];
const MOOD_ICONS = ['rainy-outline', 'moon-outline', 'remove-outline', 'happy-outline', 'sparkles-outline'] as const;

export default function TodayScreen() {
  const router = useRouter();
  const { session, profile, pregnancy, week, loading } = useApp();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCheckin, setLoadingCheckin] = useState(true);

  const info = weekInfo(week ?? 4);
  const isPartner = profile?.role === 'partner';
  const daysLeft = pregnancy ? daysUntilDue(pregnancy.due_date) : null;

  const load = useCallback(async () => {
    if (!pregnancy || !session?.user) {
      setLoadingCheckin(false);
      return;
    }
    try {
      const c = await fetchTodayCheckin(pregnancy.id, session.user.id);
      setCheckin(c);
      if (c) {
        setMood(c.mood);
        setSymptoms(c.symptoms ?? []);
        setNote(c.notes ?? '');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingCheckin(false);
    }
  }, [pregnancy, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (week) scheduleGentleReminders(week).catch(() => {});
  }, [week]);

  const save = async () => {
    if (!pregnancy || !session?.user) return;
    setSaving(true);
    const payload: Checkin = {
      pregnancy_id: pregnancy.id,
      user_id: session.user.id,
      checkin_date: formatISODate(new Date()),
      mood,
      symptoms,
      notes: note.trim() || null,
    };
    setCheckin(payload); // optimistic
    try {
      await upsertCheckin(payload);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2500);
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const dateLine = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(),
    []
  );

  if (loading || loadingCheckin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: spacing.screen, gap: spacing.lg }}>
          <CardSkeleton height={200} />
          <CardSkeleton height={160} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent.terracotta} />
        }
      >
        <FadeIn index={0}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateCaps}>{dateLine}</Text>
              <Text style={styles.greeting}>
                {copy.today.greeting(profile?.display_name?.split(' ')[0] ?? 'there')}
              </Text>
            </View>
            <PressScale onPress={() => router.push('/settings')} hitSlop={8}>
              <Ionicons name="person-circle-outline" size={30} color={colors.ink.secondary} />
            </PressScale>
          </View>
        </FadeIn>

        {/* Weekly-size hero card */}
        <FadeIn index={1}>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>
              WEEK {week} · TRIMESTER {trimesterOf(week ?? 4)}
            </Text>
            <Text style={styles.heroHeadline}>{info.headline}</Text>
            <View style={styles.sizeRow}>
              <Ionicons name="nutrition-outline" size={36} color={colors.accent.terracotta} />
              <Text style={styles.sizeQuote}>Size of {info.sizeComparison}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatLength(info.sizeLengthCm)}</Text>
                <Text style={styles.statLabel}>Length</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatWeight(info.sizeWeightG)}</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{daysLeft ?? '—'}</Text>
                <Text style={styles.statLabel}>Days to go</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, ((week ?? 4) / 40) * 100)}%` }]} />
            </View>
          </View>
        </FadeIn>

        {/* Daily check-in */}
        <FadeIn index={2}>
          <Card style={{ marginTop: spacing.xl }}>
            <Text style={styles.eyebrow}>{copy.today.checkinEyebrow}</Text>
            <Text style={styles.checkinQuestion}>{dailyPrompt(profile?.role)}</Text>
            <View style={styles.moodRow}>
              {copy.moods.map((m, i) => (
                <PressScale key={m} onPress={() => setMood(m)} style={styles.moodItem}>
                  <Ionicons
                    name={MOOD_ICONS[i] as keyof typeof Ionicons.glyphMap}
                    size={26}
                    color={mood === m ? colors.accent.terracotta : colors.ink.tertiary}
                  />
                  <Text style={[styles.moodLabel, mood === m && { color: colors.accent.terracottaDeep }]}>{m}</Text>
                </PressScale>
              ))}
            </View>
            <View style={styles.chipsWrap}>
              {SYMPTOMS.map((s) => (
                <Chip key={s} label={s} selected={symptoms.includes(s)} onPress={() => toggleSymptom(s)} />
              ))}
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="One sentence is enough…"
              placeholderTextColor={colors.ink.tertiary}
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 280))}
              multiline
            />
            <View style={styles.saveRow}>
              {savedTick ? (
                <View style={styles.savedPill}>
                  <Ionicons name="checkmark" size={14} color={colors.sage.primary} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              ) : checkin ? (
                <Text style={styles.caption}>Checked in today</Text>
              ) : (
                <Text style={styles.caption}>{copy.empty.today.body}</Text>
              )}
              <Button
                label={checkin ? 'Update' : copy.empty.today.cta}
                onPress={save}
                loading={saving}
                disabled={!mood && symptoms.length === 0 && !note.trim()}
                style={{ height: 44, paddingHorizontal: spacing.xl }}
              />
            </View>
          </Card>
        </FadeIn>

        {/* This week */}
        <FadeIn index={3}>
          <Text style={[styles.eyebrow, { marginTop: spacing.section }]}>{copy.today.thisWeek}</Text>
          <TipCard eyebrow={copy.today.babyEyebrow} body={info.development} />
          {isPartner ? (
            <>
              <TipCard eyebrow={copy.today.forYou} body={info.partnerTip} />
              <TipCard eyebrow={copy.today.forHer} body={info.momTip} />
            </>
          ) : (
            <>
              <TipCard eyebrow={copy.today.forYou} body={info.momTip} />
              <TipCard eyebrow={copy.today.forPartner} body={info.partnerTip} />
            </>
          )}
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipCard({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <Card style={{ marginTop: spacing.md }}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.tipBody}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  dateCaps: { ...type.labelCaps, color: colors.ink.tertiary },
  greeting: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.xs },
  hero: {
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.xl,
    ...shadow.raised,
  },
  heroEyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  heroHeadline: { ...type.displayXL, color: colors.ink.primary, marginTop: spacing.sm },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  sizeQuote: { ...type.serifQuote, color: colors.ink.secondary, flex: 1 },
  statsRow: { flexDirection: 'row', marginTop: spacing.xl, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...type.displayMD, color: colors.ink.primary },
  statLabel: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border.subtle },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border.subtle,
    borderRadius: 1,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: { height: 2, backgroundColor: colors.accent.terracotta },
  eyebrow: { ...type.labelCaps, color: colors.ink.tertiary },
  checkinQuestion: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  moodItem: { alignItems: 'center', gap: spacing.xs, minWidth: 52 },
  moodLabel: { ...type.caption, color: colors.ink.tertiary },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  noteInput: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    padding: spacing.md,
    ...type.bodySM,
    color: colors.ink.primary,
    marginTop: spacing.lg,
    minHeight: 44,
  },
  saveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.md },
  caption: { ...type.caption, color: colors.ink.tertiary, flex: 1 },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sage.soft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  savedText: { ...type.labelMD, color: colors.sage.primary },
  tipBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
});
