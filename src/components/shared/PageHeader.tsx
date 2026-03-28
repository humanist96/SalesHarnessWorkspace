import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, actionLabel, actionHref, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-slate-500">{description}</p>
        )}
      </div>
      {action}
      {!action && actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-shadow hover:shadow-amber-500/30"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
