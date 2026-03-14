import { create } from 'zustand';
import { WorkoutEntry } from '../types';

interface WorkoutState {
  workouts: WorkoutEntry[];
  addWorkout: (entry: Omit<WorkoutEntry, 'id' | 'timestamp' | 'caloriesBurned'>) => void;
  removeWorkout: (id: string) => void;
  getTodayWorkouts: () => WorkoutEntry[];
  getTodayCaloriesBurned: () => number;
  getWorkoutsByDate: (date: string) => WorkoutEntry[];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],

  addWorkout: (entry) => {
    const caloriesBurned = Math.round(entry.exercise.caloriesPerMinute * entry.duration);
    const newWorkout: WorkoutEntry = {
      ...entry,
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caloriesBurned,
      timestamp: Date.now(),
    };
    set((state) => ({ workouts: [...state.workouts, newWorkout] }));
  },

  removeWorkout: (id) => {
    set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) }));
  },

  getTodayWorkouts: () => {
    const today = getTodayString();
    return get().workouts.filter((w) => w.date === today);
  },

  getTodayCaloriesBurned: () => {
    const today = getTodayString();
    return get()
      .workouts.filter((w) => w.date === today)
      .reduce((sum, w) => sum + w.caloriesBurned, 0);
  },

  getWorkoutsByDate: (date) => {
    return get().workouts.filter((w) => w.date === date);
  },
}));
