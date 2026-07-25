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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { PressScale } from '../../components/PressScale';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { EntryType, countHouseholdMedia, createJournalEntry, createMediaRow, updateJournalEntry, uploadToBucket } from '../../lib/db';
import { FREE_MEDIA_LIMIT, promptForPass, useEntitlement } from '../../lib/entitlements';
import { PickedMedia, pickMedia, uriToBytes } from '../../lib/media';
import { currentWeek, formatISODate } from '../../lib/weeks';
import { colors, radius, spacing, type } from '../../lib/theme';

const ENTRY_TYPES: { key: EntryType; label: string }[] = [
  { key: 'note', label: 'Note' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'craving', label: 'Craving' },
  { key: 'ultrasound', label: 'Ultrasound' },
];

export default function ComposeScreen() {
  const router = useRouter();
  // When opened from a journal card, params pre-fill the form for editing.
  const params = useLocalSearchParams<{ id?: string; type?: string; title?: string; body?: string }>();
  const editId = params.id ?? null;
  const { session, household, pregnancy } = useApp();
  const { pregnancyPass } = useEntitlement();
  const [entryType, setEntryType] = useState<EntryType>((params.type as EntryType) || 'note');
  const [title, setTitle] = useState(params.title ?? '');
  const [body, setBody] = useState(params.body ?? '');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [busy, setBusy] = useState(false);

  const attach = async () => {
    // Free tier: 25 journal media items. The Pass lifts the cap. (Dev mode:
    // always entitled, never gated.)
    if (!pregnancyPass && household) {
      const existing = await countHouseholdMedia(household.id);
      if (existing + media.length >= FREE_MEDIA_LIMIT) {
        promptForPass(router, copy.paywall.gateMedia);
        return;
      }
    }
    const picked = await pickMedia({ allowsVideo: true });
    if (picked) setMedia((m) => [...m, picked]);
  };

  const save = async () => {
    if (!session?.user || !household) return;
    if (!body.trim() && !title.trim() && media.length === 0 && !editId) return;
    setBusy(true);
    try {
      let entryId = editId;
      if (editId) {
        // Editing: update the existing row in place (media already attached stays).
        await updateJournalEntry(editId, {
          entry_type: entryType,
          title: title.trim() || null,
          body: body.trim() || null,
        });
      } else {
        const entry = await createJournalEntry({
          household_id: household.id,
          pregnancy_id: pregnancy?.id ?? null,
          author_id: session.user.id,
          week_number: pregnancy ? currentWeek(pregnancy.due_date) : null,
          entry_type: entryType,
          title: title.trim() || null,
          body: body.trim() || null,
          entry_date: formatISODate(new Date()),
        });
        entryId = entry.id;
      }
      for (const m of media) {
        const bytes = await uriToBytes(m.uri);
        const path = await uploadToBucket('journal-media', household.id, bytes, m.ext, m.contentType);
        await createMediaRow({
          journal_entry_id: entryId!,
          household_id: household.id,
          storage_path: path,
          media_type: m.mediaType,
          caption: null,
        });
      }
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const applyMilestone = (label: string, prompt: string) => {
    setEntryType('milestone');
    setTitle(label);
    if (!body) setBody('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={colors.ink.secondary} />
          </PressScale>
          <Text style={styles.topDate}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.chipsRow}>
            {ENTRY_TYPES.map((t) => (
              <Chip key={t.key} label={t.label} selected={entryType === t.key} onPress={() => setEntryType(t.key)} />
            ))}
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="What do you want to remember?"
            placeholderTextColor={colors.ink.tertiary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Write it down while it's still small and new…"
            placeholderTextColor={colors.ink.tertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          {media.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              {media.map((m, i) =>
                m.mediaType === 'photo' ? (
                  <Image key={i} source={{ uri: m.uri }} style={styles.thumb} />
                ) : (
                  <View key={i} style={[styles.thumb, styles.videoThumb]}>
                    <Ionicons name="videocam" size={24} color={colors.accent.onAccent} />
                  </View>
                )
              )}
            </ScrollView>
          ) : null}
          <PressScale onPress={attach} style={styles.attachRow}>
            <Ionicons name="image-outline" size={20} color={colors.accent.terracotta} />
            <Text style={styles.attachText}>Add photos or a video</Text>
          </PressScale>
          <Text style={styles.milestoneLabel}>MILESTONES</Text>
          <View style={styles.chipsWrap}>
            {copy.milestones.map((m) => (
              <Chip key={m.label} label={m.label} selected={title === m.label} onPress={() => applyMilestone(m.label, m.prompt)} />
            ))}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={editId ? 'Save changes' : copy.global.keepMemory}
            onPress={save}
            loading={busy}
            disabled={!body.trim() && !title.trim() && media.length === 0}
          />
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
  topDate: { ...type.labelMD, color: colors.ink.tertiary },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  titleInput: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.xl },
  bodyInput: {
    ...type.bodyMD,
    color: colors.ink.primary,
    marginTop: spacing.lg,
    minHeight: 140,
  },
  thumb: { width: 140, height: 105, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: colors.bg.surfaceWarm },
  videoThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink.secondary },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44 },
  attachText: { ...type.titleSM, color: colors.accent.terracotta },
  milestoneLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xxl },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  footer: { padding: spacing.screen, paddingTop: spacing.sm },
});
