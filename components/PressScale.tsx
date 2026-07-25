import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '../lib/theme';

/**
 * Style keys that arrange a PressScale's *children* (row/column layout, gap,
 * centering). These are forwarded to the inner animated view; everything else
 * (background, border, padding, size, position, shadow) stays on the
 * Pressable container.
 */
const CHILD_LAYOUT_KEYS = new Set<string>([
  'flexDirection',
  'flexWrap',
  'alignItems',
  'alignContent',
  'justifyContent',
  'gap',
  'rowGap',
  'columnGap',
]);

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Pressable with Bloom's 0.97 press-scale over 120ms, spring back on release.
 *
 * The container is a plain React Native Pressable — never
 * `Animated.createAnimatedComponent(Pressable)`. On Reanimated 4 + RN 0.81
 * (New Architecture), an animated Pressable can fail to paint its children in
 * release/production builds: button labels and icons vanish while the pill's
 * background and border still draw. The spring scale lives on an inner
 * Animated.View around the children, so labels always render in production.
 */
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

  // Split the caller's style: the Pressable keeps layout + visual chrome, the
  // inner animated view keeps the props that arrange the children.
  const flat = StyleSheet.flatten(style) ?? {};
  const outerStyle: ViewStyle = {};
  const innerLayout: ViewStyle = { flexGrow: 1, flexShrink: 1 };
  (Object.keys(flat) as (keyof ViewStyle)[]).forEach((key) => {
    const value = flat[key];
    if (CHILD_LAYOUT_KEYS.has(key as string)) {
      (innerLayout as Record<string, unknown>)[key] = value;
    } else {
      (outerStyle as Record<string, unknown>)[key] = value;
    }
  });
  // Mirror a minimum tappable height inside so centered labels stay centered.
  if (typeof flat.minHeight === 'number') {
    (innerLayout as Record<string, unknown>).minHeight = flat.minHeight;
  }

  return (
    <Pressable {...rest} onPressIn={handleIn} onPressOut={handleOut} style={outerStyle}>
      <Animated.View style={[innerLayout, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
