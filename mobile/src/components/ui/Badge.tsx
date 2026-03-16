import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../lib/colors';

interface BadgeProps {
  label: string;
  variant?: 'green' | 'cyan' | 'violet' | 'amber' | 'red' | 'gray';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'green', style }: BadgeProps) {
  const variantStyles = {
    green: { bg: 'rgba(34,197,94,0.15)', text: colors.primary },
    cyan: { bg: 'rgba(6,182,212,0.15)', text: colors.secondary },
    violet: { bg: 'rgba(139,92,246,0.15)', text: colors.accent },
    amber: { bg: 'rgba(245,158,11,0.15)', text: colors.warning },
    red: { bg: 'rgba(239,68,68,0.15)', text: colors.danger },
    gray: { bg: colors.bgInput, text: colors.textMuted },
  };
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
