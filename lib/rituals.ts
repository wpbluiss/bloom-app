import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_WEEK_KEY = 'bloom.lastSeenWeek';

/**
 * Weekly-unlock bookkeeping. Returns the new week number when the pregnancy
 * week has advanced since the app was last opened (and records it), otherwise
 * null. First-ever open just records the current week without a ceremony.
 */
export async function consumeWeekUnlock(currentWeek: number | null): Promise<number | null> {
  if (!currentWeek) return null;
  try {
    const raw = await AsyncStorage.getItem(LAST_SEEN_WEEK_KEY);
    if (raw === null) {
      await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, String(currentWeek));
      return null;
    }
    const last = parseInt(raw, 10);
    if (!Number.isNaN(last) && currentWeek > last) {
      await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, String(currentWeek));
      return currentWeek;
    }
    if (currentWeek < last) {
      // due date was corrected backwards — resync quietly
      await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, String(currentWeek));
    }
    return null;
  } catch {
    return null;
  }
}
