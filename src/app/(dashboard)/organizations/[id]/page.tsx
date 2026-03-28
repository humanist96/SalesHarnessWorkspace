'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { OrganizationDetail } from '@/features/organizations/components/OrganizationDetail'
import { Skeleton } from '@/components/ui/skeleton'
import type { Organization, Contact } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading } = useQuery<Organization & { contacts: Contact[] }>({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${id}`)
      const json: ApiResponse<Organization & { contacts: Contact[] }> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data!
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.04]" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.04]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="고객사를 찾을 수 없습니다" />
        <p className="text-[13px] text-slate-500">요청한 고객사가 존재하지 않습니다.</p>
      </div>
    )
  }

  const { contacts, ...organization } = data

  return <OrganizationDetail organization={organization} contacts={contacts} />
}
