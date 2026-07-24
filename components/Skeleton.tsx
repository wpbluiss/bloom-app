import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../lib/theme';

export function Skeleton({ width = '100%', height = 16, style }: { width?: number | string; height?: number; style?: ViewStyle }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.base, { width: width as number, height }, anim, style]} />;
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="80%" height={20} style={{ marginTop: 12 }} />
      <Skeleton width="95%" height={12} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.bg.sunken, borderRadius: radius.sm },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 20,
  },
});
