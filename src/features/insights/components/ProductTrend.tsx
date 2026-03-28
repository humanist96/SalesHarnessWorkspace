'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const PRODUCT_COLORS: Record<string, string> = {
  '원장서비스':   '#f59e0b',
  '투자정보계':   '#3b82f6',
  '백업서비스':   '#8b5cf6',
  '전송서비스':   '#10b981',
  '회선서비스':   '#06b6d4',
  '시세정보':    '#ec4899',
  '채권매도대행': '#f97316',
  '장비유지보수': '#14b8a6',
  'FEP':        '#6366f1',
  '외국환':      '#84cc16',
}

function getProductColor(product: string): string {
  return PRODUCT_COLORS[product] ?? '#6b7280'
}

interface ProductTrendProps {
  data: { month: string; products: Record<string, number> }[]
}

export function ProductTrend({ data }: ProductTrendProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-slate-500">V2 분류 데이터 없음</p>
  }

  // 모든 상품명 수집
  const allProducts = new Set<string>()
  for (const d of data) {
    for (const p of Object.keys(d.products)) {
      allProducts.add(p)
    }
  }
  const productList = [...allProducts]

  // Recharts 데이터 형식으로 변환
  const chartData = data.map((d) => ({
    name: d.month.slice(5), // "2024-03" → "03"
    ...Object.fromEntries(productList.map((p) => [p, d.products[p] ?? 0])),
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 12,
              color: '#e2e8f0',
            }}
          />
          {productList.map((product) => (
            <Area
              key={product}
              type="monotone"
              dataKey={product}
              stackId="1"
              stroke={getProductColor(product)}
              fill={getProductColor(product)}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3">
        {productList.map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProductColor(p) }} />
            <span className="text-slate-400">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
