import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { createPregnancy, fetchActivePregnancy, updatePregnancy } from '../../lib/db';
import { saveOnboardingAnswers } from '../../lib/onboarding';
import { useApp } from '../../lib/AppContext';
import { useOnboarding } from '../../lib/OnboardingContext';
import { colors, radius, spacing, type } from '../../lib/theme';

export default function NicknameScreen() {
  const router = useRouter();
  const { session, household, profile, refresh } = useApp();
  const data = useOnboarding();
  const [nickname, setNickname] = useState(data.nickname);
  const [busy, setBusy] = useState(false);

  const effectiveRole = data.role ?? profile?.role ?? 'mother';
  const step = effectiveRole === 'partner' ? 4 : 8;
  const total = effectiveRole === 'partner' ? 6 : 9;

  const finish = async () => {
    if (!session?.user || !household) {
      Alert.alert(copy.global.error);
      return;
    }
    setBusy(true);
    try {
      const name = nickname.trim() || null;
      const existing = await fetchActivePregnancy(household.id);
      if (existing) {
        await updatePregnancy(existing.id, {
          due_date: data.dueDate ?? existing.due_date,
          baby_nickname: name ?? existing.baby_nickname,
        });
      } else if (data.dueDate) {
        await createPregnancy({
          householdId: household.id,
          dueDate: data.dueDate,
          babyNickname: name,
        });
      }
      await saveOnboardingAnswers(session.user.id, {
        lmp: data.lmp,
        firstBaby: data.firstBaby ?? undefined,
        vitamins: data.vitamins ?? undefined,
        appointment: data.appointment ?? undefined,
        feelings: data.feelings.length > 0 ? data.feelings : undefined,
      });
      await refresh();
      if (effectiveRole === 'partner') {
        router.push('/(onboarding)/support');
      } else {
        router.push('/(onboarding)/notifications');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={step}
      total={total}
      eyebrow={copy.onboarding.nickname.eyebrow}
      headline={copy.onboarding.nickname.headline}
      helper={copy.onboarding.nickname.helper}
      ctaLabel={copy.dueDate.cta}
      onContinue={finish}
      busy={busy}
      secondaryLabel={copy.onboarding.nickname.skip}
      onSecondary={busy ? undefined : finish}
    >
      <TextInput
        style={styles.input}
        placeholder={copy.onboarding.nickname.placeholder}
        placeholderTextColor={colors.ink.tertiary}
        value={nickname}
        onChangeText={setNickname}
        maxLength={40}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.xl,
    height: 60,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 24,
    color: colors.ink.primary,
    textAlign: 'center',
  },
});
