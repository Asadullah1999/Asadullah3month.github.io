import { create } from 'zustand';
import { UserProfile, WeightEntry, SleepEntry } from '../types';
import { calculateTDEE } from '../constants/Nutrition';

interface ProfileState {
  profile: UserProfile;
  weightHistory: WeightEntry[];
  sleepHistory: SleepEntry[];
  steps: number;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logWeight: (weight: number) => void;
  logSleep: (hours: number, quality: 1 | 2 | 3 | 4 | 5) => void;
  updateSteps: (steps: number) => void;
  getBMI: () => number;
  recalculateCalorieTarget: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  age: 25,
  gender: 'male',
  height: 175,
  currentWeight: 75,
  targetWeight: 70,
  activityLevel: 'moderate',
  goal: 'lose',
  dailyCalorieTarget: 1800,
  dailyWaterTarget: 2500,
  dailyStepsTarget: 10000,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  weightHistory: [],
  sleepHistory: [],
  steps: 0,

  updateProfile: (updates) => {
    set((state) => ({
      profile: { ...state.profile, ...updates },
    }));
  },

  logWeight: (weight) => {
    const entry: WeightEntry = {
      id: `weight_${Date.now()}`,
      weight,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };
    set((state) => ({
      profile: { ...state.profile, currentWeight: weight },
      weightHistory: [...state.weightHistory, entry],
    }));
  },

  logSleep: (hours, quality) => {
    const entry: SleepEntry = {
      id: `sleep_${Date.now()}`,
      hours,
      quality,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };
    set((state) => ({ sleepHistory: [...state.sleepHistory, entry] }));
  },

  updateSteps: (steps) => {
    set({ steps });
  },

  getBMI: () => {
    const { profile } = get();
    const heightM = profile.height / 100;
    return parseFloat((profile.currentWeight / (heightM * heightM)).toFixed(1));
  },

  recalculateCalorieTarget: () => {
    const { profile } = get();
    const tdee = calculateTDEE(profile);
    let target = tdee;
    if (profile.goal === 'lose') target = tdee - 500;
    if (profile.goal === 'gain') target = tdee + 500;
    set((state) => ({
      profile: { ...state.profile, dailyCalorieTarget: Math.max(1200, target) },
    }));
  },
}));
