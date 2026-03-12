import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Please add GEMINI_API_KEY.' })
  }

  const { messages, userId } = req.body as { messages: Message[]; userId?: string }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient<Database>(supabaseUrl, serviceKey)

  let userContext = 'No client profile data available.'

  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('full_name, age, gender, height_cm, weight_kg, goal, activity_level, diet_preference, calorie_target, protein_target, carb_target, fat_target')
      .eq('id', userId)
      .single()

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('log_date, total_calories, total_protein, total_carbs, total_fat, water_ml, mood')
      .eq('user_id', userId)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false })

    if (user) {
      userContext = `
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
  : '- No recent logs available'}`
    }
  }

  const systemPrompt = `You are an expert AI nutritionist and health coach named NutriCoach AI. You provide personalized, science-based nutrition advice.

${userContext}

Guidelines:
- Give specific, actionable advice based on the client's profile and goals
- Reference their actual data when relevant
- Be encouraging but honest
- Keep responses concise (2-4 paragraphs max)
- Use bullet points for lists
- Always maintain a supportive, professional tone
- For medical conditions, recommend consulting a healthcare professional`

  // Gemini uses "model" instead of "assistant" for role
  const geminiHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...geminiHistory,
            { role: 'user', parts: [{ text: lastMessage.content }] },
          ],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      let userMsg = 'AI service error. Please try again.'
      try {
        const errJson = JSON.parse(errorText)
        if (errJson?.error?.message) userMsg = errJson.error.message
      } catch { /* ignore */ }
      return res.status(502).json({ error: userMsg })
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.'

    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
