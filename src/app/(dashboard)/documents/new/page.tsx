'use client'

import { useState } from 'react'
import { FileText, Mail, BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProposalForm } from '@/features/documents/components/ProposalForm'
import { EmailForm } from '@/features/documents/components/EmailForm'
import { ReportForm } from '@/features/documents/components/ReportForm'
import { DocumentStreamView } from '@/features/documents/components/DocumentStreamView'
import { DocumentEditor } from '@/features/documents/components/DocumentEditor'
import { useDocumentGenerator } from '@/features/documents/hooks/useDocumentGenerator'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import type { CreateProposalInput, CreateEmailInput, CreateReportInput } from '@/lib/validations/document'

const tabs = [
  { key: 'proposal' as const, label: DOCUMENT_TYPES.proposal, icon: FileText },
  { key: 'email' as const, label: DOCUMENT_TYPES.email, icon: Mail },
  { key: 'report' as const, label: DOCUMENT_TYPES.report, icon: BarChart3 },
]

export default function NewDocumentPage() {
  const [activeTab, setActiveTab] = useState<'proposal' | 'email' | 'report'>('proposal')
  const [showEditor, setShowEditor] = useState(false)
  const { content, isGenerating, error, generate, reset } = useDocumentGenerator()

  async function handleProposalGenerate(data: CreateProposalInput) {
    setShowEditor(false)
    await generate({ type: 'proposal', data })
    setShowEditor(true)
  }

  async function handleEmailGenerate(data: CreateEmailInput) {
    setShowEditor(false)
    await generate({ type: 'email', data })
    setShowEditor(true)
  }

  async function handleReportGenerate(data: CreateReportInput) {
    setShowEditor(false)
    await generate({ type: 'report', data })
    setShowEditor(true)
  }

  async function handleSave(editedContent: string) {
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          title: `${DOCUMENT_TYPES[activeTab]} — ${new Date().toLocaleDateString('ko-KR')}`,
          content: editedContent,
          aiGenerated: true,
          aiModel: activeTab === 'email' ? 'gpt-4o-mini' : 'gpt-4o',
        }),
      })
      toast.success('문서가 저장되었습니다')
    } catch {
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div>
      <PageHeader title="새 문서 만들기" />

      {/* Tab selector */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); reset() }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-white/[0.06] text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* 왼쪽: 입력 폼 */}
        <div className="col-span-2">
          <div className="glass-card rounded-2xl p-6">
            {activeTab === 'proposal' && (
              <ProposalForm onGenerate={handleProposalGenerate} isGenerating={isGenerating} />
            )}
            {activeTab === 'email' && (
              <EmailForm onGenerate={handleEmailGenerate} isGenerating={isGenerating} />
            )}
            {activeTab === 'report' && (
              <ReportForm onGenerate={handleReportGenerate} isGenerating={isGenerating} />
            )}
          </div>
        </div>

        {/* 오른쪽: AI 생성 결과 */}
        <div className="col-span-3">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {(isGenerating || content) && !showEditor && (
            <DocumentStreamView content={content} isStreaming={isGenerating} />
          )}

          {showEditor && content && (
            <div className="glass-card rounded-2xl p-6">
              <DocumentEditor
                initialContent={content}
                aiGenerated
                onSave={handleSave}
              />
            </div>
          )}

          {!content && !isGenerating && !error && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/[0.06]">
              <p className="text-[13px] text-slate-600">
                왼쪽 폼을 작성하고 생성 버튼을 클릭하면 AI가 문서를 만들어 드립니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
