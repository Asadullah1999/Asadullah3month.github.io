import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/colors';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Badge } from '../components/ui/Badge';
import { formatDate, calculateBMI, getBMICategory } from '../lib/utils';
import type { User, DailyLog, MainStackParamList } from '../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [user, setUser] = useState<User | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const [{ data: userData }, { data: logData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('daily_logs').select('*').eq('user_id', authUser.id).eq('log_date', formatDate(new Date())).single(),
    ]);
    if (userData) setUser(userData);
    if (logData) setLog(logData);

    // Calculate streak
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('log_date')
      .eq('user_id', authUser.id)
      .order('log_date', { ascending: false })
      .limit(30);
    if (logs) {
      let s = 0;
      const today = new Date();
      for (let i = 0; i < logs.length; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (logs[i]?.log_date === formatDate(d)) s++;
        else break;
      }
      setStreak(s);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const calories = log?.total_calories ?? 0;
  const protein = log?.total_protein ?? 0;
  const carbs = log?.total_carbs ?? 0;
  const fat = log?.total_fat ?? 0;
  const water = log?.water_ml ?? 0;
  const calorieTarget = user?.calorie_target ?? 2000;
  const proteinTarget = user?.protein_target ?? 150;
  const carbTarget = user?.carb_target ?? 250;
  const fatTarget = user?.fat_target ?? 65;
  const waterTarget = 2500;
  const remaining = Math.max(0, calorieTarget - calories);
  const bmi = user?.weight_kg && user?.height_cm ? calculateBMI(user.weight_kg, user.height_cm) : null;

  const QuickAction = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}! 👋</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        )}
      </View>

      {/* Calorie Overview */}
      <LinearGradient colors={['rgba(34,197,94,0.15)', 'rgba(6,182,212,0.1)']} style={styles.calorieCard}>
        <View style={styles.calorieRow}>
          <ProgressRing
            progress={calorieTarget > 0 ? calories / calorieTarget : 0}
            size={100}
            strokeWidth={8}
            color={colors.primary}
            value={`${calories}`}
            label="kcal"
            sublabel="eaten"
          />
          <View style={styles.calorieStats}>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatLabel}>Target</Text>
              <Text style={styles.calorieStatValue}>{calorieTarget} kcal</Text>
            </View>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatLabel}>Remaining</Text>
              <Text style={[styles.calorieStatValue, { color: remaining > 0 ? colors.primary : colors.danger }]}>
                {remaining} kcal
              </Text>
            </View>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          {[
            { label: 'Protein', value: protein, target: proteinTarget, color: colors.secondary },
            { label: 'Carbs', value: carbs, target: carbTarget, color: colors.warning },
            { label: 'Fat', value: fat, target: fatTarget, color: colors.accent },
          ].map((m) => (
            <View key={m.label} style={styles.macroItem}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <Text style={[styles.macroValue, { color: m.color }]}>{m.value}g</Text>
              <View style={styles.macroBar}>
                <View style={[styles.macroFill, { width: `${Math.min(100, (m.value / m.target) * 100)}%`, backgroundColor: m.color }]} />
              </View>
              <Text style={styles.macroTarget}>/{m.target}g</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Water */}
      <Card style={styles.waterCard}>
        <View style={styles.waterRow}>
          <View style={styles.waterInfo}>
            <Ionicons name="water" size={22} color={colors.secondary} />
            <Text style={styles.waterLabel}>Water</Text>
          </View>
          <Text style={styles.waterValue}>{(water / 1000).toFixed(1)}L / 2.5L</Text>
        </View>
        <View style={styles.waterBarBg}>
          <LinearGradient
            colors={[colors.secondary, '#0e7490']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.waterBarFill, { width: `${Math.min(100, (water / waterTarget) * 100)}%` }]}
          />
        </View>
        <View style={styles.waterBtns}>
          {[250, 500, 750].map((ml) => (
            <TouchableOpacity key={ml} style={styles.waterBtn} onPress={() => addWater(ml)}>
              <Text style={styles.waterBtnText}>+{ml}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickAction icon="chatbubble-ellipses" label="AI Chat" color={colors.primary} onPress={() => navigation.navigate('AIChat')} />
        <QuickAction icon="camera" label="Scan Meal" color={colors.secondary} onPress={() => navigation.navigate('MealScanner')} />
        <QuickAction icon="barcode" label="Barcode" color={colors.accent} onPress={() => navigation.navigate('BarcodeScanner')} />
        <QuickAction icon="scale" label="Weight" color={colors.warning} onPress={() => navigation.navigate('WeightLog')} />
        <QuickAction icon="moon" label="Sleep" color="#6366f1" onPress={() => navigation.navigate('Sleep')} />
        <QuickAction icon="cart" label="Grocery" color={colors.primary} onPress={() => navigation.navigate('GroceryList')} />
        <QuickAction icon="notifications" label="Reminders" color={colors.secondary} onPress={() => navigation.navigate('Reminders')} />
        <QuickAction icon="barbell" label="Workout" color={colors.warning} onPress={() => navigation.navigate('Workout')} />
      </View>

      {/* BMI Card */}
      {bmi && (
        <Card style={styles.bmiCard}>
          <View style={styles.bmiRow}>
            <View>
              <Text style={styles.bmiLabel}>BMI</Text>
              <Text style={styles.bmiValue}>{bmi}</Text>
              <Badge label={getBMICategory(bmi)} variant={bmi < 18.5 ? 'cyan' : bmi < 25 ? 'green' : bmi < 30 ? 'amber' : 'red'} />
            </View>
            <View style={styles.bmiInfo}>
              <Text style={styles.bmiInfoText}>Weight: {user?.weight_kg}kg</Text>
              <Text style={styles.bmiInfoText}>Height: {user?.height_cm}cm</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Today's Meals Summary */}
      {log && (
        <View>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => {
            const items = log[meal] as any[];
            if (!items || items.length === 0) return null;
            const mealCals = items.reduce((s: number, i: any) => s + (i.calories || 0), 0);
            return (
              <Card key={meal} style={styles.mealCard}>
                <View style={styles.mealRow}>
                  <Text style={styles.mealName}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                  <Text style={styles.mealCals}>{mealCals} kcal</Text>
                </View>
                <Text style={styles.mealItems}>{items.map((i: any) => i.name).join(', ')}</Text>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  async function addWater(ml: number) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const today = formatDate(new Date());
    const newWater = water + ml;

    if (log) {
      await supabase.from('daily_logs').update({ water_ml: newWater }).eq('id', log.id);
      setLog({ ...log, water_ml: newWater });
    } else {
      const { data } = await supabase.from('daily_logs').insert({
        user_id: authUser.id, log_date: today, water_ml: newWater,
        breakfast: [], lunch: [], dinner: [], snacks: [],
        total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0,
      }).select().single();
      if (data) setLog(data);
    }
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 18, fontWeight: '700', color: colors.text },
  dateText: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  streakBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { color: colors.warning, fontWeight: '700', fontSize: 15 },
  calorieCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  calorieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calorieStats: { flex: 1, paddingLeft: 20, gap: 12 },
  calorieStat: {},
  calorieStatLabel: { fontSize: 12, color: colors.textMuted },
  calorieStatValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  macrosRow: { flexDirection: 'row', gap: 12 },
  macroItem: { flex: 1 },
  macroLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  macroValue: { fontSize: 15, fontWeight: '700' },
  macroBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginVertical: 4 },
  macroFill: { height: '100%', borderRadius: 2 },
  macroTarget: { fontSize: 11, color: colors.textDim },
  waterCard: { marginBottom: 14 },
  waterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  waterInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  waterValue: { color: colors.textMuted, fontSize: 13 },
  waterBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 12 },
  waterBarFill: { height: '100%', borderRadius: 4 },
  waterBtns: { flexDirection: 'row', gap: 8 },
  waterBtn: { flex: 1, backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  waterBtnText: { color: colors.secondary, fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 4 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  quickAction: { width: '22%', alignItems: 'center', gap: 6 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  bmiCard: { marginBottom: 14 },
  bmiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bmiLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 2 },
  bmiValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  bmiInfo: { gap: 4 },
  bmiInfoText: { color: colors.textMuted, fontSize: 13 },
  mealCard: { marginBottom: 10 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  mealName: { fontSize: 14, fontWeight: '600', color: colors.text },
  mealCals: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  mealItems: { color: colors.textMuted, fontSize: 13 },
});
