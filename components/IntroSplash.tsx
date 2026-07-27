import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { colors, type } from '../lib/theme';

/**
 * Cold open, quiet on purpose (Luis QA: "SKIMS-level", the SVG cartoon read
 * cheap): the brand watercolor settles onto the canvas, breathes, and the
 * wordmark joins. ~1.9s, then hands off to the gate (session/onboarding).
 * The artwork is the same sprout as the native splash screen, so the handoff
 * from OS splash to this screen is seamless.
 *
 * Every animation runs on the NATIVE driver with opacity/transform only.
 * The build-5 startup crash came from mixing a JS-driven value into native
 * animations — the new architecture aborts on that. Do not add SVG prop
 * animations or JS-driver values here. Entrance and breath live on nested
 * views so no composed values are needed at all.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq = Animated.sequence([
      // the sprout settles in — slow, soft, no bounce
      Animated.timing(enter, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // the wordmark joins
      Animated.timing(word, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(430),
    ]);
    seq.start(({ finished }) => finished && onDone());

    // one slow breath, looped — presence, not motion graphics
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breath.start();
    return () => {
      seq.stop();
      breath.stop();
    };
  }, [breathe, enter, onDone, word]);

  return (
    <Animated.View style={styles.wrap}>
      <Animated.View
        style={{
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        }}
      >
        <Animated.Image
          source={require('../assets/splash-icon.png')}
          style={{
            width: 168,
            height: 168,
            transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
          }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.word,
          { opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
      >
        Bloom
      </Animated.Text>
      <Animated.Text style={[styles.byline, { opacity: word }]}>by Conduit AI</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg.canvas, alignItems: 'center', justifyContent: 'center' },
  word: { ...type.displayXL, fontSize: 40, color: colors.ink.primary, marginTop: 22 },
  // Faint house mark — SKIMS-quiet (Luis QA): present, never loud.
  byline: {
    ...type.caption,
    position: 'absolute',
    bottom: 54,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.ink.tertiary,
    opacity: 0.7,
  },
});
