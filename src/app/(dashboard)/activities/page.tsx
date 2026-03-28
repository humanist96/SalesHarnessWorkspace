'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Phone, Mail, MapPin, Handshake, FileCheck, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Activity } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: '전화', icon: Phone, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  email: { label: '이메일', icon: Mail, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  visit: { label: '방문', icon: MapPin, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  meeting: { label: '미팅', icon: Handshake, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  contract: { label: '계약', icon: FileCheck, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  billing: { label: '빌링', icon: ClipboardList, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  other: { label: '기타', icon: ClipboardList, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient()

  const { data: activityList, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activities?limit=100')
      const json: ApiResponse<Activity[]> = await res.json()
      return json.data ?? []
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['activities'] })
    queryClient.invalidateQueries({ queryKey: ['reminders'] })
  }

  return (
    <div>
      <PageHeader title="영업 활동" description="활동을 기록하면 AI가 자동으로 분류하고 후속조치를 추출합니다." />

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
            <h2 className="mb-4 text-[15px] font-semibold text-white">
              최근 활동 ({activityList?.length || 0}건)
            </h2>

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
                {activityList.map((activity) => {
                  const config = TYPE_CONFIG[activity.type || 'other'] || TYPE_CONFIG.other
                  const Icon = config.icon
                  const parsed = activity.parsedContent as Record<string, unknown> | null

                  return (
                    <div key={activity.id} className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                          <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              {config.label}
                            </Badge>
                            {activity.aiClassified && (
                              <span className="text-[9px] text-amber-500/60">AI 분류</span>
                            )}
                            <span className="ml-auto text-[11px] text-slate-600">
                              {formatRelativeTime(activity.activityDate)}
                            </span>
                          </div>
                          <p className="text-[13px] text-slate-300 line-clamp-2">
                            {(parsed?.summary as string) || activity.rawContent.slice(0, 150)}
                          </p>
                          {parsed && Array.isArray(parsed.keywords) && (parsed.keywords as string[]).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {(parsed.keywords as string[]).slice(0, 4).map((kw, i) => (
                                <span key={i} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
