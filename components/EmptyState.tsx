import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type } from '../lib/theme';
import { Button } from './Button';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  headline: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}

/** Warm empty state: sage line icon on warm circle, Fraunces headline, one CTA. */
export function EmptyState({ icon, headline, body, cta, onCta }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={40} color={colors.sage.primary} />
      </View>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>
      {cta && onCta ? <Button label={cta} onPress={onCta} style={styles.cta} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.hero },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  headline: { ...type.displayMD, color: colors.ink.primary, textAlign: 'center' },
  body: {
    ...type.bodySM,
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  cta: { marginTop: spacing.xxl, alignSelf: 'stretch' },
});
