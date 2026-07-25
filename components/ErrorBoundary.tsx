import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { reportError } from '../lib/errorReporting';
import { colors, spacing, type } from '../lib/theme';

interface State {
  hasError: boolean;
}

/**
 * Last-resort crash screen — soft, on-brand, and it phones home first
 * (error_reports). Wraps the root navigator; a render crash anywhere shows
 * this instead of a white screen.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    reportError(error, { source: 'boundary' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Bloom stumbled for a moment.</Text>
          <Text style={styles.body}>
            Everything you kept is safe. Close the app and come right back — we already know about this one.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.hero,
  },
  title: { ...type.displayMD, color: colors.ink.primary, textAlign: 'center' },
  body: {
    ...type.bodyMD,
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 320,
  },
});
