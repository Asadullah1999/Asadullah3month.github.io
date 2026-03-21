export type BotOption = {
  label: string
  emoji?: string
  nextId: string
  action?: 'navigate' | 'ticket' | 'back'
  href?: string
}

export type BotNode = {
  id: string
  text: string
  options?: BotOption[]
  link?: { label: string; href: string }
}

export type ChatMessage = {
  id: string
  role: 'bot' | 'user'
  text: string
  timestamp: Date
  options?: BotOption[]
  link?: { label: string; href: string }
}

const nodes: Record<string, BotNode> = {
  root: {
    id: 'root',
    text: "Hi there! 👋 I'm the FahmiFit assistant. How can I help you today?",
    options: [
      { label: 'Log a meal', emoji: '🍽️', nextId: 'meal', action: 'navigate', href: '/checkin' },
      { label: 'View my progress', emoji: '📊', nextId: 'progress', action: 'navigate', href: '/progress' },
      { label: 'AI Nutritionist', emoji: '🤖', nextId: 'ai', action: 'navigate', href: '/ai-chat' },
      { label: 'WhatsApp reminders', emoji: '💬', nextId: 'whatsapp', action: 'navigate', href: '/whatsapp' },
      { label: 'Pricing & plans', emoji: '💎', nextId: 'pricing', action: 'navigate', href: '/pricing' },
      { label: 'Browse all pages', emoji: '🗺️', nextId: 'pages' },
      { label: 'Raise a support ticket', emoji: '🎫', nextId: 'ticket', action: 'ticket' },
    ],
  },
  meal: {
    id: 'meal',
    text: "Taking you to the Meal Check-in page where you can log breakfast, lunch, dinner and snacks!",
    link: { label: 'Go to Meal Check-in →', href: '/checkin' },
  },
  progress: {
    id: 'progress',
    text: "Taking you to your Progress dashboard with weekly charts and analytics!",
    link: { label: 'Go to Progress →', href: '/progress' },
  },
  ai: {
    id: 'ai',
    text: "The AI Nutritionist is available on Pro and Premium plans. It gives personalized nutrition advice based on your meals and health profile!",
    link: { label: 'Go to AI Chat →', href: '/ai-chat' },
    options: [
      { label: 'See pricing', emoji: '💎', nextId: 'pricing', action: 'navigate', href: '/pricing' },
      { label: 'Back to menu', emoji: '↩', nextId: 'root', action: 'back' },
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    text: "Set up WhatsApp reminders for your meals and water intake. You'll get friendly nudges at the right times!",
    link: { label: 'Set up WhatsApp →', href: '/whatsapp' },
    options: [
      { label: 'Back to menu', emoji: '↩', nextId: 'root', action: 'back' },
    ],
  },
  pricing: {
    id: 'pricing',
    text: "FahmiFit has three plans:\n• Free — Calorie tracking & meal logging\n• Pro — WhatsApp reminders, AI chat, grocery lists\n• Premium — Nutritionist review & custom plans\n\nContact us on WhatsApp to get your activation code!",
    link: { label: 'View full pricing →', href: '/pricing' },
    options: [
      { label: 'Back to menu', emoji: '↩', nextId: 'root', action: 'back' },
    ],
  },
  pages: {
    id: 'pages',
    text: "Here are all the pages in FahmiFit. Where would you like to go?",
    options: [
      { label: '🏠 Dashboard', nextId: 'nav_dashboard', action: 'navigate', href: '/dashboard' },
      { label: '🍽️ Meal Check-in', nextId: 'nav_checkin', action: 'navigate', href: '/checkin' },
      { label: '📊 Progress', nextId: 'nav_progress', action: 'navigate', href: '/progress' },
      { label: '🤖 AI Chat', nextId: 'nav_ai', action: 'navigate', href: '/ai-chat' },
      { label: '🛒 Grocery List', nextId: 'nav_grocery', action: 'navigate', href: '/grocery-list' },
      { label: '💪 Workout', nextId: 'nav_workout', action: 'navigate', href: '/workout' },
      { label: '⚖️ Weight Log', nextId: 'nav_weight', action: 'navigate', href: '/weight-log' },
      { label: '😴 Sleep', nextId: 'nav_sleep', action: 'navigate', href: '/sleep' },
      { label: '🔔 Reminders', nextId: 'nav_reminders', action: 'navigate', href: '/reminders' },
      { label: '💬 WhatsApp', nextId: 'nav_whatsapp', action: 'navigate', href: '/whatsapp' },
      { label: '💎 Pricing', nextId: 'nav_pricing', action: 'navigate', href: '/pricing' },
      { label: '↩ Back', nextId: 'root', action: 'back' },
    ],
  },
}

export function getNode(id: string): BotNode {
  return nodes[id] || nodes['root']
}

export function getRootNode(): BotNode {
  return nodes['root']
}
