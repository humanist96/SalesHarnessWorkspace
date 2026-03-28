'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Organization } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'
import type { CreateOrganizationInput } from '@/lib/validations/organization'

export function useOrganizations() {
  return useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      const json: ApiResponse<Organization[]> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${id}`)
      const json: ApiResponse<Organization> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrganizationInput) => {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json: ApiResponse<Organization> = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}
