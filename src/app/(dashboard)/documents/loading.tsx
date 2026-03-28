import { Skeleton } from '@/components/ui/skeleton'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Skeleton className="h-8 w-32 bg-white/[0.06]" />
        <Skeleton className="h-10 w-40 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}
