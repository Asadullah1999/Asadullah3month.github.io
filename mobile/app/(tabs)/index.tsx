import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../constants/Colors';
import { useFoodStore } from '../../store/useFoodStore';
import { useWaterStore } from '../../store/useWaterStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useProfileStore } from '../../store/useProfileStore';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { MacroBar } from '../../components/ui/MacroBar';

const WATER_QUICK_ADD = [150, 250, 350, 500];

export default function DashboardScreen() {
  const { getTodayCalories, getTodayMacros } = useFoodStore();
  const { getTodayIntake, addWater } = useWaterStore();
  const { getTodayCaloriesBurned } = useWorkoutStore();
  const { profile, steps } = useProfileStore();

  const caloriesConsumed = getTodayCalories();
  const caloriesBurned = getTodayCaloriesBurned();
  const netCalories = caloriesConsumed - caloriesBurned;
  const waterIntake = getTodayIntake();
  const macros = getTodayMacros();

  const calProgress = Math.min(1, netCalories / profile.dailyCalorieTarget);
  const waterProgress = Math.min(1, waterIntake / profile.dailyWaterTarget);
  const stepsProgress = Math.min(1, steps / profile.dailyStepsTarget);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{profile.name} 👋</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calorie Ring */}
          <Card style={styles.calorieCard}>
            <Text style={styles.sectionTitle}>Daily Calories</Text>
            <View style={styles.ringRow}>
              <ProgressRing
                size={140}
                progress={calProgress}
                color={Colors.primaryLight}
                strokeWidth={12}
                label={String(Math.round(netCalories))}
                sublabel="consumed"
              />
              <View style={styles.calDetails}>
                <CalDetail
                  icon="restaurant-outline"
                  label="Food"
                  value={`${Math.round(caloriesConsumed)} kcal`}
                  color={Colors.calories}
                />
                <CalDetail
                  icon="flame-outline"
                  label="Burned"
                  value={`${Math.round(caloriesBurned)} kcal`}
                  color={Colors.workout}
                />
                <CalDetail
                  icon="checkmark-circle-outline"
                  label="Target"
                  value={`${profile.dailyCalorieTarget} kcal`}
                  color={Colors.accent}
                />
                <CalDetail
                  icon="remove-circle-outline"
                  label="Remaining"
                  value={`${Math.max(0, profile.dailyCalorieTarget - netCalories)} kcal`}
                  color={Colors.primaryLight}
                />
              </View>
            </View>
            <MacroBar
              protein={macros.protein}
              carbs={macros.carbs}
              fat={macros.fat}
              totalCalories={caloriesConsumed}
            />
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard
              icon="water"
              label="Water"
              value={`${waterIntake}`}
              unit="ml"
              gradient={Gradients.water}
              progress={waterProgress}
              style={styles.statCardHalf}
            />
            <StatCard
              icon="footsteps"
              label="Steps"
              value={steps.toLocaleString()}
              gradient={['#FD79A8', '#E84393']}
              progress={stepsProgress}
              style={styles.statCardHalf}
            />
          </View>

          {/* Water Quick Add */}
          <Card>
            <Text style={styles.sectionTitle}>Quick Add Water</Text>
            <View style={styles.waterRow}>
              {WATER_QUICK_ADD.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.waterBtn}
                  onPress={() => addWater(amount)}
                >
                  <Ionicons name="water" size={16} color={Colors.water} />
                  <Text style={styles.waterBtnText}>{amount}ml</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.waterProgressRow}>
              <Text style={styles.waterLabel}>
                {waterIntake}ml / {profile.dailyWaterTarget}ml
              </Text>
              <Text style={styles.waterPct}>{Math.round(waterProgress * 100)}%</Text>
            </View>
          </Card>

          {/* Today's Summary */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="barbell"
              label="Workouts"
              value={String(useWorkoutStore.getState().getTodayWorkouts().length)}
              unit="sessions"
              gradient={Gradients.workout}
            />
            <StatCard
              icon="flame"
              label="Burned"
              value={String(Math.round(caloriesBurned))}
              unit="kcal"
              gradient={Gradients.calories}
            />
          </View>

          {/* Tip of the Day */}
          <Card style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
              <Text style={styles.tipTitle}>Tip of the Day</Text>
            </View>
            <Text style={styles.tipText}>
              Drinking water before meals can reduce calorie intake and help with weight management. Aim for 500ml 30 minutes before eating.
            </Text>
          </Card>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function CalDetail({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={calStyles.row}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={calStyles.label}>{label}</Text>
      <Text style={[calStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const calStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 24, fontWeight: '800', color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieCard: { gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  calDetails: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCardHalf: {},
  statsGrid: { flexDirection: 'row', gap: 12 },
  waterRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  waterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.water + '40',
  },
  waterBtnText: { fontSize: 12, color: Colors.water, fontWeight: '600' },
  waterProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  waterLabel: { fontSize: 12, color: Colors.textSecondary },
  waterPct: { fontSize: 12, color: Colors.primaryLight, fontWeight: '700' },
  tipCard: { gap: 8 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  tipText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
