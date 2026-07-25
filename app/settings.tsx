import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { InviteCard } from '../components/InviteCard';
import { PressScale } from '../components/PressScale';
import { useApp } from '../lib/AppContext';
import { copy } from '../lib/copy';
import { Role, updateProfile, updatePregnancy } from '../lib/db';
import { useEntitlement } from '../lib/entitlements';
import {
  NotificationPrefs,
  getNotificationPrefs,
  notificationsAllowed,
  requestNotificationPermission,
  saveNotificationPrefs,
  scheduleGentleReminders,
} from '../lib/notifications';
import { restorePurchases } from '../lib/revenuecat';
import { supabase } from '../lib/supabase';
import { formatISODate } from '../lib/weeks';
import { colors, radius, spacing, type } from '../lib/theme';

function timeToDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { session, profile, household, pregnancy, week, refresh } = useApp();
  const { pregnancyPass, plus, refresh: refreshEntitlements } = useEntitlement();
  const emailPrefix = session?.user.email?.split('@')[0]?.toLowerCase();
  const storedName = profile?.display_name?.trim() ?? '';
  const nameIsEmailPrefix = storedName.length > 0 && storedName.toLowerCase() === emailPrefix;
  const [name, setName] = useState(nameIsEmailPrefix ? '' : storedName);
  const [role, setRole] = useState<Role | null>(profile?.role ?? null);
  const [dueDate, setDueDate] = useState<Date>(
    pregnancy ? new Date(pregnancy.due_date + 'T12:00:00') : new Date()
  );
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(household?.invite_code ?? null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setInviteCode(household?.invite_code ?? null);
  }, [household]);

  useEffect(() => {
    getNotificationPrefs().then(setPrefs);
  }, []);

  const save = async () => {
    if (!session?.user) return;
    setBusy(true);
    try {
      await updateProfile(session.user.id, { display_name: name.trim() || null, role });
      if (pregnancy) {
        await updatePregnancy(pregnancy.id, { due_date: formatISODate(dueDate) });
      }
      await refresh();
      router.back();
    } catch (e) {
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const updatePrefs = async (next: NotificationPrefs) => {
    setPrefs(next);
    await saveNotificationPrefs(next);
    await scheduleGentleReminders(week, pregnancy?.due_date ?? null);
  };

  const toggleDaily = async (enabled: boolean) => {
    if (!prefs) return;
    if (enabled && !(await notificationsAllowed())) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Reminders are off in iOS Settings', 'You can allow Bloom notifications any time in the Settings app.');
        return;
      }
    }
    await updatePrefs({ ...prefs, dailyEnabled: enabled });
  };

  const restore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        Alert.alert(copy.paywall.devNote);
        return;
      }
      await refreshEntitlements();
      const any = restored.pregnancyPass || restored.plus || restored.memoryBook;
      Alert.alert(any ? copy.paywall.restoreDone : copy.paywall.restoreNone);
    } finally {
      setRestoring(false);
    }
  };

  const signOut = () => {
    Alert.alert(copy.global.signOut, copy.global.signOutConfirm, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy.global.signOut,
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const nameMissing = !storedName || nameIsEmailPrefix;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <PressScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {week ? <Text style={styles.weekCaps}>{copy.global.weekCounter(week)}</Text> : null}

        {nameMissing ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.namePrompt}>{copy.namePrompt.body}</Text>
          </Card>
        ) : null}

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>DISPLAY NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.ink.tertiary}
          />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>ROLE</Text>
          <View style={styles.chipsRow}>
            <Chip label="I'm the mother" selected={role === 'mother'} onPress={() => setRole('mother')} />
            <Chip label="I'm the partner" selected={role === 'partner'} onPress={() => setRole('partner')} />
          </View>
          {pregnancy ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.lg }]}>DUE DATE</Text>
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(_: DateTimePickerEvent, d?: Date) => d && setDueDate(d)}
                accentColor={colors.accent.terracotta}
              />
            </>
          ) : null}
          {pregnancy?.baby_nickname ? (
            <Text style={styles.nickname}>For {pregnancy.baby_nickname}</Text>
          ) : null}
        </Card>

        {prefs ? (
          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>DAILY REMINDER</Text>
                <Text style={styles.reminderHint}>A gentle nudge to check in, once a day.</Text>
              </View>
              <Switch
                value={prefs.dailyEnabled}
                onValueChange={toggleDaily}
                trackColor={{ true: colors.accent.terracottaSoft, false: colors.border.subtle }}
                thumbColor={prefs.dailyEnabled ? colors.accent.terracotta : colors.ink.tertiary}
              />
            </View>
            {prefs.dailyEnabled ? (
              <View style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
                <DateTimePicker
                  value={timeToDate(prefs.hour, prefs.minute)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={(_: DateTimePickerEvent, d?: Date) => {
                    if (d) updatePrefs({ ...prefs, hour: d.getHours(), minute: d.getMinutes() });
                  }}
                  accentColor={colors.accent.terracotta}
                />
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* Bloom Pass — status, upgrade path, and Apple's required restore */}
        <Card style={{ marginTop: spacing.xl }}>
          <View style={styles.passRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>BLOOM PASS</Text>
              <Text style={styles.passStatus}>
                {pregnancyPass ? copy.paywall.passActive : 'One payment for your whole pregnancy.'}
              </Text>
              {plus ? <Text style={styles.passPlus}>{copy.paywall.plusActive}</Text> : null}
            </View>
            {pregnancyPass ? (
              <Ionicons name="checkmark-circle" size={24} color={colors.sage.primary} />
            ) : (
              <PressScale onPress={() => router.push('/paywall')} hitSlop={8} style={styles.passCta}>
                <Text style={styles.passCtaText}>Get the Pass</Text>
              </PressScale>
            )}
          </View>
          <PressScale onPress={restore} disabled={restoring} hitSlop={8} style={styles.restoreRow}>
            <Text style={styles.restoreText}>{restoring ? 'Restoring…' : copy.paywall.restore}</Text>
          </PressScale>
        </Card>

        {inviteCode ? (
          <View style={{ marginTop: spacing.xl }}>
            <InviteCard
              code={inviteCode}
              onRegenerated={(next) => {
                setInviteCode(next);
                refresh().catch(() => {});
              }}
            />
          </View>
        ) : null}

        <Button label="Save" onPress={save} loading={busy} style={{ marginTop: spacing.xl }} />
        <Button label={copy.global.signOut} variant="tertiary" onPress={signOut} style={{ marginTop: spacing.md }} />
        <Text style={styles.footer}>{session?.user.email ?? ''}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  title: { ...type.titleMD, color: colors.ink.primary },
  scroll: { padding: spacing.screen },
  weekCaps: { ...type.labelCaps, color: colors.accent.terracotta },
  label: { ...type.labelCaps, color: colors.ink.tertiary },
  input: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    ...type.bodyMD,
    color: colors.ink.primary,
    marginTop: spacing.sm,
  },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  nickname: { ...type.serifQuote, color: colors.ink.secondary, marginTop: spacing.lg },
  namePrompt: { ...type.bodySM, color: colors.ink.secondary },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderHint: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  passStatus: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  passPlus: { ...type.caption, color: colors.sage.primary, marginTop: spacing.xs },
  passCta: {
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    height: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passCtaText: { ...type.titleSM, color: colors.accent.onAccent },
  restoreRow: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm },
  restoreText: { ...type.titleSM, color: colors.accent.terracotta },
  footer: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.xxl },
});
