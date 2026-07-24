import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../components/Button';
import { FadeIn } from '../../components/FadeIn';
import { copy } from '../../lib/copy';
import { createPregnancy } from '../../lib/db';
import { useApp } from '../../lib/AppContext';
import { formatISODate } from '../../lib/weeks';
import { scheduleGentleReminders } from '../../lib/notifications';
import { colors, radius, spacing, type } from '../../lib/theme';
import { ProgressDots } from './role';

export default function DueDateScreen() {
  const router = useRouter();
  const { household, refresh } = useApp();
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 168); // ~24 weeks out as a friendly default
    return d;
  });
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDate(selected);
  };

  const finish = async () => {
    if (!household) {
      Alert.alert(copy.global.error);
      return;
    }
    setBusy(true);
    try {
      await createPregnancy({
        householdId: household.id,
        dueDate: formatISODate(date),
        babyNickname: nickname.trim() || null,
      });
      await refresh();
      scheduleGentleReminders(null).catch(() => {});
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <ProgressDots step={2} />
        <FadeIn index={0}>
          <Text style={styles.eyebrow}>{copy.dueDate.eyebrow}</Text>
          <Text style={styles.headline}>{copy.dueDate.headline}</Text>
          <Text style={styles.helper}>{copy.dueDate.helper}</Text>
        </FadeIn>
        <FadeIn index={1}>
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              minimumDate={new Date()}
              themeVariant="light"
              accentColor={colors.accent.terracotta}
              style={{ alignSelf: 'center' }}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Baby's nickname (optional) — “Little Bean”"
            placeholderTextColor={colors.ink.tertiary}
            value={nickname}
            onChangeText={setNickname}
            maxLength={40}
          />
        </FadeIn>
      </View>
      <View style={styles.footer}>
        <Button label={copy.dueDate.cta} onPress={finish} loading={busy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  body: { flex: 1, padding: spacing.screen },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.lg },
  headline: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm },
  helper: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  pickerCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginTop: spacing.section,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.lg,
    height: 52,
    ...type.bodyMD,
    color: colors.ink.primary,
    marginTop: spacing.lg,
  },
  footer: { padding: spacing.screen, paddingBottom: spacing.section },
});
