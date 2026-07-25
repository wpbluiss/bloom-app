// Bloom design tokens — verbatim from design-system.md §7
export const tokens = {
  color: {
    bg: {
      canvas: '#FAF6F0',
      surface: '#FFFFFF',
      surfaceWarm: '#F4EDE3',
      accent: '#F3E9DE',
      paper: '#FDF9F3',
      sunken: '#F0E9DE',
    },
    ink: {
      primary: '#2B2620',
      secondary: '#6E6459',
      tertiary: '#A29484',
    },
    accent: {
      terracotta: '#C4603C',
      terracottaDeep: '#A84E2E',
      terracottaSoft: '#F2DCD0',
      blush: '#E8A68F',
      onAccent: '#FFF8F2',
    },
    sage: {
      primary: '#7C8B6F',
      soft: '#E4E9DC',
    },
    border: {
      subtle: '#E8DFD2',
      strong: '#D8CBB9',
    },
    status: {
      warning: '#B8862F',
      warningSoft: '#F5E9CF',
      avoid: '#9C4A38',
      avoidSoft: '#F3DDD5',
    },
    overlay: {
      scrim: 'rgba(43, 38, 32, 0.35)',
    },
  },
  type: {
    displayXL: { fontFamily: 'Fraunces_500Medium', fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
    displayLG: { fontFamily: 'Fraunces_500Medium', fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
    displayMD: { fontFamily: 'Fraunces_500Medium', fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
    titleMD: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
    titleSM: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
    bodyMD: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 25, letterSpacing: 0 },
    bodySM: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, letterSpacing: 0 },
    labelMD: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
    labelCaps: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' as const },
    caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
    serifQuote: { fontFamily: 'Fraunces_400Regular_Italic', fontSize: 18, lineHeight: 27, letterSpacing: -0.2 },
  },
  // screen: the consistent horizontal gutter for every screen (24px).
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 32, hero: 40, screen: 24 },
  radius: { sm: 8, md: 14, lg: 20, xl: 28, full: 999 },
  shadow: {
    // Warm-tinted, low-opacity, long-blur — depth you feel, not see.
    card: { shadowColor: '#5A4232', shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, shadowOpacity: 0.08, elevation: 3 },
    raised: { shadowColor: '#5A4232', shadowOffset: { width: 0, height: 10 }, shadowRadius: 28, shadowOpacity: 0.12, elevation: 7 },
    fab: { shadowColor: '#5A4232', shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, shadowOpacity: 0.16, elevation: 7 },
    // Soft terracotta glow reserved for the current week on the journey timeline.
    glow: { shadowColor: '#C4603C', shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, shadowOpacity: 0.22, elevation: 6 },
  },
  motion: {
    springDefault: { damping: 18, stiffness: 180, mass: 0.9 },
    springPop: { damping: 22, stiffness: 260 },
    timing: { durationFast: 200, durationDefault: 260, durationSlow: 300 },
    easing: [0.25, 0.1, 0.25, 1.0] as const,
    pressScale: 0.97,
    pressDuration: 120,
  },
} as const;

export const colors = tokens.color;
export const type = tokens.type;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const shadow = tokens.shadow;
