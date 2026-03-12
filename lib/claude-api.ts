import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY,
});

export async function analyzeMealImage(imageBase64: string): Promise<{
  meals: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: number;
}> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this food image and provide nutritional information. Return a JSON object with this structure:
{
  "meals": [
    {
      "name": "food item name",
      "calories": number,
      "protein": number in grams,
      "carbs": number in grams,
      "fat": number in grams
    }
  ],
  "totalCalories": sum of all calories,
  "totalProtein": sum of all protein,
  "totalCarbs": sum of all carbs,
  "totalFat": sum of all fat,
  "confidence": confidence score from 0-100
}

Be as accurate as possible with portion sizes based on visual estimation.`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    // Extract JSON from the response (might be wrapped in markdown code blocks)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse meal analysis:', error);
    throw new Error('Failed to parse meal analysis from AI response');
  }
}

export function buildNutritionistSystemPrompt(userData: {
  full_name: string | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  calorie_target: number | null;
  protein_target: number | null;
  carb_target: number | null;
  fat_target: number | null;
  diet_preference: string | null;
}, recentLogs: Array<{
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  log_date: string;
}>, activePlan: {
  title: string;
  description: string | null;
  meals: any;
} | null): string {
  const avgCalories = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0) / recentLogs.length)
    : 0;

  return `You are an expert nutrition coach and AI nutritionist. You are helping ${userData.full_name || 'the user'} achieve their nutrition goals.

User Profile:
- Age: ${userData.age || 'Not specified'}
- Gender: ${userData.gender || 'Not specified'}
- Goal: ${userData.goal || 'Improve overall health'}
- Diet Preference: ${userData.diet_preference || 'No preference'}

Daily Nutrition Targets:
- Calories: ${userData.calorie_target || 'Not set'}
- Protein: ${userData.protein_target || 'Not set'}g
- Carbs: ${userData.carb_target || 'Not set'}g
- Fat: ${userData.fat_target || 'Not set'}g

Recent Progress (Last 7 days):
- Average daily calories: ${avgCalories}
${activePlan ? `- Active Diet Plan: ${activePlan.title}` : ''}

Provide personalized, evidence-based nutrition advice. Be encouraging and practical. If the user mentions specific foods or meals, provide nutritional analysis and suggestions for improvement. Always consider their stated goals and preferences.`;
}

export async function nutritionistChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as any,
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}

export async function parseGroceryList(meals: any[]): Promise<Array<{
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
}>> {
  const mealSummary = JSON.stringify(meals);

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Parse these meals and extract all ingredients with quantities. Return a JSON array of objects with this structure:
[
  {
    "ingredient": "ingredient name",
    "quantity": number,
    "unit": "cups/grams/tbsp/etc",
    "category": "proteins/vegetables/grains/dairy/fruits/pantry/spices"
  }
]

Consolidate similar ingredients (e.g., combine "2 cups rice" + "1 cup rice" into one entry with quantity 3).
Be as specific as possible with categories.

Meals:
${mealSummary}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse grocery list:', error);
    throw new Error('Failed to parse grocery list from AI response');
  }
}
