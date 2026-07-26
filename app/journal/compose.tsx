import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { WeekArt } from '../../components/WeekArt';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import {
  createJournalEntry,
  updateJournalEntry,
  uploadJournalMedia,
  type JournalMedia,
  type JournalType,
} from '../../lib/db';
import { pickMedia } from '../../lib/media';
import { useEntitlement } from '../../lib/entitlements';
import { maybeAskForReview } from '../../lib/review';
import { colors, spacing, type } from '../../lib/theme';
import { track } from '../../lib/events';

const ENTRY_TYPES: JournalType[] = ['note', 'milestone', 'craving', 'ultrasound'];

export default function ComposeScreen() {
  const router = useRouter();
  const { household, profile, pregnancy, week, refreshJournal } = useApp();
  const { canUnlimitedMedia } = useEntitlement();
  const params = useLocalSearchParams<{ type?: string; editId?: string; existingTitle?: string; existingBody?: string }>();
  const editId = params.editId;
  const [entryType, setEntryType] = useState<JournalType>(
    (params.type as JournalType) || 'note'
  );
  const [title, setTitle] = useState(params.existingTitle ?? '');
  const [body, setBody] = useState(params.existingBody ?? '');
  const [media, setMedia] = useState<JournalMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    track('journal_compose_open', { type: entryType, editing: Boolean(editId) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhoto = async () => {
    if (!household || !pregnancy) return;
    setMediaBusy(true);
    try {
      const picked = await pickMedia({ allowsVideo: true });
      if (!picked) return;
      const up = await uploadJournalMedia(household.id, pregnancy.id, picked);
      setMedia((m) => [...m, up]);
    } catch {
      Alert.alert(copy.global.error);
    } finally {
      setMediaBusy(false);
    }
  };

  const save = async () => {
    if (!household || !profile || !pregnancy) return;
    if (!title.trim() && !body.trim() && media.length === 0) {
      Alert.alert('Nothing to keep yet', 'Write a line or add a photo first.');
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await updateJournalEntry(editId, { title: title.trim(), body: body.trim() });
      } else {
        await createJournalEntry({
          household_id: household.id,
          pregnancy_id: pregnancy.id,
          author_id: profile.id,
          week: week ?? null,
          type: entryType,
          title: title.trim(),
          body: body.trim(),
          media,
        });
        track('journal_saved', { type: entryType, has_media: media.length > 0, week });
      }
      await refreshJournal();
      router.back();
      // Big-feelings moment: after a first milestone lands, ask for the App Store review (once ever).
      if (!editId && entryType === 'milestone') void maybeAskForReview();
    } catch {
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const applyMilestone = (label: string, prompt: string) => {
    setTitle(label);
    if (!body) setBody('');
    track('journal_quick_pick', { type: 'milestone', pick: label });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={colors.ink.secondary} />
          </Pressable>
          <Text style={styles.topTitle}>{editId ? 'Edit entry' : 'New entry'}</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.chipsWrap}>
            {ENTRY_TYPES.map((t) => (
              <Chip
                key={t}
                label={copy.compose.typeLabels[t]}
                selected={entryType === t}
                onPress={() => setEntryType(t)}
              />
            ))}
          </View>

          {entryType === 'note' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.note}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.notePicks.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={title === p}
                    onPress={() => {
                      setTitle(p);
                      track('journal_quick_pick', { type: 'note', pick: p });
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {entryType === 'milestone' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.milestone}</Text>
              <View style={styles.chipsWrap}>
                {copy.milestones.map((m) => (
                  <Chip
                    key={m.label}
                    label={m.label}
                    selected={title === m.label}
                    onPress={() => applyMilestone(m.label, m.prompt)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {entryType === 'craving' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.craving}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.cravingPicks.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={title === p}
                    onPress={() => {
                      setTitle(p);
                      track('journal_quick_pick', { type: 'craving', pick: p });
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {entryType === 'ultrasound' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.ultrasound}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.ultrasoundPicks.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={title === p}
                    onPress={() => {
                      setTitle(p);
                      track('journal_quick_pick', { type: 'ultrasound', pick: p });
                    }}
                  />
                ))}
              </View>
              <Pressable onPress={addPhoto} style={styles.photoCta}>
                <Ionicons name="image-outline" size={18} color={colors.accent.terracotta} />
                <Text style={styles.photoCtaText}>{copy.compose.ultrasoundPhotoCta}</Text>
              </Pressable>
            </View>
          ) : null}

          <TextInput
            style={styles.titleInput}
            placeholder="What do you want to remember?"
            placeholderTextColor={colors.ink.tertiary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Write it all down while it's still small and new…"
            placeholderTextColor={colors.ink.tertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          {media.length > 0 ? (
            <View style={styles.mediaRow}>
              {media.map((m, i) => (
                <View key={i} style={styles.mediaPill}>
                  <Ionicons
                    name={m.contentType.startsWith('video') ? 'videocam' : 'image'}
                    size={14}
                    color={colors.ink.secondary}
                  />
                  <Text style={styles.mediaPillText} numberOfLines={1}>
                    {m.path.split('/').pop()}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {entryType !== 'ultrasound' ? (
            <Pressable onPress={addPhoto} disabled={mediaBusy} style={styles.attachRow}>
              <Ionicons name="attach" size={18} color={colors.ink.secondary} />
              <Text style={styles.attachText}>{mediaBusy ? 'Uploading…' : 'Add photo or video'}</Text>
            </Pressable>
          ) : null}

          <WeekArt week={week ?? 20} height={120} />

          <Button label={copy.global.keepMemory} onPress={save} loading={busy} style={{ marginTop: spacing.lg }} />
        </ScrollView>
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
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  picksLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginBottom: spacing.sm },
  titleInput: {
    ...type.displayMD,
    color: colors.ink.primary,
    paddingVertical: spacing.md,
  },
  bodyInput: {
    ...type.bodyMD,
    color: colors.ink.primary,
    minHeight: 160,
    paddingVertical: spacing.md,
  },
  photoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  photoCtaText: { ...type.titleSM, color: colors.accent.terracotta },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  attachText: { ...type.titleSM, color: colors.ink.secondary },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.soft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 220,
  },
  mediaPillText: { ...type.caption, color: colors.ink.secondary },
});
