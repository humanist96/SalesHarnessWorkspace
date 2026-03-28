'use client'

import { useState } from 'react'
import { Copy, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AIBadge } from '@/components/shared/AIBadge'
import { toast } from 'sonner'

interface DocumentEditorProps {
  initialContent: string
  aiGenerated?: boolean
  onSave: (content: string) => void
  isSaving?: boolean
}

export function DocumentEditor({ initialContent, aiGenerated, onSave, isSaving }: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('클립보드에 복사되었습니다')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {aiGenerated && <AIBadge />}
          <span className="text-[11px] text-slate-600">
            {content.length.toLocaleString()}자
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 border-white/[0.06] bg-white/[0.03] text-[12px] text-slate-400 hover:bg-white/[0.06]"
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사하기'}
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(content)}
            disabled={isSaving}
            className="h-8 bg-gradient-to-r from-amber-500 to-amber-600 text-[12px] font-semibold text-amber-950"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[400px] border-white/[0.06] bg-white/[0.02] text-[14px] leading-relaxed text-slate-300 placeholder-slate-600"
      />
    </div>
  )
}
