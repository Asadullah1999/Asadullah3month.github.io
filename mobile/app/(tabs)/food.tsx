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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../constants/Colors';
import { useFoodStore } from '../../store/useFoodStore';
import { SAMPLE_FOODS } from '../../constants/Nutrition';
import { FoodItem, MealEntry } from '../../types';
import { Card } from '../../components/ui/Card';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#FDCB6E',
  lunch: '#74C69D',
  dinner: '#A29BFE',
  snack: '#FD79A8',
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export default function FoodScreen() {
  const { meals, addMeal, removeMeal, getMealsByDate, getTodayCalories, getTodayMacros } = useFoodStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');

  const today = getTodayString();
  const todayMeals = getMealsByDate(today);
  const totalCalories = getTodayCalories();
  const macros = getTodayMacros();

  const filteredFoods = searchQuery.length > 1
    ? SAMPLE_FOODS.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SAMPLE_FOODS.slice(0, 10);

  const mealsByType = (type: MealType) => todayMeals.filter((m) => m.mealType === type);

  function handleAddFood() {
    if (!selectedFood) return;
    addMeal({
      foodItem: selectedFood,
      quantity: parseFloat(quantity) || 1,
      mealType: selectedMealType,
      date: today,
    });
    setSelectedFood(null);
    setQuantity('1');
    setShowSearch(false);
    setSearchQuery('');
  }

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Food Tracker</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowSearch(true)}
            >
              <Ionicons name="add" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Daily Summary */}
          <Card style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <SummaryItem label="Calories" value={`${Math.round(totalCalories)}`} unit="kcal" color={Colors.calories} />
              <SummaryItem label="Protein" value={`${Math.round(macros.protein)}`} unit="g" color={Colors.protein} />
              <SummaryItem label="Carbs" value={`${Math.round(macros.carbs)}`} unit="g" color={Colors.carbs} />
              <SummaryItem label="Fat" value={`${Math.round(macros.fat)}`} unit="g" color={Colors.fat} />
            </View>
          </Card>

          {/* Meal Type Selector */}
          <View style={styles.mealTypeRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeBtn,
                  selectedMealType === type && { backgroundColor: MEAL_COLORS[type] + '30', borderColor: MEAL_COLORS[type] },
                ]}
                onPress={() => setSelectedMealType(type)}
              >
                <Ionicons
                  name={MEAL_ICONS[type]}
                  size={14}
                  color={selectedMealType === type ? MEAL_COLORS[type] : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.mealTypeLabel,
                    selectedMealType === type && { color: MEAL_COLORS[type] },
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meals Sections */}
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
            const typeMeals = mealsByType(type);
            const typeCalories = typeMeals.reduce(
              (sum, m) => sum + m.foodItem.calories * m.quantity,
              0
            );
            return (
              <Card key={type} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealHeaderLeft}>
                    <Ionicons
                      name={MEAL_ICONS[type]}
                      size={18}
                      color={MEAL_COLORS[type]}
                    />
                    <Text style={styles.mealTitle}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.mealHeaderRight}>
                    <Text style={[styles.mealCalories, { color: MEAL_COLORS[type] }]}>
                      {Math.round(typeCalories)} kcal
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMealType(type);
                        setShowSearch(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={22} color={MEAL_COLORS[type]} />
                    </TouchableOpacity>
                  </View>
                </View>
                {typeMeals.length === 0 ? (
                  <Text style={styles.emptyMeal}>Tap + to add food</Text>
                ) : (
                  typeMeals.map((meal) => (
                    <View key={meal.id} style={styles.mealItem}>
                      <View style={styles.mealItemLeft}>
                        <Text style={styles.mealItemName}>{meal.foodItem.name}</Text>
                        <Text style={styles.mealItemDetail}>
                          {meal.quantity} × {meal.foodItem.servingSize}{meal.foodItem.servingUnit} •{' '}
                          {Math.round(meal.foodItem.protein * meal.quantity)}g P •{' '}
                          {Math.round(meal.foodItem.carbs * meal.quantity)}g C •{' '}
                          {Math.round(meal.foodItem.fat * meal.quantity)}g F
                        </Text>
                      </View>
                      <View style={styles.mealItemRight}>
                        <Text style={styles.mealItemCal}>
                          {Math.round(meal.foodItem.calories * meal.quantity)} kcal
                        </Text>
                        <TouchableOpacity onPress={() => removeMeal(meal.id)}>
                          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </Card>
            );
          })}

        </ScrollView>
      </SafeAreaView>

      {/* Food Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add to {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSelectedFood(null); setSearchQuery(''); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search food..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {selectedFood ? (
            <View style={styles.selectedFood}>
              <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
              <Text style={styles.selectedFoodMacros}>
                {selectedFood.calories} kcal • {selectedFood.protein}g protein • {selectedFood.carbs}g carbs • {selectedFood.fat}g fat
              </Text>
              <Text style={styles.selectedFoodServing}>
                Per {selectedFood.servingSize}{selectedFood.servingUnit}
              </Text>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Servings:</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(String(Math.max(0.5, parseFloat(quantity) - 0.5)))}
                >
                  <Ionicons name="remove" size={18} color={Colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(String(parseFloat(quantity) + 0.5))}
                >
                  <Ionicons name="add" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.totalCals}>
                Total: {Math.round(selectedFood.calories * parseFloat(quantity || '1'))} kcal
              </Text>
              <TouchableOpacity style={styles.addFoodBtn} onPress={handleAddFood}>
                <Text style={styles.addFoodBtnText}>Add to {selectedMealType}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedFood(null)}>
                <Text style={styles.backBtnText}>← Back to search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.foodList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.foodRow}
                  onPress={() => setSelectedFood(item)}
                >
                  <View style={styles.foodRowLeft}>
                    <Text style={styles.foodRowName}>{item.name}</Text>
                    <Text style={styles.foodRowDetail}>
                      {item.servingSize}{item.servingUnit} • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                    </Text>
                  </View>
                  <Text style={styles.foodRowCal}>{item.calories} kcal</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
}

function SummaryItem({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

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
  summaryCard: {},
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryUnit: { fontSize: 11, color: Colors.textMuted },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mealTypeRow: { flexDirection: 'row', gap: 8 },
  mealTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  mealTypeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  mealCard: { gap: 8 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  mealCalories: { fontSize: 13, fontWeight: '600' },
  emptyMeal: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  mealItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  mealItemLeft: { flex: 1 },
  mealItemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  mealItemDetail: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  mealItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealItemCal: { fontSize: 13, fontWeight: '700', color: Colors.calories },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  foodList: { paddingBottom: 20 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  foodRowLeft: { flex: 1 },
  foodRowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  foodRowDetail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  foodRowCal: { fontSize: 14, fontWeight: '700', color: Colors.primaryLight },
  separator: { height: 1, backgroundColor: Colors.border },
  selectedFood: { padding: 4, gap: 8 },
  selectedFoodName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  selectedFoodMacros: { fontSize: 13, color: Colors.textSecondary },
  selectedFoodServing: { fontSize: 12, color: Colors.textMuted },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  quantityLabel: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    width: 60, height: 40, textAlign: 'center', borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, color: Colors.text, fontSize: 16, fontWeight: '700', backgroundColor: Colors.surface,
  },
  totalCals: { fontSize: 18, fontWeight: '700', color: Colors.primaryLight, marginTop: 4 },
  addFoodBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  addFoodBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  backBtn: { alignItems: 'center', padding: 12 },
  backBtnText: { fontSize: 14, color: Colors.textSecondary },
});
