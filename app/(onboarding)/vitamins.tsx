import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell, OptionCard } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { useOnboarding } from '../../lib/OnboardingContext';
import { colors, spacing, type } from '../../lib/theme';

const VALUES = ['yes', 'not-yet', 'different'] as const;

export default function VitaminsScreen() {
  const router = useRouter();
  const { patch } = useOnboarding();
  const [value, setValue] = useState<(typeof VALUES)[number] | null>(null);

  return (
    <OnboardingShell
      step={5}
      total={9}
      eyebrow={copy.onboarding.vitamins.eyebrow}
      headline={copy.onboarding.vitamins.headline}
      onContinue={() => {
        patch({ vitamins: value });
        router.push('/(onboarding)/appointment');
      }}
    >
      <View style={{ gap: spacing.lg }}>
        {copy.onboarding.vitamins.options.map((label, i) => (
          <OptionCard key={label} title={label} selected={value === VALUES[i]} onPress={() => setValue(VALUES[i])} />
        ))}
      </View>
      {value === 'not-yet' ? <Text style={styles.note}>{copy.onboarding.vitamins.notYetNote}</Text> : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  note: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.xl },
});
