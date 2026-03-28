'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-[18px] font-semibold text-white">문제가 발생했습니다</h2>
      <p className="mt-2 max-w-md text-[13px] text-slate-500">
        다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.
      </p>
      <Button
        onClick={reset}
        className="mt-6 bg-white/[0.06] text-[13px] text-slate-300 hover:bg-white/[0.1]"
      >
        다시 시도
      </Button>
    </div>
  )
}
