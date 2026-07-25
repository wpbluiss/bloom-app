import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { InviteCard } from '../components/InviteCard';
import { PressScale } from '../components/PressScale';
import { useApp } from '../lib/AppContext';
import { copy } from '../lib/copy';
import { Role, deleteAccount, signedUrl, updateProfile, updatePregnancy, uploadToBucket } from '../lib/db';
import { useEntitlement } from '../lib/entitlements';
import { capturePhoto, pickMedia, uriToBytes } from '../lib/media';
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

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://conduitai.io/bloom/privacy';

const AVATAR_ICONS = [
  'flower-outline',
  'leaf-outline',
  'heart-outline',
  'star-outline',
  'moon-outline',
  'sunny-outline',
  'sparkles-outline',
  'water-outline',
] as const;

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
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [role, setRole] = useState<Role | null>(profile?.role ?? null);
  const [dueDate, setDueDate] = useState<Date>(
    pregnancy ? new Date(pregnancy.due_date + 'T12:00:00') : new Date()
  );
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(household?.invite_code ?? null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    setInviteCode(household?.invite_code ?? null);
  }, [household]);

  useEffect(() => {
    getNotificationPrefs().then(setPrefs);
  }, []);

  // Resolve the avatar: a storage path becomes a signed URL; 'icon:*' and null render locally.
  useEffect(() => {
    let live = true;
    (async () => {
      const p = profile?.avatar_path;
      if (p && !p.startsWith('icon:')) {
        const u = await signedUrl('avatars', p);
        if (live) setAvatarUrl(u ?? null);
      } else if (live) {
        setAvatarUrl(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [profile?.avatar_path]);

  const saveAvatarPath = async (path: string | null) => {
    if (!session?.user) return;
    try {
      await updateProfile(session.user.id, { avatar_path: path });
      await refresh();
    } catch {
      Alert.alert(copy.global.error);
    }
  };

  const pickAvatar = (source: 'camera' | 'library') => {
    setAvatarBusy(true);
    void (async () => {
      try {
        if (!session?.user) return;
        const picked = source === 'camera' ? await capturePhoto() : await pickMedia({ allowsVideo: false });
        if (!picked) return;
        const bytes = await uriToBytes(picked.uri);
        const path = await uploadToBucket('avatars', session.user.id, bytes, picked.ext, picked.contentType);
        await saveAvatarPath(path);
      } catch (e) {
        console.warn(e);
        Alert.alert(copy.global.error);
      } finally {
        setAvatarBusy(false);
      }
    })();
  };

  const chooseAvatar = () => {
    Alert.alert(copy.settings.avatarTitle, undefined, [
      { text: copy.settings.takePhoto, onPress: () => pickAvatar('camera') },
      { text: copy.settings.choosePhoto, onPress: () => pickAvatar('library') },
      { text: copy.settings.useIcon, onPress: () => setIconPickerOpen((v) => !v) },
      ...(profile?.avatar_path
        ? [{ text: copy.settings.removePhoto, style: 'destructive' as const, onPress: () => saveAvatarPath(null) }]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!session?.user) return;
    setBusy(true);
    try {
      await updateProfile(session.user.id, {
        display_name: name.trim() || null,
        role,
        phone: phone.trim() || null,
      });
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

  // The compassionate off-ramp (panel: "design it before the day it's needed").
  const closePregnancy = () => {
    if (!pregnancy) return;
    Alert.alert(copy.danger.pregnancyEndedTitle, copy.danger.pregnancyEndedBody, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy.danger.pregnancyEndedConfirm,
        style: 'destructive',
        onPress: async () => {
          try {
            await updatePregnancy(pregnancy.id, { is_active: false });
            await refresh();
            router.replace('/');
          } catch {
            Alert.alert(copy.global.error);
          }
        },
      },
    ]);
  };

  // App Review 5.1.1(v): full in-app account deletion, two explicit confirms.
  const deleteMyAccount = () => {
    Alert.alert(copy.danger.deleteConfirmTitle, copy.danger.deleteConfirmBody, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy.danger.deleteConfirmConfirm,
        style: 'destructive',
        onPress: () => {
          Alert.alert(copy.danger.deleteConfirmTitle, copy.danger.deleteFinalBody, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: copy.danger.deleteConfirmConfirm,
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAccount();
                  router.replace('/(auth)/login');
                } catch {
                  Alert.alert(copy.global.error);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const nameMissing = !storedName || nameIsEmailPrefix;
  const initials = (name.trim() || storedName || session?.user.email?.[0] || '?')[0].toUpperCase();
  const avatarIcon = profile?.avatar_path?.startsWith('icon:')
    ? (profile.avatar_path.slice(5) as keyof typeof Ionicons.glyphMap)
    : null;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = (Constants.expoConfig?.ios as { buildNumber?: string } | undefined)?.buildNumber;

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

        {/* ── Profile ─────────────────────────────────────── */}
        <Text style={styles.section}>{copy.settings.sectionProfile}</Text>
        <Card>
          <View style={styles.avatarRow}>
            <PressScale onPress={chooseAvatar} style={styles.avatarWrap} disabled={avatarBusy}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : avatarIcon ? (
                <View style={styles.avatarFallback}>
                  <Ionicons name={avatarIcon} size={36} color={colors.accent.terracottaDeep} />
                </View>
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name={avatarBusy ? 'hourglass-outline' : 'camera'} size={12} color={colors.accent.onAccent} />
              </View>
            </PressScale>
            <View style={{ flex: 1 }}>
              <Text style={styles.avatarName}>{name.trim() || storedName || 'Your name'}</Text>
              <Text style={styles.avatarHint}>
                {avatarUrl ? 'Looking lovely.' : 'A photo, or an icon that feels like you.'}
              </Text>
            </View>
          </View>
          {iconPickerOpen ? (
            <View style={styles.iconRow}>
              {AVATAR_ICONS.map((iconName) => (
                <PressScale
                  key={iconName}
                  onPress={() => {
                    saveAvatarPath(`icon:${iconName}`);
                    setIconPickerOpen(false);
                  }}
                  style={[styles.iconChoice, avatarIcon === iconName && styles.iconChoiceActive]}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={avatarIcon === iconName ? colors.accent.onAccent : colors.accent.terracottaDeep}
                  />
                </PressScale>
              ))}
            </View>
          ) : null}
          <Text style={styles.label}>DISPLAY NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.ink.tertiary}
          />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>{copy.settings.phoneLabel}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={copy.settings.phonePlaceholder}
            placeholderTextColor={colors.ink.tertiary}
            keyboardType="phone-pad"
            maxLength={24}
          />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>{copy.settings.emailLabel}</Text>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyText} numberOfLines={1}>
              {session?.user.email ?? '—'}
            </Text>
          </View>
        </Card>

        {/* ── Pregnancy ───────────────────────────────────── */}
        <Text style={styles.section}>{copy.settings.sectionPregnancy}</Text>
        <Card>
          <Text style={styles.label}>ROLE</Text>
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
          {pregnancy ? (
            <PressScale onPress={closePregnancy} hitSlop={8} style={styles.endedRow}>
              <Text style={styles.endedText}>{copy.settings.pregnancyEnded}</Text>
            </PressScale>
          ) : null}
        </Card>

        {/* ── Reminders ───────────────────────────────────── */}
        {prefs ? (
          <>
            <Text style={styles.section}>{copy.settings.sectionReminders}</Text>
            <Card>
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
          </>
        ) : null}

        {/* ── Bloom Pass ──────────────────────────────────── */}
        <Text style={styles.section}>{copy.settings.sectionPass}</Text>
        <Card>
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

        {/* ── Partner ─────────────────────────────────────── */}
        {inviteCode ? (
          <>
            <Text style={styles.section}>{copy.settings.sectionPartner}</Text>
            <InviteCard
              code={inviteCode}
              onRegenerated={(next) => {
                setInviteCode(next);
                refresh().catch(() => {});
              }}
            />
          </>
        ) : null}

        {/* ── About ───────────────────────────────────────── */}
        <Text style={styles.section}>{copy.settings.sectionAbout}</Text>
        <Card>
          <PressScale style={styles.aboutRow} onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} hitSlop={4}>
            <Text style={styles.aboutLabel}>{copy.settings.aboutPrivacy}</Text>
            <Ionicons name="open-outline" size={16} color={colors.ink.tertiary} />
          </PressScale>
          <View style={styles.aboutDivider} />
          <PressScale style={styles.aboutRow} onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} hitSlop={4}>
            <Text style={styles.aboutLabel}>{copy.settings.aboutTerms}</Text>
            <Ionicons name="open-outline" size={16} color={colors.ink.tertiary} />
          </PressScale>
          <View style={styles.aboutDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>
              {copy.settings.versionLabel(appVersion)}
              {buildNumber ? ` (${buildNumber})` : ''}
            </Text>
          </View>
        </Card>

        {/* ── Danger zone ─────────────────────────────────── */}
        <Text style={styles.section}>{copy.settings.sectionDanger}</Text>
        <Card>
          <PressScale onPress={deleteMyAccount} hitSlop={8} style={styles.deleteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deleteLabel}>{copy.settings.deleteAccount}</Text>
              <Text style={styles.deleteHint}>{copy.settings.deleteHint}</Text>
            </View>
            <Ionicons name="trash-outline" size={18} color="#B3402A" />
          </PressScale>
        </Card>

        <Button label="Save" onPress={save} loading={busy} style={{ marginTop: spacing.xl }} />
        <Button label={copy.global.signOut} variant="tertiary" onPress={signOut} style={{ marginTop: spacing.md }} />
        <Text style={styles.footer}>{copy.welcome.wordmark} — made with love, for the smallest readers.</Text>
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
  section: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xl, marginBottom: spacing.sm },
  label: { ...type.labelCaps, color: colors.ink.tertiary },
  input: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    ...type.bodyMD,
    color: colors.ink.primary,
    marginTop: spacing.sm,
  },
  readonlyRow: {
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  readonlyText: { ...type.bodyMD, color: colors.ink.secondary },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  nickname: { ...type.serifQuote, color: colors.ink.secondary, marginTop: spacing.lg },
  namePrompt: { ...type.bodySM, color: colors.ink.secondary },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xs },
  avatarWrap: { width: 84, height: 84 },
  avatarImg: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.bg.surfaceWarm },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...type.displayXL, color: colors.accent.terracottaDeep },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  avatarName: { ...type.titleMD, color: colors.ink.primary },
  avatarHint: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.xs },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xs },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceActive: { backgroundColor: colors.accent.terracotta },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderHint: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  passStatus: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  passPlus: { ...type.caption, color: colors.sage.primary, marginTop: spacing.xs },
  passCta: {
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passCtaText: { ...type.titleSM, color: colors.accent.onAccent },
  restoreRow: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm },
  restoreText: { ...type.titleSM, color: colors.accent.terracotta },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  aboutDivider: { height: 1, backgroundColor: colors.border.subtle },
  aboutLabel: { ...type.bodyMD, color: colors.ink.primary },
  aboutValue: { ...type.bodySM, color: colors.ink.tertiary },
  endedRow: { marginTop: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle, minHeight: 44 },
  endedText: { ...type.bodySM, color: colors.ink.tertiary },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  deleteLabel: { ...type.bodyMD, fontWeight: '600', color: '#B3402A' },
  deleteHint: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  footer: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.xxl },
});
