import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
  totalCalories: number;
}

export function MacroBar({ protein, carbs, fat, totalCalories }: MacroBarProps) {
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const total = proteinCals + carbsCals + fatCals || 1;

  const proteinPct = (proteinCals / total) * 100;
  const carbsPct = (carbsCals / total) * 100;
  const fatPct = (fatCals / total) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Macronutrients</Text>
      <View style={styles.bar}>
        <View style={[styles.segment, { flex: proteinPct, backgroundColor: Colors.protein }]} />
        <View style={[styles.segment, { flex: carbsPct, backgroundColor: Colors.carbs }]} />
        <View style={[styles.segment, { flex: fatPct, backgroundColor: Colors.fat }]} />
      </View>
      <View style={styles.legend}>
        <MacroLegendItem color={Colors.protein} label="Protein" value={`${Math.round(protein)}g`} />
        <MacroLegendItem color={Colors.carbs} label="Carbs" value={`${Math.round(carbs)}g`} />
        <MacroLegendItem color={Colors.fat} label="Fat" value={`${Math.round(fat)}g`} />
      </View>
    </View>
  );
}

function MacroLegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  legendValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
});
