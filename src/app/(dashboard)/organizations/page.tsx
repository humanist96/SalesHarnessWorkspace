import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function OrganizationsPage() {
  // TODO: Block G에서 실 데이터 조회
  const organizations: unknown[] = []

  return (
    <div>
      <PageHeader
        title="고객사"
        description="영업 대상 고객사를 관리합니다."
        actionLabel="+ 고객사 추가"
        actionHref="#"
      />

      {organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="등록된 고객사가 없습니다"
          description="영업 대상 고객사를 등록하면 AI가 맞춤형 제안서를 작성하고 미팅 브리핑을 준비해 드립니다."
          actionLabel="첫 고객사 등록하기"
          actionHref="#"
        />
      ) : (
        <div>{/* TODO: OrganizationList 컴포넌트 */}</div>
      )}
    </div>
  )
}
