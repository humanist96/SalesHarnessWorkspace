'use client'

import { Badge } from '@/components/ui/badge'
import {
  INTENT_CONFIG,
  STAGE_CONFIG,
  SENTIMENT_CONFIG,
  type SalesIntent,
  type SalesStage,
  type ActivitySentiment,
} from '@/lib/pipeline/types'
import { isV2Content } from '@/lib/pipeline/parse-content'
import { AlertTriangle } from 'lucide-react'

interface ClassificationBadgesProps {
  parsedContent: unknown
  showStage?: boolean
  showProducts?: boolean
  showSentiment?: boolean
  showRisks?: boolean
  compact?: boolean
}

export function ClassificationBadges({
  parsedContent,
  showStage = true,
  showProducts = false,
  showSentiment = false,
  showRisks = false,
  compact = false,
}: ClassificationBadgesProps) {
  if (!isV2Content(parsedContent)) return null

  const intentCfg = INTENT_CONFIG[parsedContent.intent]
  const stageCfg = STAGE_CONFIG[parsedContent.stage]
  const sentimentCfg = SENTIMENT_CONFIG[parsedContent.sentiment]
  const size = compact ? 'text-[9px]' : 'text-[10px]'

  return (
    <div className="flex flex-wrap items-center gap-1">
      {intentCfg && (
        <Badge variant="outline" className={`${size} ${intentCfg.color}`}>
          {intentCfg.label}
        </Badge>
      )}

      {showStage && stageCfg && (
        <Badge variant="outline" className={`${size} bg-white/[0.03] text-slate-400 border-white/[0.08]`}>
          {stageCfg.label}
        </Badge>
      )}

      {showProducts && parsedContent.products.length > 0 && (
        <>
          {parsedContent.products.slice(0, compact ? 2 : 4).map((p) => (
            <span key={p} className={`rounded bg-white/[0.04] px-1.5 py-0.5 ${size} text-slate-500`}>
              {p}
            </span>
          ))}
          {parsedContent.products.length > (compact ? 2 : 4) && (
            <span className={`${size} text-slate-600`}>+{parsedContent.products.length - (compact ? 2 : 4)}</span>
          )}
        </>
      )}

      {showSentiment && sentimentCfg && (
        <span className={`${size} ${sentimentCfg.color}`}>
          {parsedContent.sentiment === 'positive' ? '+' : parsedContent.sentiment === 'negative' ? '-' : '~'} {sentimentCfg.label}
        </span>
      )}

      {showRisks && parsedContent.riskFlags.length > 0 && (
        <span className={`inline-flex items-center gap-0.5 ${size} text-rose-400`}>
          <AlertTriangle className="h-3 w-3" />
          {parsedContent.riskFlags[0]}
          {parsedContent.riskFlags.length > 1 && ` +${parsedContent.riskFlags.length - 1}`}
        </span>
      )}
    </div>
  )
}
