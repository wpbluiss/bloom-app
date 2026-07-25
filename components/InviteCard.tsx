import React, { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { PressScale } from './PressScale';
import { copy } from '../lib/copy';
import { promptForPass, useEntitlement } from '../lib/entitlements';
import { regenerateInviteCode } from '../lib/invites';
import { colors, radius, spacing, type } from '../lib/theme';

interface Props {
  code: string;
  onRegenerated?: (newCode: string) => void;
}

/**
 * The family invite code, presented like a letterpress card: big Fraunces
 * letters, native share sheet, and a quiet "new code" action (Settings).
 *
 * Partner linking is a Bloom Pregnancy Pass feature: without the entitlement,
 * sharing or regenerating a code opens a warm upgrade prompt instead. In dev
 * mode (no RevenueCat key) everyone is entitled and nothing changes.
 */
export function InviteCard({ code, onRegenerated }: Props) {
  const router = useRouter();
  const { pregnancyPass } = useEntitlement();
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (!pregnancyPass) {
      promptForPass(router, copy.paywall.gatePartner);
      return;
    }
    try {
      await Share.share({ message: copy.invite.shareMessage(code) });
    } catch {
      // user dismissed the sheet — nothing to do
    }
  };

  const regenerate = () => {
    if (!pregnancyPass) {
      promptForPass(router, copy.paywall.gatePartner);
      return;
    }
    Alert.alert(copy.invite.regenerate + '?', 'The old code stops working right away.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy.invite.regenerate,
        onPress: async () => {
          setBusy(true);
          try {
            const next = await regenerateInviteCode();
            onRegenerated?.(next);
          } catch {
            Alert.alert(copy.global.error);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Card>
      <Text style={styles.eyebrow}>{copy.invite.eyebrow}</Text>
      <Text style={styles.headline}>{copy.invite.headline}</Text>
      <Text style={styles.body}>{copy.invite.body}</Text>
      <View style={styles.codePlate}>
        <Text style={styles.codeLabel}>{copy.invite.codeLabel}</Text>
        <Text style={styles.code}>{code}</Text>
      </View>
      <View style={styles.actions}>
        <PressScale onPress={share} style={styles.shareButton}>
          <Ionicons name="share-outline" size={18} color={colors.accent.onAccent} />
          <Text style={styles.shareLabel}>{copy.invite.share}</Text>
        </PressScale>
        {onRegenerated ? (
          <PressScale onPress={regenerate} disabled={busy} hitSlop={8} style={styles.regen}>
            <Text style={styles.regenLabel}>{copy.invite.regenerate}</Text>
          </PressScale>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  headline: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  body: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  codePlate: {
    backgroundColor: colors.bg.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  codeLabel: { ...type.labelCaps, color: colors.ink.tertiary },
  code: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 36,
    letterSpacing: 8,
    color: colors.ink.primary,
    marginTop: spacing.xs,
    paddingLeft: 8, // optically recenter letter-spaced text
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.lg },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.terracotta,
    borderRadius: radius.full,
    height: 44,
    paddingHorizontal: spacing.xl,
  },
  shareLabel: { ...type.titleSM, color: colors.accent.onAccent },
  regen: { minHeight: 44, justifyContent: 'center' },
  regenLabel: { ...type.titleSM, color: colors.accent.terracotta },
});
