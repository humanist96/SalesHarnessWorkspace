import { Sparkles } from 'lucide-react'

export function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
      <Sparkles className="h-3 w-3" />
      AI 생성
    </span>
  )
}
