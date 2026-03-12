import Card from '@/components/ui/Card';
import { Flame, Droplet, Zap } from 'lucide-react';

interface DetectedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealDetectionCardProps {
  meals: DetectedMeal[];
  confidence: number;
  onAddMeal?: (meal: DetectedMeal) => void;
  loading?: boolean;
}

export function MealDetectionCard({
  meals,
  confidence,
  onAddMeal,
  loading,
}: MealDetectionCardProps) {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Detected Foods</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-2xl font-bold text-blue-600">{confidence}%</p>
        </div>
      </div>

      {/* Individual meals */}
      <div className="space-y-3 mb-6">
        {meals.map((meal, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900 capitalize">{meal.name}</h4>
              <span className="text-lg font-bold text-orange-600">{meal.calories} cal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Droplet className="w-4 h-4 text-blue-500" />
                <span>{meal.protein.toFixed(1)}g protein</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{meal.carbs.toFixed(1)}g carbs</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-red-500" />
                <span>{meal.fat.toFixed(1)}g fat</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-3">Total Nutrition</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Calories</p>
            <p className="text-2xl font-bold text-orange-600">{totalCalories}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Protein</p>
            <p className="text-2xl font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Carbs</p>
            <p className="text-2xl font-bold text-yellow-600">{totalCarbs.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fat</p>
            <p className="text-2xl font-bold text-red-600">{totalFat.toFixed(1)}g</p>
          </div>
        </div>
      </div>

      {onAddMeal && (
        <button
          disabled={loading}
          onClick={() => onAddMeal(meals[0])}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add to Today\'s Log'}
        </button>
      )}
    </Card>
  );
}
