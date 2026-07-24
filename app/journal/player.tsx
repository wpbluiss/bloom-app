import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius, spacing } from '../../lib/theme';

export default function JournalPlayerScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const player = useVideoPlayer(typeof uri === 'string' ? uri : null, (p) => {
    p.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
      />
      <SafeAreaView style={styles.closeWrap} edges={['top']}>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Close video"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={colors.accent.onAccent} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink.primary },
  video: { flex: 1 },
  closeWrap: { position: 'absolute', top: 0, right: 0 },
  closeButton: {
    marginTop: spacing.lg,
    marginRight: spacing.screen,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
