import { ImageSourcePropType } from 'react-native';
import { clampWeek } from './weeks';

/**
 * Bundled variant of lib/illustrations.ts — used once the watercolor PNGs are
 * vendored into assets/illustrations/ (run scripts/import-illustrations.sh,
 * commit the PNGs, then swap this file in for lib/illustrations.ts).
 * Nothing imports this file until then, so Metro never bundles it.
 */
import week04 from '../assets/illustrations/week-04.png';
import week05 from '../assets/illustrations/week-05.png';
import week06 from '../assets/illustrations/week-06.png';
import week07 from '../assets/illustrations/week-07.png';
import week08 from '../assets/illustrations/week-08.png';
import week09 from '../assets/illustrations/week-09.png';
import week10 from '../assets/illustrations/week-10.png';
import week11 from '../assets/illustrations/week-11.png';
import week12 from '../assets/illustrations/week-12.png';
import week13 from '../assets/illustrations/week-13.png';
import week14 from '../assets/illustrations/week-14.png';
import week15 from '../assets/illustrations/week-15.png';
import week16 from '../assets/illustrations/week-16.png';
import week17 from '../assets/illustrations/week-17.png';
import week18 from '../assets/illustrations/week-18.png';
import week19 from '../assets/illustrations/week-19.png';
import week20 from '../assets/illustrations/week-20.png';
import week21 from '../assets/illustrations/week-21.png';
import week22 from '../assets/illustrations/week-22.png';
import week23 from '../assets/illustrations/week-23.png';
import week24 from '../assets/illustrations/week-24.png';
import week25 from '../assets/illustrations/week-25.png';
import week26 from '../assets/illustrations/week-26.png';
import week27 from '../assets/illustrations/week-27.png';
import week28 from '../assets/illustrations/week-28.png';
import week29 from '../assets/illustrations/week-29.png';
import week30 from '../assets/illustrations/week-30.png';
import week31 from '../assets/illustrations/week-31.png';
import week32 from '../assets/illustrations/week-32.png';
import week33 from '../assets/illustrations/week-33.png';
import week34 from '../assets/illustrations/week-34.png';
import week35 from '../assets/illustrations/week-35.png';
import week36 from '../assets/illustrations/week-36.png';
import week37 from '../assets/illustrations/week-37.png';
import week38 from '../assets/illustrations/week-38.png';
import week39 from '../assets/illustrations/week-39.png';
import week40 from '../assets/illustrations/week-40.png';

const ILLUSTRATIONS: Record<number, number> = {
  4: week04,
  5: week05,
  6: week06,
  7: week07,
  8: week08,
  9: week09,
  10: week10,
  11: week11,
  12: week12,
  13: week13,
  14: week14,
  15: week15,
  16: week16,
  17: week17,
  18: week18,
  19: week19,
  20: week20,
  21: week21,
  22: week22,
  23: week23,
  24: week24,
  25: week25,
  26: week26,
  27: week27,
  28: week28,
  29: week29,
  30: week30,
  31: week31,
  32: week32,
  33: week33,
  34: week34,
  35: week35,
  36: week36,
  37: week37,
  38: week38,
  39: week39,
  40: week40,
};

/** Watercolor for the given pregnancy week (clamped to 4–40). */
export function weekIllustration(week: number): ImageSourcePropType {
  return ILLUSTRATIONS[clampWeek(week)] as ImageSourcePropType;
}
