import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell, OptionCard } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { useOnboarding } from '../../lib/OnboardingContext';
import { spacing } from '../../lib/theme';

const VALUES = ['yes', 'no', 'declined'] as const;

export default function FirstBabyScreen() {
  const router = useRouter();
  const { patch } = useOnboarding();
  const [value, setValue] = useState<(typeof VALUES)[number] | null>(null);

  return (
    <OnboardingShell
      step={4}
      total={9}
      eyebrow={copy.onboarding.firstBaby.eyebrow}
      headline={copy.onboarding.firstBaby.headline}
      onContinue={() => {
        patch({ firstBaby: value });
        router.push('/(onboarding)/vitamins');
      }}
    >
      <View style={{ gap: spacing.lg }}>
        {copy.onboarding.firstBaby.options.map((label, i) => (
          <OptionCard key={label} title={label} selected={value === VALUES[i]} onPress={() => setValue(VALUES[i])} />
        ))}
      </View>
    </OnboardingShell>
  );
}
