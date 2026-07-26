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

function openExternal(url: string, retailer?: string | null) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const m = /^https?:\/\/([^/]+)/i.exec(normalized);
  const host = (m?.[1] ?? normalized).replace(/^www\./, '');
  Alert.alert(copy.wishlist.openLinkTitle, `${retailer ? `${retailer} — ` : ''}${host}`, [
    { text: copy.wishlist.openLinkCancel, style: 'cancel' },
    { text: copy.wishlist.openLinkConfirm, onPress: () => Linking.openURL(normalized).catch(() => Alert.alert(copy.wishlist.openLinkError, normalized)) },
  ]);
}

export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [alts, setAlts] = useState<WishlistAlternative[]>([]);
  const [scanning, setScanning] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [target, setTarget] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('wishlist_items').select('*').eq('id', id).single();
    if (data) {
      setItem(data as WishlistItem);
      setTarget(data.target_price != null ? String(data.target_price) : '');
      if (data.photo_path) {
        const u = await signedUrl('wishlist-photos', data.photo_path);
        setPhotoUrl(u);
      }
    }
    const { data: a } = await fetchAlternatives(id!);
    setAlts(a);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const scan = async () => {
    setScanning(true);
    track('deal_finder_tap', { item: id });
    await findAlternatives(id!);
    const { data: a } = await fetchAlternatives(id!);
    setAlts(a);
    setScanning(false);
  };

  const saveTarget = async () => {
    const n = target.trim() ? Number(target) : null;
    if (target.trim() && (n == null || isNaN(n) || n < 0)) {
      Alert.alert(copy.common.error, copy.wishlist.badTarget);
      return;
    }
    await updateWishlistItem(id!, { target_price: n });
    load();
  };

  const toggleStatus = async () => {
    if (!item) return;
    const next = item.status === 'purchased' ? 'wanted' : 'purchased';
    await updateWishlistItem(id!, { status: next });
    load();
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing.lg }}>
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <PressScale onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.ink.primary} />
        </PressScale>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <Image source={wishlistCategoryArt(item.category)} style={styles.photo} />
        )}
        <Text style={styles.price}>
          {item.target_price != null ? `$${Number(item.target_price).toFixed(2)}` : 'No target price'}
          {item.category ? `  ·  ${item.category}` : ''}
        </Text>
        {item.source_url ? (
          <PressScale onPress={() => openExternal(item.source_url!)} style={{ marginTop: spacing.sm }}>
            <Text style={styles.link}>{copy.wishlist.viewListing}</Text>
          </PressScale>
        ) : null}

        <View style={styles.targetRow}>
          <TextInput
            style={styles.targetInput}
            placeholder={copy.wishlist.targetPlaceholder}
            placeholderTextColor={colors.ink.tertiary}
            keyboardType="decimal-pad"
            value={target}
            onChangeText={setTarget}
          />
          <Button title={copy.wishlist.setTarget} onPress={saveTarget} small />
        </View>

        <Button
          title={item.status === 'purchased' ? copy.wishlist.markWanted : copy.wishlist.markPurchased}
          onPress={toggleStatus}
          variant="secondary"
          style={{ marginTop: spacing.md }}
        />

        <View style={styles.altHeader}>
          <Text style={styles.altTitle}>{copy.wishlist.dealsTitle}</Text>
          <PressScale onPress={scan} disabled={scanning}>
            <Text style={styles.scanLink}>{scanning ? copy.wishlist.scanning : copy.wishlist.rescan}</Text>
          </PressScale>
        </View>
        {scanning ? <CardSkeleton /> : null}
        {!scanning && alts.length === 0 ? (
          <Text style={styles.emptyAlts}>{copy.wishlist.noDeals}</Text>
        ) : null}
        {!scanning &&
          alts.map((a) => {
            const reachable = !!a.url;
            return (
              <PressScale
                key={a.id}
                style={styles.altCard}
                disabled={!reachable}
                onPress={() => {
                  if (!a.url) return;
                  track('deal_open', { item: item.id, retailer: a.retailer, price: a.price });
                  openExternal(a.url, a.retailer);
                }}
              >
                {a.image_url ? (
                  <Image source={{ uri: a.image_url }} style={styles.altImg} />
                ) : (
                  <View style={[styles.altImg, styles.altImgFallback]}>
                    <Ionicons name="storefront-outline" size={20} color={colors.ink.tertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.altRetailer}>{a.retailer ?? copy.wishlist.unknownRetailer}</Text>
                  <Text style={styles.altName} numberOfLines={2}>
                    {a.title ?? item.name}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.altPrice}>{a.price != null ? `$${Number(a.price).toFixed(2)}` : '—'}</Text>
                  {reachable ? (
                    <Text style={styles.altOpen}>{copy.wishlist.viewDeal}</Text>
                  ) : null}
                </View>
              </PressScale>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: { ...type.titleMD, color: colors.ink.primary, flex: 1, textAlign: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  photo: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.bg.sunken },
  price: { ...type.titleSM, color: colors.ink.primary, marginTop: spacing.md },
  link: { ...type.bodyMD, color: colors.accent.terracotta },
  targetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'center' },
  targetInput: {
    flex: 1,
    ...type.bodyMD,
    color: colors.ink.primary,
    borderWidth: 1,
    borderColor: colors.line.soft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  altHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  altTitle: { ...type.titleSM, color: colors.ink.primary },
  scanLink: { ...type.bodySM, color: colors.accent.terracotta },
  emptyAlts: { ...type.bodySM, color: colors.ink.tertiary },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  altImg: { width: 48, height: 48, borderRadius: radius.md },
  altImgFallback: {
    backgroundColor: colors.bg.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altRetailer: { ...type.caption, color: colors.ink.tertiary, textTransform: 'uppercase', letterSpacing: 1 },
  altName: { ...type.bodySM, color: colors.ink.primary },
  altPrice: { ...type.titleSM, color: colors.accent.terracotta },
  altOpen: { ...type.caption, color: colors.ink.tertiary, marginTop: 2 },
});
