import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { formatCurrency } from '../../lib/npvEngine'
import { SCHOOL_COLORS } from '../../lib/economicData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        backgroundColor: '#131313',
        border: '1px solid rgba(72,72,72,0.3)',
        borderRadius: '0.625rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontSize: '0.75rem',
        minWidth: '10rem',
      }}
    >
      <p style={{ fontWeight: 700, color: '#e7e5e4', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
        Year {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, display: 'inline-block' }} />
            <span style={{ color: '#acabaa' }}>{p.name}</span>
          </span>
          <span style={{ fontWeight: 600, color: p.value >= 0 ? '#e7e5e4' : '#ec7c8a' }}>
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
    <div
      style={{
        backgroundColor: '#131313',
        borderRadius: '0.875rem',
        padding: '1.75rem',
        border: '1px solid rgba(72,72,72,0.15)',
      }}
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e7e5e4', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
        Cumulative Wealth Trajectory
      </h3>
      <p style={{ fontSize: '0.75rem', color: '#767575', marginBottom: '1.5rem', letterSpacing: '0.03em' }}>
        Discounted at 5% · includes college costs + foregone wages
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(72,72,72,0.15)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#767575' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v === 1 ? 'Start' : v === 5 ? 'Yr 5' : v === 14 ? 'Yr 14' : v === 24 ? 'Yr 24' : v === 44 ? 'Yr 44' : ''}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#767575' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, true)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(72,72,72,0.4)" strokeDasharray="4 4" />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#acabaa' }}
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
