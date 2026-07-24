import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip } from '../../components/Chip';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { useOnboarding } from '../../lib/OnboardingContext';
import { spacing } from '../../lib/theme';

export default function FeelingsScreen() {
  const router = useRouter();
  const { patch } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (s: string) =>
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const next = () => {
    patch({ feelings: selected });
    router.push('/(onboarding)/nickname');
  };

  return (
    <OnboardingShell
      step={7}
      total={9}
      eyebrow={copy.onboarding.feelings.eyebrow}
      headline={copy.onboarding.feelings.headline}
      helper={copy.onboarding.feelings.helper}
      onContinue={next}
      secondaryLabel={copy.onboarding.feelings.skip}
      onSecondary={next}
    >
      <View style={styles.chips}>
        {copy.onboarding.feelings.options.map((s) => (
          <Chip key={s} label={s} selected={selected.includes(s)} onPress={() => toggle(s)} />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
