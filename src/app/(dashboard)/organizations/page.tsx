'use client'

import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { OrganizationList } from '@/features/organizations/components/OrganizationList'
import { OrganizationForm } from '@/features/organizations/components/OrganizationForm'
import { useOrganizations, useCreateOrganization } from '@/features/organizations/hooks/useOrganizations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { CreateOrganizationInput } from '@/lib/validations/organization'

export default function OrganizationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: organizations, isLoading } = useOrganizations()
  const createOrg = useCreateOrganization()

  async function handleCreate(data: CreateOrganizationInput) {
    try {
      await createOrg.mutateAsync(data)
      toast.success('고객사가 추가되었습니다')
      setDialogOpen(false)
    } catch {
      toast.error('고객사 추가에 실패했습니다')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-white">고객사</h1>
          <p className="mt-1 text-[13px] text-slate-500">영업 대상 고객사를 관리합니다.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-shadow hover:shadow-amber-500/30"
        >
          <Plus className="h-4 w-4" />
          고객사 추가
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !organizations || organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="등록된 고객사가 없습니다"
          description="영업 대상 고객사를 등록하면 AI가 맞춤형 제안서를 작성하고 미팅 브리핑을 준비해 드립니다."
        />
      ) : (
        <OrganizationList organizations={organizations} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/[0.08] bg-[#1a2236] text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">고객사 추가</DialogTitle>
          </DialogHeader>
          <OrganizationForm onSubmit={handleCreate} isLoading={createOrg.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
