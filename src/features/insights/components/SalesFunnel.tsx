'use client'

import { STAGE_CONFIG, type SalesStage } from '@/lib/pipeline/types'

const STAGE_ORDER: SalesStage[] = [
  'prospecting', 'needs_analysis', 'proposal', 'negotiation',
  'contracting', 'implementation', 'post_care',
]

const STAGE_COLORS = [
  'from-slate-500/20 to-slate-500/10',
  'from-blue-500/20 to-blue-500/10',
  'from-violet-500/20 to-violet-500/10',
  'from-amber-500/20 to-amber-500/10',
  'from-emerald-500/20 to-emerald-500/10',
  'from-teal-500/20 to-teal-500/10',
  'from-cyan-500/20 to-cyan-500/10',
]

const STAGE_TEXT_COLORS = [
  'text-slate-400', 'text-blue-400', 'text-violet-400', 'text-amber-400',
  'text-emerald-400', 'text-teal-400', 'text-cyan-400',
]

interface SalesFunnelProps {
  data: { stage: SalesStage; count: number }[]
}

export function SalesFunnel({ data }: SalesFunnelProps) {
  const stageMap = new Map(data.map((d) => [d.stage, d.count]))
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-slate-500">V2 분류 데이터 없음</p>
  }

  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((stage, i) => {
        const count = stageMap.get(stage) ?? 0
        const pct = Math.round((count / maxCount) * 100)
        const cfg = STAGE_CONFIG[stage]

        return (
          <div key={stage} className="flex items-center gap-3">
            <span className={`w-16 text-right text-[11px] font-medium ${STAGE_TEXT_COLORS[i]}`}>
              {cfg.label}
            </span>
            <div className="flex-1 h-7 rounded-lg bg-white/[0.03] overflow-hidden">
              <div
                className={`h-full rounded-lg bg-gradient-to-r ${STAGE_COLORS[i]} flex items-center px-2 transition-all duration-500`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              >
                <span className="text-[11px] font-semibold text-white/80">{count}</span>
              </div>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <span className="text-[9px] text-slate-600">
                {count > 0 && (stageMap.get(STAGE_ORDER[i + 1]) ?? 0) > 0
                  ? `${Math.round(((stageMap.get(STAGE_ORDER[i + 1]) ?? 0) / count) * 100)}%`
                  : ''
                }
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
