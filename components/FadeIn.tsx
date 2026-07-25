import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { tokens } from '../lib/theme';

/** Staggered screen entrance: translateY 8→0 with fade, delayed per index. */
export function FadeIn({
  index = 0,
  style,
  children,
}: {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      index * 60,
      withTiming(1, {
        duration: tokens.motion.timing.durationDefault,
        easing: Easing.bezier(...tokens.motion.easing),
      })
    );
  }, [index, progress]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
