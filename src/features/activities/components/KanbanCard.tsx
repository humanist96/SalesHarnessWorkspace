'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'
import { isV2Content, getSummary, getAmounts } from '@/lib/pipeline/parse-content'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Activity } from '@/lib/db/schema'

const INTENT_ACCENT: Record<string, string> = {
  new_business: 'border-l-emerald-400',
  contract_renewal: 'border-l-amber-400',
  cross_sell: 'border-l-violet-400',
  upsell: 'border-l-blue-400',
  issue_resolution: 'border-l-rose-400',
  relationship: 'border-l-slate-400',
  info_gathering: 'border-l-cyan-400',
  negotiation: 'border-l-orange-400',
  delivery: 'border-l-teal-400',
  billing_payment: 'border-l-pink-400',
}

interface KanbanCardProps {
  activity: Activity
  onClick: () => void
  index: number
}

export function KanbanCard({ activity, onClick, index }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
  })

  const style = transform
    ? { transform: CSS.Transform.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined

  const parsed = activity.parsedContent
  const v2 = isV2Content(parsed)
  const intent = v2 ? parsed.intent : null
  const intentCfg = intent ? INTENT_CONFIG[intent as SalesIntent] : null
  const orgName = v2 ? parsed.organizationMention : null
  const summary = getSummary(parsed) || activity.rawContent.slice(0, 80)
  const amounts = getAmounts(parsed)
  const accentClass = intent ? INTENT_ACCENT[intent] ?? 'border-l-slate-500' : 'border-l-slate-500'

  // 금액 표시
  const amountText = amounts.length > 0
    ? `${amounts[0].value}${amounts[0].unit}`
    : null

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{
        opacity: isDragging ? 0.8 : 1,
        y: 0,
        filter: 'blur(0px)',
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.4)' : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ delay: isDragging ? 0 : index * 0.03, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileHover={isDragging ? {} : { y: -2, transition: { duration: 0.15 } }}
      className={`cursor-grab rounded-lg border-l-[3px] ${accentClass} border border-white/[0.04] bg-white/[0.03] transition-colors active:cursor-grabbing ${
        isDragging
          ? 'border-white/[0.15] bg-white/[0.08]'
          : 'hover:border-white/[0.08] hover:bg-white/[0.05]'
      }`}
    >
      <div className="p-3" onClick={(e) => { if (!isDragging) { e.stopPropagation(); onClick() } }}>
        <div className="flex items-center gap-1.5 mb-1">
          {orgName && (
            <span className="truncate text-[11px] font-semibold text-amber-400/80">{orgName}</span>
          )}
          {intentCfg && (
            <Badge variant="outline" className={`shrink-0 text-[8px] ${intentCfg.color}`}>
              {intentCfg.label}
            </Badge>
          )}
          {amountText && (
            <span className="ml-auto shrink-0 text-[9px] font-semibold text-blue-400">{amountText}</span>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400 line-clamp-2">{summary}</p>
        <p className="mt-1.5 text-[9px] text-slate-600">{formatRelativeTime(activity.activityDate)}</p>
      </div>
    </motion.div>
  )
}
