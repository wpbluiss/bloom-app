import React, { useCallback, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { JournalEntry, fetchJournalEntries } from '../../lib/db';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  note: 'pencil-outline',
  milestone: 'star-outline',
  craving: 'ice-cream-outline',
  ultrasound: 'heart-outline',
};

export default function JournalScreen() {
  const router = useRouter();
  const { household } = useApp();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!household) return;
    try {
      setEntries(await fetchJournalEntries(household.id));
    } catch (e) {
      console.warn(e);
      setEntries([]);
    }
  }, [household]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    (entries ?? []).forEach((e) => {
      const d = new Date(e.entry_date + 'T12:00:00');
      const month = d.toLocaleDateString(undefined, { month: 'long' }).toUpperCase();
      const key = e.week_number ? `WEEK ${e.week_number} · ${month}` : month;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return [...map.entries()];
  }, [entries]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
      </View>
      {entries === null ? (
        <View style={{ padding: spacing.screen, gap: spacing.lg }}>
          <CardSkeleton height={140} />
          <CardSkeleton height={140} />
        </View>
      ) : entries.length === 0 ? (
        <EmptyState
          icon="book-outline"
          headline={copy.empty.journal.headline}
          body={copy.empty.journal.body}
          cta={copy.empty.journal.cta}
          onCta={() => router.push('/journal/compose')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.accent.terracotta}
            />
          }
        >
          {groups.map(([label, items], gi) => (
            <View key={label}>
              <Text style={[styles.groupHeader, gi > 0 && { marginTop: spacing.section }]}>{label}</Text>
              {items.map((e, i) => (
                <FadeIn key={e.id} index={Math.min(i, 5)}>
                  <Card style={{ marginTop: spacing.md }}>
                    <View style={styles.entryHeader}>
                      <Ionicons
                        name={TYPE_ICONS[e.entry_type] ?? 'pencil-outline'}
                        size={16}
                        color={colors.accent.terracotta}
                      />
                      {e.title ? <Text style={styles.entryTitle}>{e.title}</Text> : null}
                    </View>
                    {e.body ? <Text style={styles.entryBody}>{e.body}</Text> : null}
                    {e.media && e.media.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md }}>
                        {e.media.map((m) =>
                          m.signedUrl && m.media_type === 'photo' ? (
                            <Image key={m.id} source={{ uri: m.signedUrl }} style={styles.thumb} />
                          ) : m.signedUrl ? (
                            <View key={m.id} style={[styles.thumb, styles.videoThumb]}>
                              <Ionicons name="play" size={22} color={colors.accent.onAccent} />
                            </View>
                          ) : null
                        )}
                      </ScrollView>
                    ) : null}
                    <Text style={styles.timestamp}>
                      {new Date(e.entry_date + 'T12:00:00').toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </Card>
                </FadeIn>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      <PressScale style={styles.fab} onPress={() => router.push('/journal/compose')}>
        <Ionicons name="add" size={28} color={colors.accent.onAccent} />
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  scroll: { padding: spacing.screen, paddingBottom: 120 },
  groupHeader: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.lg },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryTitle: { ...type.titleMD, color: colors.ink.primary, flex: 1 },
  entryBody: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.sm },
  thumb: { width: 180, height: 135, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: colors.bg.surfaceWarm },
  videoThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink.secondary },
  timestamp: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.screen,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
});
