import { Target } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function PipelinePage() {
  return (
    <div>
      <PageHeader title="영업 현황" description="딜 파이프라인과 매출 예측을 확인합니다." />
      <EmptyState
        icon={Target}
        title="진행 중인 딜이 없습니다"
        description="영업 기회를 등록하면 파이프라인을 한눈에 확인하고 AI가 전환 확률을 예측해 드립니다. (Phase 3에서 활성화)"
      />
    </div>
  )
}
