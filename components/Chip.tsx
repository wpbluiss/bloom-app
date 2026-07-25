import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../lib/theme';
import { PressScale } from './PressScale';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dotColor?: string;
}

export function Chip({ label, selected, onPress, dotColor }: ChipProps) {
  return (
    <PressScale onPress={onPress} disabled={!onPress} style={[styles.chip, selected ? styles.selected : styles.unselected]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, selected ? { color: colors.accent.terracottaDeep } : { color: colors.ink.secondary }]}>
        {label}
      </Text>
    </PressScale>
  );
}

/** Severity chip for the Food tab ("Avoid" / "Limit") with a 6pt dot. */
export function SeverityChip({ severity }: { severity: 'avoid' | 'limit' }) {
  const isAvoid = severity === 'avoid';
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: isAvoid ? colors.status.avoidSoft : colors.status.warningSoft },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: isAvoid ? colors.status.avoid : colors.status.warning }]} />
      <Text style={[styles.label, { color: isAvoid ? colors.status.avoid : colors.status.warning }]}>
        {isAvoid ? 'Avoid' : 'Limit'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    // minHeight + vertical padding instead of a fixed height, so the label
    // always fits inside the chip.
    minHeight: 32,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  selected: { backgroundColor: colors.accent.terracottaSoft },
  unselected: { backgroundColor: colors.bg.surfaceWarm },
  label: { ...type.labelMD },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
