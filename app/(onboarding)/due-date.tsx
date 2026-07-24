import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { OnboardingShell } from '../../components/OnboardingShell';
import { PressScale } from '../../components/PressScale';
import { copy } from '../../lib/copy';
import { useApp } from '../../lib/AppContext';
import { useOnboarding } from '../../lib/OnboardingContext';
import { formatISODate } from '../../lib/weeks';
import { colors, radius, spacing, type } from '../../lib/theme';

export default function DueDateScreen() {
  const router = useRouter();
  const { profile } = useApp();
  const { role, patch } = useOnboarding();
  const effectiveRole = role ?? profile?.role ?? 'mother';
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 168); // ~24 weeks out as a friendly default
    return d;
  });
  const [lmpMode, setLmpMode] = useState<'hidden' | 'adding' | 'skipped'>('hidden');
  const [lmp, setLmp] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 112); // ~16 weeks ago as a neutral default
    return d;
  });

  const next = () => {
    patch({ dueDate: formatISODate(date), lmp: lmpMode === 'adding' ? formatISODate(lmp) : null });
    if (effectiveRole === 'partner') {
      router.push('/(onboarding)/nickname');
    } else {
      router.push('/(onboarding)/first-baby');
    }
  };

  return (
    <OnboardingShell
      step={3}
      total={effectiveRole === 'partner' ? 6 : 9}
      eyebrow={copy.dueDate.eyebrow}
      headline={copy.dueDate.headline}
      helper={copy.dueDate.helper}
      ctaLabel={copy.dueDate.cta}
      onContinue={next}
    >
      <View style={styles.pickerCard}>
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_: DateTimePickerEvent, selected?: Date) => selected && setDate(selected)}
          minimumDate={new Date()}
          themeVariant="light"
          accentColor={colors.accent.terracotta}
          style={{ alignSelf: 'center' }}
        />
      </View>

      {effectiveRole === 'mother' ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.lmpLabel}>{copy.onboarding.dueDate.lmpLabel}</Text>
          {lmpMode === 'adding' ? (
            <View style={[styles.pickerCard, { marginTop: spacing.sm }]}>
              <DateTimePicker
                value={lmp}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={(_: DateTimePickerEvent, selected?: Date) => selected && setLmp(selected)}
                maximumDate={new Date()}
                themeVariant="light"
                accentColor={colors.accent.terracotta}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          ) : (
            <View style={styles.lmpRow}>
              <PressScale onPress={() => setLmpMode('adding')} hitSlop={8}>
                <Text style={styles.lmpLink}>{copy.onboarding.dueDate.lmpAdd}</Text>
              </PressScale>
              <PressScale onPress={() => setLmpMode('skipped')} hitSlop={8}>
                <Text style={[styles.lmpLink, lmpMode === 'skipped' && styles.lmpLinkActive]}>
                  {copy.onboarding.dueDate.lmpSkip}
                </Text>
              </PressScale>
            </View>
          )}
          <Text style={styles.lmpHelper}>{copy.onboarding.dueDate.lmpHelper}</Text>
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pickerCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
  },
  lmpLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  lmpRow: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.sm },
  lmpLink: { ...type.titleSM, color: colors.accent.terracotta, minHeight: 32 },
  lmpLinkActive: { color: colors.accent.terracottaDeep, textDecorationLine: 'underline' },
  lmpHelper: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.sm },
});
