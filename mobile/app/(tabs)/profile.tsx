import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useProfileStore } from '../../store/useProfileStore';
import { Card } from '../../components/ui/Card';
import { calculateBMI, getBMICategory, calculateTDEE } from '../../constants/Nutrition';
import { UserProfile } from '../../types';

const ACTIVITY_LEVELS: { key: UserProfile['activityLevel']; label: string; desc: string }[] = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Light', desc: '1-3 days/week' },
  { key: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { key: 'active', label: 'Active', desc: '6-7 days/week' },
  { key: 'veryActive', label: 'Very Active', desc: 'Twice a day' },
];

const GOALS: { key: UserProfile['goal']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lose', label: 'Lose Weight', icon: 'trending-down-outline' },
  { key: 'maintain', label: 'Maintain', icon: 'remove-outline' },
  { key: 'gain', label: 'Gain Muscle', icon: 'trending-up-outline' },
];

const GOAL_COLORS: Record<string, string> = {
  lose: '#FF6B6B',
  maintain: '#74C69D',
  gain: '#74B9FF',
};

export default function ProfileScreen() {
  const { profile, weightHistory, sleepHistory, updateProfile, logWeight, logSleep, updateSteps, getBMI, recalculateCalorieTarget } = useProfileStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [showLogSleep, setShowLogSleep] = useState(false);
  const [newWeight, setNewWeight] = useState(String(profile.currentWeight));
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [stepsInput, setStepsInput] = useState('');

  // Edit profile state
  const [editName, setEditName] = useState(profile.name);
  const [editAge, setEditAge] = useState(String(profile.age));
  const [editHeight, setEditHeight] = useState(String(profile.height));
  const [editTargetWeight, setEditTargetWeight] = useState(String(profile.targetWeight));
  const [editGender, setEditGender] = useState(profile.gender);
  const [editActivity, setEditActivity] = useState(profile.activityLevel);
  const [editGoal, setEditGoal] = useState(profile.goal);
  const [editWaterTarget, setEditWaterTarget] = useState(String(profile.dailyWaterTarget));
  const [editStepsTarget, setEditStepsTarget] = useState(String(profile.dailyStepsTarget));

  const bmi = getBMI();
  const bmiInfo = getBMICategory(bmi);
  const tdee = calculateTDEE({
    age: profile.age,
    gender: profile.gender,
    weight: profile.currentWeight,
    height: profile.height,
    activityLevel: profile.activityLevel,
  });

  function handleSaveProfile() {
    updateProfile({
      name: editName,
      age: parseInt(editAge) || profile.age,
      height: parseFloat(editHeight) || profile.height,
      targetWeight: parseFloat(editTargetWeight) || profile.targetWeight,
      gender: editGender,
      activityLevel: editActivity,
      goal: editGoal,
      dailyWaterTarget: parseInt(editWaterTarget) || profile.dailyWaterTarget,
      dailyStepsTarget: parseInt(editStepsTarget) || profile.dailyStepsTarget,
    });
    recalculateCalorieTarget();
    setShowEdit(false);
  }

  function handleLogWeight() {
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 0) {
      logWeight(w);
      setShowLogWeight(false);
    }
  }

  function handleLogSleep() {
    const h = parseFloat(sleepHours);
    if (!isNaN(h) && h > 0) {
      logSleep(h, sleepQuality);
      setShowLogSleep(false);
    }
  }

  function handleUpdateSteps() {
    const s = parseInt(stepsInput);
    if (!isNaN(s) && s >= 0) {
      updateSteps(s);
      setStepsInput('');
    }
  }

  const recentSleep = sleepHistory.slice(-1)[0];
  const avgSleep = sleepHistory.length > 0
    ? (sleepHistory.slice(-7).reduce((s, e) => s + e.hours, 0) / Math.min(7, sleepHistory.length)).toFixed(1)
    : '—';

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{profile.name}</Text>
              <Text style={styles.subtitle}>Personal Profile</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="create-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.overviewRow}>
            <OverviewItem label="Age" value={`${profile.age}y`} icon="calendar-outline" color={Colors.accent} />
            <OverviewItem label="Height" value={`${profile.height}cm`} icon="resize-outline" color={Colors.water} />
            <OverviewItem label="Weight" value={`${profile.currentWeight}kg`} icon="scale-outline" color={Colors.primaryLight} />
          </View>

          {/* Goal Card */}
          <Card style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.sectionTitle}>Current Goal</Text>
              <View style={[styles.goalBadge, { backgroundColor: GOAL_COLORS[profile.goal] + '20' }]}>
                <Ionicons name={GOALS.find((g) => g.key === profile.goal)?.icon || 'remove-outline'} size={14} color={GOAL_COLORS[profile.goal]} />
                <Text style={[styles.goalBadgeText, { color: GOAL_COLORS[profile.goal] }]}>
                  {GOALS.find((g) => g.key === profile.goal)?.label}
                </Text>
              </View>
            </View>
            <View style={styles.goalStats}>
              <GoalStat label="Target Weight" value={`${profile.targetWeight} kg`} />
              <GoalStat label="Daily Calories" value={`${profile.dailyCalorieTarget} kcal`} />
              <GoalStat label="TDEE" value={`${tdee} kcal`} />
              <GoalStat label="Activity" value={ACTIVITY_LEVELS.find((a) => a.key === profile.activityLevel)?.label || '—'} />
            </View>
          </Card>

          {/* BMI Card */}
          <Card>
            <Text style={styles.sectionTitle}>BMI</Text>
            <View style={styles.bmiRow}>
              <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi}</Text>
              <View style={styles.bmiDetails}>
                <Text style={[styles.bmiCategory, { color: bmiInfo.color }]}>{bmiInfo.category}</Text>
                <Text style={styles.bmiHint}>Based on height & weight</Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Text style={styles.sectionTitle}>Log Today</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLogWeight(true)}>
                <Ionicons name="scale-outline" size={22} color={Colors.primaryLight} />
                <Text style={styles.actionLabel}>Weight</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLogSleep(true)}>
                <Ionicons name="moon-outline" size={22} color={Colors.sleep} />
                <Text style={styles.actionLabel}>Sleep</Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <TextInput
                  style={styles.stepsInput}
                  placeholder="Steps"
                  placeholderTextColor={Colors.textMuted}
                  value={stepsInput}
                  onChangeText={setStepsInput}
                  keyboardType="number-pad"
                  onSubmitEditing={handleUpdateSteps}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleUpdateSteps}>
                  <Ionicons name="footsteps-outline" size={22} color={Colors.steps} />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>Steps</Text>
              </View>
            </View>
          </Card>

          {/* Sleep Summary */}
          <Card>
            <Text style={styles.sectionTitle}>Sleep</Text>
            <View style={styles.sleepRow}>
              <View style={styles.sleepItem}>
                <Ionicons name="moon" size={20} color={Colors.sleep} />
                <Text style={styles.sleepValue}>{recentSleep ? `${recentSleep.hours}h` : '—'}</Text>
                <Text style={styles.sleepLabel}>Last night</Text>
              </View>
              <View style={styles.sleepItem}>
                <Ionicons name="stats-chart-outline" size={20} color={Colors.sleep} />
                <Text style={styles.sleepValue}>{avgSleep}h</Text>
                <Text style={styles.sleepLabel}>7-day avg</Text>
              </View>
              {recentSleep && (
                <View style={styles.sleepItem}>
                  <View style={styles.qualityStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= recentSleep.quality ? 'star' : 'star-outline'}
                        size={12}
                        color={Colors.warning}
                      />
                    ))}
                  </View>
                  <Text style={styles.sleepLabel}>Quality</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Targets */}
          <Card>
            <Text style={styles.sectionTitle}>Daily Targets</Text>
            <TargetRow icon="restaurant-outline" label="Calories" value={`${profile.dailyCalorieTarget} kcal`} color={Colors.calories} />
            <TargetRow icon="water-outline" label="Water" value={`${profile.dailyWaterTarget} ml`} color={Colors.water} />
            <TargetRow icon="footsteps-outline" label="Steps" value={profile.dailyStepsTarget.toLocaleString()} color={Colors.steps} />
          </Card>

        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll}>
            <EditField label="Name" value={editName} onChange={setEditName} />
            <EditField label="Age" value={editAge} onChange={setEditAge} keyboardType="number-pad" />
            <EditField label="Height (cm)" value={editHeight} onChange={setEditHeight} keyboardType="decimal-pad" />
            <EditField label="Target Weight (kg)" value={editTargetWeight} onChange={setEditTargetWeight} keyboardType="decimal-pad" />
            <EditField label="Daily Water Target (ml)" value={editWaterTarget} onChange={setEditWaterTarget} keyboardType="number-pad" />
            <EditField label="Daily Steps Target" value={editStepsTarget} onChange={setEditStepsTarget} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.toggleRow}>
              {(['male', 'female', 'other'] as UserProfile['gender'][]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.toggleBtn, editGender === g && styles.toggleBtnActive]}
                  onPress={() => setEditGender(g)}
                >
                  <Text style={[styles.toggleLabel, editGender === g && styles.toggleLabelActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Goal</Text>
            <View style={styles.toggleRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.toggleBtn, editGoal === g.key && styles.toggleBtnActive]}
                  onPress={() => setEditGoal(g.key)}
                >
                  <Text style={[styles.toggleLabel, editGoal === g.key && styles.toggleLabelActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Activity Level</Text>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[styles.activityRow, editActivity === a.key && styles.activityRowActive]}
                onPress={() => setEditActivity(a.key)}
              >
                <View>
                  <Text style={[styles.activityLabel, editActivity === a.key && styles.activityLabelActive]}>{a.label}</Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </View>
                {editActivity === a.key && <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Log Weight Modal */}
      <Modal visible={showLogWeight} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <TouchableOpacity onPress={() => setShowLogWeight(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerForm}>
            <Text style={styles.bigInputLabel}>Current Weight (kg)</Text>
            <TextInput
              style={styles.bigInput}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.weightHint}>Previous: {profile.currentWeight} kg</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleLogWeight}>
              <Text style={styles.saveBtnText}>Save Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Sleep Modal */}
      <Modal visible={showLogSleep} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Sleep</Text>
            <TouchableOpacity onPress={() => setShowLogSleep(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerForm}>
            <Text style={styles.bigInputLabel}>Hours Slept</Text>
            <TextInput
              style={styles.bigInput}
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.fieldLabel}>Sleep Quality</Text>
            <View style={styles.qualityRow}>
              {([1, 2, 3, 4, 5] as const).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityBtn, sleepQuality === q && styles.qualityBtnActive]}
                  onPress={() => setSleepQuality(q)}
                >
                  <Text style={[styles.qualityLabel, sleepQuality === q && styles.qualityLabelActive]}>{q}★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleLogSleep}>
              <Text style={styles.saveBtnText}>Save Sleep</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function OverviewItem({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={ovStyles.item}>
      <View style={[ovStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={ovStyles.value}>{value}</Text>
      <Text style={ovStyles.label}>{label}</Text>
    </View>
  );
}

const ovStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '800', color: Colors.text },
  label: { fontSize: 11, color: Colors.textMuted },
});

function GoalStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={gsStyles.item}>
      <Text style={gsStyles.label}>{label}</Text>
      <Text style={gsStyles.value}>{value}</Text>
    </View>
  );
}

const gsStyles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: '700', color: Colors.text },
});

function TargetRow({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return (
    <View style={trStyles.row}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={trStyles.label}>{label}</Text>
      <Text style={[trStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const trStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, fontWeight: '700' },
});

function EditField({ label, value, onChange, keyboardType }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'number-pad' | 'decimal-pad' | 'default';
}) {
  return (
    <View style={efStyles.wrap}>
      <Text style={efStyles.label}>{label}</Text>
      <TextInput
        style={efStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

const efStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 14, color: Colors.text, fontSize: 15,
  },
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  editBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  overviewRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  goalCard: { gap: 0 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  goalBadgeText: { fontSize: 12, fontWeight: '700' },
  goalStats: {},
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bmiValue: { fontSize: 48, fontWeight: '900' },
  bmiDetails: {},
  bmiCategory: { fontSize: 18, fontWeight: '700' },
  bmiHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border,
  },
  actionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  stepsInput: { fontSize: 15, color: Colors.text, textAlign: 'center', minWidth: 60 },
  sleepRow: { flexDirection: 'row', justifyContent: 'space-around' },
  sleepItem: { alignItems: 'center', gap: 4 },
  sleepValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 4 },
  sleepLabel: { fontSize: 11, color: Colors.textMuted },
  qualityStars: { flexDirection: 'row', gap: 2 },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  formScroll: { paddingBottom: 40 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, marginTop: 8, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight },
  toggleLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  toggleLabelActive: { color: Colors.text },
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, marginBottom: 8,
  },
  activityRowActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primary + '20' },
  activityLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  activityLabelActive: { color: Colors.primaryLight },
  activityDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  centerForm: { padding: 8, gap: 16 },
  bigInputLabel: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  bigInput: {
    fontSize: 40, fontWeight: '900', color: Colors.text, textAlign: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, padding: 20,
  },
  weightHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  qualityRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  qualityBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  qualityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight },
  qualityLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },
  qualityLabelActive: { color: Colors.text },
});
