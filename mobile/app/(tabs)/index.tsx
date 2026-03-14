import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { getTodayLog, upsertDailyLog, DailyLog, MealItem } from '../../lib/database';
import { Colors } from '../../constants/Colors';
import { ProgressRing } from '../../components/ui/ProgressRing';

function today() { return new Date().toISOString().split('T')[0]; }
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const WATER_QUICK_ADD = [150, 250, 350, 500];
const DAILY_WATER_TARGET = 2500;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const calorieTarget = profile?.calorie_target ?? 2000;

  async function loadLog() {
    if (!session?.user) return;
    const data = await getTodayLog(session.user.id, today());
    setLog(data);
    setLoading(false);
  }

  useEffect(() => { loadLog(); }, [session]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLog();
    setRefreshing(false);
  }, [session]);

  async function addWater(ml: number) {
    if (!session?.user) return;
    const base: DailyLog = log ?? {
      user_id: session.user.id,
      log_date: today(),
      breakfast: [], lunch: [], dinner: [], snacks: [],
      total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0,
      water_ml: 0, mood: null, notes: null,
    };
    const updated = { ...base, water_ml: (base.water_ml ?? 0) + ml };
    setLog(updated);
    await upsertDailyLog(updated);
  }

  const calories = log?.total_calories ?? 0;
  const protein = log?.total_protein ?? 0;
  const carbs = log?.total_carbs ?? 0;
  const fat = log?.total_fat ?? 0;
  const water = log?.water_ml ?? 0;
  const calorieProgress = Math.min(calories / calorieTarget, 1);
  const waterProgress = Math.min(water / DAILY_WATER_TARGET, 1);

  const allMeals: { label: string; items: MealItem[] }[] = [
    { label: 'Breakfast', items: log?.breakfast ?? [] },
    { label: 'Lunch', items: log?.lunch ?? [] },
    { label: 'Dinner', items: log?.dinner ?? [] },
    { label: 'Snacks', items: log?.snacks ?? [] },
  ];
  const recentMeals = allMeals.filter(m => m.items.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{profile?.full_name ?? 'there'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
            <LinearGradient colors={Colors.gradients.accent as any} style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile?.full_name ?? 'U').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primaryLight} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Calorie Ring */}
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Today's Calories</Text>
                <View style={styles.ringWrap}>
                  <ProgressRing
                    size={160}
                    progress={calorieProgress}
                    color={Colors.primaryLight}
                    trackColor={Colors.border}
                    strokeWidth={14}
                    label={`${calories}`}
                    sublabel="kcal eaten"
                  />
                </View>
                <View style={styles.calRow}>
                  {[
                    { label: 'Target', val: calorieTarget, color: Colors.textMuted },
                    { label: 'Remaining', val: Math.max(0, calorieTarget - calories), color: calories > calorieTarget ? Colors.danger : Colors.success },
                  ].map(c => (
                    <View key={c.label} style={styles.calItem}>
                      <Text style={[styles.calVal, { color: c.color }]}>{c.val}</Text>
                      <Text style={styles.calLabel}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Macros</Text>
                <View style={styles.macroRow}>
                  {[
                    { name: 'Protein', val: protein, color: Colors.protein, target: profile?.protein_target ?? 150 },
                    { name: 'Carbs', val: carbs, color: Colors.carbs, target: profile?.carb_target ?? 200 },
                    { name: 'Fat', val: fat, color: Colors.fat, target: profile?.fat_target ?? 67 },
                  ].map(m => (
                    <View key={m.name} style={styles.macroItem}>
                      <Text style={[styles.macroVal, { color: m.color }]}>{m.val}g</Text>
                      <View style={styles.macroBarBg}>
                        <View style={[styles.macroBarFill, { width: `${Math.min((m.val / m.target) * 100, 100)}%` as any, backgroundColor: m.color }]} />
                      </View>
                      <Text style={styles.macroName}>{m.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Water */}
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Water Intake</Text>
                  <View style={styles.waterBadge}>
                    <Ionicons name="water" size={14} color={Colors.water} />
                    <Text style={[styles.waterTotal, { color: Colors.water }]}>{water} / {DAILY_WATER_TARGET} ml</Text>
                  </View>
                </View>
                <View style={styles.waterBarBg}>
                  <View style={[styles.waterBarFill, { width: `${waterProgress * 100}%` as any }]} />
                </View>
                <View style={styles.waterBtns}>
                  {WATER_QUICK_ADD.map(ml => (
                    <TouchableOpacity key={ml} style={styles.waterBtn} onPress={() => addWater(ml)}>
                      <Ionicons name="add" size={14} color={Colors.water} />
                      <Text style={styles.waterBtnText}>{ml}ml</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Recent Meals */}
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Today's Meals</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/checkin')} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color={Colors.primaryLight} />
                  <Text style={styles.addBtnText}>Log Meal</Text>
                </TouchableOpacity>
              </View>
              {recentMeals.length === 0 ? (
                <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/(tabs)/checkin')}>
                  <Ionicons name="restaurant-outline" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No meals logged yet</Text>
                  <Text style={styles.emptySubText}>Tap to log your first meal</Text>
                </TouchableOpacity>
              ) : (
                recentMeals.map(m => (
                  <View key={m.label} style={styles.mealCard}>
                    <Text style={styles.mealLabel}>{m.label}</Text>
                    {m.items.map((item, i) => (
                      <View key={i} style={styles.mealItem}>
                        <Text style={styles.mealItemName}>{item.name}</Text>
                        <Text style={styles.mealItemCal}>{item.calories} kcal</Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>

            {/* Quick Actions */}
            <View style={[styles.section, { paddingBottom: 24 }]}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {[
                  { icon: 'scan', label: 'Scan Food', route: '/(tabs)/scanner', color: Colors.gradients.accent },
                  { icon: 'chatbubbles', label: 'AI Coach', route: '/(tabs)/ai-chat', color: Colors.gradients.workout },
                  { icon: 'logo-whatsapp', label: 'WhatsApp', route: '/(tabs)/whatsapp', color: ['#128C7E', '#25D366'] },
                  { icon: 'trending-up', label: 'Progress', route: '/(tabs)/progress', color: Colors.gradients.sleep },
                ].map(a => (
                  <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)} style={styles.actionCard}>
                    <LinearGradient colors={a.color as any} style={styles.actionIcon}>
                      <Ionicons name={a.icon as any} size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff' },
  avatarBtn: {},
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  ringWrap: { alignItems: 'center', marginVertical: 12 },
  calRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  calItem: { alignItems: 'center' },
  calVal: { fontSize: 20, fontWeight: '700' },
  calLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  macroRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  macroItem: { flex: 1, alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '700' },
  macroBarBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, width: '100%', marginVertical: 6 },
  macroBarFill: { height: 6, borderRadius: 3 },
  macroName: { fontSize: 11, color: Colors.textMuted },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waterTotal: { fontSize: 13, fontWeight: '600' },
  waterBarBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginTop: 10, marginBottom: 12 },
  waterBarFill: { height: 8, backgroundColor: Colors.water, borderRadius: 4 },
  waterBtns: { flexDirection: 'row', gap: 8 },
  waterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#0E2A3A', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: Colors.water + '40' },
  waterBtnText: { color: Colors.water, fontSize: 13, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600', marginTop: 10 },
  emptySubText: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  mealCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  mealLabel: { fontSize: 13, fontWeight: '700', color: Colors.primaryLight, marginBottom: 8 },
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  mealItemName: { color: Colors.textSecondary, fontSize: 14 },
  mealItemCal: { color: Colors.textMuted, fontSize: 13 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: Colors.text, fontSize: 13, fontWeight: '600' },
});
