import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { PressScale } from '../../components/PressScale';
import { useApp } from '../../lib/AppContext';
import { copy } from '../../lib/copy';
import {
  deleteWishlistItem,
  findAlternatives,
  updateWishlistItem,
  type DealAlternative,
  type WishlistItem,
} from '../../lib/db';
import { colors, spacing, type } from '../../lib/theme';
import { track } from '../../lib/events';

/**
 * External links leave the app exactly how a careful parent expects:
 * a small "Open this link?" confirmation naming where they're headed
 * (Luis QA — previously taps failed silently on scheme-less URLs).
 */
function openExternal(url: string, retailer?: string | null) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const m = /^https?:\/\/([^/]+)/i.exec(normalized);
  const host = (m?.[1] ?? normalized).replace(/^www\./, '');
  Alert.alert(copy.wishlist.openLinkTitle, `${retailer ? `${retailer} — ` : ''}${host}`, [
    { text: copy.wishlist.openLinkCancel, style: 'cancel' },
    {
      text: copy.wishlist.openLinkConfirm,
      onPress: () =>
        Linking.openURL(normalized).catch(() =>
          Alert.alert(copy.wishlist.openLinkError, normalized),
        ),
    },
  ]);
}

export default function WishlistDetail() {
  const router = useRouter();
  const { item: raw } = useLocalSearchParams<{ item: string }>();
  const { refreshWishlist } = useApp();
  const [item, setItem] = useState<WishlistItem | null>(() => {
    try {
      return raw ? (JSON.parse(raw) as WishlistItem) : null;
    } catch {
      return null;
    }
  });
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [deals, setDeals] = useState<DealAlternative[]>(item?.alternatives ?? []);
  const [hunting, setHunting] = useState(false);

  useEffect(() => {
    if (item && deals.length === 0) void hunt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hunt = async () => {
    if (!item) return;
    setHunting(true);
    try {
      const found = await findAlternatives(item);
      setDeals(found);
    } catch {
      // Silent: the deals section simply stays empty; the item itself is what matters.
    } finally {
      setHunting(false);
    }
  };

  const saveNotes = async () => {
    if (!item) return;
    try {
      await updateWishlistItem(item.id, { notes });
      await refreshWishlist();
    } catch {
      Alert.alert(copy.global.error);
    }
  };

  const toggleBought = async () => {
    if (!item) return;
    try {
      await updateWishlistItem(item.id, { status: item.status === 'bought' ? 'wanted' : 'bought' });
      await refreshWishlist();
      router.back();
    } catch {
      Alert.alert(copy.global.error);
    }
  };

  const remove = () => {
    if (!item) return;
    Alert.alert(copy.global.deleteConfirm, undefined, [
      { text: copy.global.keepIt, style: 'cancel' },
      {
        text: copy.global.letItGo,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWishlistItem(item.id);
            await refreshWishlist();
            router.back();
          } catch {
            Alert.alert(copy.global.error);
          }
        },
      },
    ]);
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>This item wandered off.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <PressScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-down" size={26} color={colors.ink.secondary} />
        </PressScale>
        <PressScale onPress={remove} hitSlop={8}>
          <Ionicons name="trash-outline" size={22} color={colors.ink.tertiary} />
        </PressScale>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.name}>{item.name}</Text>
        {item.price_estimate != null ? (
          <Text style={styles.price}>${Number(item.price_estimate).toFixed(0)}</Text>
        ) : null}

        {item.source_url ? (
          <PressScale onPress={() => openExternal(item.source_url!)} style={{ marginTop: spacing.sm }}>
            <Text style={styles.link}>View where you found it</Text>
          </PressScale>
        ) : null}

        <Card style={{ marginTop: spacing.xl }}>
          <Text style={styles.cardLabel}>NOTES</Text>
          <Text style={styles.notesPlaceholder}>{notes || 'Which color? Which size? Who mentioned it?'}</Text>
          <Button label="Save notes" variant="secondary" onPress={saveNotes} style={{ marginTop: spacing.md }} />
        </Card>

        <View style={styles.dealsHead}>
          <Text style={styles.dealsTitle}>Lookalikes &amp; deals</Text>
          {hunting ? <Text style={styles.hunting}>{copy.global.findingAlternatives}…</Text> : null}
        </View>
        {deals.map((a, i) => {
          const openable = Boolean(a.url);
          return (
            <PressScale
              key={i}
              style={{ marginTop: spacing.md }}
              disabled={!openable}
              onPress={() => {
                if (!a.url) return;
                track('deal_open', { item: item.id, retailer: a.retailer, price: a.price });
                openExternal(a.url, a.retailer);
              }}
            >
              <Card>
                <View style={styles.dealRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dealName}>{a.name}</Text>
                    <Text style={styles.dealMeta}>
                      {a.retailer ?? '—'}
                      {a.similarity ? ` · ${a.similarity}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.dealPrice}>{a.price != null ? `$${Number(a.price).toFixed(0)}` : ''}</Text>
                </View>
                {openable ? <Text style={styles.dealCta}>{copy.wishlist.viewDeal}</Text> : null}
              </Card>
            </PressScale>
          );
        })}

        <Button
          label={item.status === 'bought' ? 'Mark as still wanted' : 'We got it'}
          onPress={toggleBought}
          variant={item.status === 'bought' ? 'secondary' : 'primary'}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  missing: { ...type.bodyMD, color: colors.ink.secondary, textAlign: 'center', marginTop: 120 },
  name: { ...type.displayLG, color: colors.ink.primary },
  price: { ...type.titleLG, color: colors.accent.terracotta, marginTop: spacing.xs },
  link: { ...type.titleSM, color: colors.sage.primary, textDecorationLine: 'underline' },
  cardLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  notesPlaceholder: { ...type.bodyMD, color: colors.ink.secondary, marginTop: spacing.sm },
  dealsHead: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  dealsTitle: { ...type.titleLG, color: colors.ink.primary },
  hunting: { ...type.caption, color: colors.ink.tertiary },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dealName: { ...type.titleMD, color: colors.ink.primary },
  dealMeta: { ...type.caption, color: colors.ink.tertiary, marginTop: 2 },
  dealPrice: { ...type.titleLG, color: colors.accent.terracotta },
  dealCta: { ...type.labelCaps, color: colors.sage.primary, marginTop: spacing.sm },
});
