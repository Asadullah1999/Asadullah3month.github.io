import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../constants/Colors';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { EXERCISES } from '../../constants/Nutrition';
import { WorkoutExercise, WorkoutEntry } from '../../types';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cardio: 'heart-outline',
  strength: 'barbell-outline',
  flexibility: 'body-outline',
  sports: 'football-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  cardio: '#FF6B6B',
  strength: '#FDCB6E',
  flexibility: '#74B9FF',
  sports: '#74C69D',
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export default function WorkoutScreen() {
  const { workouts, addWorkout, removeWorkout, getTodayWorkouts, getTodayCaloriesBurned } = useWorkoutStore();
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [duration, setDuration] = useState('30');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const todayWorkouts = getTodayWorkouts();
  const caloriesBurned = getTodayCaloriesBurned();
  const totalMinutes = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);

  const filteredExercises = EXERCISES.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleAddWorkout() {
    if (!selectedExercise || !duration) return;
    addWorkout({
      exercise: selectedExercise,
      duration: parseInt(duration) || 30,
      sets: sets ? parseInt(sets) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      weight: weightKg ? parseFloat(weightKg) : undefined,
      date: getTodayString(),
    });
    setSelectedExercise(null);
    setDuration('30');
    setSets('');
    setReps('');
    setWeightKg('');
    setSearchQuery('');
    setShowAdd(false);
  }

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Workout</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              label="Burned"
              value={String(Math.round(caloriesBurned))}
              unit="kcal"
              gradient={Gradients.calories}
              style={styles.half}
            />
            <StatCard
              icon="time-outline"
              label="Duration"
              value={String(totalMinutes)}
              unit="min"
              gradient={Gradients.workout}
              style={styles.half}
            />
          </View>

          {/* Today's Workouts */}
          <Card>
            <Text style={styles.sectionTitle}>Today's Sessions</Text>
            {todayWorkouts.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="barbell-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No workouts logged yet</Text>
                <Text style={styles.emptyHint}>Tap + to add your first session</Text>
              </View>
            ) : (
              todayWorkouts.map((w) => (
                <WorkoutRow key={w.id} workout={w} onRemove={() => removeWorkout(w.id)} />
              ))
            )}
          </Card>

          {/* Quick Add Buttons */}
          <Card>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickGrid}>
              {EXERCISES.slice(0, 6).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.quickBtn}
                  onPress={() => {
                    setSelectedExercise(ex);
                    setShowAdd(true);
                  }}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[ex.category]}
                    size={20}
                    color={CATEGORY_COLORS[ex.category]}
                  />
                  <Text style={styles.quickBtnText} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.quickBtnCal}>{ex.caloriesPerMinute} kcal/min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

        </ScrollView>
      </SafeAreaView>

      {/* Add Workout Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Workout</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setSelectedExercise(null); setSearchQuery(''); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {selectedExercise ? (
            <ScrollView contentContainerStyle={styles.formScroll}>
              <View style={styles.selectedEx}>
                <View style={[styles.exIcon, { backgroundColor: CATEGORY_COLORS[selectedExercise.category] + '20' }]}>
                  <Ionicons name={CATEGORY_ICONS[selectedExercise.category]} size={24} color={CATEGORY_COLORS[selectedExercise.category]} />
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{selectedExercise.name}</Text>
                  <Text style={styles.exDetail}>{selectedExercise.muscleGroup} • {selectedExercise.caloriesPerMinute} kcal/min</Text>
                </View>
              </View>

              <FormField label="Duration (minutes)" value={duration} onChange={setDuration} keyboardType="number-pad" />

              {selectedExercise.category === 'strength' && (
                <>
                  <FormField label="Sets (optional)" value={sets} onChange={setSets} keyboardType="number-pad" />
                  <FormField label="Reps (optional)" value={reps} onChange={setReps} keyboardType="number-pad" />
                  <FormField label="Weight kg (optional)" value={weightKg} onChange={setWeightKg} keyboardType="decimal-pad" />
                </>
              )}

              {duration ? (
                <Text style={styles.calPreview}>
                  Estimated: {Math.round(selectedExercise.caloriesPerMinute * (parseInt(duration) || 0))} kcal burned
                </Text>
              ) : null}

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddWorkout}>
                <Text style={styles.saveBtnText}>Log Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedExercise(null)}>
                <Text style={styles.backBtnText}>← Back to exercises</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <View style={styles.catRow}>
                {[null, 'cardio', 'strength', 'flexibility'].map((cat) => (
                  <TouchableOpacity
                    key={String(cat)}
                    style={[styles.catBtn, categoryFilter === cat && styles.catBtnActive]}
                    onPress={() => setCategoryFilter(cat)}
                  >
                    <Text style={[styles.catLabel, categoryFilter === cat && styles.catLabelActive]}>
                      {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.exList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.exRow} onPress={() => setSelectedExercise(item)}>
                    <View style={[styles.exRowIcon, { backgroundColor: CATEGORY_COLORS[item.category] + '20' }]}>
                      <Ionicons name={CATEGORY_ICONS[item.category]} size={20} color={CATEGORY_COLORS[item.category]} />
                    </View>
                    <View style={styles.exRowInfo}>
                      <Text style={styles.exRowName}>{item.name}</Text>
                      <Text style={styles.exRowDetail}>{item.muscleGroup}</Text>
                    </View>
                    <Text style={styles.exRowCal}>{item.caloriesPerMinute} kcal/min</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
}

function WorkoutRow({ workout, onRemove }: { workout: WorkoutEntry; onRemove: () => void }) {
  const color = CATEGORY_COLORS[workout.exercise.category];
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, { backgroundColor: color + '20' }]}>
        <Ionicons name={CATEGORY_ICONS[workout.exercise.category]} size={18} color={color} />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{workout.exercise.name}</Text>
        <Text style={rowStyles.detail}>
          {workout.duration} min
          {workout.sets ? ` • ${workout.sets} sets` : ''}
          {workout.reps ? ` × ${workout.reps} reps` : ''}
          {workout.weight ? ` @ ${workout.weight}kg` : ''}
        </Text>
      </View>
      <View style={rowStyles.right}>
        <Text style={rowStyles.cal}>{workout.caloriesBurned} kcal</Text>
        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FormField({
  label, value, onChange, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'number-pad' | 'decimal-pad';
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

const formStyles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  detail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  cal: { fontSize: 13, fontWeight: '700', color: Colors.workout },
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  half: {},
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: Colors.textMuted },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  quickBtn: {
    width: '30%', backgroundColor: Colors.surfaceLight, borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnText: { fontSize: 11, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  quickBtnCal: { fontSize: 10, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  formScroll: { paddingBottom: 40 },
  selectedEx: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  exIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  exInfo: { flex: 1 },
  exName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  exDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  calPreview: { fontSize: 16, fontWeight: '700', color: Colors.primaryLight, textAlign: 'center', marginVertical: 12 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  backBtn: { alignItems: 'center', padding: 12 },
  backBtnText: { fontSize: 14, color: Colors.textSecondary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight },
  catLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  catLabelActive: { color: Colors.text },
  exList: { paddingBottom: 20 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  exRowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  exRowInfo: { flex: 1 },
  exRowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  exRowDetail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  exRowCal: { fontSize: 13, fontWeight: '700', color: Colors.workout },
  separator: { height: 1, backgroundColor: Colors.border },
});
