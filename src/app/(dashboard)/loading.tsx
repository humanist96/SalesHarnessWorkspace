import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48 bg-white/[0.06]" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl bg-white/[0.03]" />
    </div>
  )
}
