import weeksData from '../assets/weeks.json';

export interface WeekInfo {
  week: number;
  sizeComparison: string;
  sizeLengthCm: number;
  sizeWeightG: number;
  headline: string;
  development: string;
  /** 5+ rotating tips; index 0 is the original curated tip for the week. */
  momTips: string[];
  partnerTips: string[];
}

export const WEEKS: WeekInfo[] = weeksData as WeekInfo[];

export const MIN_WEEK = 4;
export const MAX_WEEK = 40;

/** Current pregnancy week = 40 - ceil((dueDate - today)/7d), clamped 4..40. */
export function currentWeek(dueDate: Date | string, today: Date = new Date()): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate + 'T12:00:00') : dueDate;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((due.getTime() - stripTime(today).getTime()) / msPerDay);
  const weeksLeft = Math.ceil(daysLeft / 7);
  return clampWeek(MAX_WEEK - weeksLeft);
}

export function clampWeek(week: number): number {
  return Math.min(MAX_WEEK, Math.max(MIN_WEEK, week));
}

export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysUntilDue(dueDate: Date | string, today: Date = new Date()): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate + 'T12:00:00') : dueDate;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((due.getTime() - stripTime(today).getTime()) / msPerDay);
}

export function trimesterOf(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

/**
 * Daily rotating tip from a week's tip array: deterministic by day-of-pregnancy
 * so it changes every day, stays stable within a day, and is always
 * week-appropriate (the array is scoped to the week being viewed).
 */
export function dailyTip(tips: string[], dueDate: Date | string, today: Date = new Date()): string {
  const dayIndex = Math.max(0, 280 - daysUntilDue(dueDate, today));
  return tips[dayIndex % tips.length];
}

/** A calendar date mapped onto the 280-day pregnancy window. */
export interface PregnancyDayPoint {
  /** 0-based index into the window (0 = first day, 279 = due day). */
  dayIndex: number;
  /** Calendar pregnancy week (1–40, unclamped; weekInfo() clamps to content range). */
  week: number;
  /** Day within the pregnancy week (1–7). */
  dayOfWeek: number;
  /** 1-based day of pregnancy (1–280). */
  day: number;
}

/**
 * Map any calendar date to its point in the pregnancy, or null when the date
 * falls outside the 280-day window ending on the due date. Used by the Today
 * screen's week strip, where any day of the calendar week can be selected.
 */
export function pregnancyDay(dueDate: Date | string, date: Date = new Date()): PregnancyDayPoint | null {
  const dayIndex = 280 - daysUntilDue(dueDate, date);
  if (dayIndex < 0 || dayIndex > 279) return null;
  return {
    dayIndex,
    week: Math.floor(dayIndex / 7) + 1,
    dayOfWeek: (dayIndex % 7) + 1,
    day: dayIndex + 1,
  };
}

export function weekInfo(week: number): WeekInfo {
  const w = clampWeek(week);
  return WEEKS.find((x) => x.week === w) ?? WEEKS[0];
}

export function formatLength(cm: number): string {
  if (cm < 1) return `${Math.round(cm * 10)} mm`;
  return `${cm.toFixed(cm < 10 ? 1 : 0)} cm`;
}

export function formatWeight(g: number): string {
  if (g < 1000) return g < 10 ? `${g.toFixed(1)} g` : `${Math.round(g)} g`;
  return `${(g / 1000).toFixed(2)} kg`;
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
