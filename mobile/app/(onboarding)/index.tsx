import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { updateProfile, calculateCalorieTarget } from '../../lib/database';
import { Colors } from '../../constants/Colors';

const TOTAL_STEPS = 5;

type StepData = {
  age: string;
  gender: 'male' | 'female' | 'other';
  height: string;
  weight: string;
  targetWeight: string;
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietPreference: string;
};

const GOALS = [
  { key: 'lose_weight', label: 'Lose Weight', icon: 'trending-down', desc: 'Reduce body fat' },
  { key: 'gain_muscle', label: 'Gain Muscle', icon: 'barbell', desc: 'Build strength & size' },
  { key: 'maintain', label: 'Maintain', icon: 'shield-checkmark', desc: 'Stay at current weight' },
  { key: 'improve_health', label: 'Improve Health', icon: 'heart', desc: 'General wellness' },
] as const;

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Light', desc: '1–3 days/week' },
  { key: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { key: 'active', label: 'Active', desc: '6–7 days/week' },
  { key: 'very_active', label: 'Very Active', desc: 'Hard exercise daily' },
] as const;

const DIETS = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Halal', 'Kosher'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<StepData>({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    targetWeight: '',
    goal: 'lose_weight',
    activityLevel: 'moderate',
    dietPreference: 'Omnivore',
  });

  function update(key: keyof StepData, value: string) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function next() {
    if (step === 1 && (!data.age || !data.gender)) {
      Alert.alert('Required', 'Please fill in all fields'); return;
    }
    if (step === 2 && (!data.height || !data.weight)) {
      Alert.alert('Required', 'Please fill in height and weight'); return;
    }
    setStep(s => s + 1);
  }

  function back() { setStep(s => s - 1); }

  const calorieTarget = calculateCalorieTarget({
    age: Number(data.age) || 25,
    gender: data.gender,
    height_cm: Number(data.height) || 170,
    weight_kg: Number(data.weight) || 70,
    activity_level: data.activityLevel,
    goal: data.goal,
  });

  async function finish() {
    if (!session?.user) return;
    setSaving(true);
    try {
      await updateProfile(session.user.id, {
        age: Number(data.age),
        gender: data.gender,
        height_cm: Number(data.height),
        weight_kg: Number(data.weight),
        goal: data.goal,
        activity_level: data.activityLevel,
        diet_preference: data.dietPreference,
        calorie_target: calorieTarget,
        protein_target: Math.round((calorieTarget * 0.3) / 4),
        carb_target: Math.round((calorieTarget * 0.4) / 4),
        fat_target: Math.round((calorieTarget * 0.3) / 9),
        onboarded: true,
      });
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <LinearGradient colors={['#0D1F17', '#1B4332', '#0D1F17']} style={styles.gradient}>
      {/* Progress */}
      <View style={styles.progressWrap}>
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Step 1: Age & Gender */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Ionicons name="person" size={36} color={Colors.primaryLight} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>About You</Text>
            <Text style={styles.stepSub}>Help us personalise your experience</Text>

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={data.age}
              onChangeText={v => update('age', v)}
              placeholder="25"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.row}>
              {(['male', 'female', 'other'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, data.gender === g && styles.chipActive]}
                  onPress={() => setData(p => ({ ...p, gender: g }))}
                >
                  <Text style={[styles.chipText, data.gender === g && styles.chipTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Height & Weight */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Ionicons name="body" size={36} color={Colors.primaryLight} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Your Measurements</Text>
            <Text style={styles.stepSub}>Used to calculate your daily needs</Text>

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={data.height}
              onChangeText={v => update('height', v)}
              placeholder="175"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Current Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={data.weight}
              onChangeText={v => update('weight', v)}
              placeholder="75"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Target Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={data.targetWeight}
              onChangeText={v => update('targetWeight', v)}
              placeholder="68"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Ionicons name="flag" size={36} color={Colors.primaryLight} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Your Goal</Text>
            <Text style={styles.stepSub}>What are you working towards?</Text>

            {GOALS.map(g => (
              <TouchableOpacity
                key={g.key}
                style={[styles.optionCard, data.goal === g.key && styles.optionCardActive]}
                onPress={() => setData(p => ({ ...p, goal: g.key }))}
              >
                <Ionicons name={g.icon as any} size={24} color={data.goal === g.key ? Colors.primaryLight : Colors.textMuted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionLabel, data.goal === g.key && styles.optionLabelActive]}>{g.label}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </View>
                {data.goal === g.key && <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 4: Activity & Diet */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Ionicons name="fitness" size={36} color={Colors.primaryLight} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Lifestyle</Text>
            <Text style={styles.stepSub}>Tell us about your activity & diet</Text>

            <Text style={styles.label}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[styles.optionCard, data.activityLevel === a.key && styles.optionCardActive]}
                onPress={() => setData(p => ({ ...p, activityLevel: a.key }))}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, data.activityLevel === a.key && styles.optionLabelActive]}>{a.label}</Text>
                  <Text style={styles.optionDesc}>{a.desc}</Text>
                </View>
                {data.activityLevel === a.key && <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: 20 }]}>Diet Preference</Text>
            <View style={styles.dietGrid}>
              {DIETS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, data.dietPreference === d && styles.chipActive]}
                  onPress={() => setData(p => ({ ...p, dietPreference: d }))}
                >
                  <Text style={[styles.chipText, data.dietPreference === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <View style={styles.stepCard}>
            <Ionicons name="checkmark-circle" size={36} color={Colors.primaryLight} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Your Plan is Ready!</Text>
            <Text style={styles.stepSub}>Based on your profile, here are your daily targets</Text>

            <LinearGradient colors={Colors.gradients.primary as any} style={styles.summaryCard}>
              <Text style={styles.summaryBig}>{calorieTarget}</Text>
              <Text style={styles.summaryLabel}>Daily Calories (kcal)</Text>
            </LinearGradient>

            <View style={styles.macroRow}>
              <View style={[styles.macroBox, { backgroundColor: '#1E3A5F' }]}>
                <Text style={styles.macroVal}>{Math.round((calorieTarget * 0.3) / 4)}g</Text>
                <Text style={styles.macroName}>Protein</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: '#3D2B00' }]}>
                <Text style={styles.macroVal}>{Math.round((calorieTarget * 0.4) / 4)}g</Text>
                <Text style={styles.macroName}>Carbs</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: '#3D1F2D' }]}>
                <Text style={styles.macroVal}>{Math.round((calorieTarget * 0.3) / 9)}g</Text>
                <Text style={styles.macroName}>Fat</Text>
              </View>
            </View>

            <View style={styles.summaryItems}>
              {[
                { icon: 'flag', label: 'Goal', val: data.goal.replace('_', ' ') },
                { icon: 'fitness', label: 'Activity', val: data.activityLevel },
                { icon: 'leaf', label: 'Diet', val: data.dietPreference },
              ].map(item => (
                <View key={item.label} style={styles.summaryItem}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.primaryLight} />
                  <Text style={styles.summaryItemLabel}>{item.label}</Text>
                  <Text style={styles.summaryItemVal}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtnNav} onPress={back}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < TOTAL_STEPS ? (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, saving && styles.btnDisabled]} onPress={finish} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.nextBtnText}>Get Started</Text>
                  <Ionicons name="rocket" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  progressWrap: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 8 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.primaryLight, borderRadius: 2 },
  container: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  stepCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  stepIcon: { marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  stepSub: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 48, color: Colors.text, fontSize: 15, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  optionCardActive: { borderColor: Colors.primaryLight, backgroundColor: '#1B4332' },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  optionLabelActive: { color: Colors.primaryLight },
  optionDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  summaryBig: { fontSize: 52, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  macroBox: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  macroVal: { fontSize: 20, fontWeight: '700', color: '#fff' },
  macroName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  summaryItems: { gap: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryItemLabel: { flex: 1, color: Colors.textMuted, fontSize: 14 },
  summaryItemVal: { color: Colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  backBtnNav: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  backBtnText: { color: Colors.text, fontSize: 15 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
