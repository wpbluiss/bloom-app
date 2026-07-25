import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PressScale } from '../components/PressScale';
import { WeekArt } from '../components/WeekArt';
import { useApp } from '../lib/AppContext';
import { copy } from '../lib/copy';
import { useEntitlement } from '../lib/entitlements';
import {
  PassOfferings,
  fetchPassOfferings,
  purchasePackage,
  restorePurchases,
} from '../lib/revenuecat';
import { colors, spacing, type } from '../lib/theme';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://conduitai.io/bloom/privacy';

/**
 * The Bloom paywall — a keepsake page, not a wall. The free habit layer is
 * never mentioned as "missing"; the Pass is framed as the way to keep more of
 * what they already love. Dismissal is always one tap and never guilted.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { week } = useApp();
  const { devMode, pregnancyPass, plus, refresh } = useEntitlement();
  const [offerings, setOfferings] = useState<PassOfferings | null>(null);
  const [busyPass, setBusyPass] = useState(false);
  const [busyPlus, setBusyPlus] = useState(false);
  const [busyRestore, setBusyRestore] = useState(false);

  useEffect(() => {
    if (devMode) return;
    fetchPassOfferings().then(setOfferings);
  }, [devMode]);

  const buyPass = async () => {
    setBusyPass(true);
    try {
      const result = await purchasePackage(offerings?.passPackage ?? null);
      if (result.outcome === 'success') {
        await refresh();
        Alert.alert(copy.paywall.welcome, copy.paywall.welcomeBody, [
          { text: 'Begin', onPress: () => router.back() },
        ]);
      } else if (result.outcome === 'error') {
        Alert.alert(copy.global.error);
      } else if (result.outcome === 'unavailable') {
        Alert.alert(copy.paywall.devNote);
      }
      // 'cancelled' — she simply changed her mind; say nothing.
    } finally {
      setBusyPass(false);
    }
  };

  const buyPlus = async () => {
    setBusyPlus(true);
    try {
      const result = await purchasePackage(offerings?.plusPackage ?? null);
      if (result.outcome === 'success') {
        await refresh();
        Alert.alert(copy.paywall.plusActive, undefined, [
          { text: 'Lovely', onPress: () => router.back() },
        ]);
      } else if (result.outcome === 'error') {
        Alert.alert(copy.global.error);
      } else if (result.outcome === 'unavailable') {
        Alert.alert(copy.paywall.devNote);
      }
    } finally {
      setBusyPlus(false);
    }
  };

  const restore = async () => {
    setBusyRestore(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        Alert.alert(copy.paywall.devNote);
        return;
      }
      await refresh();
      const any = restored.pregnancyPass || restored.plus || restored.memoryBook;
      Alert.alert(any ? copy.paywall.restoreDone : copy.paywall.restoreNone);
    } finally {
      setBusyRestore(false);
    }
  };

  const passPrice = offerings?.passPrice ?? '$49.99';
  const plusPrice = offerings?.plusPrice ?? '$4.99';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <PressScale onPress={() => router.back()} hitSlop={8} accessibilityLabel={copy.paywall.maybeLater}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WeekArt week={week ?? 20} height={180} />

        <Text style={styles.eyebrow}>{copy.paywall.eyebrow}</Text>
        <Text style={styles.headline}>{copy.paywall.headline}</Text>
        <Text style={styles.subline}>{copy.paywall.subline}</Text>

        {pregnancyPass ? (
          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.activeRow}>
              <View style={styles.activeIcon}>
                <Ionicons name="heart" size={20} color={colors.accent.terracotta} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{copy.paywall.passActive}</Text>
                <Text style={styles.cardBody}>{copy.paywall.passActiveBody}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.xl }}>
            {copy.paywall.bullets.map((b) => (
              <View key={b.icon} style={styles.bulletRow}>
                <View style={styles.bulletIcon}>
                  <Ionicons
                    name={b.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={colors.accent.terracottaDeep}
                  />
                </View>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            ))}
            <Button
              label={copy.paywall.passCta(passPrice)}
              onPress={buyPass}
              loading={busyPass}
              disabled={devMode}
              style={{ marginTop: spacing.lg }}
            />
            <Text style={styles.caption}>{copy.paywall.passCaption}</Text>
          </Card>
        )}

        {/* Bloom Plus — secondary, optional, for after the baby arrives */}
        <Card style={{ marginTop: spacing.xl }}>
          <Text style={styles.plusEyebrow}>{copy.paywall.plusEyebrow}</Text>
          <Text style={styles.cardTitle}>{copy.paywall.plusTitle}</Text>
          <Text style={styles.cardBody}>{copy.paywall.plusBody}</Text>
          {plus ? (
            <View style={styles.plusActiveRow}>
              <Ionicons name="checkmark" size={14} color={colors.sage.primary} />
              <Text style={styles.plusActiveText}>{copy.paywall.plusActive}</Text>
            </View>
          ) : (
            <Button
              label={copy.paywall.plusCta(plusPrice)}
              variant="secondary"
              onPress={buyPlus}
              loading={busyPlus}
              disabled={devMode}
              style={{ marginTop: spacing.lg }}
            />
          )}
        </Card>

        <PressScale onPress={restore} disabled={busyRestore} hitSlop={8} style={styles.restoreRow}>
          <Text style={styles.restoreText}>{copy.paywall.restore}</Text>
        </PressScale>

        <View style={styles.legalRow}>
          <PressScale onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>{copy.paywall.terms}</Text>
          </PressScale>
          <View style={styles.legalDot} />
          <PressScale onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>{copy.paywall.privacy}</Text>
          </PressScale>
        </View>

        {devMode ? <Text style={styles.devNote}>{copy.paywall.devNote}</Text> : null}

        <PressScale onPress={() => router.back()} hitSlop={8} style={styles.laterRow}>
          <Text style={styles.laterText}>{copy.paywall.maybeLater}</Text>
        </PressScale>
      </ScrollView>
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
  scroll: { padding: spacing.screen, paddingBottom: spacing.hero },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta, marginTop: spacing.xl, textAlign: 'center' },
  headline: { ...type.displayLG, color: colors.ink.primary, marginTop: spacing.sm, textAlign: 'center' },
  subline: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.md, textAlign: 'center' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: { ...type.bodySM, color: colors.ink.secondary, flex: 1, marginTop: 4 },
  cardTitle: { ...type.titleMD, color: colors.ink.primary },
  cardBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  activeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { ...type.caption, color: colors.ink.tertiary, marginTop: spacing.md, textAlign: 'center' },
  plusEyebrow: { ...type.labelCaps, color: colors.sage.primary },
  plusActiveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  plusActiveText: { ...type.labelMD, color: colors.sage.primary },
  restoreRow: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.xl },
  restoreText: { ...type.titleSM, color: colors.accent.terracotta },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legalLink: { ...type.caption, color: colors.ink.tertiary, textDecorationLine: 'underline' },
  legalDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border.strong },
  devNote: { ...type.caption, color: colors.ink.tertiary, textAlign: 'center', marginTop: spacing.lg },
  laterRow: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm },
  laterText: { ...type.bodySM, color: colors.ink.tertiary },
});
