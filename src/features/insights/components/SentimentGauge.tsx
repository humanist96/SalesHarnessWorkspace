'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { SENTIMENT_CONFIG, type ActivitySentiment } from '@/lib/pipeline/types'

const COLORS: Record<ActivitySentiment, string> = {
  positive: '#10b981',
  neutral: '#64748b',
  negative: '#ef4444',
}

interface SentimentGaugeProps {
  data: { sentiment: ActivitySentiment; count: number; percentage: number }[]
}

export function SentimentGauge({ data }: SentimentGaugeProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-slate-500">V2 분류 데이터 없음</p>
  }

  const chartData = data.map((d) => ({
    name: SENTIMENT_CONFIG[d.sentiment]?.label ?? d.sentiment,
    value: d.count,
  }))

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={40}
            outerRadius={60}
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={COLORS[d.sentiment] ?? '#6b7280'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.sentiment} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[d.sentiment] }}
            />
            <span className="text-[12px] text-slate-300">
              {SENTIMENT_CONFIG[d.sentiment]?.label ?? d.sentiment}
            </span>
            <span className="text-[12px] font-semibold text-white">{d.percentage}%</span>
            <span className="text-[10px] text-slate-500">({d.count}건)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
