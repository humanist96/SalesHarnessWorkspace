import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // TODO: Block G에서 실 데이터 조회
  return (
    <div>
      <PageHeader title="문서 상세" />
      <div className="glass-card rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 bg-white/[0.06]" />
          <Skeleton className="h-4 w-full bg-white/[0.04]" />
          <Skeleton className="h-4 w-3/4 bg-white/[0.04]" />
          <Skeleton className="h-4 w-5/6 bg-white/[0.04]" />
          <Skeleton className="h-64 w-full bg-white/[0.03]" />
        </div>
      </div>
    </div>
  )
}
