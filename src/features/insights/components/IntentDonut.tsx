'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'

const COLORS: Record<string, string> = {
  new_business: '#10b981',
  contract_renewal: '#f59e0b',
  cross_sell: '#8b5cf6',
  upsell: '#3b82f6',
  issue_resolution: '#ef4444',
  relationship: '#64748b',
  info_gathering: '#06b6d4',
  negotiation: '#f97316',
  delivery: '#14b8a6',
  billing_payment: '#ec4899',
}

interface IntentDonutProps {
  data: { intent: SalesIntent; count: number; percentage: number }[]
}

export function IntentDonut({ data }: IntentDonutProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-slate-500">V2 분류 데이터 없음</p>
  }

  const chartData = data.map((d) => ({
    name: INTENT_CONFIG[d.intent]?.label ?? d.intent,
    value: d.count,
    percentage: d.percentage,
  }))

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={COLORS[d.intent] ?? '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 12,
              color: '#e2e8f0',
            }}
            formatter={(value, name) => [`${value}건`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((d) => (
          <div key={d.intent} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[d.intent] ?? '#6b7280' }}
            />
            <span className="text-slate-300">{INTENT_CONFIG[d.intent]?.label ?? d.intent}</span>
            <span className="text-slate-500">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
