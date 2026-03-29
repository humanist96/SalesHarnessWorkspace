'use client'

import { useMemo, useCallback } from 'react'
import { DndContext, DragOverlay, closestCorners, type DragEndEvent } from '@dnd-kit/core'
import { motion } from 'motion/react'
import { KanbanColumn } from './KanbanColumn'
import { isV2Content } from '@/lib/pipeline/parse-content'
import { toast } from 'sonner'
import type { Activity } from '@/lib/db/schema'

// 실무형 3단계 칸반
export type KanbanStatus = 'received' | 'in_progress' | 'completed'

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string; stages: string[] }[] = [
  {
    id: 'received',
    label: '접수',
    stages: ['prospecting', 'needs_analysis'],
  },
  {
    id: 'in_progress',
    label: '진행중',
    stages: ['proposal', 'negotiation', 'contracting', 'implementation'],
  },
  {
    id: 'completed',
    label: '완료',
    stages: ['post_care'],
  },
]

// stage → kanban status 매핑
function getKanbanStatus(activity: Activity): KanbanStatus {
  const parsed = activity.parsedContent
  if (!isV2Content(parsed)) return 'received'

  const stage = parsed.stage
  for (const col of KANBAN_COLUMNS) {
    if (col.stages.includes(stage)) return col.id
  }
  return 'received'
}

// kanban status → 대표 stage (API 저장용)
const STATUS_TO_STAGE: Record<KanbanStatus, string> = {
  received: 'needs_analysis',
  in_progress: 'proposal',
  completed: 'post_care',
}

interface KanbanViewProps {
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  onStageChange?: (activityId: string, newStage: string) => void
}

export function KanbanView({ activities, onActivityClick, onStageChange }: KanbanViewProps) {
  const columns = useMemo(() => {
    const map = new Map<KanbanStatus, Activity[]>()
    for (const col of KANBAN_COLUMNS) {
      map.set(col.id, [])
    }
    for (const a of activities) {
      const status = getKanbanStatus(a)
      map.get(status)!.push(a)
    }
    return map
  }, [activities])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activityId = active.id as string
    const newStatus = over.id as KanbanStatus

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return
    const currentStatus = getKanbanStatus(activity)
    if (currentStatus === newStatus) return

    if (onStageChange) {
      const newStage = STATUS_TO_STAGE[newStatus]
      onStageChange(activityId, newStage)
      const label = KANBAN_COLUMNS.find(c => c.id === newStatus)?.label ?? newStatus
      toast.success(`"${label}"로 이동했습니다`)
    }
  }, [activities, onStageChange])

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        {KANBAN_COLUMNS.map((col, i) => (
          <KanbanColumn
            key={col.id}
            stage={col.id}
            label={col.label}
            activities={columns.get(col.id) ?? []}
            onActivityClick={onActivityClick}
            columnIndex={i}
          />
        ))}
      </motion.div>
      <DragOverlay />
    </DndContext>
  )
}
