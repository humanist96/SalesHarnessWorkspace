import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
        <Icon className="h-7 w-7 text-slate-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-300">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-slate-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-shadow hover:shadow-amber-500/30"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
