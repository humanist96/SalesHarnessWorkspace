import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function DocumentsPage() {
  // TODO: Block G에서 실 데이터 조회
  const documents: unknown[] = []

  return (
    <div>
      <PageHeader
        title="문서"
        description="AI로 생성한 제안서, 이메일, 보고서를 관리합니다."
        actionLabel="+ 새 문서 만들기"
        actionHref="/documents/new"
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="아직 문서가 없습니다"
          description="AI로 첫 번째 제안서를 만들어볼까요? 고객사와 상품을 선택하면 제안서 초안을 자동으로 생성해 드립니다."
          actionLabel="첫 제안서 만들기"
          actionHref="/documents/new"
        />
      ) : (
        <div>{/* TODO: DocumentList 컴포넌트 */}</div>
      )}
    </div>
  )
}
