import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { PressScale } from '../../components/PressScale';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { createWishlistItem, uploadToBucket } from '../../lib/db';
import { PickedMedia, capturePhoto, pickMedia, uriToBytes } from '../../lib/media';
import { colors, radius, spacing, type } from '../../lib/theme';

const CATEGORIES = ['Nursery', 'Gear', 'Clothing', 'Feeding', 'For mom'];

export default function NewWishlistItem() {
  const router = useRouter();
  const { session, household } = useApp();
  const [photo, setPhoto] = useState<PickedMedia | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!session?.user || !household || !name.trim()) return;
    setBusy(true);
    try {
      let photoPath: string | null = null;
      if (photo) {
        const bytes = await uriToBytes(photo.uri);
        photoPath = await uploadToBucket('wishlist-photos', household.id, bytes, photo.ext, photo.contentType);
      }
      await createWishlistItem({
        household_id: household.id,
        added_by: session.user.id,
        name: name.trim(),
        category,
        photo_path: photoPath,
        source_url: sourceUrl.trim() || null,
        target_price: price.trim() ? Number(price) : null,
        status: 'wanted',
        notes: null,
      });
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={colors.ink.secondary} />
          </PressScale>
          <Text style={styles.topTitle}>Add to the wishlist</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          ) : (
            <View style={styles.photoButtons}>
              <PressScale
                style={styles.photoButton}
                onPress={async () => setPhoto(await capturePhoto())}
              >
                <Ionicons name="camera-outline" size={24} color={colors.accent.terracotta} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </PressScale>
              <PressScale
                style={styles.photoButton}
                onPress={async () => setPhoto(await pickMedia())}
              >
                <Ionicons name="image-outline" size={24} color={colors.accent.terracotta} />
                <Text style={styles.photoButtonText}>Library</Text>
              </PressScale>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="What is it? — “Convertible crib”"
            placeholderTextColor={colors.ink.tertiary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Target price ($)"
            placeholderTextColor={colors.ink.tertiary}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={styles.input}
            placeholder="Link to where you saw it (optional)"
            placeholderTextColor={colors.ink.tertiary}
            autoCapitalize="none"
            keyboardType="url"
            value={sourceUrl}
            onChangeText={setSourceUrl}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Save to wishlist" onPress={save} loading={busy} disabled={!name.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  topTitle: { ...type.titleMD, color: colors.ink.primary },
  scroll: { padding: spacing.screen },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.bg.surfaceWarm },
  photoButtons: { flexDirection: 'row', gap: spacing.md },
  photoButton: {
    flex: 1,
    aspectRatio: 1.6,
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoButtonText: { ...type.labelMD, color: colors.accent.terracotta },
  input: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.lg,
    height: 52,
    ...type.bodyMD,
    color: colors.ink.primary,
    marginTop: spacing.lg,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  footer: { padding: spacing.screen, paddingTop: spacing.sm },
});
