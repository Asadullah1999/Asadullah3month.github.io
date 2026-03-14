import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  diet_preference: string | null;
  calorie_target: number | null;
  protein_target: number | null;
  carb_target: number | null;
  fat_target: number | null;
  onboarded: boolean;
};

export type MealItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
};

export type DailyLog = {
  id?: string;
  user_id: string;
  log_date: string;
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  water_ml: number;
  mood: 'great' | 'good' | 'okay' | 'bad' | null;
  notes: string | null;
};

export type Reminder = {
  id: string;
  user_id: string;
  type: 'meal' | 'water' | 'weigh_in' | 'custom';
  title: string;
  message: string;
  time: string;
  days: string[];
  is_active: boolean;
  channel: 'whatsapp' | 'push' | 'both';
};

export type WhatsAppContact = {
  id: string;
  user_id: string;
  phone_number: string;
  display_name: string | null;
  is_verified: boolean;
  opt_in: boolean;
};

// ── User ──────────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function createUserProfile(userId: string, email: string, fullName: string) {
  const { error } = await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: fullName,
    onboarded: false,
  });
  if (error) throw error;
}

// ── Daily Logs ─────────────────────────────────────────────────────────────────

export async function getTodayLog(userId: string, date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .single();
  if (error) return null;
  return data as DailyLog;
}

export async function upsertDailyLog(log: DailyLog) {
  const totals = recalcTotals(log);
  const { error } = await supabase.from('daily_logs').upsert({
    ...log,
    ...totals,
    checkin_time: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getWeekLogs(userId: string): Promise<DailyLog[]> {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .in('log_date', dates)
    .order('log_date', { ascending: false });
  if (error) return [];
  return data as DailyLog[];
}

function recalcTotals(log: DailyLog) {
  const all = [...log.breakfast, ...log.lunch, ...log.dinner, ...log.snacks];
  return {
    total_calories: Math.round(all.reduce((s, i) => s + i.calories, 0)),
    total_protein: Math.round(all.reduce((s, i) => s + i.protein, 0)),
    total_carbs: Math.round(all.reduce((s, i) => s + i.carbs, 0)),
    total_fat: Math.round(all.reduce((s, i) => s + i.fat, 0)),
  };
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────

export async function getWhatsAppContact(userId: string): Promise<WhatsAppContact | null> {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as WhatsAppContact;
}

export async function upsertWhatsAppContact(contact: Partial<WhatsAppContact> & { user_id: string }) {
  const { error } = await supabase.from('whatsapp_contacts').upsert(contact);
  if (error) throw error;
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export async function getReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('time');
  if (error) return [];
  return data as Reminder[];
}

export async function createReminder(reminder: Omit<Reminder, 'id'>) {
  const { error } = await supabase.from('reminders').insert(reminder);
  if (error) throw error;
}

export async function toggleReminder(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('reminders')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
}

// ── TDEE Calculator ───────────────────────────────────────────────────────────

export function calculateCalorieTarget(profile: Partial<UserProfile>): number {
  const { age = 25, gender = 'male', height_cm = 170, weight_kg = 70, activity_level = 'moderate', goal = 'maintain' } = profile;
  let bmr = gender === 'female'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    : 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const multipliers: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  const tdee = bmr * (multipliers[activity_level] ?? 1.55);
  if (goal === 'lose_weight') return Math.round(tdee - 500);
  if (goal === 'gain_muscle') return Math.round(tdee + 300);
  return Math.round(tdee);
}
