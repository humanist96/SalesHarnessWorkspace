'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { ClipboardList, Sparkles, Search, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { ActivityCard } from '@/features/activities/components/ActivityCard'
import { ActivityDetailSheet } from '@/features/activities/components/ActivityDetailSheet'
import { ActivityViewTabs, type ViewMode } from '@/features/activities/components/ActivityViewTabs'
import { CalendarView } from '@/features/activities/components/CalendarView'
import { KanbanView } from '@/features/activities/components/KanbanView'
import { INTENT_CONFIG, STAGE_CONFIG, ALL_INTENTS, ALL_STAGES } from '@/lib/pipeline/types'
import type { Activity } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

const METHOD_TYPES = [
  { value: '', label: '전체' },
  { value: 'call', label: '전화' },
  { value: 'email', label: '이메일' },
  { value: 'visit', label: '방문' },
  { value: 'meeting', label: '미팅' },
  { value: 'contract', label: '계약' },
  { value: 'billing', label: '빌링' },
  { value: 'other', label: '기타' },
]

export default function ActivitiesPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [typeFilter, setTypeFilter] = useState('')
  const [intentFilter, setIntentFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 캘린더/칸반은 더 많은 데이터가 필요
  const limit = viewMode === 'list' ? '100' : '500'

  const { data: activityList, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities', typeFilter, intentFilter, stageFilter, searchQuery, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit })
      if (typeFilter) params.set('type', typeFilter)
      if (intentFilter) params.set('intent', intentFilter)
      if (stageFilter) params.set('stage', stageFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/activities?${params}`)
      const json: ApiResponse<Activity[]> = await res.json()
      return json.data ?? []
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['activities'] })
    queryClient.invalidateQueries({ queryKey: ['reminders'] })
  }

  function handleCardClick(activity: Activity) {
    setSelectedActivity(activity)
    setSheetOpen(true)
  }

  const handleStageChange = useCallback(async (activityId: string, newStage: string) => {
    try {
      await fetch(`/api/activities/${activityId}/classify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    } catch {
      // handled by toast in KanbanView
    }
  }, [queryClient])

  const isFullWidth = viewMode === 'calendar' || viewMode === 'kanban'

  return (
    <div>
      <PageHeader title="영업 활동" description="활동을 기록하면 AI가 자동으로 분류하고 인사이트를 도출합니다." />

      {/* 뷰 전환 + 액션 버튼 */}
      <div className="mb-6 flex items-center justify-between">
        <ActivityViewTabs value={viewMode} onChange={setViewMode} />
        <div className="flex items-center gap-2">
          <Link
            href="/import"
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200"
          >
            <Upload className="h-3.5 w-3.5" />
            CSV 가져오기
          </Link>
          <button
            onClick={() => {
              const a = document.createElement('a')
              a.href = '/api/activities/export?format=csv'
              a.download = ''
              a.click()
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            CSV 내보내기
          </button>
        </div>
      </div>

      {/* 캘린더/칸반 뷰: 전체 폭 */}
      {isFullWidth ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {viewMode === 'calendar' && (
              <div className="glass-card rounded-2xl p-6">
                {isLoading ? (
                  <div className="h-[500px] animate-pulse rounded-xl bg-white/[0.04]" />
                ) : (
                  <CalendarView
                    activities={activityList ?? []}
                    onActivityClick={handleCardClick}
                  />
                )}
              </div>
            )}

            {viewMode === 'kanban' && (
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-7 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="h-[400px] animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                  </div>
                ) : (
                  <KanbanView
                    activities={activityList ?? []}
                    onActivityClick={handleCardClick}
                    onStageChange={handleStageChange}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* 리스트 뷰: 폼 + 목록 2컬럼 */
        <div className="grid grid-cols-5 gap-6">
          {/* 왼쪽: 활동 기록 폼 */}
          <div className="col-span-2">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Sparkles className="h-4 w-4 text-amber-400" />
                새 활동 기록
              </h2>
              <ActivityForm onSuccess={handleSuccess} />
            </div>
          </div>

          {/* 오른쪽: 활동 목록 */}
          <div className="col-span-3">
            <div className="glass-card rounded-2xl p-6">
              {/* 필터 영역 */}
              <div className="mb-4 space-y-3">
                <h2 className="text-[15px] font-semibold text-white">
                  최근 활동 ({activityList?.length || 0}건)
                </h2>

                {/* 수단 필터 */}
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-[10px] text-slate-600">수단:</span>
                  {METHOD_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTypeFilter(t.value)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                        typeFilter === t.value
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* 영업 목적 필터 */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[10px] text-slate-600">목적:</span>
                  <button
                    onClick={() => setIntentFilter('')}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                      intentFilter === ''
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                    }`}
                  >
                    전체
                  </button>
                  {ALL_INTENTS.map((intent) => {
                    const cfg = INTENT_CONFIG[intent]
                    return (
                      <button
                        key={intent}
                        onClick={() => setIntentFilter(intent)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                          intentFilter === intent
                            ? `${cfg.color}`
                            : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>

                {/* 영업 단계 필터 */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[10px] text-slate-600">단계:</span>
                  <button
                    onClick={() => setStageFilter('')}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                      stageFilter === ''
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                    }`}
                  >
                    전체
                  </button>
                  {ALL_STAGES.map((stage) => {
                    const cfg = STAGE_CONFIG[stage]
                    return (
                      <button
                        key={stage}
                        onClick={() => setStageFilter(stage)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                          stageFilter === stage
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>

                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    placeholder="활동 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-[12px] text-slate-300 placeholder-slate-600 outline-none focus:border-amber-500/30"
                  />
                </div>
              </div>

              {/* 활동 목록 */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : !activityList || activityList.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="아직 활동 기록이 없습니다"
                  description="왼쪽 폼에서 첫 번째 영업 활동을 기록해보세요. AI가 자동으로 분류합니다."
                />
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {activityList.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onClick={() => handleCardClick(activity)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 활동 상세 Sheet */}
      <ActivityDetailSheet
        activity={selectedActivity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={handleSuccess}
      />
    </div>
  )
}
