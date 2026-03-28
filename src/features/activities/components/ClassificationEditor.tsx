'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  INTENT_CONFIG,
  STAGE_CONFIG,
  SENTIMENT_CONFIG,
  ALL_INTENTS,
  ALL_STAGES,
  type SalesIntent,
  type SalesStage,
  type ActivitySentiment,
} from '@/lib/pipeline/types'
import { isV2Content } from '@/lib/pipeline/parse-content'
import { X } from 'lucide-react'

interface ClassificationEditorProps {
  activityId: string
  parsedContent: unknown
  onSaved: () => void
  onCancel: () => void
}

export function ClassificationEditor({ activityId, parsedContent, onSaved, onCancel }: ClassificationEditorProps) {
  const v2 = isV2Content(parsedContent)

  const [intent, setIntent] = useState<SalesIntent>(v2 ? parsedContent.intent : 'relationship')
  const [stage, setStage] = useState<SalesStage>(v2 ? parsedContent.stage : 'post_care')
  const [sentiment, setSentiment] = useState<ActivitySentiment>(v2 ? parsedContent.sentiment : 'neutral')
  const [products, setProducts] = useState<string[]>(v2 ? parsedContent.products : [])
  const [newProduct, setNewProduct] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/activities/${activityId}/classify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, stage, products, sentiment }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('분류가 수정되었습니다.')
        onSaved()
      } else {
        toast.error(json.error || '수정에 실패했습니다.')
      }
    } catch {
      toast.error('서버 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function addProduct() {
    const trimmed = newProduct.trim()
    if (trimmed && !products.includes(trimmed)) {
      setProducts([...products, trimmed])
      setNewProduct('')
    }
  }

  function removeProduct(p: string) {
    setProducts(products.filter((x) => x !== p))
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-3">
      <p className="text-[12px] font-medium text-amber-300">분류 수정</p>

      <div className="grid grid-cols-3 gap-3">
        {/* Intent */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500">영업 목적</label>
          <Select value={intent} onValueChange={(v) => setIntent(v as SalesIntent)}>
            <SelectTrigger className="h-8 border-white/[0.06] bg-white/[0.03] text-[11px] text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1a2236]">
              {ALL_INTENTS.map((i) => (
                <SelectItem key={i} value={i} className="text-[11px] text-slate-300">
                  {INTENT_CONFIG[i].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500">영업 단계</label>
          <Select value={stage} onValueChange={(v) => setStage(v as SalesStage)}>
            <SelectTrigger className="h-8 border-white/[0.06] bg-white/[0.03] text-[11px] text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1a2236]">
              {ALL_STAGES.map((s) => (
                <SelectItem key={s} value={s} className="text-[11px] text-slate-300">
                  {STAGE_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sentiment */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500">감성</label>
          <Select value={sentiment} onValueChange={(v) => setSentiment(v as ActivitySentiment)}>
            <SelectTrigger className="h-8 border-white/[0.06] bg-white/[0.03] text-[11px] text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1a2236]">
              {(['positive', 'neutral', 'negative'] as const).map((s) => (
                <SelectItem key={s} value={s} className="text-[11px] text-slate-300">
                  {SENTIMENT_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500">관련 상품</label>
        <div className="flex flex-wrap gap-1">
          {products.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-300">
              {p}
              <button type="button" onClick={() => removeProduct(p)} className="text-slate-500 hover:text-slate-300">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProduct() } }}
            placeholder="+ 추가"
            className="h-6 w-20 rounded border-0 bg-transparent px-1 text-[10px] text-slate-300 placeholder-slate-600 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 text-[11px] text-slate-400">
          취소
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-7 bg-amber-500/20 text-[11px] text-amber-300 hover:bg-amber-500/30"
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
