'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'motion/react'
import { Inbox, Loader2, CheckCircle2 } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import type { Activity } from '@/lib/db/schema'
import type { KanbanStatus } from './KanbanView'

const COLUMN_THEME: Record<KanbanStatus, {
  gradient: string
  text: string
  border: string
  icon: typeof Inbox
  iconColor: string
}> = {
  received: {
    gradient: 'from-blue-500/20 to-transparent',
    text: 'text-blue-400',
    border: 'border-t-blue-500/50',
    icon: Inbox,
    iconColor: 'text-blue-400',
  },
  in_progress: {
    gradient: 'from-amber-500/20 to-transparent',
    text: 'text-amber-400',
    border: 'border-t-amber-500/50',
    icon: Loader2,
    iconColor: 'text-amber-400',
  },
  completed: {
    gradient: 'from-emerald-500/20 to-transparent',
    text: 'text-emerald-400',
    border: 'border-t-emerald-500/50',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
}

interface KanbanColumnProps {
  stage: KanbanStatus
  label: string
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  columnIndex: number
}

export function KanbanColumn({ stage, label, activities, onActivityClick, columnIndex }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const theme = COLUMN_THEME[stage]
  const Icon = theme.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: columnIndex * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col rounded-2xl border ${theme.border} border-t-2 transition-all duration-300 ${
        isOver
          ? 'border-white/[0.15] bg-white/[0.05] shadow-[0_0_20px_rgba(255,255,255,0.03)]'
          : 'border-white/[0.04] bg-white/[0.015]'
      }`}
    >
      {/* 헤더 */}
      <div className={`bg-gradient-to-b ${theme.gradient} rounded-t-2xl px-4 py-3`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${theme.iconColor}`} />
          <h3 className={`text-[14px] font-bold ${theme.text}`}>{label}</h3>
          <span className={`ml-auto rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-semibold ${theme.text}`}>
            {activities.length}
          </span>
        </div>
      </div>

      {/* 카드 목록 */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-3"
        style={{ maxHeight: '600px', minHeight: '200px' }}
      >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06]"
          >
            <Icon className={`h-6 w-6 ${theme.iconColor} opacity-30 mb-2`} />
            <p className="text-[11px] text-slate-600">드래그하여 이동</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
