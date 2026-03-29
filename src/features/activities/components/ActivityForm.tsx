'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ClassificationBadges } from './ClassificationBadges'
import { ActivitySuggestPanel } from './ActivitySuggestPanel'
import { useActivitySuggestions } from '../hooks/useActivitySuggestions'
import { isV2Content } from '@/lib/pipeline/parse-content'
import type { Organization } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

interface ActivityFormProps {
  onSuccess?: () => void
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: '전화', email: '이메일', visit: '방문', meeting: '미팅',
  contract: '계약', billing: '빌링', inspection: '검수', other: '기타',
}

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const [rawContent, setRawContent] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const { suggestions, templates, isLoading: suggestLoading, compositionHandlers } =
    useActivitySuggestions(rawContent, organizationId)

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      const json: ApiResponse<Organization[]> = await res.json()
      return json.data ?? []
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rawContent.trim()) return

    setIsSubmitting(true)
    setPipelineResult(null)

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, organizationId }),
      })
      const json = await res.json()

      if (json.success) {
        const { pipeline } = json.data
        setPipelineResult(pipeline)

        const classification = pipeline?.classification
        const typeLabel = classification?.type ? ACTIVITY_TYPE_LABELS[classification.type] || classification.type : '기타'
        const remindersMsg = pipeline?.remindersCreated > 0
          ? ` | 후속조치 ${pipeline.remindersCreated}건 자동 추출`
          : ''

        toast.success(`활동 기록 완료 (${typeLabel})${remindersMsg}`)
        setRawContent('')
        setOrganizationId(null)
        onSuccess?.()
      } else {
        toast.error(json.error || '저장에 실패했습니다')
      }
    } catch {
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const classification = pipelineResult?.classification as Record<string, unknown> | undefined

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">고객사 (선택)</Label>
          <Select onValueChange={(v) => { if (v) setOrganizationId(String(v)) }}>
            <SelectTrigger className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200">
              <SelectValue placeholder="고객사를 선택하세요 (미선택 시 AI가 자동 매칭)" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1a2236]">
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id} className="text-[13px] text-slate-300">{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">활동 내용</Label>
          <div className="relative">
            <Textarea
              value={rawContent}
              onChange={(e) => {
                setRawContent(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              onCompositionStart={compositionHandlers.onCompositionStart}
              onCompositionEnd={compositionHandlers.onCompositionEnd}
              placeholder="자유형식으로 입력하세요. AI가 자동으로 분류하고 후속조치를 추출합니다.&#10;&#10;예시: IBK 강용원 이사 통화, 부산은행 채권매도대행 회선비용 0.06억/년, 차주 계약 진행 예정"
              className="min-h-[120px] border-white/[0.06] bg-white/[0.03] text-[14px] leading-relaxed text-slate-200 placeholder-slate-600"
            />
            <ActivitySuggestPanel
              suggestions={suggestions}
              templates={templates}
              isLoading={suggestLoading}
              visible={showSuggestions && (rawContent.length >= 5 || !!organizationId)}
              onSelectSuggestion={(content, orgId) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                setRawContent(content)
                if (orgId) setOrganizationId(orgId)
                setShowSuggestions(false)
              }}
              onSelectTemplate={(content) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                setRawContent(content)
                setShowSuggestions(false)
              }}
            />
          </div>
          <p className="text-[11px] text-slate-600">{rawContent.length}자</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !rawContent.trim()}
          className="h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              AI가 분석하고 있습니다...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              활동 기록 + AI 분류
            </>
          )}
        </Button>
      </form>

      {/* AI 분류 결과 표시 */}
      {classification && (
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-[13px] font-medium text-amber-300">AI 분류 결과</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
              신뢰도 {classification.confidence as number}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <span className="text-slate-500">유형:</span>{' '}
              <span className="text-slate-200">{ACTIVITY_TYPE_LABELS[(classification.type as string) || 'other']}</span>
            </div>
            <div>
              <span className="text-slate-500">고객사:</span>{' '}
              <span className="text-slate-200">{(classification.organizationMention as string) || '—'}</span>
            </div>
          </div>

          {/* V2 의미 분류 태그 */}
          {isV2Content(classification) && (
            <ClassificationBadges
              parsedContent={classification}
              showStage
              showProducts
              showSentiment
              showRisks
            />
          )}

          {/* AI 분류 이유 */}
          {(classification.reasoning as string) && (
            <p className="text-[11px] italic text-slate-500">
              &ldquo;{classification.reasoning as string}&rdquo;
            </p>
          )}

          {(classification.summary as string) && (
            <p className="text-[12px] text-slate-400">{classification.summary as string}</p>
          )}

          {Array.isArray(classification.keywords) && (classification.keywords as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(classification.keywords as string[]).map((kw, i) => (
                <span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">{kw}</span>
              ))}
            </div>
          )}

          {Array.isArray(classification.followUps) && (classification.followUps as { action: string }[]).length > 0 && (
            <div className="border-t border-white/[0.04] pt-2">
              <p className="mb-1 text-[11px] font-medium text-emerald-400">자동 추출된 후속조치:</p>
              {(classification.followUps as { action: string; dueDescription: string; priority: string }[]).map((fu, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">{fu.action}</span>
                  <span className="text-slate-600">({fu.dueDescription})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
