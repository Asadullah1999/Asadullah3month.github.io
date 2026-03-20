import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/colors';
import { Button } from '../components/ui/Button';
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros } from '../lib/utils';
import type { Goal, ActivityLevel, DietPreference } from '../types';

const STEPS = ['personal', 'body', 'goal', 'diet', 'summary'] as const;
type Step = typeof STEPS[number];

export function OnboardingScreen() {
  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [activity, setActivity] = useState<ActivityLevel>('moderately_active');
  const [diet, setDiet] = useState<DietPreference>('none');

  const stepIdx = STEPS.indexOf(step);
  const progress = (stepIdx + 1) / STEPS.length;

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age, 10);
    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activity);
    const calorieTarget = calculateCalorieTarget(tdee, goal);
    const { protein, carbs, fat } = calculateMacros(calorieTarget, goal);

    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: name,
      age: a,
      gender,
      weight_kg: w,
      height_cm: h,
      goal,
      activity_level: activity,
      diet_preference: diet,
      calorie_target: calorieTarget,
      protein_target: protein,
      carb_target: carbs,
      fat_target: fat,
      onboarded: true,
    });
    setLoading(false);
  };

  const OptionButton = ({ label, value, current, onSelect, icon }: any) => (
    <TouchableOpacity
      style={[styles.optionBtn, current === value && styles.optionBtnActive]}
      onPress={() => onSelect(value)}
    >
      {icon && <Ionicons name={icon} size={20} color={current === value ? colors.primary : colors.textMuted} />}
      <Text style={[styles.optionText, current === value && styles.optionTextActive]}>{label}</Text>
      {current === value && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.optionCheck} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress * 100}%` }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepCount}>Step {stepIdx + 1} of {STEPS.length}</Text>

        {/* Personal Step */}
        {step === 'personal' && (
          <View>
            <Text style={styles.stepTitle}>👋 Let's get to know you</Text>
            <Text style={styles.stepSubtitle}>Tell us your name and gender</Text>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textDim}
            />
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.optionRow}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <OptionButton key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} value={g} current={gender} onSelect={setGender} />
              ))}
            </View>
          </View>
        )}

        {/* Body Stats Step */}
        {step === 'body' && (
          <View>
            <Text style={styles.stepTitle}>📏 Body measurements</Text>
            <Text style={styles.stepSubtitle}>For accurate calorie calculations</Text>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput style={styles.textInput} value={age} onChangeText={setAge} placeholder="Years" placeholderTextColor={colors.textDim} keyboardType="numeric" />
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput style={styles.textInput} value={weight} onChangeText={setWeight} placeholder="e.g. 70" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput style={styles.textInput} value={height} onChangeText={setHeight} placeholder="e.g. 170" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" />
          </View>
        )}

        {/* Goal Step */}
        {step === 'goal' && (
          <View>
            <Text style={styles.stepTitle}>🎯 What's your goal?</Text>
            <Text style={styles.stepSubtitle}>This sets your calorie targets</Text>
            <OptionButton label="Lose Weight" value="lose_weight" current={goal} onSelect={setGoal} icon="trending-down-outline" />
            <OptionButton label="Maintain Weight" value="maintain" current={goal} onSelect={setGoal} icon="remove-outline" />
            <OptionButton label="Gain Muscle" value="gain_muscle" current={goal} onSelect={setGoal} icon="trending-up-outline" />
            <OptionButton label="Improve Health" value="improve_health" current={goal} onSelect={setGoal} icon="heart-outline" />
            <Text style={[styles.inputLabel, { marginTop: 24 }]}>Activity Level</Text>
            <OptionButton label="Sedentary (desk job)" value="sedentary" current={activity} onSelect={setActivity} />
            <OptionButton label="Lightly Active (1-3x/week)" value="lightly_active" current={activity} onSelect={setActivity} />
            <OptionButton label="Moderately Active (3-5x/week)" value="moderately_active" current={activity} onSelect={setActivity} />
            <OptionButton label="Very Active (6-7x/week)" value="very_active" current={activity} onSelect={setActivity} />
            <OptionButton label="Extremely Active (athlete)" value="extremely_active" current={activity} onSelect={setActivity} />
          </View>
        )}

        {/* Diet Step */}
        {step === 'diet' && (
          <View>
            <Text style={styles.stepTitle}>🥗 Diet preference</Text>
            <Text style={styles.stepSubtitle}>We'll personalize your meal suggestions</Text>
            {([
              { value: 'none', label: 'No preference' },
              { value: 'vegetarian', label: 'Vegetarian' },
              { value: 'vegan', label: 'Vegan' },
              { value: 'keto', label: 'Keto' },
              { value: 'paleo', label: 'Paleo' },
              { value: 'gluten_free', label: 'Gluten-free' },
            ] as const).map((d) => (
              <OptionButton key={d.value} label={d.label} value={d.value} current={diet} onSelect={setDiet} />
            ))}
          </View>
        )}

        {/* Summary Step */}
        {step === 'summary' && (
          <View>
            <Text style={styles.stepTitle}>✅ You're all set!</Text>
            <Text style={styles.stepSubtitle}>Here's your personalized plan</Text>
            {weight && height && age && (() => {
              const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age, 10);
              const bmr = calculateBMR(w, h, a, gender);
              const tdee = calculateTDEE(bmr, activity);
              const cals = calculateCalorieTarget(tdee, goal);
              const macros = calculateMacros(cals, goal);
              return (
                <View style={styles.summaryCards}>
                  {[
                    { label: 'Daily Calories', value: `${cals}`, unit: 'kcal', color: colors.primary },
                    { label: 'Protein', value: `${macros.protein}g`, unit: '', color: colors.secondary },
                    { label: 'Carbs', value: `${macros.carbs}g`, unit: '', color: colors.warning },
                    { label: 'Fat', value: `${macros.fat}g`, unit: '', color: colors.accent },
                  ].map((item) => (
                    <View key={item.label} style={styles.summaryCard}>
                      <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                      <Text style={styles.summaryLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryInfoText}>Goal: <Text style={styles.summaryInfoValue}>{goal.replace('_', ' ')}</Text></Text>
              <Text style={styles.summaryInfoText}>Activity: <Text style={styles.summaryInfoValue}>{activity.replace('_', ' ')}</Text></Text>
              <Text style={styles.summaryInfoText}>Diet: <Text style={styles.summaryInfoValue}>{diet === 'none' ? 'No preference' : diet}</Text></Text>
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.btnRow}>
          {stepIdx > 0 && (
            <Button title="Back" onPress={back} variant="outline" style={styles.backBtn} />
          )}
          {step !== 'summary' ? (
            <Button title="Continue" onPress={next} style={styles.nextBtn} />
          ) : (
            <Button title="Start My Journey 🚀" onPress={handleComplete} loading={loading} style={styles.nextBtn} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  progressBar: { height: 4, backgroundColor: colors.border, marginTop: 60 },
  progressFill: { height: '100%', borderRadius: 2 },
  scroll: { padding: 24, paddingTop: 20 },
  stepCount: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 6 },
  stepSubtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 24 },
  inputLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  textInput: {
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 16,
  },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, marginBottom: 10, flex: 1,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  optionText: { color: colors.textMuted, fontSize: 14, flex: 1 },
  optionTextActive: { color: colors.primary, fontWeight: '600' },
  optionCheck: { marginLeft: 'auto' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, alignItems: 'center',
  },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  summaryInfo: { backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  summaryInfoText: { color: colors.textMuted, fontSize: 14 },
  summaryInfoValue: { color: colors.text, fontWeight: '600' },
});
