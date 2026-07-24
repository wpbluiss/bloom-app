import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { copy } from '../../lib/copy';
import { Role, createHouseholdForUser, updateProfile } from '../../lib/db';
import { useApp } from '../../lib/AppContext';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

export default function RoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dueDate?: string; nickname?: string }>();
  const { session, household, refresh } = useApp();
  const [role, setRole] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);

  const next = async () => {
    if (!role || !session?.user) return;
    setBusy(true);
    try {
      if (household) {
        await updateProfile(session.user.id, { role });
      } else {
        const name = session.user.email?.split('@')[0] ?? 'Parent';
        await createHouseholdForUser(session.user.id, name, role);
      }
      await refresh();
      if (params.dueDate) {
        // came back from due-date; finish there
        router.push({ pathname: '/(onboarding)/due-date', params: { dueDate: params.dueDate, nickname: params.nickname ?? '' } });
      } else {
        router.push('/(onboarding)/due-date');
      }
    } catch (e) {
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <ProgressDots step={1} />
        <FadeIn index={0}>
          <Text style={styles.eyebrow}>{copy.role.eyebrow}</Text>
          <Text style={styles.headline}>{copy.role.headline}</Text>
        </FadeIn>
        <FadeIn index={1}>
          <View style={styles.cards}>
            {(['mother', 'partner'] as Role[]).map((r) => {
              const c = r === 'mother' ? copy.role.cardA : copy.role.cardB;
              const active = role === r;
              return (
                <PressScale key={r} onPress={() => setRole(r)} style={[styles.roleCard, active && styles.roleCardActive]}>
                  <View style={styles.roleRow}>
                    <Text style={styles.roleTitle}>{c.title}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={colors.accent.terracotta} /> : null}
                  </View>
                  <Text style={styles.roleBody}>{c.body}</Text>
                </PressScale>
              );
            })}
          </View>
        </FadeIn>
      </View>
      <View style={styles.footer}>
        <Button label={copy.role.cta} onPress={next} disabled={!role} loading={busy} />
        <Text style={styles.note}>{copy.role.footer}</Text>
      </View>
    </SafeAreaView>
  );
}

export function ProgressDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  body: { flex: 1, padding: spacing.screen },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginVertical: spacing.lg },
  dot: { width: 24, height: 2, backgroundColor: colors.border.strong, borderRadius: 1 },
  dotActive: { backgroundColor: colors.accent.terracotta },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.lg },
  headline: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm },
  cards: { marginTop: spacing.section, gap: spacing.lg },
  roleCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
    ...shadow.card,
  },
  roleCardActive: {
    backgroundColor: colors.accent.terracottaSoft,
    borderColor: colors.accent.terracotta,
  },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleTitle: { ...type.displayMD, color: colors.ink.primary },
  roleBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  footer: { padding: spacing.screen, paddingBottom: spacing.section },
  note: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.md },
});
