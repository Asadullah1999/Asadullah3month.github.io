import { ActivityLevel, Goal } from '../types';

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  if (gender === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose_weight': return Math.max(1200, tdee - 500);
    case 'gain_muscle': return tdee + 300;
    default: return tdee;
  }
}

export function calculateMacros(calories: number, goal: Goal) {
  let proteinPct: number, carbPct: number, fatPct: number;
  switch (goal) {
    case 'gain_muscle':
      proteinPct = 0.35; carbPct = 0.45; fatPct = 0.20; break;
    case 'lose_weight':
      proteinPct = 0.40; carbPct = 0.35; fatPct = 0.25; break;
    default:
      proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
  }
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
