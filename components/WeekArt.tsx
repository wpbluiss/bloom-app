import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { weekIllustration } from '../lib/illustrations';
import { colors, radius } from '../lib/theme';

interface Props {
  week: number;
  height?: number;
  style?: ViewStyle;
}

/**
 * The week's watercolor, presented like art in a keepsake book:
 * a soft paper backdrop, hairline warm border, generous air around the subject.
 */
export function WeekArt({ week, height = 220, style }: Props) {
  return (
    <View style={[styles.paper, style]}>
      <Image
        source={weekIllustration(week)}
        style={{ width: '100%', height }}
        resizeMode="contain"
        accessibilityLabel={`Watercolor illustration for week ${week}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.bg.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
