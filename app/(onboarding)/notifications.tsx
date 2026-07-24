import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Card } from '../../components/Card';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import {
  DEFAULT_NOTIFICATION_PREFS,
  requestNotificationPermission,
  saveNotificationPrefs,
  scheduleGentleReminders,
} from '../../lib/notifications';
import { useApp } from '../../lib/AppContext';
import { colors, spacing, type } from '../../lib/theme';

function toDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** The polite permission moment: explain why, offer a time, easy to skip. */
export default function NotificationsScreen() {
  const router = useRouter();
  const { week, pregnancy, profile } = useApp();
  const isPartner = profile?.role === 'partner';
  const [time, setTime] = useState(() => toDate(DEFAULT_NOTIFICATION_PREFS.hour, DEFAULT_NOTIFICATION_PREFS.minute));
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const done = () => router.replace('/(tabs)');

  const enable = async () => {
    setBusy(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setDenied(true);
        return;
      }
      await saveNotificationPrefs({ dailyEnabled: true, hour: time.getHours(), minute: time.getMinutes() });
      await scheduleGentleReminders(week, pregnancy?.due_date ?? null);
      done();
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    await saveNotificationPrefs({ dailyEnabled: false, hour: time.getHours(), minute: time.getMinutes() });
    done();
  };

  return (
    <OnboardingShell
      step={isPartner ? 6 : 9}
      total={isPartner ? 6 : 9}
      eyebrow={copy.onboarding.notifications.eyebrow}
      headline={copy.onboarding.notifications.headline}
      helper={copy.onboarding.notifications.body}
      ctaLabel={copy.onboarding.notifications.enable}
      onContinue={enable}
      busy={busy}
      secondaryLabel={copy.onboarding.notifications.later}
      onSecondary={skip}
      footerNote={denied ? copy.onboarding.notifications.denied : undefined}
    >
      <Card>
        <Text style={styles.timeLabel}>{copy.onboarding.notifications.timeLabel}</Text>
        <View style={{ alignItems: 'flex-start', marginTop: spacing.sm }}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={(_: DateTimePickerEvent, d?: Date) => d && setTime(d)}
            accentColor={colors.accent.terracotta}
          />
        </View>
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  timeLabel: { ...type.labelCaps, color: colors.ink.tertiary },
});
