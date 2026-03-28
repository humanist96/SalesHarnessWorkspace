'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/validations/resolver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createOrganizationSchema, type CreateOrganizationInput } from '@/lib/validations/organization'
import { ORG_SIZES } from '@/lib/constants'

interface OrganizationFormProps {
  onSubmit: (data: CreateOrganizationInput) => void
  isLoading?: boolean
  defaultValues?: Partial<CreateOrganizationInput>
}

export function OrganizationForm({ onSubmit, isLoading, defaultValues }: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">회사명 *</Label>
        <Input {...register('name')} placeholder="예: A증권" className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
        {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">업종</Label>
          <Input {...register('industry')} placeholder="증권, 자산운용 등" className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">규모</Label>
          <Select onValueChange={(v) => { if (v) setValue('size', v as CreateOrganizationInput['size']) }}>
            <SelectTrigger className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1a2236]">
              {Object.entries(ORG_SIZES).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-[13px] text-slate-300">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">웹사이트</Label>
        <Input {...register('website')} placeholder="https://www.example.com" className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
        {errors.website && <p className="text-[11px] text-red-400">{errors.website.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">메모</Label>
        <Textarea {...register('notes')} placeholder="고객사에 대한 메모..." className="min-h-[60px] border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
      </div>

      <Button type="submit" disabled={isLoading} className="h-10 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-semibold text-amber-950">
        {isLoading ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
