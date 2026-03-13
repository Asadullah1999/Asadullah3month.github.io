export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: number;
  servingUnit: string;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'sports';
  caloriesPerMinute: number;
  muscleGroup?: string;
}

export interface WorkoutEntry {
  id: string;
  exercise: WorkoutExercise;
  duration: number; // minutes
  sets?: number;
  reps?: number;
  weight?: number; // kg
  caloriesBurned: number;
  date: string;
  timestamp: number;
}

export interface WaterEntry {
  id: string;
  amount: number; // ml
  date: string;
  timestamp: number;
}

export interface WeightEntry {
  id: string;
  weight: number; // kg
  date: string;
  timestamp: number;
}

export interface SleepEntry {
  id: string;
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  date: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieTarget: number;
  dailyWaterTarget: number; // ml
  dailyStepsTarget: number;
}

export interface DailyStats {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  waterIntake: number;
  steps: number;
  sleepHours: number;
  protein: number;
  carbs: number;
  fat: number;
}
