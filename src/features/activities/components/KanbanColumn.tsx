'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'motion/react'
import { KanbanCard } from './KanbanCard'
import type { Activity } from '@/lib/db/schema'
import type { SalesStage } from '@/lib/pipeline/types'

const COLUMN_THEME: Record<SalesStage, { gradient: string; text: string; border: string }> = {
  prospecting:    { gradient: 'from-slate-500/20 to-transparent', text: 'text-slate-400', border: 'border-t-slate-500/40' },
  needs_analysis: { gradient: 'from-blue-500/20 to-transparent', text: 'text-blue-400', border: 'border-t-blue-500/40' },
  proposal:       { gradient: 'from-violet-500/20 to-transparent', text: 'text-violet-400', border: 'border-t-violet-500/40' },
  negotiation:    { gradient: 'from-amber-500/20 to-transparent', text: 'text-amber-400', border: 'border-t-amber-500/40' },
  contracting:    { gradient: 'from-emerald-500/20 to-transparent', text: 'text-emerald-400', border: 'border-t-emerald-500/40' },
  implementation: { gradient: 'from-teal-500/20 to-transparent', text: 'text-teal-400', border: 'border-t-teal-500/40' },
  post_care:      { gradient: 'from-cyan-500/20 to-transparent', text: 'text-cyan-400', border: 'border-t-cyan-500/40' },
}

interface KanbanColumnProps {
  stage: SalesStage
  label: string
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  columnIndex: number
}

export function KanbanColumn({ stage, label, activities, onActivityClick, columnIndex }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const theme = COLUMN_THEME[stage]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: columnIndex * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col rounded-xl border border-white/[0.04] ${theme.border} border-t-2 transition-colors ${
        isOver ? 'border-white/[0.12] bg-white/[0.04]' : 'bg-white/[0.015]'
      }`}
    >
      {/* 헤더 */}
      <div className={`bg-gradient-to-b ${theme.gradient} rounded-t-xl px-3 py-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-[13px] font-semibold ${theme.text}`}>{label}</h3>
          <span className={`rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium ${theme.text}`}>
            {activities.length}
          </span>
        </div>
      </div>

      {/* 카드 목록 */}
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: '500px' }}>
        <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
          {activities.map((a, i) => (
            <KanbanCard
              key={a.id}
              activity={a}
              onClick={() => onActivityClick(a)}
              index={i}
            />
          ))}
        </SortableContext>

        {activities.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-white/[0.06]">
            <p className="text-[11px] text-slate-600">활동 없음</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
