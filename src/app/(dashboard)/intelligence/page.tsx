'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Building2, Sparkles, BarChart3, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils/format'
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

export default function IntelligencePage() {
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

  return (
    <div>
      <PageHeader title="인텔리전스" description="AI 기반 영업 인사이트와 추천을 확인합니다." />

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

          <div className="grid grid-cols-2 gap-4">
            {/* Activity Type Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                활동 유형별 현황 (30일)
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

            {/* Monthly Trend */}
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
