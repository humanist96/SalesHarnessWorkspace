'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Markdown from 'react-markdown'
import { FileBarChart, Plus, Calendar, Clock, Copy, Download, X, Trash2, Check } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Report } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: reportList, isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports')
      const json: ApiResponse<Report[]> = await res.json()
      return json.data ?? []
    },
  })

  const generateMutation = useMutation({
    mutationFn: async ({ type }: { type: 'weekly' | 'monthly' }) => {
      const now = new Date()
      let periodStart: string
      let periodEnd: string

      if (type === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        periodStart = weekAgo.toISOString().split('T')[0]
        periodEnd = now.toISOString().split('T')[0]
      } else {
        periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        periodEnd = now.toISOString().split('T')[0]
      }

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, periodStart, periodEnd }),
      })
      const json: ApiResponse<Report> = await res.json()
      return json.data!
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSelectedReport(report)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSelectedReport(null)
    },
  })

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload(report: Report) {
    const blob = new Blob([report.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="보고서"
        description="AI가 영업 데이터를 분석하여 주간/월간 보고서를 자동 생성합니다."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => generateMutation.mutate({ type: 'weekly' })}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {generateMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              주간 보고서
            </button>
            <button
              onClick={() => generateMutation.mutate({ type: 'monthly' })}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 hover:bg-white/[0.06] disabled:opacity-50"
            >
              월간 보고서
            </button>
          </div>
        }
      />

      {generateMutation.isPending && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Clock className="h-4 w-4 animate-spin text-amber-400" />
          <span className="text-[13px] text-amber-300">AI가 보고서를 생성하고 있습니다... (최대 15초)</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Report List */}
        <div className={selectedReport ? 'col-span-1' : 'col-span-3'}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />)}
            </div>
          ) : !reportList || reportList.length === 0 ? (
            <EmptyState
              icon={FileBarChart}
              title="생성된 보고서가 없습니다"
              description="'주간 보고서' 버튼을 클릭하면 AI가 이번 주 영업 데이터를 분석하여 보고서를 자동 생성합니다."
            />
          ) : (
            <div className="space-y-2">
              {reportList.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                    selectedReport?.id === report.id
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/[0.03] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      report.type === 'weekly' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
                    }`}>
                      {report.type === 'weekly' ? '주간' : '월간'}
                    </span>
                    <span className="text-[12px] text-slate-500">
                      {report.periodStart} ~ {report.periodEnd}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-medium text-white">{report.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {new Date(report.generatedAt).toLocaleString('ko-KR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report Detail */}
        {selectedReport && (
          <div className="col-span-2 glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-white">{selectedReport.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedReport.content)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? '복사됨' : '복사'}
                </button>
                <button
                  onClick={() => handleDownload(selectedReport)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  다운로드
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedReport.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-slate-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedReport.periodStart} ~ {selectedReport.periodEnd}</span>
              <span>AI: {selectedReport.aiModel}</span>
              <span>{new Date(selectedReport.generatedAt).toLocaleString('ko-KR')}</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 prose-headings:text-white prose-headings:font-semibold prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-hr:border-white/[0.06]">
              <Markdown>{selectedReport.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
