import { FoodItem, WorkoutExercise } from '../types';

export const SAMPLE_FOODS: FoodItem[] = [
  { id: '1', name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, servingSize: 100, servingUnit: 'g' },
  { id: '2', name: 'Brown Rice (cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, servingSize: 195, servingUnit: 'g' },
  { id: '3', name: 'Egg (boiled)', calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, servingSize: 50, servingUnit: 'g' },
  { id: '4', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, servingSize: 118, servingUnit: 'g' },
  { id: '5', name: 'Oatmeal (cooked)', calories: 147, protein: 5, carbs: 25, fat: 2.5, fiber: 4, servingSize: 234, servingUnit: 'g' },
  { id: '6', name: 'Greek Yogurt (plain)', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, servingSize: 170, servingUnit: 'g' },
  { id: '7', name: 'Salmon (baked)', calories: 208, protein: 28, carbs: 0, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g' },
  { id: '8', name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, fiber: 3.8, servingSize: 130, servingUnit: 'g' },
  { id: '9', name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, servingSize: 28, servingUnit: 'g' },
  { id: '10', name: 'Broccoli (steamed)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1, servingSize: 156, servingUnit: 'g' },
  { id: '11', name: 'Avocado', calories: 240, protein: 3, carbs: 12, fat: 22, fiber: 10, servingSize: 150, servingUnit: 'g' },
  { id: '12', name: 'Whole Wheat Bread', calories: 69, protein: 3.6, carbs: 12, fat: 1.1, fiber: 1.9, servingSize: 28, servingUnit: 'g' },
  { id: '13', name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, servingSize: 131, servingUnit: 'g' },
  { id: '14', name: 'Tuna (canned)', calories: 109, protein: 25, carbs: 0, fat: 0.5, fiber: 0, servingSize: 100, servingUnit: 'g' },
  { id: '15', name: 'Lentils (cooked)', calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 16, servingSize: 198, servingUnit: 'g' },
  { id: '16', name: 'Milk (low fat)', calories: 102, protein: 8, carbs: 12, fat: 2.5, fiber: 0, servingSize: 240, servingUnit: 'ml' },
  { id: '17', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, servingSize: 182, servingUnit: 'g' },
  { id: '18', name: 'Quinoa (cooked)', calories: 222, protein: 8, carbs: 39, fat: 3.5, fiber: 5, servingSize: 185, servingUnit: 'g' },
  { id: '19', name: 'Spinach (raw)', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7, servingSize: 30, servingUnit: 'g' },
  { id: '20', name: 'Cottage Cheese', calories: 206, protein: 25, carbs: 8, fat: 9, fiber: 0, servingSize: 226, servingUnit: 'g' },
];

export const EXERCISES: WorkoutExercise[] = [
  { id: 'e1', name: 'Running', category: 'cardio', caloriesPerMinute: 11, muscleGroup: 'Full body' },
  { id: 'e2', name: 'Cycling', category: 'cardio', caloriesPerMinute: 9, muscleGroup: 'Legs' },
  { id: 'e3', name: 'Swimming', category: 'cardio', caloriesPerMinute: 10, muscleGroup: 'Full body' },
  { id: 'e4', name: 'Jump Rope', category: 'cardio', caloriesPerMinute: 13, muscleGroup: 'Full body' },
  { id: 'e5', name: 'Walking', category: 'cardio', caloriesPerMinute: 5, muscleGroup: 'Legs' },
  { id: 'e6', name: 'Push-ups', category: 'strength', caloriesPerMinute: 7, muscleGroup: 'Chest & Arms' },
  { id: 'e7', name: 'Pull-ups', category: 'strength', caloriesPerMinute: 8, muscleGroup: 'Back & Arms' },
  { id: 'e8', name: 'Squats', category: 'strength', caloriesPerMinute: 8, muscleGroup: 'Legs & Glutes' },
  { id: 'e9', name: 'Deadlift', category: 'strength', caloriesPerMinute: 9, muscleGroup: 'Full body' },
  { id: 'e10', name: 'Bench Press', category: 'strength', caloriesPerMinute: 7, muscleGroup: 'Chest' },
  { id: 'e11', name: 'Yoga', category: 'flexibility', caloriesPerMinute: 3, muscleGroup: 'Full body' },
  { id: 'e12', name: 'Pilates', category: 'flexibility', caloriesPerMinute: 4, muscleGroup: 'Core' },
  { id: 'e13', name: 'HIIT', category: 'cardio', caloriesPerMinute: 14, muscleGroup: 'Full body' },
  { id: 'e14', name: 'Plank', category: 'strength', caloriesPerMinute: 5, muscleGroup: 'Core' },
  { id: 'e15', name: 'Lunges', category: 'strength', caloriesPerMinute: 6, muscleGroup: 'Legs' },
];

export const MEAL_PLAN_SUGGESTIONS = [
  {
    id: 'mp1',
    name: 'Weight Loss Plan',
    calories: 1500,
    meals: [
      { type: 'breakfast', name: 'Oatmeal + Greek Yogurt + Banana', calories: 350 },
      { type: 'lunch', name: 'Grilled Chicken + Brown Rice + Broccoli', calories: 450 },
      { type: 'snack', name: 'Almonds + Apple', calories: 200 },
      { type: 'dinner', name: 'Salmon + Sweet Potato + Spinach', calories: 500 },
    ],
  },
  {
    id: 'mp2',
    name: 'Muscle Gain Plan',
    calories: 2500,
    meals: [
      { type: 'breakfast', name: 'Eggs + Whole Wheat Toast + Milk', calories: 600 },
      { type: 'lunch', name: 'Chicken Breast + Quinoa + Avocado', calories: 700 },
      { type: 'snack', name: 'Cottage Cheese + Almonds', calories: 400 },
      { type: 'dinner', name: 'Tuna + Lentils + Brown Rice', calories: 800 },
    ],
  },
  {
    id: 'mp3',
    name: 'Balanced Maintenance',
    calories: 2000,
    meals: [
      { type: 'breakfast', name: 'Greek Yogurt + Banana + Oats', calories: 450 },
      { type: 'lunch', name: 'Tuna Salad + Whole Wheat Bread', calories: 500 },
      { type: 'snack', name: 'Orange + Almonds', calories: 250 },
      { type: 'dinner', name: 'Chicken + Sweet Potato + Spinach', calories: 800 },
    ],
  },
];

export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: 'Underweight', color: '#74B9FF' };
  if (bmi < 25) return { category: 'Normal', color: '#00B894' };
  if (bmi < 30) return { category: 'Overweight', color: '#FDCB6E' };
  return { category: 'Obese', color: '#FF6B6B' };
}

export function calculateTDEE(profile: {
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
}): number {
  let bmr: number;
  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(bmr * (multipliers[profile.activityLevel] || 1.55));
}
