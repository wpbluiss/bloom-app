import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Card } from '../../components/Card';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { useOnboarding } from '../../lib/OnboardingContext';
import { formatISODate } from '../../lib/weeks';
import { colors, radius, spacing, type } from '../../lib/theme';

export default function AppointmentScreen() {
  const router = useRouter();
  const { patch } = useOnboarding();
  const [notYet, setNotYet] = useState(false);
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });

  const next = () => {
    patch({ appointment: notYet ? 'not-yet' : formatISODate(date) });
    router.push('/(onboarding)/feelings');
  };

  return (
    <OnboardingShell
      step={6}
      total={9}
      eyebrow={copy.onboarding.appointment.eyebrow}
      headline={copy.onboarding.appointment.headline}
      onContinue={next}
      secondaryLabel={notYet ? undefined : copy.onboarding.appointment.notYet}
      onSecondary={notYet ? undefined : () => setNotYet(true)}
    >
      {notYet ? (
        <Card>
          <Text style={styles.tip}>{copy.onboarding.appointment.notYetTip}</Text>
        </Card>
      ) : (
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
      )}
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
  tip: { ...type.serifQuote, color: colors.ink.secondary },
});
