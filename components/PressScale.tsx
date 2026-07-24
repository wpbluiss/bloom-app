import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Pressable with Bloom's 0.97 press-scale over 120ms, spring back on release. */
export function PressScale({ style, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);

  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = withTiming(tokens.motion.pressScale, { duration: tokens.motion.pressDuration });
      onPressIn?.(e);
    },
    [onPressIn, scale]
  );
  const handleOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, tokens.motion.springPop);
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable style={[style, animatedStyle]} onPressIn={handleIn} onPressOut={handleOut} {...rest}>
      {children}
    </AnimatedPressable>
  );
}
