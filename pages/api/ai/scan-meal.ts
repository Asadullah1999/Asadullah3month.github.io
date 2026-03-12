import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { analyzeMealImage } from '../../../lib/claude-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

type ResponseData = {
  success?: boolean;
  scan?: any;
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

    const { image, date } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate image format (should be base64)
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Convert data URL to base64
    const base64Image = image.split(',')[1];

    // Analyze meal using Claude
    const mealAnalysis = await analyzeMealImage(base64Image);

    // Save scan to database
    const { data: scanData, error: scanError } = await supabase
      .from('meal_scans')
      .insert({
        user_id: userId,
        image_url: image,
        detected_meals: mealAnalysis.meals,
        total_calories: mealAnalysis.totalCalories,
        total_protein: mealAnalysis.totalProtein,
        total_carbs: mealAnalysis.totalCarbs,
        total_fat: mealAnalysis.totalFat,
        ai_confidence: mealAnalysis.confidence,
        logged: false,
        scan_date: date || new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error saving scan:', scanError);
      return res.status(500).json({ error: 'Failed to save meal scan' });
    }

    return res.status(200).json({
      success: true,
      scan: {
        id: scanData.id,
        ...mealAnalysis,
      },
    });
  } catch (error) {
    console.error('Meal scan error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze meal',
    });
  }
}
