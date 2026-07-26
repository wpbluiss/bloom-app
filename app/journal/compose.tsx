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
import {
  EntryType,
  countHouseholdMedia,
  createJournalEntry,
  createMediaRow,
  updateJournalEntry,
  uploadToBucket,
} from '../../lib/db';
import { FREE_MEDIA_LIMIT, promptForPass, useEntitlement } from '../../lib/entitlements';
import { track } from '../../lib/events';
import { PickedMedia, pickMedia, uriToBytes } from '../../lib/media';
import { maybeAskForReview } from '../../lib/review';
import { formatISODate } from '../../lib/weeks';
import { colors, radius, spacing, type } from '../../lib/theme';

/**
 * Journal compose — the heart of Bloom.
 * Params: id (edit mode), type (entry type), title/body (prefill).
 */
export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; type?: string; title?: string; body?: string }>();
  const { session, household, pregnancy, week } = useApp();
  const { pregnancyPass } = useEntitlement();
  const editingId = params.id ?? null;
  const [entryType, setEntryType] = useState<EntryType>((params.type as EntryType) || 'note');
  const [title, setTitle] = useState(params.title ?? '');
  const [body, setBody] = useState(params.body ?? '');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [busy, setBusy] = useState(false);

  const attach = async () => {
    // Free tier: 25 journal media items. The Pass lifts the cap. (Dev mode:
    // always entitled, never gated.)
    if (!pregnancyPass && household) {
      const count = await countHouseholdMedia(household.id);
      if (count >= FREE_MEDIA_LIMIT) {
        promptForPass(router, copy.paywall.gateMedia);
        return;
      }
    }
    const picked = await pickMedia({ allowsVideo: true });
    if (picked) setMedia(picked);
  };

  const pick = (p: string) => {
    setTitle(p);
    track('journal_quick_pick', { type: entryType, pick: p });
  };

  const save = async () => {
    if (!session?.user || !household) return;
    if (!title.trim() && !body.trim() && !media) {
      Alert.alert('A blank page', 'Write a line, or add a photo — future-you will be glad you did.');
      return;
    }
    setBusy(true);
    try {
      let entryId = editingId;
      if (editingId) {
        await updateJournalEntry(editingId, {
          entry_type: entryType,
          title: title.trim() || null,
          body: body.trim() || null,
        });
      } else {
        const entry = await createJournalEntry({
          household_id: household.id,
          pregnancy_id: pregnancy?.id ?? null,
          author_id: session.user.id,
          week_number: week,
          entry_type: entryType,
          title: title.trim() || null,
          body: body.trim() || null,
          entry_date: formatISODate(new Date()),
        });
        entryId = entry.id;
      }
      if (media && entryId) {
        const bytes = await uriToBytes(media.uri);
        const path = await uploadToBucket('journal-media', household.id, bytes, media.ext, media.contentType);
        await createMediaRow({
          journal_entry_id: entryId,
          household_id: household.id,
          storage_path: path,
          media_type: media.mediaType,
          caption: null,
        });
      }
      if (entryType === 'milestone' && !editingId) void maybeAskForReview();
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const activeMilestone = copy.milestones.find((m) => m.label === title);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressScale onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.ink.primary} />
          </PressScale>
          <Text style={styles.headerTitle}>{copy.compose.typeLabels[entryType]}</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Type switcher */}
          <View style={styles.chipsWrap}>
            {(['note', 'milestone', 'craving', 'ultrasound'] as EntryType[]).map((t) => (
              <Chip key={t} label={copy.compose.typeLabels[t]} selected={entryType === t} onPress={() => setEntryType(t)} />
            ))}
          </View>

          {/* Media */}
          {media ? (
            <View style={styles.thumbWrap}>
              <Image source={{ uri: media.uri }} style={styles.thumb} />
              {media.mediaType === 'video' ? (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={12} color={colors.accent.onAccent} />
                </View>
              ) : null}
              <PressScale style={styles.thumbRemove} onPress={() => setMedia(null)} hitSlop={6}>
                <Ionicons name="close" size={12} color={colors.accent.onAccent} />
              </PressScale>
            </View>
          ) : entryType === 'ultrasound' ? (
            <PressScale style={styles.attachHero} onPress={attach}>
              <Ionicons name="image-outline" size={20} color={colors.accent.terracotta} />
              <Text style={styles.attachText}>{copy.compose.ultrasoundPhotoCta}</Text>
            </PressScale>
          ) : (
            <PressScale style={styles.attachInline} onPress={attach}>
              <Ionicons name="image-outline" size={20} color={colors.accent.terracotta} />
              <Text style={styles.attachText}>Add a photo or video</Text>
            </PressScale>
          )}

          {/* Type-aware quick picks — one tap starts the memory */}
          {entryType === 'note' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.note}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.notePicks.map((p) => (
                  <Chip key={p} label={p} selected={title === p} onPress={() => pick(p)} />
                ))}
              </View>
            </View>
          ) : null}
          {entryType === 'milestone' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.milestone}</Text>
              <View style={styles.chipsWrap}>
                {copy.milestones.map((m) => (
                  <Chip key={m.label} label={m.label} selected={title === m.label} onPress={() => pick(m.label)} />
                ))}
              </View>
              {activeMilestone ? <Text style={styles.promptHint}>{activeMilestone.prompt}</Text> : null}
            </View>
          ) : null}
          {entryType === 'craving' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.craving}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.cravingPicks.map((p) => (
                  <Chip key={p} label={p} selected={title === p} onPress={() => pick(p)} />
                ))}
              </View>
            </View>
          ) : null}
          {entryType === 'ultrasound' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.ultrasound}</Text>
              <View style={styles.chipsWrap}>
                {copy.compose.ultrasoundPicks.map((p) => (
                  <Chip key={p} label={p} selected={title === p} onPress={() => pick(p)} />
                ))}
              </View>
            </View>
          ) : null}

          <TextInput
            style={styles.titleInput}
            placeholder="Give this memory a title…"
            placeholderTextColor={colors.ink.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Write it down while it's fresh — the small details are the first to fade."
            placeholderTextColor={colors.ink.tertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button label={busy ? 'Saving…' : copy.global.keepMemory} onPress={save} disabled={busy} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  headerTitle: { ...type.titleMD, color: colors.ink.primary },
  scroll: { padding: spacing.screen, paddingBottom: spacing.xxl },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  picksLabel: { ...type.labelCaps, color: colors.ink.tertiary, marginBottom: spacing.sm },
  promptHint: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm, fontStyle: 'italic' },
  attachHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  attachInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  attachText: { ...type.bodyMD, color: colors.accent.terracotta },
  thumbWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  thumb: { width: '100%', height: '100%' },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    padding: 4,
  },
  thumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    padding: 4,
  },
  titleInput: {
    ...type.titleMD,
    color: colors.ink.primary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginBottom: spacing.md,
  },
  bodyInput: { ...type.bodyMD, color: colors.ink.primary, minHeight: 160 },
  footer: { padding: spacing.screen, paddingTop: 0 },
});
