import dailyData from '../assets/content/daily.json';
import { daysUntilDue } from './weeks';
import type { Role } from './db';

export type DailyKind = 'fact' | 'tip' | 'action';
export type DailyAudience = 'both' | 'mother' | 'partner';

export interface DailyEntry {
  id: string;
  kind: DailyKind;
  audience: DailyAudience;
  title: string;
  body: string;
  cta?: { label: string; route: string };
}

const DAILY = dailyData as DailyEntry[];

/**
 * One card per day, deterministic by day-of-pregnancy (both partners see the
 * same card on the same day). With 60+ entries and a 1-per-day cadence, a card
 * can never repeat within a week.
 */
export function dailyEntry(role: Role | null | undefined, dueDate: string, today: Date = new Date()): DailyEntry {
  const dayOfPregnancy = Math.max(0, 280 - daysUntilDue(dueDate, today));
  const eligible = DAILY.filter((e) => e.audience === 'both' || e.audience === (role ?? 'mother'));
  const list = eligible.length > 0 ? eligible : DAILY;
  return list[dayOfPregnancy % list.length];
}

export const DAILY_KIND_LABEL: Record<DailyKind, string> = {
  fact: 'DID YOU KNOW',
  tip: 'A GENTLE TIP',
  action: 'TODAY, TOGETHER',
};
