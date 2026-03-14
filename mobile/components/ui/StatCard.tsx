import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  gradient: string[];
  progress?: number; // 0 to 1
  style?: ViewStyle;
}

export function StatCard({ icon, label, value, unit, gradient, progress, style }: StatCardProps) {
  return (
    <LinearGradient
      colors={gradient as [string, string]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.top}>
        <Ionicons name={icon} size={22} color="rgba(255,255,255,0.9)" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unit: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
});
