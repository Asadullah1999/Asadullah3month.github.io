import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../lib/colors';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  value?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress, size = 80, strokeWidth = 6, color = colors.primary,
  label, value, sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colors.border} strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {(value || label) && (
        <View style={[styles.labelContainer, { width: size, height: size }]}>
          {value && <Text style={[styles.value, { fontSize: size * 0.18 }]}>{value}</Text>}
          {label && <Text style={[styles.label, { fontSize: size * 0.13 }]}>{label}</Text>}
          {sublabel && <Text style={[styles.sublabel, { fontSize: size * 0.11 }]}>{sublabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: colors.text, fontWeight: '700' },
  label: { color: colors.textMuted, fontWeight: '500' },
  sublabel: { color: colors.textDim },
});
