import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell, OptionCard } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { createHouseholdForUser, updateProfile } from '../../lib/db';
import { useApp } from '../../lib/AppContext';
import { useOnboarding } from '../../lib/OnboardingContext';
import { spacing } from '../../lib/theme';

/** "Is your partner already on Bloom?" — asked before any household is created. */
export default function JoinScreen() {
  const router = useRouter();
  const { session, household, refresh } = useApp();
  const { role } = useOnboarding();
  const [busy, setBusy] = useState(false);

  const startFresh = async () => {
    if (!session?.user) return;
    setBusy(true);
    try {
      if (household) {
        // Returning user re-running onboarding — keep their home, update role.
        if (role) await updateProfile(session.user.id, { role });
      } else {
        // Name comes later from Settings — never prefill from the email address.
        await createHouseholdForUser(session.user.id, '', role ?? 'mother');
      }
      await refresh();
      router.push('/(onboarding)/due-date');
    } catch (e) {
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={2}
      total={role === 'partner' ? 6 : 9}
      eyebrow={copy.onboarding.join.eyebrow}
      headline={copy.onboarding.join.headline}
      footerNote={copy.role.footer}
    >
      <View style={{ gap: spacing.lg }}>
        <OptionCard
          title={copy.onboarding.join.cardA.title}
          body={copy.onboarding.join.cardA.body}
          selected={false}
          onPress={busy ? () => {} : startFresh}
        />
        <OptionCard
          title={copy.onboarding.join.cardB.title}
          body={copy.onboarding.join.cardB.body}
          selected={false}
          onPress={() => router.push('/(onboarding)/join-code')}
        />
      </View>
    </OnboardingShell>
  );
}
