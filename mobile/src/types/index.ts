export type UserRole = 'user' | 'admin' | 'nutritionist';
export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type DietPreference = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten_free';
export type Mood = 'great' | 'good' | 'okay' | 'bad';
export type ReminderType = 'meal' | 'water' | 'weigh_in' | 'custom';
export type ReminderChannel = 'whatsapp' | 'push' | 'both';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: Goal | null;
  activity_level: ActivityLevel | null;
  diet_preference: DietPreference | null;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  onboarded: boolean;
  role: UserRole;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  quantity?: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
  snacks: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  water_ml: number;
  mood: Mood | null;
  notes: string | null;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  notes: string | null;
}

export interface SleepLog {
  id: string;
  user_id: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
  quality: number;
  notes: string | null;
  logged_date: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  message: string;
  time: string;
  days: string[];
  channel: ReminderChannel;
  is_active: boolean;
}

export interface WhatsAppContact {
  id: string;
  user_id: string;
  phone_number: string;
  is_verified: boolean;
  opt_in: boolean;
}

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  CheckIn: undefined;
  Scan: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  AIChat: undefined;
  MealScanner: undefined;
  BarcodeScanner: undefined;
  WeightLog: undefined;
  Sleep: undefined;
  GroceryList: undefined;
  WhatsApp: undefined;
  Reminders: undefined;
  Settings: undefined;
  Workout: undefined;
  Pricing: undefined;
};
