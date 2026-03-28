'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Target, Plus, X, Building2, DollarSign, Calendar, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils/format'
import type { Deal, Organization } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

const STAGES = [
  { key: 'discovery', label: '발굴', color: 'slate' },
  { key: 'proposal', label: '제안', color: 'blue' },
  { key: 'negotiation', label: '협상', color: 'violet' },
  { key: 'contract', label: '계약', color: 'amber' },
  { key: 'billing', label: '빌링', color: 'emerald' },
] as const

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  slate: { bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/20', text: 'text-slate-400' },
  blue: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  violet: { bg: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', text: 'text-violet-400' },
  amber: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  emerald: { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
}

interface PipelineData {
  stages: Record<string, { deal: Deal; organizationName: string | null }[]>
  summary: { totalDeals: number; totalAmount: number; weightedAmount: number }
}

export default function PipelinePage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: pipeline, isLoading } = useQuery<PipelineData>({
    queryKey: ['deals', 'pipeline'],
    queryFn: async () => {
      const res = await fetch('/api/deals?view=pipeline')
      const json: ApiResponse<PipelineData> = await res.json()
      return json.data!
    },
  })

  const stageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })

  const summary = pipeline?.summary

  return (
    <div>
      <PageHeader
        title="영업 현황"
        description="딜 파이프라인과 매출 예측을 확인합니다."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            새 딜
          </button>
        }
      />

      {showForm && (
        <DealForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['deals'] })
          }}
        />
      )}

      {/* Summary Bar */}
      {summary && summary.totalDeals > 0 && (
        <div className="mb-6 flex items-center gap-6 rounded-xl border border-white/[0.04] bg-white/[0.02] px-6 py-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-[12px] text-slate-500">딜</span>
            <span className="text-[14px] font-bold text-white">{summary.totalDeals}</span>
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <span className="text-[12px] text-slate-500">총 예상</span>
            <span className="text-[14px] font-bold text-white">{formatCurrency(summary.totalAmount)}</span>
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-[12px] text-slate-500">가중 매출</span>
            <span className="text-[14px] font-bold text-emerald-400">{formatCurrency(summary.weightedAmount)}</span>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !pipeline || pipeline.summary.totalDeals === 0 ? (
        <EmptyState
          icon={Target}
          title="진행 중인 딜이 없습니다"
          description="영업 기회를 등록하면 파이프라인을 한눈에 확인하고 AI가 전환 확률을 예측해 드립니다."
        />
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map(({ key, label, color }) => {
            const stageDeals = pipeline.stages[key] ?? []
            const stageAmount = stageDeals.reduce((s, d) => s + (d.deal.amount ?? 0), 0)
            const c = STAGE_COLORS[color]

            return (
              <div key={key} className="flex flex-col">
                {/* Stage Header */}
                <div className={`mb-2 rounded-lg border bg-gradient-to-b ${c.bg} ${c.border} p-3 text-center`}>
                  <p className="text-[12px] font-semibold text-slate-300">{label}</p>
                  <p className="text-[18px] font-bold text-white">{stageDeals.length}</p>
                  <p className="text-[10px] text-slate-500">{formatCurrency(stageAmount)}</p>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2">
                  {stageDeals.map(({ deal, organizationName }) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      orgName={organizationName}
                      stageColor={color}
                      onStageChange={(newStage) =>
                        stageMutation.mutate({ dealId: deal.id, stage: newStage })
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DealCard({
  deal,
  orgName,
  stageColor,
  onStageChange,
}: {
  deal: Deal
  orgName: string | null
  stageColor: string
  onStageChange: (stage: string) => void
}) {
  const [showStageMenu, setShowStageMenu] = useState(false)
  const scoreColor = (deal.aiScore ?? 0) >= 70 ? 'text-emerald-400' : (deal.aiScore ?? 0) >= 40 ? 'text-amber-400' : 'text-slate-500'

  return (
    <div className="glass-card group relative rounded-xl p-3 transition-all duration-200 hover:border-white/[0.08]">
      <p className="text-[12px] font-semibold text-white">{orgName || '미지정'}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-400">{deal.title}</p>

      {deal.amount && (
        <p className="mt-1.5 text-[13px] font-bold text-white">
          {formatCurrency(deal.amount)}
          <span className="text-[10px] font-normal text-slate-500">
            /{deal.term === 'yearly' ? '년' : deal.term === 'monthly' ? '월' : '일시'}
          </span>
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {deal.aiScore != null && (
          <span className={`text-[10px] font-semibold ${scoreColor}`}>
            AI {deal.aiScore}%
          </span>
        )}
        {deal.contractEndDate && (
          <span className="text-[9px] text-slate-600">
            만기 {deal.contractEndDate}
          </span>
        )}
      </div>

      {/* Stage Change Dropdown */}
      <button
        onClick={() => setShowStageMenu(!showStageMenu)}
        className="absolute right-2 top-2 rounded p-0.5 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-slate-300"
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>
      </button>

      {showStageMenu && (
        <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-white/[0.08] bg-slate-900 py-1 shadow-xl">
          {STAGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { onStageChange(key); setShowStageMenu(false) }}
              className={`w-full px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-white/[0.06] ${
                deal.stage === key ? 'font-semibold text-amber-400' : 'text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="mx-2 my-1 h-px bg-white/[0.06]" />
          <button
            onClick={() => { onStageChange('closed_won'); setShowStageMenu(false) }}
            className="w-full px-3 py-1.5 text-left text-[11px] text-emerald-400 hover:bg-white/[0.06]"
          >
            성사
          </button>
          <button
            onClick={() => { onStageChange('closed_lost'); setShowStageMenu(false) }}
            className="w-full px-3 py-1.5 text-left text-[11px] text-rose-400 hover:bg-white/[0.06]"
          >
            실패
          </button>
        </div>
      )}
    </div>
  )
}

function DealForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [stage, setStage] = useState('discovery')
  const [amount, setAmount] = useState('')
  const [term, setTerm] = useState('yearly')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: orgs } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      const json: ApiResponse<Organization[]> = await res.json()
      return json.data ?? []
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !organizationId) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          organizationId,
          stage,
          amount: amount ? Math.round(parseFloat(amount) * 100_000_000) : null,
          term,
          expectedCloseDate: expectedCloseDate || null,
          description: description || null,
        }),
      })
      if (res.ok) onSuccess()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glass-card mb-6 rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">새 딜 추가</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">딜 제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 채권매도대행 회선서비스"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none" required />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">고객사 *</label>
            <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-amber-500/30 focus:outline-none" required>
              <option value="">선택</option>
              {orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">단계</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-amber-500/30 focus:outline-none">
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">금액 (억)</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3.06"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">기간</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-amber-500/30 focus:outline-none">
              <option value="yearly">연간</option>
              <option value="monthly">월간</option>
              <option value="one_time">일시</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">예상 계약일</label>
            <input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-amber-500/30 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-400">설명</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="딜에 대한 추가 설명" rows={2}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none" />
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 disabled:opacity-50">
          {isSubmitting ? '저장 중...' : '딜 추가'}
        </button>
      </form>
    </div>
  )
}
