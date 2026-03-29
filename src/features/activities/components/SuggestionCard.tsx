'use client'

import { Badge } from '@/components/ui/badge'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'
import { formatRelativeTime } from '@/lib/utils/format'

interface SuggestionCardProps {
  rawContent: string
  intent: string | null
  products: string[] | null
  organizationName: string | null
  activityDate: string
  score?: number
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score > 0.3 ? 'bg-emerald-400' : score > 0.15 ? 'bg-amber-400' : 'bg-slate-500'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-12 rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct * 2, 100)}%` }} />
      </div>
      <span className="text-[9px] text-slate-600">{pct}%</span>
    </div>
  )
}

export function SuggestionCard({
  rawContent,
  intent,
  products,
  organizationName,
  activityDate,
  score,
}: SuggestionCardProps) {
  const intentCfg = intent ? INTENT_CONFIG[intent as SalesIntent] : null
  const parsedProducts = Array.isArray(products) ? products : []

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center gap-1.5">
        {intentCfg && (
          <Badge variant="outline" className={`text-[9px] ${intentCfg.color}`}>
            {intentCfg.label}
          </Badge>
        )}
        {parsedProducts.slice(0, 2).map((p) => (
          <span key={p} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">{p}</span>
        ))}
        {organizationName && (
          <span className="ml-auto text-[9px] text-amber-400/70">{organizationName}</span>
        )}
        <span className="text-[9px] text-slate-600">{formatRelativeTime(activityDate)}</span>
      </div>
      <p className="text-[12px] leading-relaxed text-slate-300 line-clamp-2">
        {rawContent.slice(0, 200)}
      </p>
      {score !== undefined && score > 0 && <ScoreBar score={score} />}
    </div>
  )
}
