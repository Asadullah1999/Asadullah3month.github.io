interface ProgressRingProps {
  value: number   // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sub?: string
}

export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#22c55e',
  label,
  sub,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <span className="text-xl font-bold text-gray-900 leading-none">{label}</span>}
        {sub && <span className="text-xs text-gray-500 mt-0.5">{sub}</span>}
      </div>
    </div>
  )
}
