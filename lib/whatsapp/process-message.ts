/**
 * Shared WhatsApp incoming message processor
 * Used by both Meta webhook and Twilio webhook
 */

import { createClient } from '@supabase/supabase-js'
import { getProvider } from './provider'
import { saveMealToLog } from './save-meal'
import { parseMealText } from './parse-meal'

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function processIncomingMessage(params: {
  phone: string
  text: string
  hasImage: boolean
  imageUrl?: string
  imageMimeType?: string
}): Promise<void> {
  const { phone, text, hasImage, imageUrl, imageMimeType } = params
  const db = getDb()
  const provider = getProvider()

  // Normalize phone: ensure it has + prefix for DB lookup
  const dbPhone = phone.startsWith('+') ? phone : `+${phone}`
  const sendPhone = phone.replace('+', '')

  // Find user by phone
  const { data: waContact } = await db
    .from('whatsapp_contacts')
    .select('user_id, is_verified, verification_code')
    .eq('phone_number', dbPhone)
    .maybeSingle()

  // Also try without + prefix (some entries might be stored differently)
  const contact = waContact || (await db
    .from('whatsapp_contacts')
    .select('user_id, is_verified, verification_code')
    .eq('phone_number', sendPhone)
    .maybeSingle()).data

  if (!contact) {
    await provider.sendText(sendPhone, '🌿 Welcome to FahmiFit! Visit fahmifit.com/whatsapp to connect your account.')
    return
  }

  // Handle unverified users — check for VERIFY token
  if (!contact.is_verified) {
    const verifyMatch = text.trim().match(/^verify\s+(.+)$/i)
    const trimmed = text.trim()

    if (verifyMatch && verifyMatch[1] === contact.verification_code) {
      await db.from('whatsapp_contacts').update({
        is_verified: true,
        verification_code: null,
        verified_at: new Date().toISOString(),
        opt_in: true,
      }).eq('user_id', contact.user_id)

      await provider.sendText(sendPhone,
        '✅ Your WhatsApp is now connected to FahmiFit!\n\n' +
        'You can now:\n' +
        '• Text what you ate (e.g. "2 roti and dal for lunch")\n' +
        '• Send food photos for instant analysis\n' +
        '• Type *water 500* to log water\n' +
        '• Type *status* for today\'s progress\n' +
        '• Type *help* for all commands'
      )
      return
    }

    // Also handle the old 6-digit code verification
    if (trimmed === contact.verification_code) {
      await db.from('whatsapp_contacts').update({
        is_verified: true,
        verification_code: null,
        verified_at: new Date().toISOString(),
        opt_in: true,
      }).eq('user_id', contact.user_id)
      await provider.sendText(sendPhone, '✅ Your WhatsApp is now connected to FahmiFit!')
      return
    }

    await provider.sendText(sendPhone, '⚠️ Your number is not verified yet. Visit fahmifit.com/whatsapp to connect.')
    return
  }

  const userId = contact.user_id

  // Update last_message_at
  await db.from('whatsapp_contacts').update({ last_message_at: new Date().toISOString() }).eq('user_id', userId)

  const lowerText = text.trim().toLowerCase()

  // --- Command handlers ---

  if (lowerText === 'help' || lowerText === '?') {
    await provider.sendText(sendPhone,
      '🌿 *FahmiFit Commands*\n\n' +
      '📝 Just text what you ate:\n_"2 roti, dal, and salad for lunch"_\n\n' +
      '📸 Send a food photo to auto-log it\n\n' +
      '• *water <ml>* — Log water (e.g. water 500)\n' +
      '• *status* — Today\'s calorie progress\n' +
      '• *stop* — Pause reminders\n' +
      '• *start* — Resume reminders'
    )
    return
  }

  if (lowerText === 'status') {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: log }, { data: user }] = await Promise.all([
      db.from('daily_logs').select('total_calories, total_protein, total_carbs, total_fat, water_ml').eq('user_id', userId).eq('log_date', today).maybeSingle(),
      db.from('users').select('calorie_target, full_name').eq('id', userId).single(),
    ])

    const consumed = log?.total_calories || 0
    const target = user?.calorie_target || 2000
    const water = log?.water_ml || 0
    const pct = Math.round((consumed / target) * 100)

    await provider.sendText(sendPhone,
      `📊 *Today's Progress*\n\n` +
      `🔥 Calories: ${consumed} / ${target} kcal (${pct}%)\n` +
      `🥩 Protein: ${log?.total_protein || 0}g\n` +
      `🍞 Carbs: ${log?.total_carbs || 0}g\n` +
      `🧈 Fat: ${log?.total_fat || 0}g\n` +
      `💧 Water: ${water}ml / 2500ml\n\n` +
      (consumed < target ? `You still have ${target - consumed} kcal to go!` : 'Great job hitting your target! 🎉')
    )
    return
  }

  if (lowerText.startsWith('water ')) {
    const ml = parseInt(lowerText.split(' ')[1])
    if (!isNaN(ml) && ml > 0) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await db.from('daily_logs').select('id, water_ml').eq('user_id', userId).eq('log_date', today).maybeSingle()
      const newWater = (existing?.water_ml || 0) + ml

      if (existing) {
        await db.from('daily_logs').update({ water_ml: newWater }).eq('id', existing.id)
      } else {
        await db.from('daily_logs').insert({ user_id: userId, log_date: today, water_ml: newWater })
      }
      await provider.sendText(sendPhone, `💧 Logged ${ml}ml! Total today: ${newWater}ml / 2500ml`)
      return
    }
  }

  if (lowerText === 'stop') {
    await db.from('whatsapp_contacts').update({ opt_in: false }).eq('user_id', userId)
    await provider.sendText(sendPhone, '🔕 Reminders paused. Reply *start* to resume anytime.')
    return
  }

  if (lowerText === 'start') {
    await db.from('whatsapp_contacts').update({ opt_in: true }).eq('user_id', userId)
    await provider.sendText(sendPhone, '🔔 Reminders reactivated!')
    return
  }

  // --- Image handler: analyze food photo ---
  if (hasImage && imageUrl) {
    try {
      const imageBuffer = await provider.downloadMedia(imageUrl)
      const base64 = imageBuffer.toString('base64')

      // Call Gemini analyze-meal logic directly
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        await provider.sendText(sendPhone, '⚠️ AI image analysis is not configured. Text your meals instead!')
        return
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: imageMimeType || 'image/jpeg', data: base64 } },
                { text: 'Analyze this food image. Return ONLY JSON: {"foods": [{"name": "...", "quantity": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}]}' },
              ],
            }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
          }),
        }
      )

      if (!geminiRes.ok) {
        await provider.sendText(sendPhone, '⚠️ Could not analyze the image. Try again or text what you ate.')
        return
      }

      const geminiData = await geminiRes.json()
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        await provider.sendText(sendPhone, '⚠️ Could not identify food in the image. Try texting what you ate.')
        return
      }

      const parsed = JSON.parse(jsonMatch[0])
      const foods = (parsed.foods || []).map((f: { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }) => ({
        name: f.name || 'Unknown',
        quantity: f.quantity || '1 serving',
        calories: Math.round(Number(f.calories) || 0),
        protein: Math.round(Number(f.protein) || 0),
        carbs: Math.round(Number(f.carbs) || 0),
        fat: Math.round(Number(f.fat) || 0),
      }))

      if (foods.length === 0) {
        await provider.sendText(sendPhone, '⚠️ No food detected in the image. Try texting what you ate.')
        return
      }

      const result = await saveMealToLog(userId, foods)
      const foodList = foods.map((f: { name: string; calories: number }) => `• ${f.name} (${f.calories} kcal)`).join('\n')
      await provider.sendText(sendPhone,
        `📸 *Logged to ${result.mealCategory}:*\n${foodList}\n\n` +
        `Total: ${result.totalCalories} kcal added`
      )
      return
    } catch (err) {
      console.error('Image processing error:', err)
      await provider.sendText(sendPhone, '⚠️ Error processing image. Try texting what you ate instead.')
      return
    }
  }

  // --- Check for explicit meal prefix: "lunch: chicken biryani" ---
  const mealPrefixMatch = text.trim().match(/^(breakfast|lunch|dinner|snacks?)\s*[:\-]\s*(.+)$/i)
  if (mealPrefixMatch) {
    const category = mealPrefixMatch[1].toLowerCase().replace('snack', 'snacks') as 'breakfast' | 'lunch' | 'dinner' | 'snacks'
    const parseResult = await parseMealText(mealPrefixMatch[2])

    if (parseResult.foods.length > 0) {
      const result = await saveMealToLog(userId, parseResult.foods, category)
      const foodList = parseResult.foods.map(f => `• ${f.name} (${f.calories} kcal)`).join('\n')
      await provider.sendText(sendPhone,
        `✅ *Logged to ${result.mealCategory}:*\n${foodList}\n\n` +
        `Total: ${result.totalCalories} kcal added`
      )
      return
    }
  }

  // --- Natural language meal parsing (catch-all) ---
  const parseResult = await parseMealText(text)
  if (parseResult.foods.length > 0) {
    const result = await saveMealToLog(userId, parseResult.foods, parseResult.mealCategory)
    const foodList = parseResult.foods.map(f => `• ${f.name} (${f.calories} kcal)`).join('\n')
    await provider.sendText(sendPhone,
      `✅ *Logged to ${result.mealCategory}:*\n${foodList}\n\n` +
      `Total: ${result.totalCalories} kcal added`
    )
    return
  }

  // --- Fallback ---
  await provider.sendText(sendPhone,
    '🤔 I didn\'t understand that.\n\n' +
    'You can:\n' +
    '• Text what you ate (e.g. "2 eggs and toast")\n' +
    '• Send a food photo\n' +
    '• Type *help* for all commands'
  )
}
