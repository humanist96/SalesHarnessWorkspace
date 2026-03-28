'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Building2, Sparkles, BarChart3, AlertTriangle, Target, Layers, Package, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils/format'
import { useInsights } from '@/features/insights/hooks/useInsights'
import { IntentDonut } from '@/features/insights/components/IntentDonut'
import { SalesFunnel } from '@/features/insights/components/SalesFunnel'
import { OrgIntentHeatmap } from '@/features/insights/components/OrgIntentHeatmap'
import { ProductTrend } from '@/features/insights/components/ProductTrend'
import { RiskAlerts } from '@/features/insights/components/RiskAlerts'
import { SentimentGauge } from '@/features/insights/components/SentimentGauge'
import type { ApiResponse } from '@/types/api'

interface IntelligenceData {
  activityTypeCounts: { type: string | null; count: number }[]
  orgActivityCounts: { organizationId: string | null; organizationName: string | null; count: number }[]
  monthlyTrend: { month: string; count: number }[]
  recommendations: { customer: string; reason: string; urgency: string }[]
  activeDealsCount: number
}

interface ForecastData {
  best: number
  likely: number
  worst: number
  deals: { id: string; title: string; organizationName: string | null; stage: string; amount: number; probability: number; weighted: number }[]
}

const TYPE_LABELS: Record<string, string> = {
  call: '전화', email: '이메일', visit: '방문', meeting: '미팅',
  contract: '계약', billing: '빌링', inspection: '검수', other: '기타',
}

const URGENCY_COLORS: Record<string, string> = {
  high: 'border-rose-500/20 bg-rose-500/5',
  medium: 'border-amber-500/20 bg-amber-500/5',
  low: 'border-blue-500/20 bg-blue-500/5',
}

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6b7280']

const PERIOD_OPTIONS = [
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: '6m', label: '6개월' },
  { value: '1y', label: '1년' },
]

export default function IntelligencePage() {
  const [period, setPeriod] = useState('30d')

  const { data: intel, isLoading } = useQuery<IntelligenceData>({
    queryKey: ['intelligence'],
    queryFn: async () => {
      const res = await fetch('/api/intelligence')
      const json: ApiResponse<IntelligenceData> = await res.json()
      return json.data!
    },
  })

  const { data: forecast } = useQuery<ForecastData>({
    queryKey: ['deals', 'forecast'],
    queryFn: async () => {
      const res = await fetch('/api/deals/forecast')
      const json: ApiResponse<ForecastData> = await res.json()
      return json.data!
    },
  })

  const { data: insights } = useInsights(period)

  return (
    <div>
      <PageHeader title="인텔리전스" description="AI 기반 영업 인사이트와 전략적 분석" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              AI 추천 — 이번 주 집중 고객
            </h2>
            {intel?.recommendations && intel.recommendations.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {intel.recommendations.map((rec, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${URGENCY_COLORS[rec.urgency] || URGENCY_COLORS.medium}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white">{i + 1}. {rec.customer}</span>
                      {rec.urgency === 'high' && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                    </div>
                    <p className="mt-1.5 text-[12px] text-slate-400">{rec.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">활동 데이터가 쌓이면 AI가 집중 고객을 추천합니다.</p>
            )}
          </div>

          {/* V2 인사이트 섹션 — 기간 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500">분석 기간:</span>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  period === opt.value
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 영업 목적 + 감성 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Target className="h-4 w-4 text-amber-400" />
                영업 목적 분포
              </h2>
              {insights ? (
                <IntentDonut data={insights.intentDistribution} />
              ) : (
                <div className="h-[180px] animate-pulse rounded-xl bg-white/[0.04]" />
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Activity className="h-4 w-4 text-emerald-400" />
                영업 감성 분포
              </h2>
              {insights ? (
                <SentimentGauge data={insights.sentimentDistribution} />
              ) : (
                <div className="h-[140px] animate-pulse rounded-xl bg-white/[0.04]" />
              )}
            </div>
          </div>

          {/* 영업 퍼널 */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
              <Layers className="h-4 w-4 text-violet-400" />
              영업 퍼널 (단계별 활동 분포)
            </h2>
            {insights ? (
              <SalesFunnel data={insights.stageFunnel} />
            ) : (
              <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />
            )}
          </div>

          {/* 고객사 × 목적 히트맵 */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
              <Building2 className="h-4 w-4 text-violet-400" />
              고객사 x 영업목적 히트맵
            </h2>
            {insights ? (
              <OrgIntentHeatmap data={insights.orgIntentMatrix} />
            ) : (
              <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />
            )}
          </div>

          {/* 상품별 트렌드 + 리스크 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Package className="h-4 w-4 text-blue-400" />
                상품별 활동 트렌드
              </h2>
              {insights ? (
                <ProductTrend data={insights.productTrend} />
              ) : (
                <div className="h-[220px] animate-pulse rounded-xl bg-white/[0.04]" />
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                리스크 신호
              </h2>
              {insights ? (
                <RiskAlerts data={insights.riskSummary} />
              ) : (
                <div className="h-[220px] animate-pulse rounded-xl bg-white/[0.04]" />
              )}
            </div>
          </div>

          {/* Forecast */}
          {forecast && forecast.deals.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                매출 예측
              </h2>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <ForecastCard label="Best" amount={forecast.best} color="emerald" />
                <ForecastCard label="Likely" amount={forecast.likely} color="amber" />
                <ForecastCard label="Worst" amount={forecast.worst} color="rose" />
              </div>
              <div className="space-y-1.5">
                {forecast.deals.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-lg border border-white/[0.03] bg-white/[0.02] px-4 py-2">
                    <span className="w-28 truncate text-[12px] font-medium text-slate-300">{d.organizationName}</span>
                    <span className="flex-1 truncate text-[11px] text-slate-500">{d.title}</span>
                    <span className="text-[12px] font-semibold text-white">{formatCurrency(d.amount)}</span>
                    <div className="w-12">
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${d.probability}%` }} />
                      </div>
                      <p className="mt-0.5 text-right text-[9px] text-slate-600">{d.probability}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기존 차트 (유형별/월별/고객사별) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                활동 수단별 현황 (30일)
              </h2>
              {intel?.activityTypeCounts && intel.activityTypeCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={intel.activityTypeCounts.filter((c) => c.type).map((c) => ({
                    name: TYPE_LABELS[c.type!] ?? c.type,
                    count: c.count,
                  }))}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {intel.activityTypeCounts.filter((c) => c.type).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-[13px] text-slate-500">데이터 없음</p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                월별 활동 추이
              </h2>
              {intel?.monthlyTrend && intel.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={intel.monthlyTrend.map((m) => ({
                    name: m.month.slice(5),
                    count: m.count,
                  }))}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-[13px] text-slate-500">데이터 없음</p>
              )}
            </div>
          </div>

          {/* Top Organizations */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
              <Building2 className="h-4 w-4 text-violet-400" />
              고객사별 활동 빈도 (Top 10)
            </h2>
            {intel?.orgActivityCounts && intel.orgActivityCounts.length > 0 ? (
              <div className="space-y-2.5">
                {intel.orgActivityCounts.map((org, i) => {
                  const maxCount = intel.orgActivityCounts[0]?.count ?? 1
                  const pct = Math.round((org.count / maxCount) * 100)
                  return (
                    <div key={org.organizationId || i} className="flex items-center gap-3">
                      <span className="w-32 truncate text-[12px] font-medium text-slate-300">{org.organizationName || '미분류'}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right text-[11px] font-medium text-slate-400">{org.count}건</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-[13px] text-slate-500">데이터 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ForecastCard({ label, amount, color }: { label: string; amount: number; color: 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/20',
  }
  const textColors = { emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400' }

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[color]} p-4 text-center`}>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-[20px] font-bold ${textColors[color]}`}>{formatCurrency(amount)}</p>
    </div>
  )
}
