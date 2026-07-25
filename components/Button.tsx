import React from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '../lib/theme';
import { PressScale } from './PressScale';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  if (variant === 'tertiary') {
    return (
      <PressScale onPress={onPress} disabled={disabled || loading} style={[styles.tertiary, style]} hitSlop={8}>
        <Text style={[styles.tertiaryLabel, disabled && { color: colors.ink.tertiary }]}>{label}</Text>
      </PressScale>
    );
  }
  const isSecondary = variant === 'secondary';
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.ink.primary : colors.accent.onAccent} />
      ) : (
        <Text
          style={[
            styles.label,
            isSecondary ? { color: colors.ink.primary } : { color: colors.accent.onAccent },
            disabled && { color: colors.ink.tertiary },
          ]}
        >
          {label}
        </Text>
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: {
    // minHeight (not fixed height) so the label can never be clipped by the
    // pill — the button grows with larger text instead of cutting it off.
    minHeight: 54,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  primary: { backgroundColor: colors.accent.terracotta },
  secondary: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
  },
  disabled: { backgroundColor: colors.bg.sunken, borderWidth: 0 },
  label: { ...type.bodyMD, fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  tertiary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  tertiaryLabel: { ...type.titleSM, color: colors.accent.terracotta },
});
