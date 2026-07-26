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

/**
 * Leave-the-app links always ask first (Luis QA: deal links looked dead — a
 * scheme-less URL failed silently). One confirm shows where you're headed;
 * URLs missing a scheme get https:// so they actually open.
 */
function openExternal(url: string, retailer?: string | null) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const m = /^https?:\/\/([^/]+)/i.exec(normalized);
  const host = (m?.[1] ?? normalized).replace(/^www\./, '');
  Alert.alert(copy.wishlist.openLinkTitle, `${retailer ? `${retailer} — ` : ''}${host}`, [
    { text: copy.wishlist.openLinkCancel, style: 'cancel' },
    {
      text: copy.wishlist.openLinkConfirm,
      onPress: () => Linking.openURL(normalized).catch(() => Alert.alert(copy.wishlist.openLinkError, normalized)),
    },
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
    if (!id) return;
    try {
      const { data } = await supabase.from('wishlist_items').select('*').eq('id', id).single();
      if (data) {
        const row = data as WishlistItem;
        setItem(row);
        setTarget(row.target_price != null ? String(row.target_price) : '');
        if (row.photo_path) {
          const u = await signedUrl('wishlist-photos', row.photo_path);
          setPhotoUrl(u ?? null);
        }
      }
      setAlts(await fetchAlternatives(id));
    } catch (e) {
      console.warn(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const scan = async () => {
    if (!id) return;
    setScanning(true);
    track('deal_finder_tap', { item: id });
    try {
      await findAlternatives(id);
      setAlts(await fetchAlternatives(id));
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    } finally {
      setScanning(false);
    }
  };

  const saveTarget = async () => {
    if (!id) return;
    const n = target.trim() ? Number(target) : null;
    if (target.trim() && (n == null || isNaN(n) || n < 0)) {
      Alert.alert("That price doesn't look right", 'Try a number like 69.99 — or leave it blank.');
      return;
    }
    try {
      await updateWishlistItem(id, { target_price: n });
      await load();
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    }
  };

  const toggleStatus = async () => {
    if (!item || !id) return;
    const next = item.status === 'purchased' ? 'wanted' : 'purchased';
    try {
      await updateWishlistItem(id, { status: next });
      await load();
    } catch (e) {
      console.warn(e);
      Alert.alert(copy.global.error);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing.screen }}>
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const art = wishlistCategoryArt(item.category);

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
        ) : art ? (
          <Image source={art} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Ionicons name="gift-outline" size={40} color={colors.ink.tertiary} />
          </View>
        )}
        <Text style={styles.price}>
          {item.target_price != null ? `$${Number(item.target_price).toFixed(2)}` : 'No target price'}
          {item.category ? `  ·  ${item.category}` : ''}
        </Text>
        {item.source_url ? (
          <PressScale onPress={() => openExternal(item.source_url!)} style={{ marginTop: spacing.sm }}>
            <Text style={styles.link}>View original listing</Text>
          </PressScale>
        ) : null}

        <View style={styles.targetRow}>
          <TextInput
            style={styles.targetInput}
            placeholder="Target price ($)"
            placeholderTextColor={colors.ink.tertiary}
            keyboardType="decimal-pad"
            value={target}
            onChangeText={setTarget}
          />
          <Button label="Set target" onPress={saveTarget} variant="secondary" />
        </View>

        <Button
          label={item.status === 'purchased' ? 'Move back to wanted' : 'Mark as purchased'}
          onPress={toggleStatus}
          variant="tertiary"
          style={{ marginTop: spacing.md }}
        />

        <View style={styles.altHeader}>
          <Text style={styles.altTitle}>Better-price matches</Text>
          <PressScale onPress={scan} disabled={scanning}>
            <Text style={styles.scanLink}>{scanning ? 'Finding matches…' : 'Scan again'}</Text>
          </PressScale>
        </View>
        {scanning ? <CardSkeleton /> : null}
        {!scanning && alts.length === 0 ? (
          <Text style={styles.emptyAlts}>No matches yet — tap “Scan again” and we’ll check retailers for this exact item.</Text>
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
                  <Text style={styles.altRetailer}>{a.retailer ?? 'Retailer'}</Text>
                  <Text style={styles.altName} numberOfLines={2}>
                    {a.title ?? item.name}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.altPrice}>{a.price != null ? `$${Number(a.price).toFixed(2)}` : '—'}</Text>
                  {reachable ? <Text style={styles.altOpen}>{copy.wishlist.viewDeal}</Text> : null}
                </View>
              </PressScale>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: { ...type.titleMD, color: colors.ink.primary, flex: 1, textAlign: 'center' },
  scroll: { padding: spacing.screen, paddingBottom: spacing.xxl },
  photo: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.bg.surfaceWarm },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  price: { ...type.titleSM, color: colors.ink.primary, marginTop: spacing.md },
  link: { ...type.bodyMD, color: colors.accent.terracotta },
  targetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'center' },
  targetInput: {
    flex: 1,
    ...type.bodyMD,
    color: colors.ink.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
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
    backgroundColor: colors.bg.surface,
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
  altRetailer: { ...type.labelCaps, color: colors.ink.tertiary },
  altName: { ...type.bodySM, color: colors.ink.primary },
  altPrice: { ...type.titleSM, color: colors.accent.terracotta },
  altOpen: { ...type.caption, color: colors.ink.tertiary, marginTop: 2 },
});
