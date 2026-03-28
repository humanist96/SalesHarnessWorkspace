'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Building2, User, Sparkles, AlertTriangle, TrendingUp, Pencil } from 'lucide-react'
import { ClassificationBadges } from './ClassificationBadges'
import { ClassificationEditor } from './ClassificationEditor'
import { formatRelativeTime } from '@/lib/utils/format'
import {
  getSummary,
  getKeywords,
  getAmounts,
  getFollowUps,
  getReasoning,
  getRiskFlags,
  isV2Content,
  HIGHLIGHT_PATTERNS,
} from '@/lib/pipeline/parse-content'
import type { Activity } from '@/lib/db/schema'

interface ActivityDetailSheetProps {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

function highlightText(text: string, orgName?: string | null): React.ReactNode[] {
  const parts: { text: string; type: 'amount' | 'date' | 'org' | 'plain' }[] = []

  // 고객사명 패턴 추가
  const orgPattern = orgName ? `(${orgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})` : null
  const patterns = [
    `(${HIGHLIGHT_PATTERNS.amount.source})`,
    `(${HIGHLIGHT_PATTERNS.date.source})`,
    ...(orgPattern ? [orgPattern] : []),
  ]
  const combined = new RegExp(patterns.join('|'), 'g')

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), type: 'plain' })
    }

    let type: 'amount' | 'date' | 'org' = 'amount'
    if (HIGHLIGHT_PATTERNS.amount.test(match[0])) {
      type = 'amount'
    } else if (HIGHLIGHT_PATTERNS.date.test(match[0])) {
      type = 'date'
    } else {
      type = 'org'
    }
    // Reset lastIndex of global regexps after test
    HIGHLIGHT_PATTERNS.amount.lastIndex = 0
    HIGHLIGHT_PATTERNS.date.lastIndex = 0

    parts.push({ text: match[0], type })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), type: 'plain' })
  }

  return parts.map((part, i) => {
    if (part.type === 'amount') {
      return <span key={i} className="font-semibold text-blue-400">{part.text}</span>
    }
    if (part.type === 'date') {
      return <span key={i} className="text-slate-500">{part.text}</span>
    }
    if (part.type === 'org') {
      return <span key={i} className="font-semibold text-amber-400">{part.text}</span>
    }
    return <span key={i}>{part.text}</span>
  })
}

export function ActivityDetailSheet({ activity, open, onOpenChange, onUpdated }: ActivityDetailSheetProps) {
  const [editing, setEditing] = useState(false)

  if (!activity) return null

  const parsed = activity.parsedContent
  const summary = getSummary(parsed)
  const keywords = getKeywords(parsed)
  const amounts = getAmounts(parsed)
  const followUps = getFollowUps(parsed)
  const reasoning = getReasoning(parsed)
  const riskFlags = getRiskFlags(parsed)
  const v2 = isV2Content(parsed)
  const orgName = (parsed as Record<string, unknown> | null)?.organizationMention as string | null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[540px] overflow-y-auto border-white/[0.06] bg-[#0d1526] sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-[16px] text-white">활동 상세</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatRelativeTime(activity.activityDate)}
            </span>
            {activity.organizationId && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {(parsed as Record<string, unknown> | null)?.organizationMention as string ?? '고객사'}
              </span>
            )}
            {(() => {
              const contact = (parsed as Record<string, unknown> | null)?.contactMention as string | null
              return contact ? (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {contact}
                </span>
              ) : null
            })()}
            {activity.aiClassified && (
              <span className="text-[10px] text-amber-500/60">
                AI 분류 (신뢰도 {activity.aiConfidence}%)
              </span>
            )}
          </div>

          {/* V2 분류 태그 + 수정 버튼 */}
          {v2 && !editing && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <ClassificationBadges
                  parsedContent={parsed}
                  showStage
                  showProducts
                  showSentiment
                  showRisks
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="h-6 px-2 text-[10px] text-slate-500 hover:text-amber-400"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  수정
                </Button>
              </div>
            </div>
          )}

          {/* 분류 수정 에디터 */}
          {editing && (
            <ClassificationEditor
              activityId={activity.id}
              parsedContent={parsed}
              onSaved={() => { setEditing(false); onUpdated?.() }}
              onCancel={() => setEditing(false)}
            />
          )}

          {/* AI 요약 */}
          {summary && (
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                AI 요약
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-300">{summary}</p>
            </div>
          )}

          {/* 원문 전체 */}
          <div>
            <h3 className="mb-1.5 text-[12px] font-medium text-slate-500">원문 전체</h3>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-300">
                {highlightText(activity.rawContent, orgName)}
              </pre>
            </div>
          </div>

          {/* AI 분류 이유 (V2) */}
          {reasoning && (
            <div>
              <h3 className="mb-1.5 text-[12px] font-medium text-slate-500">AI 분류 이유</h3>
              <p className="text-[12px] italic leading-relaxed text-slate-400">&ldquo;{reasoning}&rdquo;</p>
            </div>
          )}

          {/* 금액 요약 */}
          {amounts.length > 0 && (
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                금액 정보
              </h3>
              <div className="space-y-1">
                {amounts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="font-semibold text-blue-400">{a.value}{a.unit}</span>
                    <span className="text-slate-500">{a.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 키워드 */}
          {keywords.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[12px] font-medium text-slate-500">키워드</h3>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw, i) => (
                  <span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* 리스크 신호 */}
          {riskFlags.length > 0 && (
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                리스크 신호
              </h3>
              <div className="space-y-1">
                {riskFlags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 후속조치 */}
          {followUps.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[12px] font-medium text-emerald-400">자동 추출된 후속조치</h3>
              <div className="space-y-1">
                {followUps.map((fu, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">{fu.action}</span>
                    <span className="text-slate-600">({fu.dueDescription})</span>
                    <Badge variant="outline" className={`text-[9px] ${
                      fu.priority === 'critical' ? 'border-rose-500/20 text-rose-400' :
                      fu.priority === 'high' ? 'border-amber-500/20 text-amber-400' :
                      'border-slate-500/20 text-slate-500'
                    }`}>
                      {fu.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
