import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, type } from '../lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Cold open, as a four-beat origin story (Luis QA): a seed settles, shakes
 * like it's about to crack — then the sprout draws up, leafs out, and blooms.
 * ~2.6s, then hands off to the gate (session/onboarding).
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const seed = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const stem = useRef(new Animated.Value(0)).current;
  const leafL = useRef(new Animated.Value(0)).current;
  const leafR = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq = Animated.sequence([
      // 1 — the seed lands
      Animated.timing(seed, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      // 2 — it shakes: something is about to happen
      Animated.timing(shake, { toValue: 1, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      // 3 — the sprout draws itself up out of the seed
      Animated.timing(stem, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      // 4 — leaves, then the bloom
      Animated.stagger(150, [
        Animated.spring(leafL, { toValue: 1, speed: 7, bounciness: 9, useNativeDriver: true }),
        Animated.spring(leafR, { toValue: 1, speed: 7, bounciness: 9, useNativeDriver: true }),
        Animated.spring(bloom, { toValue: 1, speed: 6, bounciness: 11, useNativeDriver: true }),
      ]),
      Animated.timing(word, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(620),
    ]);
    seq.start(({ finished }) => finished && onDone());
    return () => seq.stop();
  }, [bloom, leafL, leafR, onDone, seed, shake, stem, word]);

  const stemDash = stem.interpolate({ inputRange: [0, 1], outputRange: [130, 0] });
  const pop = (v: Animated.Value, rotate?: string) => ({
    opacity: v,
    transform: [
      ...(rotate ? [{ rotate }] : []),
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] }) },
    ],
  });

  // The seed sinks away as the sprout rises from it.
  const seedStyle = {
    opacity: Animated.multiply(
      seed,
      stem.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.35, 0] })
    ),
    transform: [
      { translateY: seed.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
      {
        rotate: shake.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: ['0deg', '9deg', '-7deg', '6deg', '-3deg', '0deg'],
        }),
      },
      { scale: seed.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
    ],
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.plant}>
        <Svg width={120} height={150}>
          <AnimatedPath
            d="M60 142 C60 118 58 96 60 68"
            stroke={colors.sage.primary}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={130}
            strokeDashoffset={stemDash}
          />
        </Svg>
        <Animated.View style={[styles.seed, seedStyle]}>
          <Svg width={22} height={28}>
            <Ellipse cx={11} cy={14} rx={8.5} ry={12} fill={colors.accent.terracotta} />
            <Ellipse cx={8.5} cy={9} rx={2.6} ry={4.2} fill={colors.accent.blush} opacity={0.75} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.leafL, pop(leafL, '-26deg')] }>
          <Svg width={36} height={22}>
            <Ellipse cx={18} cy={11} rx={17} ry={9} fill={colors.sage.primary} opacity={0.85} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.leafR, pop(leafR, '26deg')] }>
          <Svg width={36} height={22}>
            <Ellipse cx={18} cy={11} rx={17} ry={9} fill={colors.sage.primary} opacity={0.85} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.bloom, pop(bloom)]}>
          <Svg width={64} height={64}>
            {[0, 72, 144, 216, 288].map((deg) => (
              <Ellipse
                key={deg}
                cx={32}
                cy={16}
                rx={9.5}
                ry={14}
                fill={colors.accent.blush}
                opacity={0.92}
                transform={`rotate(${deg} 32 32)`}
              />
            ))}
            <Circle cx={32} cy={32} r={7} fill={colors.accent.terracotta} />
          </Svg>
        </Animated.View>
      </View>
      <Animated.Text
        style={[
          styles.word,
          { opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
      >
        Bloom
      </Animated.Text>
      <Animated.Text style={[styles.byline, { opacity: word }]}>by Conduit AI</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg.canvas, alignItems: 'center', justifyContent: 'center' },
  plant: { width: 120, height: 150 },
  seed: { position: 'absolute', left: 49, top: 120 },
  leafL: { position: 'absolute', left: 20, top: 74 },
  leafR: { position: 'absolute', left: 64, top: 88 },
  bloom: { position: 'absolute', left: 28, top: 2 },
  word: { ...type.displayXL, fontSize: 40, color: colors.ink.primary, marginTop: 18 },
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
