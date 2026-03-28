import { Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function MeetingsPage() {
  return (
    <div>
      <PageHeader title="미팅" description="고객사 미팅 일정과 브리핑을 관리합니다." />
      <EmptyState
        icon={Calendar}
        title="등록된 미팅이 없습니다"
        description="다가오는 미팅을 추가하면 AI가 브리핑 자료를 자동으로 준비해 드립니다. (Phase 2에서 활성화)"
      />
    </div>
  )
}
