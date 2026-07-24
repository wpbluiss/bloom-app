import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { OnboardingShell } from '../../components/OnboardingShell';
import { copy } from '../../lib/copy';
import { fetchActivePregnancy } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { HouseholdPreview, InvalidCodeError, joinHouseholdByCode, previewHouseholdByCode } from '../../lib/invites';
import { useApp } from '../../lib/AppContext';
import { useOnboarding } from '../../lib/OnboardingContext';
import { colors, radius, spacing, type } from '../../lib/theme';

/** Joining a partner's household with their six-letter Bloom code. */
export default function JoinCodeScreen() {
  const router = useRouter();
  const { session, household, refresh } = useApp();
  const { role } = useOnboarding();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<HouseholdPreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const find = async () => {
    if (code.trim().length < 6) return;
    setBusy(true);
    setNotFound(false);
    try {
      const p = await previewHouseholdByCode(code);
      if (p) setPreview(p);
      else setNotFound(true);
    } catch (e) {
      // Migration not applied yet or network — treat as a warm not-found.
      setNotFound(true);
    } finally {
      setBusy(false);
    }
  };

  const doJoin = async () => {
    if (!session?.user) return;
    setBusy(true);
    try {
      // Make sure a profile row with the chosen role exists before joining.
      await supabase.from('profiles').upsert({ id: session.user.id, role: role ?? 'partner' });
      const householdId = await joinHouseholdByCode(code);
      await refresh();
      const pregnancy = await fetchActivePregnancy(householdId);
      if (pregnancy) {
        router.replace('/(onboarding)/notifications');
      } else {
        router.replace('/(onboarding)/due-date');
      }
    } catch (e) {
      if (e instanceof InvalidCodeError) {
        setPreview(null);
        setNotFound(true);
      } else {
        Alert.alert(copy.global.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmJoin = () => {
    if (household) {
      Alert.alert(copy.onboarding.code.switchTitle, copy.onboarding.code.switchBody, [
        { text: 'Cancel', style: 'cancel' },
        { text: copy.onboarding.code.switchConfirm, onPress: doJoin },
      ]);
    } else {
      doJoin();
    }
  };

  return (
    <OnboardingShell
      step={2}
      total={role === 'partner' ? 6 : 9}
      eyebrow={copy.onboarding.code.eyebrow}
      headline={copy.onboarding.code.headline}
      helper={copy.onboarding.code.helper}
      onContinue={preview ? undefined : find}
      ctaLabel={copy.onboarding.code.find}
      continueDisabled={code.trim().length < 6}
      busy={busy && !preview}
    >
      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
          setPreview(null);
          setNotFound(false);
        }}
        placeholder={copy.onboarding.code.placeholder}
        placeholderTextColor={colors.ink.tertiary}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />
      {notFound ? <Text style={styles.notFound}>{copy.onboarding.code.notFound}</Text> : null}
      {preview ? (
        <Card style={{ marginTop: spacing.xl }}>
          <Text style={styles.previewName}>{preview.name ?? 'Their family'}</Text>
          <Text style={styles.previewBody}>One story, two phones. Everything saved so far appears on yours.</Text>
          <Button
            label={copy.onboarding.code.join(preview.name ?? 'them')}
            onPress={confirmJoin}
            loading={busy}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  codeInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    height: 72,
    textAlign: 'center',
    fontFamily: 'Fraunces_500Medium',
    fontSize: 32,
    letterSpacing: 8,
    color: colors.ink.primary,
  },
  notFound: { ...type.bodySM, color: colors.status.avoid, marginTop: spacing.lg, textAlign: 'center' },
  previewName: { ...type.displayMD, color: colors.ink.primary },
  previewBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
});
