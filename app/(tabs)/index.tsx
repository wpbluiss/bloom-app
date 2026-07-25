import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { FadeIn } from '../../components/FadeIn';
import { InviteCard } from '../../components/InviteCard';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { WeekArt } from '../../components/WeekArt';
import { WeekStrip } from '../../components/WeekStrip';
import { useApp } from '../../lib/AppContext';
import { copy, MOOD_ACKNOWLEDGMENTS, SYMPTOM_RELIEF_TIPS } from '../../lib/copy';
import { dailyEntry, DAILY_KIND_LABEL } from '../../lib/daily';
import {
  Checkin,
  PartnerActivity,
  Profile,
  countMediaSince,
  createJournalEntry,
  createMediaRow,
  fetchHouseholdMemberCount,
  fetchLatestPartnerActivity,
  fetchProfilesByIds,
  fetchTodayCheckin,
  updateProfile,
  upsertCheckin,
  uploadToBucket,
} from '../../lib/db';
import { FREE_MOMENTS_PER_MONTH, promptForPass, useEntitlement } from '../../lib/entitlements';
import { capturePhoto, pickMedia, uriToBytes } from '../../lib/media';
import { scheduleGentleReminders } from '../../lib/notifications';
import { prefetchIllustrations, weekIllustration } from '../../lib/illustrations';
import { consumeWeekUnlock } from '../../lib/rituals';
import {
  currentWeek,
  dailyTip,
  daysUntilDue,
  formatISODate,
  formatLength,
  formatWeight,
  pregnancyDay,
  stripTime,
  trimesterOf,
  weekInfo,
} from '../../lib/weeks';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const SYMPTOMS = ['Nausea', 'Fatigue', 'Heartburn', 'Headache', 'Swelling', 'Cramping', 'Insomnia', 'Backache'];
const MOOD_ICONS = ['rainy-outline', 'moon-outline', 'remove-outline', 'happy-outline', 'sparkles-outline'] as const;

export default function TodayScreen() {
  const router = useRouter();
  const { session, profile, household, pregnancy, week, loading, refresh } = useApp();
  const { pregnancyPass } = useEntitlement();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCheckin, setLoadingCheckin] = useState(true);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [partnerActivity, setPartnerActivity] = useState<PartnerActivity | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [momentBusy, setMomentBusy] = useState(false);
  const [momentSaved, setMomentSaved] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  // Week strip selection — session-only; resets to today on reload by design.
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const unlockCheckedFor = useRef<number | null>(null);

  const info = weekInfo(week ?? 4);
  // Daily rotating tips — deterministic by day-of-pregnancy, fresh each day.
  const momTip = pregnancy ? dailyTip(info.momTips, pregnancy.due_date) : info.momTips[0];
  const partnerTip = pregnancy ? dailyTip(info.partnerTips, pregnancy.due_date) : info.partnerTips[0];
  const isPartner = profile?.role === 'partner';
  const daysLeft = pregnancy ? daysUntilDue(pregnancy.due_date) : null;

  // The selected strip day's place in the pregnancy (null when the day falls
  // outside the 280-day window — e.g. past the due date).
  const selectedPoint = pregnancy ? pregnancyDay(pregnancy.due_date, selectedDate) : null;
  const selectedInfo = selectedPoint ? weekInfo(selectedPoint.week) : null;
  const selectedTip =
    pregnancy && selectedInfo ? dailyTip(selectedInfo.momTips, pregnancy.due_date, selectedDate) : null;
  const isSelectedToday = stripTime(selectedDate).getTime() === stripTime(new Date()).getTime();

  // "Today, for you" — the exact day plus composed insights. The expectation
  // tip is offset one day from the This Week card's rotation so the two cards
  // never repeat each other on the same screen.
  const todayPoint = pregnancy ? pregnancyDay(pregnancy.due_date, new Date()) : null;
  const expectTip = pregnancy && todayPoint ? info.momTips[(todayPoint.dayIndex + 1) % info.momTips.length] : null;

  // Greeting name: profiles.display_name from onboarding/settings — but never
  // an email-prefix leftover from older signups; then we stay neutral.
  const firstName = useMemo(() => {
    const dn = profile?.display_name?.trim();
    if (!dn) return null;
    const emailPrefix = session?.user.email?.split('@')[0]?.toLowerCase();
    if (emailPrefix && dn.toLowerCase() === emailPrefix) return null;
    return dn.split(' ')[0];
  }, [profile, session]);

  const today = useMemo(() => (pregnancy ? dailyEntry(profile?.role, pregnancy.due_date) : null), [pregnancy, profile]);

  const load = useCallback(async () => {
    if (!pregnancy || !session?.user || !household) {
      setLoadingCheckin(false);
      return;
    }
    try {
      const [c, count, activity] = await Promise.all([
        fetchTodayCheckin(pregnancy.id, session.user.id),
        fetchHouseholdMemberCount(household.id),
        fetchLatestPartnerActivity(pregnancy.id, household.id, session.user.id),
      ]);
      setCheckin(c);
      if (c) {
        setMood(c.mood);
        setSymptoms(c.symptoms ?? []);
        setNote(c.notes ?? '');
      }
      setMemberCount(count);
      setPartnerActivity(activity);
      if (activity) {
        const profiles: Profile[] = await fetchProfilesByIds([activity.userId]);
        setPartnerName(profiles[0]?.display_name?.trim() || null);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingCheckin(false);
    }
  }, [pregnancy, session, household]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (week) {
      scheduleGentleReminders(week, pregnancy?.due_date ?? null).catch(() => {});
      prefetchIllustrations([week - 1, week, week + 1, week + 2]);
    }
  }, [week, pregnancy]);

  // Weekly unlock ceremony: once per new week, full-screen keepsake moment.
  useEffect(() => {
    if (!week || unlockCheckedFor.current === week) return;
    unlockCheckedFor.current = week;
    consumeWeekUnlock(week).then((newWeek) => {
      if (newWeek) router.push('/week-unlock');
    });
  }, [week, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [load, refresh]);

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
      setEditingCheckin(false);
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

  const saveName = async () => {
    if (!session?.user || !nameDraft.trim()) return;
    setNameSaving(true);
    try {
      await updateProfile(session.user.id, { display_name: nameDraft.trim() });
      await refresh();
    } catch (e) {
      console.warn(e);
    } finally {
      setNameSaving(false);
    }
  };

  // One-tap capture: camera or library straight into the journal timeline.
  const keepMoment = (source: 'camera' | 'library') => {
    setMomentBusy(true);
    void (async () => {
      try {
        if (!session?.user || !household) return;
        const picked = source === 'camera' ? await capturePhoto() : await pickMedia({ allowsVideo: true });
        if (!picked) return;
        const entry = await createJournalEntry({
          household_id: household.id,
          pregnancy_id: pregnancy?.id ?? null,
          author_id: session.user.id,
          week_number: pregnancy ? currentWeek(pregnancy.due_date) : null,
          entry_type: 'note',
          title: null,
          body: null,
          entry_date: formatISODate(new Date()),
        });
        const bytes = await uriToBytes(picked.uri);
        const path = await uploadToBucket('journal-media', household.id, bytes, picked.ext, picked.contentType);
        await createMediaRow({
          journal_entry_id: entry.id,
          household_id: household.id,
          storage_path: path,
          media_type: picked.mediaType,
          caption: null,
        });
        setMomentSaved(true);
        setTimeout(() => setMomentSaved(false), 4000);
      } catch (e) {
        console.warn(e);
        Alert.alert(copy.global.error);
      } finally {
        setMomentBusy(false);
      }
    })();
  };

  const showMomentPicker = () => {
    Alert.alert(copy.moment.title, undefined, [
      { text: copy.moment.take, onPress: () => keepMoment('camera') },
      { text: copy.moment.choose, onPress: () => keepMoment('library') },
      { text: copy.moment.cancel, style: 'cancel' },
    ]);
  };

  const openMomentPicker = () => {
    if (momentBusy) return;
    // Free tier: 10 one-tap Moments per calendar month. The Pass lifts the
    // cap. (Dev mode: always entitled, never gated.)
    if (!pregnancyPass && household) {
      void (async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const used = await countMediaSince(household.id, startOfMonth.toISOString());
        if (used >= FREE_MOMENTS_PER_MONTH) {
          promptForPass(router, copy.paywall.gateMoment);
          return;
        }
        showMomentPicker();
      })();
      return;
    }
    showMomentPicker();
  };

  const dateLine = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(),
    []
  );

  const partnerLine = useMemo(() => {
    if (!partnerActivity) return null;
    const name = partnerName ?? copy.pingpong.partnerFallback;
    switch (partnerActivity.kind) {
      case 'mood':
        return {
          icon: 'heart-outline' as const,
          text:
            copy.pingpong.mood(name, partnerActivity.mood) +
            (partnerActivity.note ? ` “${partnerActivity.note.slice(0, 80)}”` : ''),
        };
      case 'craving':
        return { icon: 'basket-outline' as const, text: copy.pingpong.craving(name, partnerActivity.food) };
      case 'journal':
        return { icon: 'book-outline' as const, text: copy.pingpong.journal(name, partnerActivity.snippet) };
    }
  }, [partnerActivity, partnerName]);

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.terracotta} />
        }
      >
        <FadeIn index={0}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateCaps}>{dateLine}</Text>
              <Text style={styles.greeting}>{copy.today.greeting(firstName)}</Text>
            </View>
            <PressScale onPress={() => router.push('/settings')} hitSlop={8}>
              <Ionicons name="person-circle-outline" size={30} color={colors.ink.secondary} />
            </PressScale>
          </View>
        </FadeIn>

        {/* Weekly hero — the week as an editorial keepsake page */}
        <FadeIn index={1}>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>
              WEEK {week} · TRIMESTER {trimesterOf(week ?? 4)}
            </Text>
            <Text style={styles.heroHeadline}>{info.headline}</Text>
            <WeekArt week={week ?? 4} height={236} style={{ marginTop: spacing.xl }} />
            <Text style={styles.sizeQuote}>Size of {info.sizeComparison}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatLength(info.sizeLengthCm)}</Text>
                <Text style={styles.statLabel}>LENGTH</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatWeight(info.sizeWeightG)}</Text>
                <Text style={styles.statLabel}>WEIGHT</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{daysLeft ?? '—'}</Text>
                <Text style={styles.statLabel}>DAYS TO GO</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, ((week ?? 4) / 40) * 100)}%` }]} />
            </View>
          </View>
        </FadeIn>

        {/* Week strip — the calendar week, day by day; tap any day for its card */}
        {pregnancy ? (
          <FadeIn index={2}>
            <Text style={[styles.eyebrow, styles.stripEyebrow]}>{copy.today.weekStripEyebrow}</Text>
            <View style={styles.stripCard}>
              <WeekStrip dueDate={pregnancy.due_date} selected={selectedDate} onSelect={setSelectedDate} />
            </View>
            <Card style={{ marginTop: spacing.md }}>
              {selectedPoint && selectedInfo ? (
                <View style={styles.dayRow}>
                  <View style={styles.dayThumb}>
                    <Image
                      source={weekIllustration(selectedPoint.week)}
                      style={styles.dayArt}
                      resizeMode="contain"
                      accessibilityLabel={`Watercolor illustration for week ${selectedPoint.week}`}
                    />
                  </View>
                  <View style={styles.dayTextWrap}>
                    <Text style={styles.dayTitle}>
                      {(isSelectedToday ? 'Today · ' : '') +
                        copy.today.weekDayLine(selectedPoint.week, selectedPoint.dayOfWeek)}
                    </Text>
                    <Text style={styles.tipBody}>
                      {`Size of ${selectedInfo.sizeComparison}. ${selectedTip}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.tipBody}>
                  {daysUntilDue(pregnancy.due_date, selectedDate) > 279
                    ? copy.today.beforeWindow
                    : copy.today.afterWindow}
                </Text>
              )}
            </Card>
          </FadeIn>
        ) : null}

        {/* Today, for you — baby/expectation-focused daily insights, composed
            from weeks.json so every day says something exact. Symptom relief
            stays with the check-in card; nothing here duplicates it. */}
        {pregnancy && todayPoint ? (
          <FadeIn index={3}>
            <Card style={{ marginTop: spacing.xl }}>
              <Text style={styles.eyebrow}>{copy.today.forYouEyebrow}</Text>
              <Text style={styles.insightDay}>{copy.today.dayLine(todayPoint.day)}</Text>
              <Text style={styles.tipBody}>{`Size of ${info.sizeComparison}. ${info.development}`}</Text>
              {expectTip ? (
                <View style={styles.insightBlock}>
                  <Text style={styles.insightLabel}>{copy.today.expectEyebrow}</Text>
                  <Text style={styles.tipBody}>{expectTip}</Text>
                </View>
              ) : null}
              <View style={styles.insightBlock}>
                <Text style={styles.insightLabel}>{copy.today.commonEyebrow}</Text>
                <Text style={styles.tipBody}>{copy.today.commonAroundNow[trimesterOf(week ?? 4) - 1]}</Text>
              </View>
            </Card>
          </FadeIn>
        ) : null}

        {/* Name prompt — Bloom should greet her properly */}
        {!firstName ? (
          <FadeIn index={4}>
            <Card style={{ marginTop: spacing.xl }}>
              <Text style={styles.tipBody}>{copy.namePrompt.body}</Text>
              <View style={styles.nameRow}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={colors.ink.tertiary}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  maxLength={40}
                />
                <Button
                  label={copy.namePrompt.cta}
                  onPress={saveName}
                  loading={nameSaving}
                  disabled={!nameDraft.trim()}
                  style={{ minHeight: 44, paddingHorizontal: spacing.xl }}
                />
              </View>
            </Card>
          </FadeIn>
        ) : null}

        {/* Today in your pregnancy — the daily fresh card */}
        {today ? (
          <FadeIn index={5}>
            <Card style={{ marginTop: spacing.xl }}>
              <View style={styles.dailyHeader}>
                <Text style={styles.eyebrow}>{copy.today.dailyEyebrow}</Text>
                <View style={styles.dailyKindPill}>
                  <Text style={styles.dailyKindText}>{DAILY_KIND_LABEL[today.kind]}</Text>
                </View>
              </View>
              <Text style={styles.dailyTitle}>{today.title}</Text>
              <Text style={styles.tipBody}>{today.body}</Text>
              {today.cta ? (
                <PressScale onPress={() => router.push(today.cta!.route as never)} hitSlop={8} style={styles.dailyCta}>
                  <Text style={styles.dailyCtaText}>{today.cta.label}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.accent.terracotta} />
                </PressScale>
              ) : null}
            </Card>
          </FadeIn>
        ) : null}

        {/* For you both — the partner ping-pong hook */}
        {partnerLine ? (
          <FadeIn index={6}>
            <Card style={{ marginTop: spacing.xl }}>
              <Text style={styles.eyebrow}>{copy.pingpong.eyebrow}</Text>
              <View style={styles.pingRow}>
                <View style={styles.pingIconWrap}>
                  <Ionicons name={partnerLine.icon} size={20} color={colors.accent.terracotta} />
                </View>
                <Text style={[styles.tipBody, { flex: 1, marginTop: 0 }]}>{partnerLine.text}</Text>
              </View>
            </Card>
          </FadeIn>
        ) : null}

        {/* Share with your partner — only while the household is a party of one */}
        {memberCount === 1 && household?.invite_code ? (
          <FadeIn index={7}>
            <View style={{ marginTop: spacing.xl }}>
              <InviteCard code={household.invite_code} />
            </View>
          </FadeIn>
        ) : null}

        {/* Daily check-in — after she checks in, the card answers back */}
        <FadeIn index={8}>
          <Card style={{ marginTop: spacing.xl }}>
            <Text style={styles.eyebrow}>{copy.today.checkinEyebrow}</Text>
            {checkin && !editingCheckin ? (
              <View>
                <Text style={styles.ackText}>
                  {(checkin.mood && MOOD_ACKNOWLEDGMENTS[checkin.mood]) || copy.checkin.heardFallback}
                </Text>
                {checkin.notes ? <Text style={styles.noteEcho}>“{checkin.notes}”</Text> : null}
                {(checkin.symptoms ?? []).filter((s) => SYMPTOM_RELIEF_TIPS[s]).length > 0 ? (
                  <View style={styles.reliefWrap}>
                    <Text style={styles.reliefEyebrow}>{copy.checkin.reliefEyebrow}</Text>
                    {(checkin.symptoms ?? [])
                      .filter((s) => SYMPTOM_RELIEF_TIPS[s])
                      .map((s) => (
                        <View key={s} style={styles.reliefBlock}>
                          <Text style={styles.reliefLabel}>{s}</Text>
                          <Text style={styles.reliefTip}>{SYMPTOM_RELIEF_TIPS[s]}</Text>
                        </View>
                      ))}
                  </View>
                ) : null}
                <View style={styles.careRow}>
                  <Ionicons name="call-outline" size={14} color={colors.accent.terracottaDeep} />
                  <Text style={styles.careText}>{copy.checkin.careLine}</Text>
                </View>
                <View style={styles.editRow}>
                  <Button
                    label={copy.checkin.edit}
                    variant="tertiary"
                    onPress={() => setEditingCheckin(true)}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.checkinQuestion}>{copy.today.checkinQuestion}</Text>
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
                  {editingCheckin && checkin ? (
                    <Button label={copy.checkin.cancel} variant="tertiary" onPress={() => setEditingCheckin(false)} />
                  ) : savedTick ? (
                    <View style={styles.savedPill}>
                      <Ionicons name="checkmark" size={14} color={colors.sage.primary} />
                      <Text style={styles.savedText}>Saved</Text>
                    </View>
                  ) : (
                    <Text style={styles.caption}>{copy.empty.today.body}</Text>
                  )}
                  <Button
                    label={checkin ? 'Update' : copy.empty.today.cta}
                    onPress={save}
                    loading={saving}
                    disabled={!mood && symptoms.length === 0 && !note.trim()}
                    style={{ minHeight: 44, paddingHorizontal: spacing.xl }}
                  />
                </View>
              </View>
            )}
          </Card>
        </FadeIn>

        {/* This week */}
        <FadeIn index={9}>
          <Text style={[styles.eyebrow, { marginTop: spacing.section }]}>{copy.today.thisWeek}</Text>
          <TipCard eyebrow={copy.today.babyEyebrow} body={info.development} />
          {isPartner ? (
            <>
              <TipCard eyebrow={copy.today.forYou} body={partnerTip} />
              <TipCard eyebrow={copy.today.forHer} body={momTip} />
            </>
          ) : (
            <>
              <TipCard eyebrow={copy.today.forYou} body={momTip} />
              <TipCard eyebrow={copy.today.forPartner} body={partnerTip} />
            </>
          )}
        </FadeIn>
      </ScrollView>

      {/* One-tap capture — the timeline grows passively */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        {momentSaved ? (
          <View style={styles.momentToast}>
            <Ionicons name="checkmark" size={14} color={colors.sage.primary} />
            <Text style={styles.momentToastText}>{copy.moment.saved}</Text>
          </View>
        ) : null}
        <PressScale onPress={openMomentPicker} style={styles.fab} disabled={momentBusy}>
          <Ionicons name={momentBusy ? 'hourglass-outline' : 'add'} size={22} color={colors.accent.onAccent} />
          <Text style={styles.fabLabel}>Moment</Text>
        </PressScale>
      </View>
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
  scroll: { padding: spacing.screen, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  dateCaps: { ...type.labelCaps, color: colors.ink.tertiary },
  greeting: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.xs },
  hero: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xxl,
    marginTop: spacing.xl,
    ...shadow.raised,
  },
  heroEyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  heroHeadline: { ...type.displayXL, color: colors.ink.primary, marginTop: spacing.sm },
  sizeQuote: { ...type.serifQuote, color: colors.ink.secondary, marginTop: spacing.lg, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: spacing.xl, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...type.displayMD, color: colors.ink.primary },
  statLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xs },
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
  stripEyebrow: { marginTop: spacing.xl },
  stripCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    ...shadow.card,
  },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayThumb: {
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
  dayArt: { width: 48, height: 48 },
  dayTextWrap: { flex: 1 },
  dayTitle: { ...type.titleSM, color: colors.ink.primary },
  insightDay: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  insightBlock: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  insightLabel: { ...type.labelCaps, color: colors.ink.tertiary },
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
  ackText: { ...type.serifQuote, color: colors.ink.primary, marginTop: spacing.md },
  noteEcho: { ...type.bodySM, fontStyle: 'italic', color: colors.ink.secondary, marginTop: spacing.md },
  reliefWrap: { marginTop: spacing.lg, gap: spacing.sm },
  reliefEyebrow: { ...type.labelCaps, color: colors.ink.tertiary, marginBottom: spacing.xs },
  reliefBlock: {
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reliefLabel: { ...type.titleSM, color: colors.accent.terracottaDeep },
  reliefTip: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.xs },
  careRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  careText: { ...type.caption, color: colors.ink.secondary, flex: 1 },
  editRow: { alignSelf: 'flex-start', marginTop: spacing.sm },
  tipBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  nameRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignItems: 'center' },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    ...type.bodyMD,
    color: colors.ink.primary,
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dailyKindPill: {
    backgroundColor: colors.sage.soft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dailyKindText: { ...type.labelCaps, fontSize: 9, color: colors.sage.primary },
  dailyTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  dailyCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg, minHeight: 32 },
  dailyCtaText: { ...type.titleSM, color: colors.accent.terracotta },
  pingRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignItems: 'flex-start' },
  pingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.screen,
    bottom: 24,
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    ...shadow.fab,
  },
  fabLabel: { ...type.titleSM, color: colors.accent.onAccent },
  momentToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  momentToastText: { ...type.caption, color: colors.ink.secondary },
});
