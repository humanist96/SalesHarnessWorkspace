import { Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function IntelligencePage() {
  return (
    <div>
      <PageHeader title="인텔리전스" description="시장 동향과 경쟁 정보를 확인합니다." />
      <EmptyState
        icon={Lightbulb}
        title="인텔리전스 데이터가 없습니다"
        description="금융IT 시장 동향, 경쟁사 분석, 상품 비교 등 AI 기반 인사이트를 제공합니다. (Phase 4에서 활성화)"
      />
    </div>
  )
}
