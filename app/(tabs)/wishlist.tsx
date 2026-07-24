import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import { WishlistItem, fetchWishlist } from '../../lib/db';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

const CATEGORIES = ['All', 'Nursery', 'Gear', 'Clothing', 'Feeding', 'For mom'];

export default function WishlistScreen() {
  const router = useRouter();
  const { household } = useApp();
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    if (!household) return;
    try {
      setItems(await fetchWishlist(household.id));
    } catch (e) {
      console.warn(e);
      setItems([]);
    }
  }, [household]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(
    () => (items ?? []).filter((i) => category === 'All' || i.category === category),
    [items, category]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
      </View>
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>
      {items === null ? (
        <View style={{ padding: spacing.screen }}>
          <CardSkeleton height={160} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          headline={copy.empty.wishlist.headline}
          body={copy.empty.wishlist.body}
          cta={copy.empty.wishlist.cta}
          onCta={() => router.push('/wishlist/new')}
        />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(i) => i.id}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <PressScale style={styles.itemCard} onPress={() => router.push(`/wishlist/${item.id}`)}>
              {item.signedUrl ? (
                <Image source={{ uri: item.signedUrl }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="gift-outline" size={30} color={colors.accent.blush} />
                </View>
              )}
              <View style={{ padding: spacing.md }}>
                {item.category ? (
                  <View style={styles.catChip}>
                    <Text style={styles.catChipText}>{item.category}</Text>
                  </View>
                ) : null}
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>
                    {item.target_price != null ? `$${Number(item.target_price).toFixed(0)}` : '—'}
                  </Text>
                  {item.status === 'purchased' ? (
                    <View style={styles.purchasedPill}>
                      <Ionicons name="checkmark" size={12} color={colors.sage.primary} />
                      <Text style={styles.purchasedText}>Got it</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </PressScale>
          )}
        />
      )}
      <PressScale style={styles.fab} onPress={() => router.push('/wishlist/new')}>
        <Ionicons name="add" size={28} color={colors.accent.onAccent} />
      </PressScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...type.displayLG, color: colors.ink.primary },
  catRow: { gap: spacing.sm, paddingHorizontal: spacing.screen, alignItems: 'center' },
  grid: { padding: spacing.screen, gap: spacing.md, paddingBottom: 120 },
  itemCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    ...shadow.card,
  },
  itemImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.bg.paper },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  catChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  catChipText: { ...type.caption, color: colors.ink.secondary },
  itemName: { ...type.titleSM, color: colors.ink.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  itemPrice: { ...type.titleSM, color: colors.ink.primary },
  purchasedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.sage.soft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  purchasedText: { ...type.caption, color: colors.sage.primary, fontFamily: 'Inter_600SemiBold' },
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
