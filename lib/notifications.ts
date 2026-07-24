import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { copy } from './copy';
import { weekInfo } from './weeks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Local-only gentle reminders: a weekly Monday-morning week-rollover note and a
 * soft daily evening check-in nudge. No push server involved.
 */
export async function scheduleGentleReminders(week: number | null): Promise<void> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gentle', {
        name: 'Gentle reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Daily check-in, 8pm
    await Notifications.scheduleNotificationAsync({
      content: { title: copy.notifications.dailyTitle, body: copy.notifications.dailyBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
    });

    // Weekly Monday 9am rollover
    const info = weekInfo(week ?? 4);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.notifications.weeklyTitle(week ?? 4),
        body: copy.notifications.weeklyBody(info.sizeComparison),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 2, hour: 9, minute: 0 },
    });
  } catch (e) {
    console.warn('notifications scheduling failed', e);
  }
}
