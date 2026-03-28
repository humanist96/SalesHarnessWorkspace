'use client'

import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@/lib/validations/resolver'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposalSchema, type CreateProposalInput } from '@/lib/validations/document'
import { PROPOSAL_TYPES } from '@/lib/constants'
import type { Organization, Product } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

interface ProposalFormProps {
  onGenerate: (data: CreateProposalInput) => void
  isGenerating: boolean
}

export function ProposalForm({ onGenerate, isGenerating }: ProposalFormProps) {
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      const json: ApiResponse<Organization[]> = await res.json()
      return json.data ?? []
    },
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      const json: ApiResponse<Product[]> = await res.json()
      return json.data ?? []
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProposalInput>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      proposalType: 'new',
      productIds: [],
    },
  })

  const selectedProducts = watch('productIds') || []

  function toggleProduct(productId: string) {
    const current = selectedProducts
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]
    setValue('productIds', updated)
  }

  return (
    <form onSubmit={handleSubmit(onGenerate)} className="space-y-5">
      {/* 고객사 선택 */}
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">고객사</Label>
        <Select onValueChange={(v) => { if (v) setValue('organizationId', String(v)) }}>
          <SelectTrigger className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200">
            <SelectValue placeholder="고객사를 선택하세요" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#1a2236]">
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="text-[13px] text-slate-300">
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.organizationId && (
          <p className="text-[11px] text-red-400">{errors.organizationId.message}</p>
        )}
      </div>

      {/* 상품 선택 */}
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">상품 (복수 선택 가능)</Label>
        <div className="grid grid-cols-2 gap-2">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id)
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleProduct(product.id)}
                className={`rounded-lg border px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                  isSelected
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]'
                }`}
              >
                {product.name}
              </button>
            )
          })}
        </div>
        {errors.productIds && (
          <p className="text-[11px] text-red-400">{errors.productIds.message}</p>
        )}
      </div>

      {/* 제안 유형 */}
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">제안 유형</Label>
        <div className="flex gap-2">
          {(Object.entries(PROPOSAL_TYPES) as [string, string][]).map(([key, label]) => {
            const current = watch('proposalType')
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('proposalType', key as CreateProposalInput['proposalType'])}
                className={`rounded-lg border px-4 py-2 text-[13px] transition-all duration-200 ${
                  current === key
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 추가 맥락 */}
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">추가 맥락 (선택)</Label>
        <Textarea
          {...register('context')}
          placeholder="고객의 주요 관심사나 요구사항을 입력해주세요..."
          className="min-h-[80px] border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600"
        />
        {errors.context && (
          <p className="text-[11px] text-red-400">{errors.context.message}</p>
        )}
      </div>

      {/* 생성 버튼 */}
      <Button
        type="submit"
        disabled={isGenerating}
        className="h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? 'AI가 제안서를 생성하고 있습니다...' : 'AI로 제안서 생성하기'}
      </Button>
    </form>
  )
}
