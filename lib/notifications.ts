import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { copy } from './copy';
import { daysUntilDue, weekInfo } from './weeks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPrefs {
  dailyEnabled: boolean;
  hour: number; // 0–23, local
  minute: number;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { dailyEnabled: true, hour: 19, minute: 0 };
const PREFS_KEY = 'bloom.notificationPrefs';

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // prefs are nice-to-have; never block the UI on them
  }
}

/** Already-allowed check that never prompts. */
export async function notificationsAllowed(): Promise<boolean> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    return perm.granted;
  } catch {
    return false;
  }
}

/** Polite, explicit request (call from onboarding / Settings, with context). */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('gentle', {
    name: 'Gentle reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** The calendar date on which `week + 1` begins, at 9am local. */
function nextRolloverDate(dueDate: string): Date | null {
  const daysLeft = daysUntilDue(dueDate);
  const weeksLeft = Math.ceil(daysLeft / 7);
  const daysUntilNextWeek = daysLeft - (weeksLeft - 1) * 7; // 1..7
  const d = new Date();
  d.setDate(d.getDate() + daysUntilNextWeek);
  d.setHours(9, 0, 0, 0);
  return d.getTime() > Date.now() ? d : null;
}

/**
 * Local-only gentle reminders: a soft daily check-in nudge at the user's chosen
 * time (default 7pm) and a celebration note the morning the next week begins.
 * No push server involved. Never prompts for permission by itself — scheduling
 * silently no-ops until permission exists.
 */
export async function scheduleGentleReminders(
  week: number | null,
  dueDate: string | null = null
): Promise<void> {
  try {
    if (!(await notificationsAllowed())) return;
    await ensureAndroidChannel();
    const prefs = await getNotificationPrefs();

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (prefs.dailyEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: { title: copy.notifications.dailyTitle, body: copy.notifications.dailyBody },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.hour,
          minute: prefs.minute,
        },
      });
    }

    if (week) {
      const nextWeek = Math.min(40, week + 1);
      const info = weekInfo(nextWeek);
      const content = {
        title: copy.notifications.weeklyTitle(nextWeek),
        body: copy.notifications.weeklyBody(info.sizeComparison),
      };
      const rollover = dueDate ? nextRolloverDate(dueDate) : null;
      if (rollover) {
        // Precise: fire the morning the new week actually begins.
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: rollover },
        });
      } else {
        // Fallback: Monday 9am rhythm.
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 2, hour: 9, minute: 0 },
        });
      }
    }
  } catch (e) {
    console.warn('notifications scheduling failed', e);
  }
}
