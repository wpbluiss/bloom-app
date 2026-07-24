import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell, OptionCard } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { Role } from '../../lib/db';
import { useOnboarding } from '../../lib/OnboardingContext';
import { spacing } from '../../lib/theme';

export default function RoleScreen() {
  const router = useRouter();
  const { patch } = useOnboarding();
  const [role, setRole] = useState<Role | null>(null);

  const next = () => {
    if (!role) return;
    patch({ role });
    router.push('/(onboarding)/join');
  };

  return (
    <OnboardingShell
      step={1}
      total={role === 'partner' ? 6 : 9}
      eyebrow={copy.role.eyebrow}
      headline={copy.role.headline}
      ctaLabel={copy.role.cta}
      onContinue={next}
      continueDisabled={!role}
      footerNote={copy.role.footer}
    >
      <View style={{ gap: spacing.lg }}>
        {(['mother', 'partner'] as Role[]).map((r) => {
          const c = r === 'mother' ? copy.role.cardA : copy.role.cardB;
          return (
            <OptionCard key={r} title={c.title} body={c.body} selected={role === r} onPress={() => setRole(r)} />
          );
        })}
      </View>
    </OnboardingShell>
  );
}
