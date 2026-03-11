import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ReferenceLine, AreaChart, Area,
} from 'recharts'

interface WeeklyCalorieChartProps {
  data: { date: string; calories: number; target: number }[]
}

export function WeeklyCalorieChart({ data }: WeeklyCalorieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          domain={[0, (max: number) => Math.ceil(max * 1.2 / 100) * 100]}
        />
        <Tooltip
          cursor={{ fill: '#f9fafb', radius: 8 }}
          contentStyle={{
            background: '#fff',
            border: '1px solid #f3f4f6',
            borderRadius: 12,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number, name: string) => [
            `${value} kcal`,
            name === 'calories' ? 'Consumed' : 'Target',
          ]}
        />
        <ReferenceLine
          y={data[0]?.target}
          stroke="#22c55e"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#22c55e' }}
        />
        <Bar dataKey="calories" fill="#86efac" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface MacroLineChartProps {
  data: { date: string; protein: number; carbs: number; fat: number }[]
}

export function MacroLineChart({ data }: MacroLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 12 }}
          formatter={(value: number, name: string) => [`${value}g`, name]}
        />
        <Line type="monotone" dataKey="protein" stroke="#60a5fa" strokeWidth={2} dot={false} name="Protein" />
        <Line type="monotone" dataKey="carbs"   stroke="#fb923c" strokeWidth={2} dot={false} name="Carbs" />
        <Line type="monotone" dataKey="fat"     stroke="#facc15" strokeWidth={2} dot={false} name="Fat" />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface WaterChartProps {
  data: { date: string; water: number }[]
}

export function WaterChart({ data }: WaterChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 12 }}
          formatter={(v: number) => [`${v}ml`, 'Water']}
        />
        <Area type="monotone" dataKey="water" stroke="#60a5fa" strokeWidth={2} fill="url(#waterGrad)" />
        <ReferenceLine y={2500} stroke="#60a5fa" strokeDasharray="4 4" strokeOpacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
