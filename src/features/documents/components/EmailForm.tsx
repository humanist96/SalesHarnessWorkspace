'use client'

import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@/lib/validations/resolver'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEmailSchema, type CreateEmailInput } from '@/lib/validations/document'
import { EMAIL_PURPOSES } from '@/lib/constants'
import type { Organization } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

interface EmailFormProps {
  onGenerate: (data: CreateEmailInput) => void
  isGenerating: boolean
}

export function EmailForm({ onGenerate, isGenerating }: EmailFormProps) {
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      const json: ApiResponse<Organization[]> = await res.json()
      return json.data ?? []
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEmailInput>({
    resolver: zodResolver(createEmailSchema),
    defaultValues: { purpose: 'followup' },
  })

  return (
    <form onSubmit={handleSubmit(onGenerate)} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">고객사</Label>
        <Select onValueChange={(v) => { if (v) setValue('organizationId', String(v)) }}>
          <SelectTrigger className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200">
            <SelectValue placeholder="고객사를 선택하세요" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#1a2236]">
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="text-[13px] text-slate-300">{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.organizationId && <p className="text-[11px] text-red-400">{errors.organizationId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">수신자 이름</Label>
          <Input {...register('recipientName')} placeholder="김과장" className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
          {errors.recipientName && <p className="text-[11px] text-red-400">{errors.recipientName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">직함 (선택)</Label>
          <Input {...register('recipientTitle')} placeholder="IT기획팀 과장" className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">이메일 목적</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(EMAIL_PURPOSES) as [string, string][]).map(([key, label]) => {
            const current = watch('purpose')
            return (
              <button key={key} type="button" onClick={() => setValue('purpose', key as CreateEmailInput['purpose'])}
                className={`rounded-lg border px-3 py-2 text-[13px] transition-all duration-200 ${current === key ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]'}`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">추가 맥락 (선택)</Label>
        <Textarea {...register('context')} placeholder="이메일에 포함할 내용이나 배경을 입력해주세요..." className="min-h-[80px] border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200 placeholder-slate-600" />
      </div>

      <Button type="submit" disabled={isGenerating} className="h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20">
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? 'AI가 이메일을 작성하고 있습니다...' : 'AI로 이메일 작성하기'}
      </Button>
    </form>
  )
}
