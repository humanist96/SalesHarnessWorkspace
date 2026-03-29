'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { GripVertical } from 'lucide-react'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'
import { isV2Content, getSummary } from '@/lib/pipeline/parse-content'
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const parsed = activity.parsedContent
  const v2 = isV2Content(parsed)
  const intent = v2 ? parsed.intent : null
  const intentCfg = intent ? INTENT_CONFIG[intent as SalesIntent] : null
  const orgName = v2 ? parsed.organizationMention : null
  const summary = getSummary(parsed) || activity.rawContent.slice(0, 80)
  const accentClass = intent ? INTENT_ACCENT[intent] ?? 'border-l-slate-500' : 'border-l-slate-500'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-lg border-l-[3px] ${accentClass} border border-white/[0.04] bg-white/[0.03] transition-all duration-200 ${
        isDragging
          ? 'scale-105 shadow-lg shadow-black/30 border-white/[0.12] bg-white/[0.06] z-50'
          : 'hover:border-white/[0.08] hover:bg-white/[0.05] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start gap-1.5 p-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-50 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-slate-600" />
        </button>

        <button type="button" onClick={onClick} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            {orgName && (
              <span className="truncate text-[11px] font-semibold text-amber-400/80">{orgName}</span>
            )}
            {intentCfg && (
              <Badge variant="outline" className={`shrink-0 text-[8px] ${intentCfg.color}`}>
                {intentCfg.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400 line-clamp-2">{summary}</p>
          <p className="mt-1.5 text-[9px] text-slate-600">{formatRelativeTime(activity.activityDate)}</p>
        </button>
      </div>
    </motion.div>
  )
}
