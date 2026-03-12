import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parseGroceryList } from '../../../lib/claude-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type ResponseData = {
  success?: boolean;
  groceryList?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    const { dietPlanId } = req.body;

    if (!dietPlanId) {
      return res.status(400).json({ error: 'Diet plan ID required' });
    }

    // Get diet plan
    const { data: dietPlan, error: planError } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', dietPlanId)
      .eq('user_id', userId)
      .single();

    if (planError || !dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    if (!dietPlan.meals || typeof dietPlan.meals !== 'object') {
      return res.status(400).json({ error: 'Diet plan has no meals' });
    }

    // Parse meals to extract ingredients
    const items = await parseGroceryList(dietPlan.meals);

    // Group items by category
    const groupedItems = items.reduce((acc: Record<string, any[]>, item) => {
      const category = item.category || 'pantry';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        ...item,
        checked: false,
      });
      return acc;
    }, {});

    // Save grocery list
    const { data: listData, error: saveError } = await supabase
      .from('grocery_lists')
      .insert({
        user_id: userId,
        diet_plan_id: dietPlanId,
        items: items,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving grocery list:', saveError);
      return res.status(500).json({ error: 'Failed to save grocery list' });
    }

    return res.status(200).json({
      success: true,
      groceryList: {
        id: listData.id,
        items: groupedItems,
        rawItems: items,
      },
    });
  } catch (error) {
    console.error('Grocery list error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate grocery list',
    });
  }
}
