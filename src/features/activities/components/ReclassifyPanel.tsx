'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Play, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { ClassificationResultV2 } from '@/lib/pipeline/types'

interface ReclassifyStatus {
  totalCount: number
  processedCount: number
  failedCount?: number
  status: 'preview' | 'running' | 'completed' | 'failed'
  sampleResults?: { id: string; rawContent: string; result: ClassificationResultV2 }[]
}

export function ReclassifyPanel() {
  const [status, setStatus] = useState<ReclassifyStatus | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePreview() {
    setLoading(true)
    try {
      const res = await fetch('/api/activities/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'v1_only', dryRun: true }),
      })
      const json = await res.json()
      if (json.success) {
        setStatus(json.data)
      } else {
        toast.error(json.error || '미리보기 실패')
      }
    } catch {
      toast.error('서버 오류')
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    setLoading(true)
    setStatus((prev) => prev ? { ...prev, status: 'running' } : null)
    try {
      const res = await fetch('/api/activities/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'v1_only', dryRun: false }),
      })
      const json = await res.json()
      if (json.success) {
        setStatus(json.data)
        toast.success(`재분류 완료: ${json.data.processedCount}건 처리`)
      } else {
        toast.error(json.error || '재분류 실패')
      }
    } catch {
      toast.error('서버 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
        <Sparkles className="h-4 w-4 text-amber-400" />
        데이터 재분류 (V1 → V2)
      </h2>

      <p className="text-[12px] text-slate-400">
        기존 활동 데이터에 영업 목적(intent), 단계(stage), 상품, 감성 분류를 추가합니다.
      </p>

      {status && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">대상</p>
              <p className="text-[18px] font-bold text-white">{status.totalCount}건</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">처리 완료</p>
              <p className="text-[18px] font-bold text-emerald-400">{status.processedCount}건</p>
            </div>
            {status.failedCount !== undefined && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] text-slate-500">실패</p>
                <p className="text-[18px] font-bold text-rose-400">{status.failedCount}건</p>
              </div>
            )}
          </div>

          {/* 진행률 바 */}
          {status.status === 'running' && status.totalCount > 0 && (
            <div>
              <div className="h-2 w-full rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                  style={{ width: `${Math.round((status.processedCount / status.totalCount) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-slate-500">
                {Math.round((status.processedCount / status.totalCount) * 100)}%
              </p>
            </div>
          )}

          {/* 미리보기 결과 */}
          {status.sampleResults && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400">미리보기 (5건)</p>
              {status.sampleResults.map((s) => (
                <div key={s.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                  <p className="text-[11px] text-slate-400 line-clamp-1">{s.rawContent}...</p>
                  <div className="mt-1 flex gap-2 text-[10px]">
                    <span className="text-amber-400">{s.result.intent}</span>
                    <span className="text-slate-500">{s.result.stage}</span>
                    <span className="text-slate-500">{s.result.products.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status.status === 'completed' && (
            <p className="text-[12px] font-medium text-emerald-400">재분류 완료!</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={loading}
          className="h-8 border-white/[0.08] bg-white/[0.03] text-[12px] text-slate-300"
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          미리보기 (5건)
        </Button>
        <Button
          size="sm"
          onClick={handleStart}
          disabled={loading || status?.status === 'completed'}
          className="h-8 bg-amber-500/20 text-[12px] text-amber-300 hover:bg-amber-500/30"
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {loading && status?.status === 'running' ? '재분류 진행 중...' : '전체 재분류 시작'}
        </Button>
      </div>
    </div>
  )
}
