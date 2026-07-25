import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { pregnancyDay, stripTime } from '../lib/weeks';
import { colors, spacing, type } from '../lib/theme';
import { PressScale } from './PressScale';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface Props {
  /** ISO due date — used to know which days fall inside the pregnancy window. */
  dueDate: string;
  selected: Date;
  onSelect: (date: Date) => void;
}

/**
 * Sunday–Saturday strip for the current calendar week. Today is a filled
 * terracotta circle; other days inside the pregnancy window get a subtle
 * terracotta ring; the tapped (non-today) day gets a soft fill.
 */
export function WeekStrip({ dueDate, selected, onSelect }: Props) {
  const days = useMemo(() => {
    const today = stripTime(new Date());
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, []);

  const todayKey = stripTime(new Date()).getTime();
  const selectedKey = stripTime(selected).getTime();

  return (
    <View style={styles.row}>
      {days.map((d) => {
        const isToday = d.getTime() === todayKey;
        const isSelected = d.getTime() === selectedKey;
        const inWindow = pregnancyDay(dueDate, d) !== null;
        return (
          <PressScale
            key={d.toISOString()}
            onPress={() => onSelect(d)}
            style={styles.cell}
            accessibilityRole="button"
            accessibilityLabel={`${DAY_LABELS[d.getDay()]} ${d.getDate()}`}
          >
            <Text style={[styles.label, (isToday || isSelected) && styles.labelActive]}>
              {DAY_LABELS[d.getDay()]}
            </Text>
            <View
              style={[
                styles.circle,
                inWindow && !isToday && styles.circleWindow,
                isSelected && !isToday && styles.circleSelected,
                isToday && styles.circleToday,
              ]}
            >
              <Text
                style={[
                  styles.number,
                  isToday && styles.numberToday,
                  isSelected && !isToday && styles.numberSelected,
                ]}
              >
                {d.getDate()}
              </Text>
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  // minHeight + padding, never a fixed height — labels can't clip.
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  label: { ...type.labelCaps, fontSize: 9, letterSpacing: 1, color: colors.ink.tertiary },
  labelActive: { color: colors.accent.terracottaDeep },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWindow: { borderWidth: 1.5, borderColor: colors.accent.blush },
  circleSelected: { backgroundColor: colors.accent.terracottaSoft, borderWidth: 0 },
  circleToday: { backgroundColor: colors.accent.terracotta },
  number: { ...type.labelMD, color: colors.ink.secondary },
  numberToday: { color: colors.accent.onAccent },
  numberSelected: { color: colors.accent.terracottaDeep },
});
