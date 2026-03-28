'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { DocumentEditor } from '@/features/documents/components/DocumentEditor'
import { Skeleton } from '@/components/ui/skeleton'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import type { Document } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${id}`)
      const json: ApiResponse<Document> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data!
    },
  })

  async function handleSave(content: string) {
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userFeedback: 'edited' }),
      })
      toast.success('문서가 저장되었습니다')
    } catch {
      toast.error('저장에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="문서 상세" />
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <Skeleton className="h-8 w-64 bg-white/[0.06]" />
          <Skeleton className="h-64 w-full bg-white/[0.03]" />
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div>
        <PageHeader title="문서를 찾을 수 없습니다" />
        <p className="text-[13px] text-slate-500">요청한 문서가 존재하지 않습니다.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={doc.title} description={DOCUMENT_TYPES[doc.type]} />
      <div className="glass-card rounded-2xl p-6">
        <DocumentEditor
          initialContent={doc.content}
          aiGenerated={doc.aiGenerated}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
