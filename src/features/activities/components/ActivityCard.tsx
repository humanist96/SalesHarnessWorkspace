'use client'

import { Phone, Mail, MapPin, Handshake, FileCheck, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ClassificationBadges } from './ClassificationBadges'
import { getSummary, getKeywords, isV2Content } from '@/lib/pipeline/parse-content'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Activity } from '@/lib/db/schema'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  call:       { label: '전화',  icon: Phone,         color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  email:      { label: '이메일', icon: Mail,          color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  visit:      { label: '방문',  icon: MapPin,         color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  meeting:    { label: '미팅',  icon: Handshake,      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  contract:   { label: '계약',  icon: FileCheck,      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  billing:    { label: '빌링',  icon: ClipboardList,  color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  inspection: { label: '검수',  icon: FileCheck,      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  other:      { label: '기타',  icon: ClipboardList,  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

interface ActivityCardProps {
  activity: Activity
  onClick: () => void
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const config = TYPE_CONFIG[activity.type || 'other'] || TYPE_CONFIG.other
  const Icon = config.icon
  const parsed = activity.parsedContent
  const summary = getSummary(parsed)
  const keywords = getKeywords(parsed)
  const v2 = isV2Content(parsed)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/[0.03] bg-white/[0.02] p-4 text-left transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
          <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
              {config.label}
            </Badge>
            {v2 ? (
              <ClassificationBadges parsedContent={parsed} showStage showRisks compact />
            ) : (
              activity.aiClassified && (
                <span className="text-[9px] text-amber-500/60">AI 분류</span>
              )
            )}
            <span className="ml-auto text-[11px] text-slate-600">
              {formatRelativeTime(activity.activityDate)}
            </span>
          </div>
          <p className="text-[13px] text-slate-300 line-clamp-2">
            {summary || activity.rawContent.slice(0, 150)}
          </p>
          {keywords.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {keywords.slice(0, 4).map((kw, i) => (
                <span key={i} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">{kw}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
