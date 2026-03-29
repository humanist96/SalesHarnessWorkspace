'use client'

import { useMemo, useCallback } from 'react'
import { DndContext, DragOverlay, closestCorners, type DragEndEvent } from '@dnd-kit/core'
import { motion } from 'motion/react'
import { KanbanColumn } from './KanbanColumn'
import { STAGE_CONFIG, ALL_STAGES, type SalesStage } from '@/lib/pipeline/types'
import { isV2Content } from '@/lib/pipeline/parse-content'
import { toast } from 'sonner'
import type { Activity } from '@/lib/db/schema'

interface KanbanViewProps {
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  onStageChange?: (activityId: string, newStage: SalesStage) => void
}

export function KanbanView({ activities, onActivityClick, onStageChange }: KanbanViewProps) {
  // 활동을 stage별로 그룹핑
  const columns = useMemo(() => {
    const map = new Map<SalesStage, Activity[]>()
    for (const stage of ALL_STAGES) {
      map.set(stage, [])
    }

    for (const a of activities) {
      const parsed = a.parsedContent
      const stage = isV2Content(parsed) ? parsed.stage : null
      if (stage && map.has(stage as SalesStage)) {
        map.get(stage as SalesStage)!.push(a)
      } else {
        // V2 미분류 → needs_analysis에 배치
        map.get('needs_analysis')!.push(a)
      }
    }

    return map
  }, [activities])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activityId = active.id as string
    const newStage = over.id as SalesStage

    // 같은 stage면 무시
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return
    const currentStage = isV2Content(activity.parsedContent) ? activity.parsedContent.stage : null
    if (currentStage === newStage) return

    if (onStageChange) {
      onStageChange(activityId, newStage)
      toast.success(`영업 단계가 "${STAGE_CONFIG[newStage].label}"로 변경되었습니다`)
    }
  }, [activities, onStageChange])

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid auto-cols-fr grid-flow-col gap-3 overflow-x-auto pb-2"
        style={{ gridTemplateColumns: `repeat(${ALL_STAGES.length}, minmax(180px, 1fr))` }}
      >
        {ALL_STAGES.map((stage, i) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={STAGE_CONFIG[stage].label}
            activities={columns.get(stage) ?? []}
            onActivityClick={onActivityClick}
            columnIndex={i}
          />
        ))}
      </motion.div>
      <DragOverlay />
    </DndContext>
  )
}
