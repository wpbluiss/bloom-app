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
import { track } from '../../lib/events';
import { PickedMedia, pickMedia, uriToBytes } from '../../lib/media';
import { maybeAskForReview } from '../../lib/review';
import { currentWeek, formatISODate } from '../../lib/weeks';
import { colors, radius, spacing, type } from '../../lib/theme';

/**
 * Journal compose — the heart of Bloom.
 * Params: type (entry type), title/body (prefill from quick actions).
 */
export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; title?: string; body?: string }>();
  const { householdId, pregnancyId, dueDate, refreshJournal, activeMilestone, milestone } = useApp();
  const { pregnancyPass } = useEntitlement();
  const [entryType, setEntryType] = useState<EntryType>((params.type as EntryType) || 'note');
  const [title, setTitle] = useState(params.title ?? '');
  const [body, setBody] = useState(params.body ?? '');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [busy, setBusy] = useState(false);

  const attach = async () => {
    // Free tier: 25 journal media items. The Pass lifts the cap. (Dev mode:
    // always entitled, never gated.)
    if (!pregnancyPass) {
      const { count, error } = await countHouseholdMedia(householdId!);
      if (!error && count >= FREE_MEDIA_LIMIT) {
        promptForPass('media');
        return;
      }
    }
    const picked = await pickMedia({ allowsMultipleSelection: true, selectionLimit: 4 });
    if (picked.length) setMedia((m) => [...m, ...picked].slice(0, 4));
  };

  const applyMilestone = (label: string) => {
    setTitle(label);
    track('journal_quick_pick', { type: 'milestone', pick: label });
  };

  const save = async () => {
    if (!title.trim() && !body.trim() && media.length === 0) {
      Alert.alert('A blank page', 'Write a line, or add a photo — future-you will be glad you did.');
      return;
    }
    setBusy(true);
    const week = dueDate ? currentWeek(dueDate) : null;
    const { data: entry, error } = await createJournalEntry({
      pregnancy_id: pregnancyId!,
      week,
      type: entryType,
      title: title.trim() || null,
      body: body.trim() || null,
      milestone_key: activeMilestone?.key ?? null,
      occurred_on: formatISODate(new Date()),
    });
    if (error || !entry) {
      setBusy(false);
      Alert.alert(copy.common.error, error?.message ?? copy.common.tryAgain);
      return;
    }
    // Upload any attached media, then register rows.
    for (const m of media) {
      const bytes = await uriToBytes(m);
      const path = `${householdId}/${entry.id}-${Date.now()}.${m.ext}`;
      const up = await uploadToBucket('journal-media', path, bytes, m.mime);
      if (up.error || !up.path) continue; // skip failed uploads quietly; entry itself is saved
      await createMediaRow(entry.id, householdId!, up.path, m.kind, bytes.length);
    }
    setBusy(false);
    track('journal_save', { type: entryType, with_media: media.length > 0 });
    refreshJournal();
    maybeAskForReview();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <PressScale onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.ink.primary} />
          </PressScale>
          <Text style={styles.headerTitle}>{copy.compose.titleOf(entryType)}</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Type switcher */}
          <View style={styles.chipsWrap}>
            {(['note', 'milestone', 'craving', 'ultrasound'] as EntryType[]).map((t) => (
              <Chip key={t} label={copy.compose.types[t]} selected={entryType === t} onPress={() => setEntryType(t)} />
            ))}
          </View>

          {entryType === 'ultrasound' && media.length === 0 ? (
            <PressScale style={styles.attachHero} onPress={attach}>
              <Ionicons name="image-outline" size={20} color={colors.accent.terracotta} />
              <Text style={styles.attachText}>{copy.compose.ultrasoundCta}</Text>
            </PressScale>
          ) : null}

          {media.length > 0 ? (
            <View style={styles.thumbRow}>
              {media.map((m, i) => (
                <View key={`${m.uri}-${i}`} style={styles.thumbWrap}>
                  <Image source={{ uri: m.uri }} style={styles.thumb} />
                  {m.kind === 'video' ? (
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={12} color="#fff" />
                    </View>
                  ) : null}
                  <PressScale
                    style={styles.thumbRemove}
                    onPress={() => setMedia((cur) => cur.filter((_, j) => j !== i))}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </PressScale>
                </View>
              ))}
              {media.length < 4 ? (
                <PressScale style={styles.thumbAdd} onPress={attach}>
                  <Ionicons name="add" size={22} color={colors.ink.tertiary} />
                </PressScale>
              ) : null}
            </View>
          ) : null}

          {entryType !== 'ultrasound' && media.length === 0 ? (
            <PressScale style={styles.attachInline} onPress={attach}>
              <Ionicons name="image-outline" size={20} color={colors.accent.terracotta} />
              <Text style={styles.attachText}>Add photos or a video</Text>
            </PressScale>
          ) : null}

          {/* Type-aware quick picks — one tap starts the memory */}
          {entryType === 'milestone' ? (
            <View>
              <Text style={styles.picksLabel}>{copy.compose.quickPicksEyebrow.milestone}</Text>
              <View style={styles.chipsWrap}>
                {copy.milestones.map((m) => (
                  <Chip key={m.label} label={m.label} selected={title === m.label} onPress={() => applyMilestone(m.label)} />
                ))}
              </View>
              {activeMilestone ? <Text style={styles.promptHint}>{activeMilestone.prompt}</Text> : null}
            </View>
          ) : null}
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

          {milestone && entryType === 'milestone' ? <Text style={styles.weekHint}>{milestone}</Text> : null}

          <TextInput
            style={styles.titleInput}
            placeholder={copy.compose.titlePlaceholder}
            placeholderTextColor={colors.ink.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder={copy.compose.bodyPlaceholderOf(entryType)}
            placeholderTextColor={colors.ink.tertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button title={busy ? copy.common.saving : copy.compose.save} onPress={save} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { ...type.titleMD, color: colors.ink.primary },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  picksLabel: { ...type.eyebrow, color: colors.ink.tertiary, marginBottom: spacing.sm },
  promptHint: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm, fontStyle: 'italic' },
  weekHint: { ...type.bodySM, color: colors.accent.sage, marginBottom: spacing.md },
  attachHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line.soft,
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
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  thumbWrap: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    padding: 3,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    padding: 3,
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line.soft,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    ...type.titleMD,
    color: colors.ink.primary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line.soft,
    marginBottom: spacing.md,
  },
  bodyInput: { ...type.bodyMD, color: colors.ink.primary, minHeight: 160 },
  footer: { padding: spacing.lg, paddingTop: 0 },
});
