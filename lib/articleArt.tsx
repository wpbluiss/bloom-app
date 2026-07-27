import React from 'react';
import { ImageSourcePropType } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from './theme';
import { weekIllustration } from './illustrations';

export type ArtKey =
  | 'heartbeat'
  | 'morning-sickness'
  | 'neural-tube'
  | 'implantation'
  | 'prenatal-vitamins'
  | 'fatigue'
  | 'emotional-changes'
  | 'first-trimester'
  | 'weeks-4-12'
  | 'weeks-13-16'
  | 'weeks-17-20'
  | 'weeks-21-24'
  | 'weeks-25-28'
  | 'weeks-29-32'
  | 'weeks-33-36'
  | 'weeks-37-40'
  | 'cravings'
  | 'exercise'
  | 'sleep'
  | 'partner'
  | 'default';

export const ARTICLE_ART_MAP: Record<string, ArtKey> = {
  'morning-sickness-relief': 'morning-sickness',
  'when-nausea-arrives': 'morning-sickness',
  'neural-tube-development': 'neural-tube',
  'implantation-and-early-signs': 'implantation',
  'prenatal-vitamins-guide': 'prenatal-vitamins',
  'first-trimester-fatigue': 'fatigue',
  'emotional-changes-first-trimester': 'emotional-changes',
  'weeks-4-12-quiet-building': 'weeks-4-12',
  'weeks-13-16-second-trimester': 'weeks-13-16',
  'weeks-17-20-halfway': 'weeks-17-20',
  'weeks-21-24-viability': 'weeks-21-24',
  'weeks-25-28-third-trimester': 'weeks-25-28',
  'weeks-29-32-countdown': 'weeks-29-32',
  'weeks-33-36-nesting': 'weeks-33-36',
  'weeks-37-40-full-term': 'weeks-37-40',
  'managing-cravings': 'cravings',
  'safe-exercise-pregnancy': 'exercise',
  'sleep-positions': 'sleep',
  'partner-guide-first-trimester': 'partner',
};

export function artKeyForArticle(articleId: string): ArtKey {
  return ARTICLE_ART_MAP[articleId] ?? 'default';
}

export function articleArtUrl(key: ArtKey): string | null {
  return null;
}

export function ArticleArtSVG({ art, size = 200 }: { art: ArtKey; size?: number }) {
  const s = size;
  const half = s / 2;
  const terracotta = colors.accent.terracotta;
  const blush = colors.accent.blush;
  const sage = colors.sage.primary;
  const soft = colors.accent.terracottaSoft;

  const watercolors: Record<ArtKey, React.ReactNode> = {
    heartbeat: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.6} />
        <Path d={`M${half * 0.25},${half} Q${half * 0.4},${half * 0.5} ${half * 0.5},${half} T${half * 0.75},${half} Q${half * 0.85},${half * 0.3} ${half},${half * 0.55} Q${half * 1.15},${half * 0.3} ${half * 1.25},${half} T${half * 1.5},${half}`} stroke={terracotta} strokeWidth={s * 0.025} fill="none" strokeLinecap="round" opacity={0.85} />
        <Circle cx={half} cy={half * 0.55} r={s * 0.06} fill={blush} opacity={0.7} />
      </G>
    ),
    'morning-sickness': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F5EDE6" opacity={0.7} />
        <Path d={`M${half * 0.35},${half * 0.45} C${half * 0.35},${half * 0.35} ${half * 0.45},${half * 0.3} ${half * 0.55},${half * 0.35} C${half * 0.65},${half * 0.3} ${half * 0.75},${half * 0.35} ${half * 0.75},${half * 0.45} C${half * 0.75},${half * 0.6} ${half * 0.65},${half * 0.7} ${half * 0.55},${half * 0.75} C${half * 0.45},${half * 0.7} ${half * 0.35},${half * 0.6} ${half * 0.35},${half * 0.45} Z`} fill={terracotta} opacity={0.5} />
        <Path d={`M${half * 0.45},${half * 0.55} Q${half * 0.5},${half * 0.65} ${half * 0.55},${half * 0.55}`} stroke={sage} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.6} />
        <Ellipse cx={half * 0.48} cy={half * 0.42} rx={s * 0.015} ry={s * 0.02} fill={colors.ink.primary} opacity={0.4} />
        <Ellipse cx={half * 0.62} cy={half * 0.42} rx={s * 0.015} ry={s * 0.02} fill={colors.ink.primary} opacity={0.4} />
      </G>
    ),
    'neural-tube': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#E8E4DC" opacity={0.5} />
        <Path d={`M${half * 0.3},${half * 0.6} Q${half * 0.5},${half * 0.25} ${half * 0.7},${half * 0.6} Q${half * 0.75},${half * 0.75} ${half * 0.5},${half * 0.8} Q${half * 0.25},${half * 0.75} ${half * 0.3},${half * 0.6}`} fill={sage} opacity={0.4} />
        <Path d={`M${half * 0.4},${half * 0.55} Q${half * 0.5},${half * 0.35} ${half * 0.6},${half * 0.55}`} stroke={terracotta} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.7} />
        <Circle cx={half * 0.5} cy={half * 0.45} r={s * 0.04} fill={blush} opacity={0.6} />
      </G>
    ),
    implantation: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Ellipse cx={half} cy={half * 0.55} rx={s * 0.18} ry={s * 0.22} fill={terracotta} opacity={0.35} />
        <Circle cx={half} cy={half * 0.5} r={s * 0.08} fill={blush} opacity={0.6} />
        <Path d={`M${half * 0.35},${half * 0.75} Q${half * 0.5},${half * 0.85} ${half * 0.65},${half * 0.75}`} stroke={sage} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.5} />
      </G>
    ),
    'prenatal-vitamins': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F0EDE6" opacity={0.6} />
        <Ellipse cx={half * 0.42} cy={half * 0.5} rx={s * 0.06} ry={s * 0.08} fill={sage} opacity={0.5} transform={`rotate(-15 ${half * 0.42} ${half * 0.5})`} />
        <Ellipse cx={half * 0.58} cy={half * 0.52} rx={s * 0.05} ry={s * 0.07} fill={terracotta} opacity={0.4} transform={`rotate(12 ${half * 0.58} ${half * 0.52})`} />
        <Ellipse cx={half * 0.5} cy={half * 0.65} rx={s * 0.055} ry={s * 0.075} fill={blush} opacity={0.45} />
        <Path d={`M${half * 0.35},${half * 0.75} L${half * 0.65},${half * 0.75}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.008} opacity={0.3} />
      </G>
    ),
    fatigue: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#E8E2DA" opacity={0.5} />
        <Path d={`M${half * 0.35},${half * 0.45} C${half * 0.35},${half * 0.35} ${half * 0.45},${half * 0.3} ${half * 0.55},${half * 0.35} C${half * 0.65},${half * 0.3} ${half * 0.75},${half * 0.35} ${half * 0.75},${half * 0.45} C${half * 0.75},${half * 0.6} ${half * 0.65},${half * 0.7} ${half * 0.55},${half * 0.75} C${half * 0.45},${half * 0.7} ${half * 0.35},${half * 0.6} ${half * 0.35},${half * 0.45} Z`} fill={terracotta} opacity={0.3} />
        <Path d={`M${half * 0.42},${half * 0.48} Q${half * 0.48},${half * 0.52} ${half * 0.54},${half * 0.48}`} stroke={colors.ink.primary} strokeWidth={s * 0.015} fill="none" strokeLinecap="round" opacity={0.3} />
        <Path d={`M${half * 0.42},${half * 0.55} Q${half * 0.48},${half * 0.58} ${half * 0.54},${half * 0.55}`} stroke={colors.ink.primary} strokeWidth={s * 0.015} fill="none" strokeLinecap="round" opacity={0.3} />
        <Circle cx={half * 0.78} cy={half * 0.35} r={s * 0.025} fill={blush} opacity={0.5} />
      </G>
    ),
    'emotional-changes': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Path d={`M${half * 0.3},${half * 0.55} Q${half * 0.4},${half * 0.4} ${half * 0.5},${half * 0.55} T${half * 0.7},${half * 0.55}`} stroke={terracotta} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.6} />
        <Path d={`M${half * 0.35},${half * 0.65} Q${half * 0.45},${half * 0.55} ${half * 0.55},${half * 0.65} T${half * 0.75},${half * 0.65}`} stroke={blush} strokeWidth={s * 0.018} fill="none" strokeLinecap="round" opacity={0.5} />
        <Circle cx={half * 0.25} cy={half * 0.4} r={s * 0.03} fill={sage} opacity={0.4} />
        <Circle cx={half * 0.75} cy={half * 0.4} r={s * 0.03} fill={sage} opacity={0.4} />
      </G>
    ),
    'first-trimester': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F5EDE6" opacity={0.6} />
        <Path d={`M${half * 0.35},${half * 0.7} Q${half * 0.5},${half * 0.2} ${half * 0.65},${half * 0.7}`} fill={terracotta} opacity={0.25} />
        <Path d={`M${half * 0.4},${half * 0.65} Q${half * 0.5},${half * 0.3} ${half * 0.6},${half * 0.65}`} fill={blush} opacity={0.3} />
        <Circle cx={half * 0.5} cy={half * 0.45} r={s * 0.05} fill={sage} opacity={0.4} />
      </G>
    ),
    'weeks-4-12': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.06} fill={terracotta} opacity={0.4} />
        <Path d={`M${half * 0.5},${half * 0.35} L${half * 0.5},${half * 0.2}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.5} />
        <Path d={`M${half * 0.35},${half * 0.5} L${half * 0.2},${half * 0.5}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.5} />
        <Path d={`M${half * 0.65},${half * 0.5} L${half * 0.8},${half * 0.5}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.5} />
        <Path d={`M${half * 0.5},${half * 0.65} L${half * 0.5},${half * 0.8}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.5} />
      </G>
    ),
    'weeks-13-16': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#E8E4DC" opacity={0.5} />
        <Ellipse cx={half * 0.5} cy={half * 0.5} rx={s * 0.1} ry={s * 0.12} fill={terracotta} opacity={0.3} />
        <Path d={`M${half * 0.35},${half * 0.45} Q${half * 0.5},${half * 0.35} ${half * 0.65},${half * 0.45}`} stroke={sage} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.5} />
      </G>
    ),
    'weeks-17-20': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.1} fill={blush} opacity={0.35} />
        <Path d={`M${half * 0.3},${half * 0.5} L${half * 0.7},${half * 0.5}`} stroke={terracotta} strokeWidth={s * 0.015} opacity={0.4} />
        <Path d={`M${half * 0.5},${half * 0.3} L${half * 0.5},${half * 0.7}`} stroke={terracotta} strokeWidth={s * 0.015} opacity={0.4} />
      </G>
    ),
    'weeks-21-24': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F0EDE6" opacity={0.5} />
        <Ellipse cx={half * 0.5} cy={half * 0.5} rx={s * 0.12} ry={s * 0.14} fill={sage} opacity={0.3} />
        <Path d={`M${half * 0.4},${half * 0.4} Q${half * 0.5},${half * 0.3} ${half * 0.6},${half * 0.4} Q${half * 0.7},${half * 0.5} ${half * 0.6},${half * 0.6} Q${half * 0.5},${half * 0.7} ${half * 0.4},${half * 0.6} Q${half * 0.3},${half * 0.5} ${half * 0.4},${half * 0.4}`} stroke={terracotta} strokeWidth={s * 0.02} fill="none" opacity={0.5} />
      </G>
    ),
    'weeks-25-28': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.14} fill={terracotta} opacity={0.25} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.1} fill={blush} opacity={0.35} />
        <Path d={`M${half * 0.35},${half * 0.35} L${half * 0.65},${half * 0.65}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.4} />
        <Path d={`M${half * 0.65},${half * 0.35} L${half * 0.35},${half * 0.65}`} stroke={sage} strokeWidth={s * 0.015} opacity={0.4} />
      </G>
    ),
    'weeks-29-32': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#E8E2DA" opacity={0.5} />
        <Ellipse cx={half * 0.5} cy={half * 0.5} rx={s * 0.15} ry={s * 0.16} fill={sage} opacity={0.3} />
        <Path d={`M${half * 0.3},${half * 0.5} Q${half * 0.5},${half * 0.3} ${half * 0.7},${half * 0.5} Q${half * 0.5},${half * 0.7} ${half * 0.3},${half * 0.5}`} stroke={terracotta} strokeWidth={s * 0.02} fill="none" opacity={0.4} />
      </G>
    ),
    'weeks-33-36': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.16} fill={terracotta} opacity={0.25} />
        <Path d={`M${half * 0.35},${half * 0.4} L${half * 0.65},${half * 0.4}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.01} opacity={0.3} />
        <Path d={`M${half * 0.35},${half * 0.5} L${half * 0.65},${half * 0.5}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.01} opacity={0.3} />
        <Path d={`M${half * 0.35},${half * 0.6} L${half * 0.65},${half * 0.6}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.01} opacity={0.3} />
      </G>
    ),
    'weeks-37-40': (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F5EDE6" opacity={0.5} />
        <Ellipse cx={half * 0.5} cy={half * 0.5} rx={s * 0.18} ry={s * 0.2} fill={blush} opacity={0.3} />
        <Path d={`M${half * 0.3},${half * 0.45} Q${half * 0.5},${half * 0.25} ${half * 0.7},${half * 0.45}`} stroke={sage} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.5} />
        <Path d={`M${half * 0.3},${half * 0.55} Q${half * 0.5},${half * 0.75} ${half * 0.7},${half * 0.55}`} stroke={sage} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.5} />
      </G>
    ),
    cravings: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Ellipse cx={half * 0.45} cy={half * 0.5} rx={s * 0.07} ry={s * 0.09} fill={terracotta} opacity={0.4} transform={`rotate(-20 ${half * 0.45} ${half * 0.5})`} />
        <Ellipse cx={half * 0.55} cy={half * 0.52} rx={s * 0.06} ry={s * 0.08} fill={sage} opacity={0.4} transform={`rotate(15 ${half * 0.55} ${half * 0.52})`} />
        <Path d={`M${half * 0.4},${half * 0.7} Q${half * 0.5},${half * 0.8} ${half * 0.6},${half * 0.7}`} stroke={blush} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.6} />
      </G>
    ),
    exercise: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#E8E4DC" opacity={0.5} />
        <Path d={`M${half * 0.35},${half * 0.65} L${half * 0.5},${half * 0.35} L${half * 0.65},${half * 0.65}`} stroke={sage} strokeWidth={s * 0.025} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        <Circle cx={half * 0.5} cy={half * 0.35} r={s * 0.04} fill={terracotta} opacity={0.5} />
        <Path d={`M${half * 0.3},${half * 0.75} L${half * 0.7},${half * 0.75}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.01} opacity={0.3} />
      </G>
    ),
    sleep: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill="#F0EDE6" opacity={0.6} />
        <Path d={`M${half * 0.3},${half * 0.5} Q${half * 0.4},${half * 0.35} ${half * 0.5},${half * 0.5} T${half * 0.7},${half * 0.5}`} stroke={terracotta} strokeWidth={s * 0.02} fill="none" strokeLinecap="round" opacity={0.5} />
        <Circle cx={half * 0.35} cy={half * 0.35} r={s * 0.025} fill={blush} opacity={0.5} />
        <Circle cx={half * 0.65} cy={half * 0.35} r={s * 0.025} fill={blush} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.3} r={s * 0.02} fill={sage} opacity={0.4} />
      </G>
    ),
    partner: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.4} cy={half * 0.5} r={s * 0.06} fill={terracotta} opacity={0.35} />
        <Circle cx={half * 0.6} cy={half * 0.5} r={s * 0.06} fill={sage} opacity={0.35} />
        <Path d={`M${half * 0.46},${half * 0.5} L${half * 0.54},${half * 0.5}`} stroke={blush} strokeWidth={s * 0.015} opacity={0.6} />
        <Path d={`M${half * 0.5},${half * 0.65} Q${half * 0.5},${half * 0.75} ${half * 0.5},${half * 0.8}`} stroke={colors.ink.tertiary} strokeWidth={s * 0.01} opacity={0.3} />
      </G>
    ),
    default: (
      <G>
        <Ellipse cx={half} cy={half} rx={half * 0.9} ry={half * 0.85} fill={soft} opacity={0.5} />
        <Circle cx={half * 0.5} cy={half * 0.5} r={s * 0.12} fill={terracotta} opacity={0.25} />
        <Path d={`M${half * 0.35},${half * 0.5} L${half * 0.65},${half * 0.5} M${half * 0.5},${half * 0.35} L${half * 0.5},${half * 0.65}`} stroke={blush} strokeWidth={s * 0.02} strokeLinecap="round" opacity={0.5} />
      </G>
    ),
  };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {watercolors[art] ?? watercolors.default}
    </Svg>
  );
}

export function articleArtSource(articleId: string, week?: number): React.ReactNode | ImageSourcePropType {
  const key = artKeyForArticle(articleId);
  const url = articleArtUrl(key);
  if (url) return { uri: url };
  if (week && articleId.includes('weeks')) {
    return weekIllustration(week);
  }
  return null;
}

export const ART_PROMPTS: Record<ArtKey, string> = {
  heartbeat: 'Soft watercolor illustration of a tiny glowing heart with gentle pulse waves, warm terracotta and blush tones, cream background, delicate botanical accent, minimalist pregnancy art, no text',
  'morning-sickness': 'Soft watercolor illustration of a gentle lemon slice and ginger root on a ceramic plate, warm sage and terracotta tones, cream background, minimalist pregnancy wellness art, no text',
  'neural-tube': 'Soft watercolor illustration of a delicate spine forming from soft light, warm sage and cream tones, abstract botanical growth, minimalist medical pregnancy art, no text',
  implantation: 'Soft watercolor illustration of a tiny seed nestled in warm soft tissue, terracotta and blush tones, cream background, gentle glow, minimalist pregnancy art, no text',
  'prenatal-vitamins': 'Soft watercolor illustration of small round vitamins and a glass of water on a wooden surface, warm sage and terracotta tones, cream background, minimalist pregnancy wellness art, no text',
  fatigue: 'Soft watercolor illustration of a cozy pillow and warm tea cup, soft terracotta and cream tones, gentle morning light, minimalist pregnancy rest art, no text',
  'emotional-changes': 'Soft watercolor illustration of gentle ocean waves transitioning from calm to stormy and back, warm terracotta and sage tones, cream background, minimalist pregnancy emotion art, no text',
  'first-trimester': 'Soft watercolor illustration of a winding path through soft hills with a tiny sprout, warm sage and terracotta tones, cream background, minimalist pregnancy journey art, no text',
  'weeks-4-12': 'Soft watercolor illustration of a tiny poppy seed growing into a lime, warm terracotta and sage tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-13-16': 'Soft watercolor illustration of an avocado half with a tiny seed, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-17-20': 'Soft watercolor illustration of a banana with soft leaves, warm terracotta and sage tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-21-24': 'Soft watercolor illustration of a corn cob with soft silk, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-25-28': 'Soft watercolor illustration of an eggplant with soft leaves, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-29-32': 'Soft watercolor illustration of a butternut squash with soft vines, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-33-36': 'Soft watercolor illustration of a pineapple with soft crown, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  'weeks-37-40': 'Soft watercolor illustration of a watermelon slice with soft seeds, warm sage and terracotta tones, cream background, minimalist pregnancy growth art, no text',
  cravings: 'Soft watercolor illustration of a pickle and a small bowl of ice cream side by side, warm terracotta and sage tones, cream background, playful minimalist pregnancy art, no text',
  exercise: 'Soft watercolor illustration of a yoga mat and a gentle stretching pose silhouette, warm sage and terracotta tones, cream background, minimalist pregnancy fitness art, no text',
  sleep: 'Soft watercolor illustration of a crescent moon and soft clouds with stars, warm terracotta and cream tones, gentle night glow, minimalist pregnancy sleep art, no text',
  partner: 'Soft watercolor illustration of two hands gently holding a tiny sprout between them, warm terracotta and sage tones, cream background, minimalist pregnancy partnership art, no text',
  default: 'Soft watercolor illustration of a gentle blooming flower, warm terracotta and blush tones, cream background, minimalist pregnancy art, no text',
};
