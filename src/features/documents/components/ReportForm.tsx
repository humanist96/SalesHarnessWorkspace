'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/validations/resolver'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createReportSchema, type CreateReportInput } from '@/lib/validations/document'

interface ReportFormProps {
  onGenerate: (data: CreateReportInput) => void
  isGenerating: boolean
}

export function ReportForm({ onGenerate, isGenerating }: ReportFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: { reportType: 'weekly' },
  })

  const reportType = watch('reportType')

  return (
    <form onSubmit={handleSubmit(onGenerate)} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[13px] text-slate-400">보고서 유형</Label>
        <div className="flex gap-2">
          {[{ key: 'weekly', label: '주간 보고서' }, { key: 'monthly', label: '월간 보고서' }].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setValue('reportType', key as CreateReportInput['reportType'])}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-[13px] transition-all duration-200 ${reportType === key ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">시작일</Label>
          <Input type="date" {...register('startDate')} className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200" />
          {errors.startDate && <p className="text-[11px] text-red-400">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-slate-400">종료일</Label>
          <Input type="date" {...register('endDate')} className="h-10 border-white/[0.06] bg-white/[0.03] text-[13px] text-slate-200" />
          {errors.endDate && <p className="text-[11px] text-red-400">{errors.endDate.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isGenerating} className="h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20">
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? 'AI가 보고서를 생성하고 있습니다...' : 'AI로 보고서 생성하기'}
      </Button>
    </form>
  )
}
