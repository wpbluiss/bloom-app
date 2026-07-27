import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Button } from '../../components/Button';
import { FadeIn } from '../../components/FadeIn';
import { PressScale } from '../../components/PressScale';
import { copy } from '../../lib/copy';
import { signInWithApple, signInWithEmail, verifyOtp } from '../../lib/db';
import { colors, radius, spacing, type } from '../../lib/theme';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Apple sign-in stays hidden until the Supabase Apple provider is enabled —
  // and it must never touch the native module at startup (iOS 26 crash).
  const appleReady =
    Platform.OS === 'ios' && Constants.expoConfig?.extra?.appleSignInEnabled === true;

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email.trim().toLowerCase());
      setStage('code');
    } catch (e) {
      setError(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim());
      router.replace('/');
    } catch (e) {
      setError(copy.global.error);
    } finally {
      setBusy(false);
    }
  };

  const apple = async () => {
    if (appleBusy) return;
    setAppleBusy(true);
    setError(null);
    try {
      await signInWithApple();
      router.replace('/');
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const msg = (e as { message?: string })?.message ?? '';
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(
          msg.includes('provider is not enabled') || msg.includes('Unsupported provider')
            ? 'Apple sign-in is waking up — please use your email code today.'
            : copy.global.error
        );
      }
    } finally {
      setAppleBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeIn index={0}>
            <Text style={styles.wordmark}>{copy.welcome.wordmark}</Text>
            <Text style={styles.subline}>{copy.welcome.subline}</Text>
          </FadeIn>

          {appleReady ? (
            <FadeIn index={1}>
              <PressScale style={styles.appleButton} onPress={apple} disabled={appleBusy}>
                <Ionicons name="logo-apple" size={19} color="#FFFFFF" />
                <Text style={styles.appleLabel}>
                  {appleBusy ? 'Signing in…' : 'Continue with Apple'}
                </Text>
              </PressScale>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or with your email</Text>
                <View style={styles.divider} />
              </View>
            </FadeIn>
          ) : null}

          <FadeIn index={2}>
            <View style={styles.card}>
              {stage === 'email' ? (
                <>
                  <Text style={styles.eyebrow}>SIGN IN</Text>
                  <Text style={styles.headline}>Your email is the key.</Text>
                  <Text style={styles.helper}>
                    We'll send a gentle sign-in code — no passwords to remember.
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.ink.tertiary}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <Button
                    label="Send my code"
                    onPress={sendCode}
                    disabled={!email.includes('@')}
                    loading={busy}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.eyebrow}>CHECK YOUR INBOX</Text>
                  <Text style={styles.headline}>Enter the 6-digit code.</Text>
                  <Text style={styles.helper}>It just arrived at {email.trim()}.</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="••••••"
                    placeholderTextColor={colors.ink.tertiary}
                    keyboardType="number-pad"
                    maxLength={8}
                    value={code}
                    onChangeText={setCode}
                  />
                  <Button label="Continue" onPress={verify} disabled={code.trim().length < 6} loading={busy} />
                  <Button
                    label="Use a different email"
                    variant="tertiary"
                    onPress={() => {
                      setStage('email');
                      setCode('');
                    }}
                  />
                </>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.canvas },
  scroll: { flexGrow: 1, padding: spacing.screen, justifyContent: 'center' },
  wordmark: {
    ...type.displayXL,
    fontSize: 44,
    lineHeight: 50,
    color: colors.ink.primary,
    textAlign: 'center',
  },
  subline: {
    ...type.serifQuote,
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.section,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#000000',
    borderRadius: radius.md,
    minHeight: 50,
    marginBottom: spacing.md,
  },
  appleLabel: { ...type.titleSM, color: '#FFFFFF' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  dividerText: { ...type.caption, color: colors.ink.tertiary },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
  },
  eyebrow: { ...type.labelCaps, color: colors.accent.terracotta },
  headline: { ...type.displayMD, color: colors.ink.primary, marginTop: spacing.sm },
  helper: { ...type.bodySM, color: colors.ink.secondary, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: spacing.lg,
    height: 52,
    ...type.bodyMD,
    color: colors.ink.primary,
    marginVertical: spacing.lg,
  },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 22 },
  error: { ...type.bodySM, color: colors.status.avoid, marginTop: spacing.md, textAlign: 'center' },
});
