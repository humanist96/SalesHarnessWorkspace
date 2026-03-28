'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { AIBadge } from '@/components/shared/AIBadge'

interface DocumentStreamViewProps {
  content: string
  isStreaming: boolean
}

const SECTIONS = ['도입부', '고객 현황 분석', '제안 솔루션', '기대 효과', '비용 및 일정']

export function DocumentStreamView({ content, isStreaming }: DocumentStreamViewProps) {
  // 섹션 진행률 추정 (콘텐츠 길이 기반)
  const contentLength = content.length
  const estimatedSections = Math.min(
    Math.floor(contentLength / 300) + 1,
    SECTIONS.length,
  )

  return (
    <div className="space-y-4">
      {/* 진행률 표시 */}
      {isStreaming && (
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <div className="flex-1">
            <div className="flex gap-3">
              {SECTIONS.map((section, i) => {
                const isDone = i < estimatedSections
                const isCurrent = i === estimatedSections - 1 && isStreaming
                return (
                  <div key={section} className="flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-white/[0.1]" />
                    )}
                    <span
                      className={`text-[11px] ${
                        isCurrent ? 'text-amber-400' : isDone ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {section}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-6">
        <div className="mb-3">
          <AIBadge />
        </div>
        <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300">
          {content}
          {isStreaming && (
            <span className="inline-block h-5 w-0.5 animate-pulse bg-amber-400" />
          )}
        </div>
        {!content && !isStreaming && (
          <p className="text-[13px] text-slate-600">
            위 폼을 작성하고 &quot;AI로 제안서 생성하기&quot;를 클릭하면 여기에 결과가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  )
}
