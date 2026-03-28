'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentList } from '@/features/documents/components/DocumentList'
import type { Document } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch('/api/documents')
      const json: ApiResponse<Document[]> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data ?? []
    },
  })

  return (
    <div>
      <PageHeader
        title="문서"
        description="AI로 생성한 제안서, 이메일, 보고서를 관리합니다."
        actionLabel="+ 새 문서 만들기"
        actionHref="/documents/new"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !documents || documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="아직 문서가 없습니다"
          description="AI로 첫 번째 제안서를 만들어볼까요? 고객사와 상품을 선택하면 제안서 초안을 자동으로 생성해 드립니다."
          actionLabel="첫 제안서 만들기"
          actionHref="/documents/new"
        />
      ) : (
        <DocumentList
          documents={documents.map((d) => ({
            id: d.id,
            type: d.type,
            title: d.title,
            ai_generated: d.aiGenerated,
            user_feedback: d.userFeedback,
            created_at: String(d.createdAt),
          }))}
        />
      )}
    </div>
  )
}
