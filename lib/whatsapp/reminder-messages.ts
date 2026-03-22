/**
 * Build personalized reminder messages for WhatsApp delivery
 * Extracted from /api/n8n/daily-reminder.ts for reuse by cron
 */

type ReminderType = 'meal' | 'water' | 'weigh_in' | 'custom'

export function buildReminderMessage(
  reminder: { type: ReminderType; title: string; message: string | null; time: string },
  user: { full_name: string | null; calorie_target: number | null },
  todayLog: { total_calories: number | null; water_ml: number | null } | null
): string {
  const name = ((user.full_name || 'there') as string).split(' ')[0]
  const consumed = todayLog?.total_calories || 0
  const target = user.calorie_target || 2000
  const water = todayLog?.water_ml || 0

  // If the reminder has a custom message, use it (with variable substitution)
  if (reminder.message) {
    return reminder.message
      .replace('{name}', name)
      .replace('{calories}', String(consumed))
      .replace('{target}', String(target))
      .replace('{remaining}', String(Math.max(0, target - consumed)))
      .replace('{water}', String(water))
  }

  // Default messages based on type and time
  const hour = parseInt(reminder.time.split(':')[0])

  if (reminder.type === 'water') {
    if (water >= 2500) return `💧 ${name}, you already hit your water goal (${water}ml)! Keep it up! 🎉`
    return `💧 Water check, ${name}! ${water}ml done. ${2500 - water}ml to go!`
  }

  if (reminder.type === 'weigh_in') {
    return `⚖️ Good morning, ${name}! Don't forget to log your weight today.`
  }

  if (reminder.type === 'meal') {
    if (hour < 10) return `🌅 Good morning, ${name}! Log your breakfast. Daily goal: ${target} kcal.`
    if (hour < 14) return `☀️ Lunchtime, ${name}! ${consumed > 0 ? `At ${consumed}/${target} kcal so far.` : 'Log your meals to stay on track!'}`
    if (hour < 18) return `🍏 Afternoon snack time, ${name}! ${consumed}/${target} kcal so far.`
    return `🌙 Evening, ${name}! ${consumed > 0 ? `At ${consumed}/${target} kcal.` : 'Log dinner to complete your day!'}`
  }

  return reminder.title || `🌿 FahmiFit reminder for ${name}`
}
