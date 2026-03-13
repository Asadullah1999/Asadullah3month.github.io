import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { getTodayLog, upsertDailyLog, DailyLog, MealItem } from '../../lib/database';
import { SAMPLE_FOODS } from '../../constants/Nutrition';
import { Colors } from '../../constants/Colors';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

const MEAL_TABS: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant' },
  { key: 'dinner', label: 'Dinner', icon: 'moon' },
  { key: 'snacks', label: 'Snacks', icon: 'ice-cream' },
];

const MOODS = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'bad', emoji: '😞', label: 'Bad' },
] as const;

function today() { return new Date().toISOString().split('T')[0]; }

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<MealType>('breakfast');
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('1');
  const [selectedFood, setSelectedFood] = useState<(typeof SAMPLE_FOODS)[0] | null>(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<DailyLog['mood']>(null);

  async function load() {
    if (!session?.user) return;
    const data = await getTodayLog(session.user.id, today());
    if (data) {
      setLog(data);
      setNotes(data.notes ?? '');
      setMood(data.mood);
    } else {
      setLog({
        user_id: session.user.id,
        log_date: today(),
        breakfast: [], lunch: [], dinner: [], snacks: [],
        total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0,
        water_ml: 0, mood: null, notes: null,
      });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function save(updatedLog: DailyLog) {
    setSaving(true);
    try {
      await upsertDailyLog(updatedLog);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function addFood() {
    if (!selectedFood || !log) return;
    const q = parseFloat(qty) || 1;
    const item: MealItem = {
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * q),
      protein: Math.round(selectedFood.protein * q * 10) / 10,
      carbs: Math.round(selectedFood.carbs * q * 10) / 10,
      fat: Math.round(selectedFood.fat * q * 10) / 10,
      quantity: q,
      unit: selectedFood.servingUnit ?? 'serving',
    };
    const updated: DailyLog = { ...log, [activeTab]: [...log[activeTab], item], mood, notes };
    setLog(updated);
    save(updated);
    setShowAddModal(false);
    setSelectedFood(null);
    setSearch('');
    setQty('1');
  }

  function removeItem(index: number) {
    if (!log) return;
    const items = [...log[activeTab]];
    items.splice(index, 1);
    const updated: DailyLog = { ...log, [activeTab]: items, mood, notes };
    setLog(updated);
    save(updated);
  }

  async function saveMoodNotes() {
    if (!log) return;
    const updated: DailyLog = { ...log, mood, notes };
    setLog(updated);
    await save(updated);
    Alert.alert('Saved', 'Mood and notes saved!');
  }

  const filteredFoods = SAMPLE_FOODS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentItems: MealItem[] = log?.[activeTab] ?? [];
  const totalCal = currentItems.reduce((s, i) => s + i.calories, 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <Text style={styles.headerTitle}>Log Meal</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </LinearGradient>

      {/* Meal Tabs */}
      <View style={styles.tabsRow}>
        {MEAL_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? Colors.primaryLight : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Current meal items */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{MEAL_TABS.find(t => t.key === activeTab)?.label}</Text>
            <Text style={styles.calBadge}>{totalCal} kcal</Text>
          </View>

          {currentItems.length === 0 ? (
            <View style={styles.emptyMeal}>
              <Ionicons name="add-circle-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nothing logged yet</Text>
            </View>
          ) : (
            currentItems.map((item, i) => (
              <View key={i} style={styles.foodItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodMacros}>P: {item.protein}g  C: {item.carbs}g  F: {item.fat}g</Text>
                </View>
                <Text style={styles.foodCal}>{item.calories} kcal</Text>
                <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addFoodBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color={Colors.primaryLight} />
            <Text style={styles.addFoodText}>Add Food</Text>
          </TouchableOpacity>
        </View>

        {/* Mood */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.moodBtn, mood === m.key && styles.moodBtnActive]}
                onPress={() => setMood(m.key)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, mood === m.key && { color: Colors.primaryLight }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any thoughts about today's meals..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveMoodNotes} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Notes & Mood</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setSelectedFood(null); setSearch(''); setQty('1'); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search food..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <ScrollView style={{ flex: 1 }}>
              {filteredFoods.map(food => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodRow, selectedFood?.id === food.id && styles.foodRowSelected]}
                  onPress={() => setSelectedFood(food)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodRowName}>{food.name}</Text>
                    <Text style={styles.foodRowMeta}>{food.calories} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</Text>
                  </View>
                  {selectedFood?.id === food.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedFood && (
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity (servings)</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.addBtn} onPress={addFood}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  tabsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primaryLight },
  tabText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryLight },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  calBadge: { fontSize: 14, fontWeight: '700', color: Colors.primaryLight },
  emptyMeal: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  foodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  foodName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  foodMacros: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  foodCal: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600', marginRight: 10 },
  removeBtn: { padding: 6 },
  addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.primaryLight, borderStyle: 'dashed' },
  addFoodText: { color: Colors.primaryLight, fontSize: 15, fontWeight: '600' },
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  moodBtnActive: { borderColor: Colors.primaryLight, backgroundColor: '#1B4332' },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  notesInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14, textAlignVertical: 'top', minHeight: 80, marginTop: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  searchInput: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 46, color: Colors.text, fontSize: 15, marginBottom: 12 },
  foodRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  foodRowSelected: { backgroundColor: '#1B4332' },
  foodRowName: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  foodRowMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  qtyLabel: { flex: 1, color: Colors.text, fontSize: 14 },
  qtyInput: { width: 70, backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 40, color: Colors.text, fontSize: 16, textAlign: 'center' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, height: 40, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
