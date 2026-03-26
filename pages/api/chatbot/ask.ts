// Lightweight AI endpoint for the chatbot widget
// Faster responses with condensed system prompt (max 400 tokens)

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  const { message, userId, currentPage } = req.body as {
    message: string
    userId: string
    currentPage?: string
  }

  if (!message || !userId) return res.status(400).json({ error: 'message and userId required' })

  const db = getDb()

  // Check plan gating
  const { data: sub } = await (db as ReturnType<typeof createClient>)
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle() as { data: { plan: string;
import { todayISOServer } from '@/lib/utils' status: string } | null }

  const plan = (sub?.status === 'active' || sub?.status === 'trialing') ? sub.plan : 'free'
  if (plan === 'free') {
    return res.status(200).json({
      reply: 'AI chat is a Pro feature! Upgrade your plan to get personalized nutrition answers directly in the widget.',
      gated: true,
      quickStats: null,
    })
  }

  // Fetch user context
  const [{ data: user }, { data: todayLog }] = await Promise.all([
    (db as ReturnType<typeof createClient>).from('users')
      .select('full_name, age, gender, height_cm, weight_kg, goal, activity_level, diet_preference, calorie_target, protein_target, diabetes_type, bp_status, allergies')
      .eq('id', userId).single(),
    (db as ReturnType<typeof createClient>).from('daily_logs')
      .select('total_calories, total_protein, total_carbs, total_fat, water_ml')
      .eq('user_id', userId).eq('log_date', todayISOServer()).maybeSingle(),
  ]) as { data: Record<string, unknown> | null }[]

  const name = (user?.full_name as string)?.split(' ')[0] || 'there'
  const calories = (todayLog?.total_calories as number) || 0
  const target = (user?.calorie_target as number) || 2000
  const protein = (todayLog?.total_protein as number) || 0
  const proteinTarget = (user?.protein_target as number) || 150

  const userContext = user ? `
User: ${name}, ${user.age || '?'}y, ${user.gender || '?'}, ${user.weight_kg || '?'}kg, ${user.height_cm || '?'}cm
Goal: ${(user.goal as string)?.replace('_', ' ') || '?'}, Activity: ${(user.activity_level as string)?.replace('_', ' ') || '?'}
Diet: ${user.diet_preference || 'omnivore'}
Targets: ${target} kcal, ${proteinTarget}g protein
Today: ${calories}/${target} kcal, ${protein}g protein, ${(todayLog?.water_ml as number) || 0}ml water
Health: Diabetes=${user.diabetes_type || 'none'}, BP=${user.bp_status || 'normal'}, Allergies=${(user.allergies as string[])?.join(', ') || 'none'}
Page: ${currentPage || '/'}`.trim() : 'No profile data.'

  const systemPrompt = `You are FahmiFit AI, a quick nutrition assistant in a chat widget. Rules:
- Keep answers under 3 sentences unless asked for detail
- Be friendly, use the user's name (${name})
- Reference their actual data when relevant
- If they ask about meals, give specific suggestions for their diet preference
- Use emoji sparingly (1-2 max)

${userContext}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('Groq widget error:', await response.text())
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not respond. Try again!'

    return res.status(200).json({
      reply,
      quickStats: { calories, target, protein, proteinTarget },
    })
  } catch (err) {
    console.error('Chatbot ask error:', err)
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
