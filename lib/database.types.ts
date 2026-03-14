export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MealItem = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: string
}

export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  height_cm: number | null
  weight_kg: number | null
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  diet_preference: 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher' | null
  calorie_target: number | null
  protein_target: number | null
  carb_target: number | null
  fat_target: number | null
  onboarded: boolean
  role: 'user' | 'admin' | 'nutritionist'
  created_at: string
  updated_at: string
}

export type DailyLog = {
  id: string
  user_id: string
  log_date: string
  breakfast: Json | null
  lunch: Json | null
  dinner: Json | null
  snacks: Json | null
  total_calories: number | null
  total_protein: number | null
  total_carbs: number | null
  total_fat: number | null
  water_ml: number | null
  mood: 'great' | 'good' | 'okay' | 'bad' | null
  notes: string | null
  checkin_time: string | null
  created_at: string
}

export type WhatsAppContact = {
  id: string
  user_id: string
  phone_number: string
  display_name: string | null
  is_verified: boolean
  verification_code: string | null
  verified_at: string | null
  opt_in: boolean
  last_message_at: string | null
  created_at: string
}

export type Reminder = {
  id: string
  user_id: string
  type: 'meal' | 'water' | 'weigh_in' | 'custom'
  title: string
  message: string | null
  time: string
  days: string[]
  is_active: boolean
  channel: 'whatsapp' | 'push' | 'both'
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'pro' | 'premium'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type DietPlan = {
  id: string
  user_id: string
  nutritionist_id: string | null
  title: string
  description: string | null
  meals: Json
  calorie_target: number
  protein_target: number
  carb_target: number
  fat_target: number
  is_active: boolean
  start_date: string
  end_date: string | null
  created_at: string
}

// Supabase Database type (used for createClient<Database>)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Partial<User> & { id: string; email: string }
        Update: Partial<User>
      }
      daily_logs: {
        Row: DailyLog
        Insert: Partial<DailyLog> & { user_id: string }
        Update: Partial<DailyLog>
      }
      whatsapp_contacts: {
        Row: WhatsAppContact
        Insert: Partial<WhatsAppContact> & { user_id: string; phone_number: string }
        Update: Partial<WhatsAppContact>
      }
      reminders: {
        Row: Reminder
        Insert: Partial<Reminder> & { user_id: string; type: Reminder['type']; title: string; time: string }
        Update: Partial<Reminder>
      }
      subscriptions: {
        Row: Subscription
        Insert: Partial<Subscription> & { user_id: string }
        Update: Partial<Subscription>
      }
      diet_plans: {
        Row: DietPlan
        Insert: Partial<DietPlan> & { user_id: string; title: string; calorie_target: number }
        Update: Partial<DietPlan>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Partial<ChatMessage> & { user_id: string; role: ChatMessage['role']; content: string }
        Update: Partial<ChatMessage>
      }
    }
  }
}
