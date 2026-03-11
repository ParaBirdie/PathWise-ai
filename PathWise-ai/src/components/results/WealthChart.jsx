import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { formatCurrency } from '../../lib/npvEngine'

const SCHOOL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl text-xs min-w-[160px]">
      <p className="font-semibold text-[#1d1d1f] mb-2">Year {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[#6e6e73]">{p.name}</span>
          </span>
          <span className={`font-medium ${p.value >= 0 ? 'text-[#1d1d1f]' : 'text-red-500'}`}>
            {formatCurrency(p.value, true)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function WealthChart({ results }) {
  // Build chart data: one row per year (1–44)
  const data = useMemo(() => {
    const maxYears = Math.max(...results.map((r) => r.trajectory.length))
    return Array.from({ length: maxYears }, (_, i) => {
      const row = { year: i + 1 }
      results.forEach((r) => {
        const point = r.trajectory[i]
        if (point) row[r.school] = point.cumulativeWealth
      })
      return row
    })
  }, [results])

  return (
    <div className="glass rounded-3xl p-6 shadow-xl shadow-black/[0.04]">
      <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Cumulative Wealth Trajectory</h3>
      <p className="text-xs text-[#6e6e73] mb-6">Discounted at 5% · includes college costs + foregone wages</p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#aeaeb2' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v === 1 ? 'Start' : v === 5 ? 'Yr 5' : v === 14 ? 'Yr 14' : v === 24 ? 'Yr 24' : v === 44 ? 'Yr 44' : ''}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#aeaeb2' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, true)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 4" />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#6e6e73' }}
          />
          {results.map((r, i) => (
            <Line
              key={r.school}
              type="monotone"
              dataKey={r.school}
              name={r.school}
              stroke={SCHOOL_COLORS[i % SCHOOL_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
