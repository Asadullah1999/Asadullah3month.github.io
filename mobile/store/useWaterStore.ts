import { create } from 'zustand';
import { WaterEntry } from '../types';

interface WaterState {
  entries: WaterEntry[];
  addWater: (amount: number) => void;
  removeWater: (id: string) => void;
  getTodayIntake: () => number;
  getIntakeByDate: (date: string) => number;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useWaterStore = create<WaterState>((set, get) => ({
  entries: [],

  addWater: (amount) => {
    const entry: WaterEntry = {
      id: `water_${Date.now()}`,
      amount,
      date: getTodayString(),
      timestamp: Date.now(),
    };
    set((state) => ({ entries: [...state.entries, entry] }));
  },

  removeWater: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  getTodayIntake: () => {
    const today = getTodayString();
    return get()
      .entries.filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getIntakeByDate: (date) => {
    return get()
      .entries.filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.amount, 0);
  },
}));
