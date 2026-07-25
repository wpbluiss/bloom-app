import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import { copy } from './copy';

const KEY = 'bloom.reviewPrompted';
const REVIEW_URL = 'https://apps.apple.com/app/id6794489325?action=write-review';

/**
 * Ask once, ever — and only at a high point (a milestone just saved). Never on
 * a hard day, never on cold open. The link goes live the day the app does.
 */
export async function maybeAskForReview(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(KEY)) return;
    await AsyncStorage.setItem(KEY, '1');
    Alert.alert(copy.review.promptTitle, copy.review.promptBody, [
      { text: copy.review.promptLater, style: 'cancel' },
      { text: copy.review.promptConfirm, onPress: () => Linking.openURL(REVIEW_URL).catch(() => {}) },
    ]);
  } catch {
    // never block a memory
  }
}
