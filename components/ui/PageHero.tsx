import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageHeroProps {
  badge?: string
  badgeColor?: string   // hex e.g. '#10b981'
  title: string
  highlight?: string    // part of title to colorize
  subtitle?: string
  action?: ReactNode
  /** Orb gradient colors, e.g. ['rgba(16,185,129,0.3)', 'rgba(6,182,212,0.2)'] */
  orbColors?: [string, string]
}

export default function PageHero({
  badge,
  badgeColor = '#10b981',
  title,
  highlight,
  subtitle,
  action,
  orbColors = ['rgba(16,185,129,0.3)', 'rgba(6,182,212,0.2)'],
}: PageHeroProps) {
  const rgb = hexToRgb(badgeColor)

  // Split title around highlight
  let beforeHighlight = title
  let afterHighlight = ''
  if (highlight && title.includes(highlight)) {
    const idx = title.indexOf(highlight)
    beforeHighlight = title.slice(0, idx)
    afterHighlight = title.slice(idx + highlight.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative mb-8 overflow-hidden rounded-2xl px-6 py-6"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb},0.07) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid rgba(${rgb},0.18)`,
      }}>

      {/* Orbs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${orbColors[0]}, transparent)`, filter: 'blur(30px)' }} />
      <div className="absolute -bottom-8 left-1/4 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${orbColors[1]}, transparent)`, filter: 'blur(30px)' }} />

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-3"
              style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)`, color: badgeColor }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: badgeColor, boxShadow: `0 0 4px ${badgeColor}` }} />
              {badge}
            </div>
          )}
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {beforeHighlight}
            {highlight && (
              <span style={{
                background: `linear-gradient(135deg, ${badgeColor}, ${adjustColor(badgeColor)})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{highlight}</span>
            )}
            {afterHighlight}
          </h1>
          {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </motion.div>
  )
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function adjustColor(hex: string): string {
  // Returns a shifted complementary color for gradient
  const map: Record<string, string> = {
    '#10b981': '#06b6d4',
    '#06b6d4': '#3b82f6',
    '#8b5cf6': '#ec4899',
    '#f97316': '#ef4444',
    '#f59e0b': '#f97316',
    '#ef4444': '#f97316',
    '#25D366': '#10b981',
    '#6366f1': '#8b5cf6',
  }
  return map[hex] || '#6b7280'
}
