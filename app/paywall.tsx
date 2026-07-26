import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
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
import { colors, radius, spacing, type } from '../lib/theme';

const TERMS_URL = 'https://bloom.conduitai.io/terms.html';
const PRIVACY_URL = 'https://bloom.conduitai.io/privacy.html';
const EXIT_OFFER_KEY = 'bloom.exitOfferShown.v1';

/**
 * The Bloom paywall — a keepsake page built to convert (Luis: "immersive,
 * beautiful, high-converting — free vs paid, what's included and what isn't").
 * Backing out without purchasing offers a one-time, once-ever before-you-go
 * card: a real launch-discount package when one is configured in RevenueCat,
 * honest launch-pricing urgency otherwise. Never nagware — it shows once,
 * and dismissal is always one tap and never guilted.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { week } = useApp();
  const { devMode, pregnancyPass, plus, refresh } = useEntitlement();
  const [offerings, setOfferings] = useState<PassOfferings | null>(null);
  const [busyPass, setBusyPass] = useState(false);
  const [busyPlus, setBusyPlus] = useState(false);
  const [busyRestore, setBusyRestore] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    if (devMode) return;
    fetchPassOfferings().then(setOfferings);
  }, [devMode]);

  const passPrice = offerings?.passPrice ?? '$49.99';
  const plusPrice = offerings?.plusPrice ?? '$4.99';

  const afterPurchase = async (title: string, body?: string) => {
    await refresh();
    Alert.alert(title, body, [{ text: 'Begin', onPress: () => router.back() }]);
  };

  const buyPass = async (useLaunch = false) => {
    setBusyPass(true);
    try {
      const pkg = useLaunch ? offerings?.launchPackage ?? offerings?.passPackage ?? null : offerings?.passPackage ?? null;
      const result = await purchasePackage(pkg);
      if (result.outcome === 'success') {
        await afterPurchase(copy.paywall.welcome, copy.paywall.welcomeBody);
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
        await afterPurchase(copy.paywall.plusActive);
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

  /**
   * Leaving without the Pass? Offer the before-you-go card — once ever, and
   * never in dev mode or when she already owns it.
   */
  const attemptExit = () => {
    if (pregnancyPass || devMode) {
      router.back();
      return;
    }
    void (async () => {
      const seen = await AsyncStorage.getItem(EXIT_OFFER_KEY).catch(() => '1');
      if (seen) {
        router.back();
        return;
      }
      await AsyncStorage.setItem(EXIT_OFFER_KEY, '1').catch(() => {});
      setExitOpen(true);
    })();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <PressScale onPress={attemptExit} hitSlop={8} accessibilityLabel={copy.paywall.maybeLater}>
          <Ionicons name="close" size={26} color={colors.ink.secondary} />
        </PressScale>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeIn index={0}>
          <WeekArt week={week ?? 20} height={180} />
          <Text style={styles.eyebrow}>{copy.paywall.eyebrow}</Text>
          <Text style={styles.headline}>{copy.paywall.headline}</Text>
          <Text style={styles.subline}>{copy.paywall.subline}</Text>
        </FadeIn>

        {/* Free vs Pass — exactly what's included, and what isn't */}
        <FadeIn index={1}>
          <Text style={styles.compareEyebrow}>{copy.paywall.compareEyebrow}</Text>
          <Card style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <View style={{ flex: 1 }} />
              <Text style={styles.compareColFree}>{copy.paywall.compareFree}</Text>
              <Text style={styles.compareColPass}>{copy.paywall.comparePass}</Text>
            </View>
            {copy.paywall.compareRows.map((row, ri) => (
              <View key={row.text} style={[styles.compareRow, ri > 0 && styles.compareRowBorder]}>
                <Text style={styles.compareText}>{row.text}</Text>
                <View style={styles.compareCellFree}>
                  {row.free === true ? (
                    <Ionicons name="checkmark" size={16} color={colors.sage.primary} />
                  ) : row.free === false ? (
                    <Text style={styles.compareDash}>—</Text>
                  ) : (
                    <Text style={styles.compareLimit}>{row.free}</Text>
                  )}
                </View>
                <View style={styles.compareCellPass}>
                  {row.pass === true ? (
                    <Ionicons name="checkmark" size={16} color={colors.accent.terracotta} />
                  ) : (
                    <Text style={styles.compareLimitPass}>{row.pass}</Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </FadeIn>

        {/* The Pass — hero plan */}
        <FadeIn index={2}>
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
            <View style={styles.heroWrap}>
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>{copy.paywall.bestValue}</Text>
              </View>
              <Card style={styles.heroCard}>
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
                  onPress={() => buyPass(false)}
                  loading={busyPass}
                  disabled={devMode}
                  style={{ marginTop: spacing.lg }}
                />
                <Text style={styles.caption}>{copy.paywall.passCaption}</Text>
              </Card>
            </View>
          )}
        </FadeIn>

        {/* Bloom Plus — secondary, optional, for after the baby arrives */}
        <FadeIn index={3}>
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
        </FadeIn>

        <FadeIn index={4}>
          <PressScale onPress={restore} disabled={busyRestore} hitSlop={8} style={styles.restoreRow}>
            <Text style={styles.restoreText}>{busyRestore ? 'Restoring…' : copy.paywall.restore}</Text>
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

          <PressScale onPress={attemptExit} hitSlop={8} style={styles.laterRow}>
            <Text style={styles.laterText}>{copy.paywall.maybeLater}</Text>
          </PressScale>
        </FadeIn>
      </ScrollView>

      {exitOpen ? (
        <ExitOfferCard
          launchPrice={offerings?.launchPrice ?? null}
          passPrice={passPrice}
          busy={busyPass}
          onAccept={() => buyPass(true)}
          onDecline={() => {
            setExitOpen(false);
            router.back();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/**
 * The before-you-go card: warm, specific, one-time. Real launch discount when
 * the SKU exists; honest urgency when it doesn't. Springs up over a soft scrim.
 */
function ExitOfferCard({
  launchPrice,
  passPrice,
  busy,
  onAccept,
  onDecline,
}: {
  launchPrice: string | null;
  passPrice: string;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const offer = launchPrice != null;
  const title = offer ? copy.paywall.exitOfferTitle : copy.paywall.exitUrgencyTitle;
  const body = offer
    ? copy.paywall.exitOfferBody(launchPrice, passPrice)
    : copy.paywall.exitUrgencyBody(passPrice);

  return (
    <View style={styles.exitOverlay}>
      <Animated.View style={[styles.exitScrim, { opacity: progress }]} />
      <Animated.View style={[styles.exitCard, { opacity: progress, transform: [{ scale }] }]}>
        <Text style={styles.exitEyebrow}>{copy.paywall.exitEyebrow}</Text>
        <Text style={styles.exitTitle}>{title}</Text>
        {offer ? (
          <View style={styles.exitPriceRow}>
            <Text style={styles.exitPriceNew}>{launchPrice}</Text>
            <Text style={styles.exitPriceOld}>{passPrice}</Text>
          </View>
        ) : null}
        <Text style={styles.exitBody}>{body}</Text>
        <Button label={copy.paywall.exitCta(launchPrice ?? passPrice)} onPress={onAccept} loading={busy} />
        <PressScale onPress={onDecline} hitSlop={8} style={styles.exitDismiss}>
          <Text style={styles.exitDismissText}>{copy.paywall.exitDismiss}</Text>
        </PressScale>
      </Animated.View>
    </View>
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
  compareEyebrow: { ...type.labelCaps, color: colors.ink.tertiary, marginTop: spacing.xxl, marginBottom: spacing.sm },
  compareCard: { paddingVertical: spacing.sm },
  compareHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.xs },
  compareColFree: { ...type.labelCaps, color: colors.ink.tertiary, width: 64, textAlign: 'center' },
  compareColPass: { ...type.labelCaps, color: colors.accent.terracotta, width: 72, textAlign: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  compareRowBorder: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  compareText: { ...type.bodySM, color: colors.ink.primary, flex: 1, paddingRight: spacing.sm },
  compareCellFree: { width: 64, alignItems: 'center' },
  compareCellPass: { width: 72, alignItems: 'center' },
  compareDash: { ...type.bodySM, color: colors.ink.tertiary },
  compareLimit: { ...type.caption, color: colors.ink.tertiary },
  compareLimitPass: { ...type.caption, color: colors.accent.terracottaDeep, fontWeight: '600' },
  heroWrap: { marginTop: spacing.xl },
  ribbon: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ribbonText: { ...type.labelCaps, color: colors.accent.onAccent },
  heroCard: { borderWidth: 1.5, borderColor: colors.accent.terracotta },
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
  exitOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
  },
  exitScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay.scrim },
  exitCard: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  exitEyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  exitTitle: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  exitPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.md },
  exitPriceNew: { ...type.displayLG, color: colors.accent.terracotta },
  exitPriceOld: { ...type.titleMD, color: colors.ink.tertiary, textDecorationLine: 'line-through' },
  exitBody: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.md, marginBottom: spacing.lg },
  exitDismiss: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.xs },
  exitDismissText: { ...type.bodySM, color: colors.ink.tertiary },
});
