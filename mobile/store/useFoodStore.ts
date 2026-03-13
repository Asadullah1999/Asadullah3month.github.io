import { create } from 'zustand';
import { MealEntry, FoodItem } from '../types';

interface FoodState {
  meals: MealEntry[];
  addMeal: (entry: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  removeMeal: (id: string) => void;
  getMealsByDate: (date: string) => MealEntry[];
  getTodayCalories: () => number;
  getTodayMacros: () => { protein: number; carbs: number; fat: number; fiber: number };
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useFoodStore = create<FoodState>((set, get) => ({
  meals: [],

  addMeal: (entry) => {
    const newEntry: MealEntry = {
      ...entry,
      id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    set((state) => ({ meals: [...state.meals, newEntry] }));
  },

  removeMeal: (id) => {
    set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
  },

  getMealsByDate: (date) => {
    return get().meals.filter((m) => m.date === date);
  },

  getTodayCalories: () => {
    const today = getTodayString();
    return get()
      .meals.filter((m) => m.date === today)
      .reduce((sum, m) => sum + m.foodItem.calories * m.quantity, 0);
  },

  getTodayMacros: () => {
    const today = getTodayString();
    const todayMeals = get().meals.filter((m) => m.date === today);
    return todayMeals.reduce(
      (acc, m) => ({
        protein: acc.protein + m.foodItem.protein * m.quantity,
        carbs: acc.carbs + m.foodItem.carbs * m.quantity,
        fat: acc.fat + m.foodItem.fat * m.quantity,
        fiber: acc.fiber + m.foodItem.fiber * m.quantity,
      }),
      { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  },
}));
