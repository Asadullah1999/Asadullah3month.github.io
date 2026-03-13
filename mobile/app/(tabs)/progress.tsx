import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { getWeekLogs, DailyLog } from '../../lib/database';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - 80) / 7 - 4;

function shortDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuthStore();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const calorieTarget = profile?.calorie_target ?? 2000;
  const waterTarget = 2500;

  async function load() {
    if (!session?.user) return;
    const data = await getWeekLogs(session.user.id);
    setLogs(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [session]);

  // Build last 7 days array (most recent last for chart)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.log_date === dateStr);
    return { date: dateStr, log };
  });

  const avgCalories = logs.length
    ? Math.round(logs.reduce((s, l) => s + (l.total_calories ?? 0), 0) / logs.length)
    : 0;
  const avgWater = logs.length
    ? Math.round(logs.reduce((s, l) => s + (l.water_ml ?? 0), 0) / logs.length)
    : 0;
  const streak = last7.filter(d => d.log && d.log.total_calories > 0).length;

  const bmi = profile?.weight_kg && profile?.height_cm
    ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
    : null;

  function bmiCategory(b: number) {
    if (b < 18.5) return { label: 'Underweight', color: Colors.info };
    if (b < 25) return { label: 'Normal', color: Colors.success };
    if (b < 30) return { label: 'Overweight', color: Colors.warning };
    return { label: 'Obese', color: Colors.danger };
  }

  const bmiCat = bmi ? bmiCategory(Number(bmi)) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSub}>Last 7 days overview</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primaryLight} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <LinearGradient colors={Colors.gradients.primary as any} style={styles.summaryCard}>
              <Ionicons name="flame" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{avgCalories}</Text>
              <Text style={styles.summaryLabel}>Avg Calories</Text>
            </LinearGradient>
            <LinearGradient colors={Colors.gradients.water as any} style={styles.summaryCard}>
              <Ionicons name="water" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{avgWater}</Text>
              <Text style={styles.summaryLabel}>Avg Water (ml)</Text>
            </LinearGradient>
            <LinearGradient colors={Colors.gradients.accent as any} style={styles.summaryCard}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{streak}/7</Text>
              <Text style={styles.summaryLabel}>Day Streak</Text>
            </LinearGradient>
          </View>

          {/* Calorie Chart */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>Daily Calories</Text>
            <Text style={styles.chartSub}>Target: {calorieTarget} kcal</Text>
            <View style={styles.barChart}>
              {last7.map(d => {
                const val = d.log?.total_calories ?? 0;
                const pct = Math.min(val / calorieTarget, 1);
                const over = val > calorieTarget;
                return (
                  <View key={d.date} style={styles.barCol}>
                    <Text style={styles.barVal}>{val > 0 ? val : ''}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { height: `${pct * 100}%` as any, backgroundColor: over ? Colors.danger : Colors.primaryLight }]} />
                    </View>
                    <Text style={styles.barDay}>{shortDay(d.date)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Water Chart */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>Water Intake</Text>
            <Text style={styles.chartSub}>Target: {waterTarget} ml</Text>
            <View style={styles.barChart}>
              {last7.map(d => {
                const val = d.log?.water_ml ?? 0;
                const pct = Math.min(val / waterTarget, 1);
                return (
                  <View key={d.date} style={styles.barCol}>
                    <Text style={styles.barVal}>{val > 0 ? val : ''}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { height: `${pct * 100}%` as any, backgroundColor: Colors.water }]} />
                    </View>
                    <Text style={styles.barDay}>{shortDay(d.date)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Macros Chart */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>Macros (7-day avg)</Text>
            {[
              { name: 'Protein', val: Math.round(logs.reduce((s, l) => s + (l.total_protein ?? 0), 0) / (logs.length || 1)), target: profile?.protein_target ?? 150, color: Colors.protein },
              { name: 'Carbs', val: Math.round(logs.reduce((s, l) => s + (l.total_carbs ?? 0), 0) / (logs.length || 1)), target: profile?.carb_target ?? 200, color: Colors.carbs },
              { name: 'Fat', val: Math.round(logs.reduce((s, l) => s + (l.total_fat ?? 0), 0) / (logs.length || 1)), target: profile?.fat_target ?? 67, color: Colors.fat },
            ].map(m => (
              <View key={m.name} style={styles.macroRow}>
                <Text style={styles.macroName}>{m.name}</Text>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${Math.min((m.val / m.target) * 100, 100)}%` as any, backgroundColor: m.color }]} />
                </View>
                <Text style={[styles.macroVal, { color: m.color }]}>{m.val}g</Text>
              </View>
            ))}
          </View>

          {/* BMI */}
          {bmi && bmiCat && (
            <View style={styles.card}>
              <Text style={styles.chartTitle}>BMI</Text>
              <View style={styles.bmiRow}>
                <Text style={styles.bmiVal}>{bmi}</Text>
                <View style={[styles.bmiChip, { backgroundColor: bmiCat.color + '33' }]}>
                  <Text style={[styles.bmiChipText, { color: bmiCat.color }]}>{bmiCat.label}</Text>
                </View>
              </View>
              <View style={styles.bmiBar}>
                <View style={[styles.bmiBarFill, { width: `${Math.min(((Number(bmi) - 10) / 30) * 100, 100)}%` as any, backgroundColor: bmiCat.color }]} />
              </View>
              <View style={styles.bmiLabels}>
                {['Underweight', 'Normal', 'Overweight', 'Obese'].map(l => (
                  <Text key={l} style={styles.bmiLabelText}>{l}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Logging Streak */}
          <View style={[styles.card, { marginBottom: 32 }]}>
            <Text style={styles.chartTitle}>Logging Streak</Text>
            <View style={styles.streakRow}>
              {last7.map(d => {
                const logged = d.log && d.log.total_calories > 0;
                return (
                  <View key={d.date} style={styles.streakDay}>
                    <View style={[styles.streakDot, logged ? styles.streakDotFilled : styles.streakDotEmpty]}>
                      {logged && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.streakLabel}>{shortDay(d.date)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: 16, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  summaryVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  chartSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { width: '100%', height: 90, backgroundColor: Colors.border, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barVal: { fontSize: 8, color: Colors.textMuted },
  barDay: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  macroName: { width: 56, fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  macroBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  macroBarFill: { height: 8, borderRadius: 4 },
  macroVal: { width: 40, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bmiVal: { fontSize: 36, fontWeight: '800', color: Colors.text },
  bmiChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  bmiChipText: { fontSize: 14, fontWeight: '700' },
  bmiBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  bmiBarFill: { height: 10, borderRadius: 5 },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  bmiLabelText: { fontSize: 9, color: Colors.textMuted },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  streakDay: { alignItems: 'center', gap: 6 },
  streakDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  streakDotFilled: { backgroundColor: Colors.primaryLight },
  streakDotEmpty: { backgroundColor: Colors.border },
  streakLabel: { fontSize: 10, color: Colors.textMuted },
});
