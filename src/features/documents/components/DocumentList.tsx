'use client'

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AIBadge } from '@/components/shared/AIBadge'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils/format'
import type { DocumentItem } from '../types'

interface DocumentListProps {
  documents: DocumentItem[]
}

const typeBadgeColors: Record<string, string> = {
  proposal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  email: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  report: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  briefing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="text-[12px] font-medium text-slate-500">제목</TableHead>
            <TableHead className="text-[12px] font-medium text-slate-500">유형</TableHead>
            <TableHead className="text-[12px] font-medium text-slate-500">고객사</TableHead>
            <TableHead className="text-[12px] font-medium text-slate-500">생성일</TableHead>
            <TableHead className="text-[12px] font-medium text-slate-500">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="border-white/[0.03] transition-colors hover:bg-white/[0.02]"
            >
              <TableCell>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-2 text-[13px] font-medium text-slate-200 hover:text-amber-400"
                >
                  {doc.title}
                  {doc.ai_generated && <AIBadge />}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${typeBadgeColors[doc.type] || ''}`}
                >
                  {DOCUMENT_TYPES[doc.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px] text-slate-400">
                {doc.organizationName || '—'}
              </TableCell>
              <TableCell className="text-[12px] text-slate-500">
                {formatRelativeTime(doc.created_at)}
              </TableCell>
              <TableCell>
                {doc.user_feedback && (
                  <span className={`text-[11px] ${
                    doc.user_feedback === 'approved' ? 'text-emerald-400' :
                    doc.user_feedback === 'edited' ? 'text-amber-400' :
                    'text-slate-500'
                  }`}>
                    {doc.user_feedback === 'approved' ? '승인됨' :
                     doc.user_feedback === 'edited' ? '수정됨' : '거절됨'}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
