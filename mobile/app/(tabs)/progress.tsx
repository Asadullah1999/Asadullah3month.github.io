import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useFoodStore } from '../../store/useFoodStore';
import { useWaterStore } from '../../store/useWaterStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useProfileStore } from '../../store/useProfileStore';
import { Card } from '../../components/ui/Card';
import { calculateBMI, getBMICategory } from '../../constants/Nutrition';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_WIDTH = SCREEN_WIDTH - 120;

type Period = '7d' | '30d';

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function shortLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function ProgressScreen() {
  const [period, setPeriod] = useState<Period>('7d');
  const { getMealsByDate } = useFoodStore();
  const { getIntakeByDate } = useWaterStore();
  const { getWorkoutsByDate } = useWorkoutStore();
  const { profile, weightHistory, sleepHistory, getBMI } = useProfileStore();

  const days = period === '7d' ? getLast7Days() : getLast30Days();

  const calorieData = days.map((date) => {
    const meals = getMealsByDate(date);
    const cals = meals.reduce((sum, m) => sum + m.foodItem.calories * m.quantity, 0);
    return { date, value: Math.round(cals) };
  });

  const waterData = days.map((date) => ({
    date,
    value: getIntakeByDate(date),
  }));

  const workoutData = days.map((date) => {
    const w = getWorkoutsByDate(date);
    return { date, value: w.reduce((sum, e) => sum + e.caloriesBurned, 0) };
  });

  const maxCalories = Math.max(...calorieData.map((d) => d.value), profile.dailyCalorieTarget);
  const maxWater = Math.max(...waterData.map((d) => d.value), profile.dailyWaterTarget);
  const maxWorkout = Math.max(...workoutData.map((d) => d.value), 500);

  const avgCalories = calorieData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) /
    (calorieData.filter((d) => d.value > 0).length || 1);
  const avgWater = waterData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) /
    (waterData.filter((d) => d.value > 0).length || 1);

  const bmi = getBMI();
  const bmiInfo = getBMICategory(bmi);

  const recentWeight = weightHistory.slice(-7);

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Progress</Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodBtn, period === '7d' && styles.periodBtnActive]}
                onPress={() => setPeriod('7d')}
              >
                <Text style={[styles.periodLabel, period === '7d' && styles.periodLabelActive]}>7D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, period === '30d' && styles.periodBtnActive]}
                onPress={() => setPeriod('30d')}
              >
                <Text style={[styles.periodLabel, period === '30d' && styles.periodLabelActive]}>30D</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <SummaryCard
              icon="restaurant-outline"
              label="Avg Calories"
              value={Math.round(avgCalories)}
              unit="kcal"
              target={profile.dailyCalorieTarget}
              color={Colors.calories}
            />
            <SummaryCard
              icon="water-outline"
              label="Avg Water"
              value={Math.round(avgWater)}
              unit="ml"
              target={profile.dailyWaterTarget}
              color={Colors.water}
            />
          </View>

          {/* BMI Card */}
          <Card>
            <Text style={styles.sectionTitle}>Body Mass Index</Text>
            <View style={styles.bmiRow}>
              <View style={styles.bmiLeft}>
                <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi}</Text>
                <Text style={[styles.bmiCategory, { color: bmiInfo.color }]}>{bmiInfo.category}</Text>
              </View>
              <View style={styles.bmiRight}>
                <BmiBar bmi={bmi} />
                <View style={styles.bmiLabels}>
                  <Text style={styles.bmiLabel}>Under</Text>
                  <Text style={styles.bmiLabel}>Normal</Text>
                  <Text style={styles.bmiLabel}>Over</Text>
                  <Text style={styles.bmiLabel}>Obese</Text>
                </View>
              </View>
            </View>
            <View style={styles.bmiStats}>
              <BmiStat label="Height" value={`${profile.height} cm`} />
              <BmiStat label="Weight" value={`${profile.currentWeight} kg`} />
              <BmiStat label="Target" value={`${profile.targetWeight} kg`} />
            </View>
          </Card>

          {/* Calorie Chart */}
          <Card>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Calories</Text>
              <Text style={styles.targetLabel}>Target: {profile.dailyCalorieTarget} kcal</Text>
            </View>
            <BarChart
              data={calorieData}
              maxValue={maxCalories}
              target={profile.dailyCalorieTarget}
              color={Colors.calories}
              period={period}
            />
          </Card>

          {/* Water Chart */}
          <Card>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Water Intake</Text>
              <Text style={styles.targetLabel}>Target: {profile.dailyWaterTarget} ml</Text>
            </View>
            <BarChart
              data={waterData}
              maxValue={maxWater}
              target={profile.dailyWaterTarget}
              color={Colors.water}
              period={period}
            />
          </Card>

          {/* Workout Calories Chart */}
          <Card>
            <Text style={styles.sectionTitle}>Calories Burned (Workouts)</Text>
            <BarChart
              data={workoutData}
              maxValue={maxWorkout}
              color={Colors.workout}
              period={period}
            />
          </Card>

          {/* Weight History */}
          {recentWeight.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Weight History</Text>
              {recentWeight.map((entry) => (
                <View key={entry.id} style={styles.weightRow}>
                  <Text style={styles.weightDate}>{shortLabel(entry.date)}</Text>
                  <View style={styles.weightBarWrap}>
                    <View
                      style={[
                        styles.weightBar,
                        {
                          width: `${(entry.weight / (profile.currentWeight * 1.2)) * 100}%`,
                          backgroundColor: entry.weight <= profile.targetWeight ? Colors.success : Colors.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weightVal}>{entry.weight} kg</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Streak */}
          <Card>
            <Text style={styles.sectionTitle}>Logging Streak</Text>
            <View style={styles.streakRow}>
              {getLast7Days().map((date) => {
                const meals = getMealsByDate(date);
                const logged = meals.length > 0;
                return (
                  <View key={date} style={styles.streakDay}>
                    <View style={[styles.streakDot, logged ? styles.streakDotActive : styles.streakDotEmpty]}>
                      {logged && <Ionicons name="checkmark" size={12} color={Colors.text} />}
                    </View>
                    <Text style={styles.streakLabel}>{dayLabel(date)}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SummaryCard({ icon, label, value, unit, target, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  unit: string;
  target?: number;
  color: string;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <View style={[sumStyles.card]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[sumStyles.value, { color }]}>{value}</Text>
      <Text style={sumStyles.unit}>{unit}</Text>
      <Text style={sumStyles.label}>{label}</Text>
      {pct !== null && <Text style={sumStyles.pct}>{pct}% of goal</Text>}
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  value: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  unit: { fontSize: 11, color: Colors.textMuted },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  pct: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});

function BarChart({ data, maxValue, target, color, period }: {
  data: { date: string; value: number }[];
  maxValue: number;
  target?: number;
  color: string;
  period: Period;
}) {
  const showLabels = period === '7d';
  const barWidth = showLabels ? Math.floor((SCREEN_WIDTH - 80) / data.length) - 4 : Math.floor((SCREEN_WIDTH - 80) / data.length) - 2;
  const maxH = 100;

  return (
    <View style={chartStyles.wrap}>
      <View style={chartStyles.bars}>
        {data.map((d) => {
          const h = maxValue > 0 ? Math.max(4, (d.value / maxValue) * maxH) : 4;
          const meetsTarget = target ? d.value >= target : true;
          return (
            <View key={d.date} style={[chartStyles.barWrap, { width: barWidth }]}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: h,
                    backgroundColor: meetsTarget ? color : color + '70',
                    width: barWidth - 2,
                  },
                ]}
              />
              {showLabels && (
                <Text style={chartStyles.barLabel}>{dayLabel(d.date)}</Text>
              )}
            </View>
          );
        })}
      </View>
      {target && (
        <View style={[chartStyles.targetLine, { bottom: (target / maxValue) * maxH + 16 }]}>
          <View style={chartStyles.targetDash} />
        </View>
      )}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { marginTop: 8, position: 'relative' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 116 },
  barWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  targetLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  targetDash: { height: 1, backgroundColor: Colors.textMuted, opacity: 0.5 },
});

function BmiBar({ bmi }: { bmi: number }) {
  const clampedBmi = Math.min(40, Math.max(10, bmi));
  const pct = ((clampedBmi - 10) / 30) * 100;
  return (
    <View style={bmiStyles.wrap}>
      <View style={bmiStyles.track}>
        <View style={[bmiStyles.segment, { backgroundColor: '#74B9FF' }]} />
        <View style={[bmiStyles.segment, { backgroundColor: '#00B894' }]} />
        <View style={[bmiStyles.segment, { backgroundColor: '#FDCB6E' }]} />
        <View style={[bmiStyles.segment, { backgroundColor: '#FF6B6B' }]} />
      </View>
      <View style={[bmiStyles.marker, { left: `${pct}%` as any }]} />
    </View>
  );
}

const bmiStyles = StyleSheet.create({
  wrap: { position: 'relative', marginVertical: 8 },
  track: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  segment: { flex: 1 },
  marker: { position: 'absolute', top: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.text, borderWidth: 2, borderColor: Colors.background, transform: [{ translateX: -9 }] },
});

function BmiStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bmiStatItem}>
      <Text style={styles.bmiStatLabel}>{label}</Text>
      <Text style={styles.bmiStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  periodToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 2, borderWidth: 1, borderColor: Colors.border },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },
  periodLabelActive: { color: Colors.text },
  summaryRow: { flexDirection: 'row', gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetLabel: { fontSize: 12, color: Colors.textMuted },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  bmiLeft: { alignItems: 'center' },
  bmiValue: { fontSize: 36, fontWeight: '900' },
  bmiCategory: { fontSize: 13, fontWeight: '700' },
  bmiRight: { flex: 1 },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  bmiLabel: { fontSize: 9, color: Colors.textMuted },
  bmiStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  bmiStatItem: { alignItems: 'center' },
  bmiStatLabel: { fontSize: 11, color: Colors.textMuted },
  bmiStatValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  weightDate: { width: 50, fontSize: 11, color: Colors.textMuted },
  weightBarWrap: { flex: 1, height: 10, backgroundColor: Colors.surfaceLight, borderRadius: 5, overflow: 'hidden' },
  weightBar: { height: '100%', borderRadius: 5 },
  weightVal: { width: 50, fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakDay: { alignItems: 'center', gap: 6 },
  streakDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  streakDotActive: { backgroundColor: Colors.primary },
  streakDotEmpty: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  streakLabel: { fontSize: 10, color: Colors.textMuted },
});
