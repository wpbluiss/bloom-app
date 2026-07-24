import weeksData from '../assets/weeks.json';

export interface WeekInfo {
  week: number;
  sizeComparison: string;
  sizeLengthCm: number;
  sizeWeightG: number;
  headline: string;
  development: string;
  momTip: string;
  partnerTip: string;
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
