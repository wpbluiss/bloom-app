import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { PressScale } from '../components/PressScale';
import { useApp } from '../lib/AppContext';
import { copy } from '../lib/copy';
import { Role, updateProfile, updatePregnancy } from '../lib/db';
import { supabase } from '../lib/supabase';
import { formatISODate } from '../lib/weeks';
import { colors, radius, spacing, type } from '../lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, profile, pregnancy, week, refresh } = useApp();
  const emailPrefix = session?.user.email?.split('@')[0]?.toLowerCase();
  const storedName = profile?.display_name?.trim() ?? '';
  const nameIsEmailPrefix = storedName.length > 0 && storedName.toLowerCase() === emailPrefix;
  const [name, setName] = useState(nameIsEmailPrefix ? '' : storedName);
  const [role, setRole] = useState<Role | null>(profile?.role ?? null);
  const [dueDate, setDueDate] = useState<Date>(
    pregnancy ? new Date(pregnancy.due_date + 'T12:00:00') : new Date()
  );
  const [busy, setBusy] = useState(false);

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
  footer: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.xxl },
});
