-- NutriCoach Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- USERS TABLE (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  age integer check (age > 0 and age < 120),
  gender text check (gender in ('male','female','other')),
  height_cm numeric(5,1) check (height_cm > 0),
  weight_kg numeric(5,1) check (weight_kg > 0),
  goal text check (goal in ('lose_weight','gain_muscle','maintain','improve_health')),
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  diet_preference text check (diet_preference in ('omnivore','vegetarian','vegan','keto','paleo','halal','kosher')),
  calorie_target integer,
  protein_target integer,
  carb_target integer,
  fat_target integer,
  onboarded boolean default false,
  role text default 'user' check (role in ('user','admin','nutritionist')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- DIET PLANS
-- ─────────────────────────────────────────────
create table if not exists public.diet_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  nutritionist_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  meals jsonb default '[]'::jsonb,
  calorie_target integer not null,
  protein_target integer not null default 0,
  carb_target integer not null default 0,
  fat_target integer not null default 0,
  is_active boolean default true,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- DAILY LOGS
-- ─────────────────────────────────────────────
create table if not exists public.daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  log_date date not null default current_date,
  breakfast jsonb default '[]'::jsonb,
  lunch jsonb default '[]'::jsonb,
  dinner jsonb default '[]'::jsonb,
  snacks jsonb default '[]'::jsonb,
  total_calories integer default 0,
  total_protein numeric(6,1) default 0,
  total_carbs numeric(6,1) default 0,
  total_fat numeric(6,1) default 0,
  water_ml integer default 0,
  mood text check (mood in ('great','good','okay','bad')),
  notes text,
  checkin_time timestamptz,
  created_at timestamptz default now(),
  unique(user_id, log_date)
);

-- ─────────────────────────────────────────────
-- WHATSAPP CONTACTS
-- ─────────────────────────────────────────────
create table if not exists public.whatsapp_contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  phone_number text not null,
  display_name text,
  is_verified boolean default false,
  verification_code text,
  verified_at timestamptz,
  opt_in boolean default true,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- REMINDERS
-- ─────────────────────────────────────────────
create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('meal','water','weigh_in','custom')),
  title text not null,
  message text,
  time time not null,
  days text[] not null default '{mon,tue,wed,thu,fri,sat,sun}',
  is_active boolean default true,
  channel text default 'whatsapp' check (channel in ('whatsapp','push','both')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' check (plan in ('free','pro','premium')),
  status text default 'active' check (status in ('active','canceled','past_due','trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.diet_plans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.whatsapp_contacts enable row level security;
alter table public.reminders enable row level security;
alter table public.subscriptions enable row level security;

-- Users: own row access
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Helper function to get current user's role without causing RLS recursion
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.users where id = auth.uid()
$$;

-- Nutritionists can read all users (uses security definer function to avoid recursion)
create policy "nutritionist_select_all_users" on public.users for select
  using (auth.uid() = id or get_my_role() in ('admin','nutritionist'));

-- Diet plans
create policy "dietplans_select_own" on public.diet_plans for select using (auth.uid() = user_id);
create policy "dietplans_insert_own" on public.diet_plans for insert with check (auth.uid() = user_id);
create policy "dietplans_update_own" on public.diet_plans for update using (auth.uid() = user_id);
create policy "dietplans_nutritionist_all" on public.diet_plans for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','nutritionist')));

-- Daily logs
create policy "dailylogs_select_own" on public.daily_logs for select using (auth.uid() = user_id);
create policy "dailylogs_insert_own" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "dailylogs_update_own" on public.daily_logs for update using (auth.uid() = user_id);
create policy "dailylogs_nutritionist_read" on public.daily_logs for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','nutritionist')));

-- WhatsApp contacts
create policy "wa_select_own" on public.whatsapp_contacts for select using (auth.uid() = user_id);
create policy "wa_insert_own" on public.whatsapp_contacts for insert with check (auth.uid() = user_id);
create policy "wa_update_own" on public.whatsapp_contacts for update using (auth.uid() = user_id);

-- Reminders
create policy "reminders_select_own" on public.reminders for select using (auth.uid() = user_id);
create policy "reminders_insert_own" on public.reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update_own" on public.reminders for update using (auth.uid() = user_id);
create policy "reminders_delete_own" on public.reminders for delete using (auth.uid() = user_id);

-- Subscriptions
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subs_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "subs_update_own" on public.subscriptions for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- HEALTH CONDITION COLUMNS (migration)
-- ─────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS health_conditions jsonb DEFAULT '[]';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS medications text[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS diabetes_type text DEFAULT 'none'
  CHECK (diabetes_type IN ('none','type1','type2','prediabetic','gestational'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bp_status text DEFAULT 'normal'
  CHECK (bp_status IN ('normal','elevated','high_stage1','high_stage2','hypertensive_crisis'));

-- ─────────────────────────────────────────────
-- CHAT MESSAGES (AI Nutritionist conversations)
-- ─────────────────────────────────────────────
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Index for fast per-user queries
create index if not exists chat_messages_user_id_idx
  on public.chat_messages(user_id, created_at desc);

-- RLS
alter table public.chat_messages enable row level security;

-- Users can read/insert their own messages
create policy "chat_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- Admins/nutritionists can read all messages
create policy "chat_admin_read" on public.chat_messages
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','nutritionist')
    )
  );
