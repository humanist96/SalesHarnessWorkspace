import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // TODO: Block G에서 실 데이터 조회
  return (
    <div>
      <PageHeader title="고객사 상세" />
      <div className="glass-card rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-white/[0.06]" />
          <div className="flex gap-2">
            {['개요', '담당자', '문서', '메모'].map((tab) => (
              <Skeleton key={tab} className="h-9 w-20 rounded-lg bg-white/[0.04]" />
            ))}
          </div>
          <Skeleton className="h-48 w-full bg-white/[0.03]" />
        </div>
      </div>
    </div>
  )
}
