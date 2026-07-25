import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { FadeIn } from './FadeIn';
import { PressScale } from './PressScale';
import { colors, radius, shadow, spacing, type } from '../lib/theme';

interface Props {
  step: number;
  total: number;
  eyebrow: string;
  headline: string;
  helper?: string;
  children: React.ReactNode;
  ctaLabel?: string;
  onContinue?: () => void;
  continueDisabled?: boolean;
  busy?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: string;
}

/** A soft progress hairline — never a clinical stepper. */
export function ProgressHairline({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, (step / total) * 100)}%` }]} />
    </View>
  );
}

/**
 * Shared frame for the one-question-per-screen onboarding: gentle Fraunces
 * heading, staggered entrance, hairline progress, single warm CTA.
 */
export function OnboardingShell({
  step,
  total,
  eyebrow,
  headline,
  helper,
  children,
  ctaLabel = 'Continue',
  onContinue,
  continueDisabled,
  busy,
  secondaryLabel,
  onSecondary,
  footerNote,
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <ProgressHairline step={step} total={total} />
        <FadeIn index={0}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.headline}>{headline}</Text>
          {helper ? <Text style={styles.helper}>{helper}</Text> : null}
        </FadeIn>
        <FadeIn index={1} style={styles.contentWrap}>
          <View style={styles.content}>{children}</View>
        </FadeIn>
      </View>
      <View style={styles.footer}>
        {onContinue ? <Button label={ctaLabel} onPress={onContinue} disabled={continueDisabled} loading={busy} /> : null}
        {secondaryLabel && onSecondary ? (
          <Button label={secondaryLabel} variant="tertiary" onPress={onSecondary} style={{ marginTop: spacing.sm }} />
        ) : null}
        {footerNote ? <Text style={styles.note}>{footerNote}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

/** Big tappable answer card used across onboarding questions. */
export function OptionCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} style={[styles.optionCard, selected && styles.optionCardActive]}>
      <View style={styles.optionRow}>
        <Text style={[styles.optionTitle, selected && { color: colors.accent.terracottaDeep }]}>{title}</Text>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent.terracotta} /> : null}
      </View>
      {body ? <Text style={styles.optionBody}>{body}</Text> : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  optionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
    ...shadow.card,
  },
  optionCardActive: {
    backgroundColor: colors.accent.terracottaSoft,
    borderColor: colors.accent.terracotta,
  },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  optionTitle: { ...type.displayMD, color: colors.ink.primary, flex: 1 },
  optionBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  body: { flex: 1, paddingHorizontal: spacing.screen },
  track: {
    height: 2,
    backgroundColor: colors.border.subtle,
    borderRadius: 1,
    marginVertical: spacing.lg,
    overflow: 'hidden',
  },
  fill: { height: 2, backgroundColor: colors.accent.terracotta, borderRadius: 1 },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.lg },
  headline: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm },
  helper: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  contentWrap: { flex: 1 },
  content: { marginTop: spacing.section, flex: 1, justifyContent: 'center' },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: spacing.section, paddingTop: spacing.md },
  note: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.md },
});
