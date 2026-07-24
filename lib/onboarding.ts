import { supabase } from './supabase';

/**
 * The warm onboarding Q&A, kept as one JSON blob on profiles.onboarding_answers.
 * Migration 002 adds that column; until it is applied we write best-effort and
 * fail silently — onboarding must never break because a column is missing.
 */
export interface OnboardingAnswers {
  lmp?: string | null; // ISO date of last period, when shared
  firstBaby?: 'yes' | 'no' | 'declined';
  vitamins?: 'yes' | 'not-yet' | 'different';
  appointment?: string | 'not-yet'; // ISO date or flag
  feelings?: string[];
  completedAt?: string; // ISO timestamp
}

export async function saveOnboardingAnswers(userId: string, answers: OnboardingAnswers): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_answers: { ...answers, completedAt: new Date().toISOString() } })
      .eq('id', userId);
    if (error) console.warn('onboarding_answers not saved (migration pending?)', error.message);
  } catch (e) {
    console.warn('onboarding_answers not saved', e);
  }
}
