import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { useApp } from '../../lib/AppContext';
import { weekInfo } from '../../lib/weeks';
import { colors, spacing, type } from '../../lib/theme';

const ICONS = ['heart-outline', 'walk-outline', 'calendar-outline'] as const;

/** Partner-only intro card: "how you can support this week". */
export default function SupportScreen() {
  const router = useRouter();
  const { week } = useApp();
  const info = weekInfo(week ?? 4);

  const lines = [
    info.partnerTips[0],
    'Her check-ins appear on your Today screen — respond with actions, not just words.',
    'A new way to help arrives every week, right when the week turns.',
  ];

  return (
    <OnboardingShell
      step={5}
      total={6}
      eyebrow={copy.onboarding.support.eyebrow}
      headline={copy.onboarding.support.headline}
      ctaLabel={copy.dueDate.cta}
      onContinue={() => router.push('/(onboarding)/notifications')}
      footerNote={copy.onboarding.support.footer}
    >
      <Card>
        <View style={{ gap: spacing.xl }}>
          {lines.map((line, i) => (
            <View key={i} style={styles.row}>
              <Ionicons name={ICONS[i]} size={20} color={colors.accent.terracotta} />
              <Text style={styles.line}>{line}</Text>
            </View>
          ))}
        </View>
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  line: { ...type.bodySM, color: colors.ink.secondary, flex: 1 },
});
