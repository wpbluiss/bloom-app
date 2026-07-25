import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { PressScale } from '../../components/PressScale';
import { CardSkeleton } from '../../components/Skeleton';
import { copy } from '../../lib/copy';
import {
  WishlistAlternative,
  WishlistItem,
  fetchAlternatives,
  findAlternatives,
  signedUrl,
  updateWishlistItem,
} from '../../lib/db';
import { track } from '../../lib/events';
import { supabase } from '../../lib/supabase';
import { wishlistCategoryArt } from '../../lib/wishlistArt';
import { colors, radius, shadow, spacing, type } from '../../lib/theme';

export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [notes, setNotes] = useState('');
  const [alternatives, setAlternatives] = useState<WishlistAlternative[] | null>(null);
  const [finding, setFinding] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase.from('wishlist_items').select('*').eq('id', id).single();
    if (error) {
      console.warn(error);
      return;
    }
    const it = data as WishlistItem;
    if (it.photo_path) it.signedUrl = await signedUrl('wishlist-photos', it.photo_path);
    setItem(it);
    setNotes(it.notes ?? '');
    setAlternatives(await fetchAlternatives(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!item) return;
    const next = item.status === 'purchased' ? 'wanted' : 'purchased';
    setItem({ ...item, status: next }); // optimistic
    try {
      await updateWishlistItem(item.id, { status: next });
    } catch {
      setItem(item);
      Alert.alert(copy.global.error);
    }
  };

  const saveNotes = async () => {
    if (!item) return;
    try {
      await updateWishlistItem(item.id, { notes: notes.trim() || null });
    } catch {
      Alert.alert(copy.global.error);
    }
  };

  const find = async () => {
    if (!item) return;
    track('deal_finder_tap', { item: item.id, name: item.name });
    setFinding(true);
    try {
      const alts = await findAlternatives(item.id);
      if (alts.length > 0) setAlternatives(alts);
      else setAlternatives(await fetchAlternatives(item.id));
    } catch (e) {
      // Function not deployed yet — fall back to whatever exists in the table
      console.warn('find-alternatives unavailable', e);
      setAlternatives((prev) => prev ?? []);
    } finally {
      setFinding(false);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: spacing.screen }}>
          <CardSkeleton height={260} />
        </View>
      </SafeAreaView>
    );
  }

  const savings = (price: number | null) =>
    price != null && item.target_price != null ? item.target_price - price : null;
  const art = wishlistCategoryArt(item.category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={colors.ink.secondary} />
          </PressScale>
          <PressScale onPress={toggleStatus} style={styles.statusPill}>
            <Ionicons
              name={item.status === 'purchased' ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={item.status === 'purchased' ? colors.sage.primary : colors.ink.tertiary}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.status === 'purchased' ? colors.sage.primary : colors.ink.tertiary },
              ]}
            >
              {item.status === 'purchased' ? 'Purchased' : 'Mark as purchased'}
            </Text>
          </PressScale>
        </View>
        {item.signedUrl ? (
          <Image source={{ uri: item.signedUrl }} style={styles.photo} />
        ) : art ? (
          <View style={[styles.photo, styles.photoArt]}>
            <Image source={art} style={styles.photoArtImg} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="cube-outline" size={48} color={colors.ink.tertiary} />
          </View>
        )}
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>
          {item.target_price != null ? `$${Number(item.target_price).toFixed(2)}` : 'No target price'}
          {item.category ? `  ·  ${item.category}` : ''}
        </Text>
        {item.source_url ? (
          <PressScale onPress={() => Linking.openURL(item.source_url!).catch(() => {})} style={{ marginTop: spacing.sm }}>
            <Text style={styles.link}>View where you found it</Text>
          </PressScale>
        ) : null}
        <TextInput
          style={styles.notes}
          placeholder="Notes — color, size, who mentioned it…"
          placeholderTextColor={colors.ink.tertiary}
          value={notes}
          onChangeText={setNotes}
          onBlur={saveNotes}
          multiline
        />
        <View style={styles.altHeader}>
          <Text style={styles.altTitle}>Lookalikes & deals</Text>
          <Button label="Find lookalikes & deals" onPress={find} loading={finding} variant="secondary" style={{ minHeight: 44 }} />
        </View>
        {alternatives && alternatives.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {alternatives.map((a) => {
              const save = savings(a.price);
              const openable = !!a.url;
              return (
                <PressScale
                  key={a.id}
                  style={styles.altCard}
                  disabled={!openable}
                  onPress={() => {
                    if (!a.url) return;
                    track('deal_open', { item: item.id, retailer: a.retailer, price: a.price });
                    Linking.openURL(a.url).catch(() => {});
                  }}
                >
                  {a.image_url ? (
                    <Image source={{ uri: a.image_url }} style={styles.altImg} resizeMode="contain" />
                  ) : (
                    <View style={[styles.altImg, styles.altImgEmpty]}>
                      <Ionicons name="image-outline" size={22} color={colors.ink.tertiary} />
                    </View>
                  )}
                  <Text style={styles.altName} numberOfLines={2}>
                    {a.title}
                  </Text>
                  {a.retailer ? <Text style={styles.altRetailer}>{a.retailer}</Text> : null}
                  <View style={styles.altPriceRow}>
                    <Text style={styles.altPrice}>{a.price != null ? `$${Number(a.price).toFixed(2)}` : '—'}</Text>
                    {save != null && save > 0 ? <Text style={styles.altSavings}>−${save.toFixed(0)}</Text> : null}
                  </View>
                  {openable ? (
                    <View style={styles.altCta}>
                      <Text style={styles.altCtaText}>{copy.wishlist.viewDeal}</Text>
                      <Ionicons name="open-outline" size={13} color={colors.accent.onAccent} />
                    </View>
                  ) : null}
                </PressScale>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.altEmpty}>
            <Ionicons name="search-outline" size={24} color={colors.ink.tertiary} />
            <Text style={styles.altEmptyText}>
              {finding ? 'Looking…' : copy.global.findingAlternatives}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusText: { ...type.labelMD },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radius.xl, backgroundColor: colors.bg.paper },
  photoArt: { alignItems: 'center', justifyContent: 'center', padding: spacing.hero },
  photoArtImg: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.surfaceWarm },
  name: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.xl },
  price: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.xs },
  link: { ...type.titleSM, color: colors.accent.terracotta },
  notes: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    padding: spacing.md,
    ...type.bodySM,
    color: colors.ink.primary,
    marginTop: spacing.xl,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  altHeader: { marginTop: spacing.section, gap: spacing.md },
  altTitle: { ...type.titleMD, color: colors.ink.primary },
  altCard: {
    width: 190,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    ...shadow.card,
  },
  altImg: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: radius.md,
    backgroundColor: colors.bg.paper,
  },
  altImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  altName: { ...type.titleSM, color: colors.ink.primary, marginTop: spacing.sm },
  altRetailer: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.xs },
  altPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  altPrice: { ...type.titleMD, color: colors.ink.primary },
  altSavings: { ...type.labelMD, color: colors.sage.primary },
  altCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  altCtaText: { ...type.titleSM, fontSize: 13, color: colors.accent.onAccent },
  altEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
    backgroundColor: colors.bg.surfaceWarm,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  altEmptyText: { ...type.bodySM, color: colors.ink.secondary, textAlign: 'center' },
});
