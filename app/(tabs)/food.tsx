import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SeverityChip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { PressScale } from '../../components/PressScale';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { FoodLog, createFoodLog, fetchFoodLogs } from '../../lib/db';
import { formatISODate } from '../../lib/weeks';
import foodsData from '../../assets/foods.json';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

interface PowerFood { name: string; benefit: string; nutrients: string[]; trimester: number | 'all' }
interface AvoidFood { name: string; why: string; severity: 'avoid' | 'limit' }
interface CravingSwap { craving: string; healthierSwap: string; why: string }

const FOODS = foodsData as { avoid: AvoidFood[]; powerFoods: PowerFood[]; cravingSwaps: CravingSwap[] };
type Segment = 0 | 1 | 2;

function fuzzyMatchSwap(input: string): CravingSwap | null {
  const q = input.trim().toLowerCase();
  if (q.length < 3) return null;
  const words = q.split(/\s+/);
  return (
    FOODS.cravingSwaps.find((s) => {
      const c = s.craving.toLowerCase();
      return c.includes(q) || words.some((w) => w.length > 3 && c.includes(w));
    }) ?? null
  );
}

export default function FoodScreen() {
  const { session, pregnancy } = useApp();
  const [segment, setSegment] = useState<Segment>(0);
  const [query, setQuery] = useState('');
  const [trimesterFilter, setTrimesterFilter] = useState<number | null>(null);
  const [cravingInput, setCravingInput] = useState('');
  const [cravingLogs, setCravingLogs] = useState<FoodLog[]>([]);
  const [logging, setLogging] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!pregnancy) return;
    try {
      setCravingLogs(await fetchFoodLogs(pregnancy.id, 'craving'));
    } catch (e) {
      console.warn(e);
    }
  }, [pregnancy]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  const q = query.trim().toLowerCase();
  const powerFiltered = useMemo(
    () =>
      FOODS.powerFoods.filter(
        (f) =>
          (!q || f.name.toLowerCase().includes(q) || f.benefit.toLowerCase().includes(q)) &&
          (!trimesterFilter || f.trimester === 'all' || f.trimester === trimesterFilter)
      ),
    [q, trimesterFilter]
  );
  const avoidFiltered = useMemo(
    () => FOODS.avoid.filter((f) => !q || f.name.toLowerCase().includes(q) || f.why.toLowerCase().includes(q)),
    [q]
  );

  const matchedSwap = fuzzyMatchSwap(cravingInput);

  const logCraving = async () => {
    if (!session?.user || !pregnancy || !cravingInput.trim()) return;
    setLogging(true);
    try {
      await createFoodLog({
        pregnancy_id: pregnancy.id,
        user_id: session.user.id,
        log_date: formatISODate(new Date()),
        kind: 'craving',
        food_name: cravingInput.trim(),
        notes: null,
      });
      setCravingInput('');
      await loadLogs();
    } catch (e) {
      console.warn(e);
    } finally {
      setLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Food</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.ink.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={copy.food.searchPlaceholder}
            placeholderTextColor={colors.ink.tertiary}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <View style={styles.segmented}>
          {copy.food.segments.map((label, i) => (
            <PressScale
              key={label}
              onPress={() => setSegment(i as Segment)}
              style={[styles.segment, segment === i && styles.segmentActive]}
            >
              <Text style={[styles.segmentLabel, segment === i && styles.segmentLabelActive]}>{label}</Text>
            </PressScale>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {segment === 0 && (
          <>
            <View style={styles.trimesterRow}>
              {[null, 1, 2, 3].map((t) => (
                <PressScale
                  key={String(t)}
                  onPress={() => setTrimesterFilter(t)}
                  style={[styles.tChip, trimesterFilter === t && styles.tChipActive]}
                >
                  <Text style={[styles.tChipLabel, trimesterFilter === t && { color: colors.accent.terracottaDeep }]}>
                    {t === null ? 'All' : `Trimester ${t}`}
                  </Text>
                </PressScale>
              ))}
            </View>
            {powerFiltered.length === 0 ? (
              <EmptyState icon="leaf-outline" headline={copy.empty.foodSearch.headline} body={copy.empty.foodSearch.body} />
            ) : (
              powerFiltered.map((f) => (
                <View key={f.name} style={styles.row}>
                  <View style={[styles.sageDot]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{f.name}</Text>
                    <Text style={styles.rowSub}>{copy.food.benefitLine(f.benefit)}</Text>
                    <View style={styles.nutrientsRow}>
                      {f.nutrients.slice(0, 4).map((n) => (
                        <View key={n} style={styles.nutrientChip}>
                          <Text style={styles.nutrientText}>{n}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.trimesterTag}>{f.trimester === 'all' ? 'ALL' : `T${f.trimester}`}</Text>
                </View>
              ))
            )}
          </>
        )}
        {segment === 1 && (
          <>
            {avoidFiltered.length === 0 ? (
              <EmptyState icon="leaf-outline" headline={copy.empty.foodSearch.headline} body={copy.empty.foodSearch.body} />
            ) : (
              avoidFiltered.map((f) => (
                <View key={f.name} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.avoidHeader}>
                      <Text style={[styles.rowTitle, { flex: 1 }]}>{f.name}</Text>
                      <SeverityChip severity={f.severity} />
                    </View>
                    <Text style={styles.rowSub}>{f.why}</Text>
                  </View>
                </View>
              ))
            )}
            <Text style={styles.doubt}>{copy.food.doubt}</Text>
          </>
        )}
        {segment === 2 && (
          <>
            <Card>
              <TextInput
                style={styles.cravingInput}
                placeholder={copy.food.cravingPlaceholder}
                placeholderTextColor={colors.ink.tertiary}
                value={cravingInput}
                onChangeText={setCravingInput}
              />
              {matchedSwap ? (
                <View style={styles.swapCard}>
                  <Text style={styles.swapTitle}>{copy.food.swapTitle(matchedSwap.craving)}</Text>
                  <View style={styles.swapRow}>
                    <Ionicons name="arrow-forward" size={14} color={colors.sage.primary} />
                    <Text style={styles.swapText}>{copy.food.swapTry(matchedSwap.healthierSwap)}</Text>
                  </View>
                  <Text style={styles.swapWhy}>{matchedSwap.why}</Text>
                </View>
              ) : null}
              <Button
                label={copy.empty.cravings.cta}
                onPress={logCraving}
                loading={logging}
                disabled={!cravingInput.trim()}
                style={{ marginTop: spacing.md }}
              />
            </Card>
            {cravingLogs.length === 0 ? (
              <EmptyState
                icon="ice-cream-outline"
                headline={copy.empty.cravings.headline}
                body={copy.empty.cravings.body}
              />
            ) : (
              cravingLogs.map((l) => (
                <View key={l.id} style={styles.row}>
                  <Ionicons name="ice-cream-outline" size={18} color={colors.accent.blush} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.rowTitle}>{l.food_name}</Text>
                    <Text style={styles.rowSub}>
                      {new Date(l.log_date + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
        <Text style={styles.disclaimer}>{copy.food.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  title: { ...type.displayLG, color: colors.ink.primary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    marginTop: spacing.lg,
  },
  searchInput: { flex: 1, ...type.bodySM, color: colors.ink.primary },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.full,
    padding: 3,
    marginTop: spacing.lg,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  segmentActive: { backgroundColor: colors.accent.terracotta, ...shadow.card },
  segmentLabel: { ...type.labelMD, color: colors.ink.secondary, textAlign: 'center' },
  segmentLabelActive: { color: colors.accent.onAccent, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: spacing.screen, paddingBottom: 120 },
  trimesterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  tChip: {
    minHeight: 30,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bg.surfaceWarm,
    justifyContent: 'center',
  },
  tChipActive: { backgroundColor: colors.accent.terracottaSoft },
  tChipLabel: { ...type.labelMD, color: colors.ink.secondary },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    ...shadow.card,
  },
  sageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage.primary, marginTop: 6, marginRight: spacing.md },
  rowTitle: { ...type.titleSM, color: colors.ink.primary },
  rowSub: { ...type.bodySM, color: colors.ink.secondary, marginTop: 2 },
  nutrientsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  nutrientChip: {
    backgroundColor: colors.sage.soft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  nutrientText: { ...type.caption, color: colors.sage.primary, fontFamily: 'Inter_500Medium' },
  trimesterTag: { ...type.labelCaps, color: colors.ink.tertiary, marginLeft: spacing.sm },
  avoidHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doubt: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
  cravingInput: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    ...type.bodyMD,
    color: colors.ink.primary,
  },
  swapCard: {
    backgroundColor: colors.sage.soft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  swapTitle: { ...type.titleSM, color: colors.ink.primary },
  swapRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  swapText: { ...type.bodySM, color: colors.sage.primary, fontFamily: 'Inter_600SemiBold', flex: 1 },
  swapWhy: { ...type.caption, color: colors.ink.secondary, marginTop: spacing.xs },
  disclaimer: {
    ...type.caption,
    color: colors.ink.tertiary,
    textAlign: 'center',
    marginTop: spacing.section,
    fontStyle: 'italic',
  },
});
