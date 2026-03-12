import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  reply: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Please add ANTHROPIC_API_KEY.' })
  }

  // Auth check
  const supabase = createServerSupabaseClient<Database>({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { messages } = req.body as { messages: Message[] }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  // Fetch user profile for personalization
  const { data: user } = await supabase
    .from('users')
    .select('full_name, age, gender, height_cm, weight_kg, goal, activity_level, diet_preference, calorie_target, protein_target, carb_target, fat_target')
    .eq('id', session.user.id)
    .single()

  // Fetch last 7 days of logs for context
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const { data: recentLogs } = await supabase
    .from('daily_logs')
    .select('log_date, total_calories, total_protein, total_carbs, total_fat, water_ml, mood')
    .eq('user_id', session.user.id)
    .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('log_date', { ascending: false })

  const userContext = user
    ? `
Client Profile:
- Name: ${user.full_name || 'Client'}
- Age: ${user.age || 'unknown'}
- Gender: ${user.gender || 'unknown'}
- Height: ${user.height_cm ? user.height_cm + 'cm' : 'unknown'}
- Weight: ${user.weight_kg ? user.weight_kg + 'kg' : 'unknown'}
- Goal: ${user.goal?.replace('_', ' ') || 'unknown'}
- Activity Level: ${user.activity_level?.replace('_', ' ') || 'unknown'}
- Diet Preference: ${user.diet_preference || 'omnivore'}
- Daily Targets: ${user.calorie_target || 2000} kcal, ${user.protein_target || 150}g protein, ${user.carb_target || 200}g carbs, ${user.fat_target || 65}g fat

Recent 7-Day Log Summary:
${recentLogs && recentLogs.length > 0
  ? recentLogs.map(log =>
      `- ${log.log_date}: ${log.total_calories || 0} kcal, ${log.total_protein || 0}g protein, water: ${log.water_ml || 0}ml, mood: ${log.mood || 'not logged'}`
    ).join('\n')
  : '- No recent logs available'}
`
    : 'No client profile data available.'

  const systemPrompt = `You are an expert AI nutritionist and health coach named NutriCoach AI. You provide personalized, science-based nutrition advice.

${userContext}

Guidelines:
- Give specific, actionable advice based on the client's profile and goals
- Reference their actual data when relevant (calorie targets, recent logs, diet preference)
- Be encouraging but honest about areas for improvement
- Keep responses concise (2-4 paragraphs max) and easy to understand
- Use bullet points for lists of recommendations
- Always maintain a supportive, professional tone
- If asked about medical conditions, recommend consulting a healthcare professional
- Focus on practical, sustainable nutrition strategies`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      return res.status(502).json({ error: 'AI service error. Please try again.' })
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> }
    const reply = data.content?.[0]?.text || 'I apologize, I could not generate a response. Please try again.'

    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
