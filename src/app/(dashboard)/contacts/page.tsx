'use client'

import { useState, useMemo } from 'react'
import { Search, Phone, User, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import pbContacts from '@/lib/data/pb-contacts.json'

interface ContactRecord {
  team: string
  majorCategory: string
  minorCategory: string
  pm: { title: string; name: string; phone: string }
  sub1: { title: string; name: string; phone: string }
  sub2: { title: string; name: string; phone: string }
}

const data = pbContacts as ContactRecord[]
const allTeams = [...new Set(data.map((r) => r.team))].sort()
const allMajorCategories = [...new Set(data.map((r) => r.majorCategory))].filter(Boolean).sort()

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    return data.filter((record) => {
      const matchesTeam = !selectedTeam || record.team === selectedTeam
      const matchesCategory = !selectedCategory || record.majorCategory === selectedCategory

      if (!search.trim()) return matchesTeam && matchesCategory

      const q = search.toLowerCase()
      const searchableText = [
        record.team, record.majorCategory, record.minorCategory,
        record.pm.name, record.pm.title,
        record.sub1.name, record.sub1.title,
        record.sub2.name, record.sub2.title,
      ].join(' ').toLowerCase()

      return matchesTeam && matchesCategory && searchableText.includes(q)
    })
  }, [search, selectedTeam, selectedCategory])

  function toggleRow(idx: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function clearFilters() {
    setSearch('')
    setSelectedTeam(null)
    setSelectedCategory(null)
  }

  const hasFilters = search || selectedTeam || selectedCategory

  return (
    <div>
      <PageHeader
        title="업무 담당자 찾기"
        description={`파워베이스 서비스 업무별 담당자 연락처 (${data.length}건)`}
      />

      {/* 검색 + 필터 */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
          <Input
            type="text"
            placeholder="담당자 이름, 업무명, 팀명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-white/[0.06] bg-white/[0.03] pl-11 pr-4 text-[14px] text-slate-200 placeholder-slate-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" strokeWidth={1.8} />

          {/* 팀 필터 */}
          <div className="flex flex-wrap gap-1.5">
            {allTeams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(selectedTeam === team ? null : team)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                  selectedTeam === team
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'
                }`}
              >
                {team}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="ml-2 text-[11px] text-slate-500 underline hover:text-amber-400">
              필터 초기화
            </button>
          )}
        </div>

        {/* 업무 대분류 필터 */}
        {selectedTeam && (
          <div className="flex flex-wrap gap-1.5 pl-6">
            {allMajorCategories
              .filter((cat) => data.some((r) => r.team === selectedTeam && r.majorCategory === cat))
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* 결과 카운트 */}
      <div className="mb-3 text-[12px] text-slate-500">
        {filtered.length === data.length
          ? `전체 ${data.length}건`
          : `검색 결과 ${filtered.length}건 / 전체 ${data.length}건`}
      </div>

      {/* 결과 테이블 */}
      <div className="glass-card overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.04] px-4 py-2.5 text-[11px] font-medium text-slate-500">
          <div className="col-span-2">팀</div>
          <div className="col-span-2">업무 (대분류)</div>
          <div className="col-span-2">업무 (소분류)</div>
          <div className="col-span-2">PM/PL</div>
          <div className="col-span-2">부담당자1</div>
          <div className="col-span-2">부담당자2</div>
        </div>

        {/* Rows */}
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="mb-3 h-8 w-8 text-slate-600" />
              <p className="text-[14px] text-slate-400">검색 결과가 없습니다</p>
              <p className="mt-1 text-[12px] text-slate-600">다른 검색어나 필터를 시도해보세요</p>
            </div>
          ) : (
            filtered.map((record, idx) => (
              <div
                key={idx}
                onClick={() => toggleRow(idx)}
                className="group grid cursor-pointer grid-cols-12 gap-2 border-b border-white/[0.02] px-4 py-3 transition-all duration-200 hover:bg-white/[0.03]"
              >
                {/* 팀 */}
                <div className="col-span-2">
                  <Badge variant="outline" className="border-white/[0.08] bg-white/[0.03] text-[10px] text-slate-400">
                    {record.team}
                  </Badge>
                </div>

                {/* 대분류 */}
                <div className="col-span-2 text-[12px] text-slate-400">
                  {record.majorCategory}
                </div>

                {/* 소분류 */}
                <div className="col-span-2 text-[13px] font-medium text-slate-200">
                  {record.minorCategory || '—'}
                </div>

                {/* PM */}
                <div className="col-span-2">
                  <ContactCell {...record.pm} />
                </div>

                {/* Sub1 */}
                <div className="col-span-2">
                  <ContactCell {...record.sub1} />
                </div>

                {/* Sub2 */}
                <div className="col-span-2">
                  <ContactCell {...record.sub2} />
                </div>

                {/* 확장 영역 (모바일용) */}
                {expandedRows.has(idx) && (
                  <div className="col-span-12 mt-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <ContactDetail label="PM/PL" {...record.pm} />
                      <ContactDetail label="부담당자1" {...record.sub1} />
                      <ContactDetail label="부담당자2" {...record.sub2} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ContactCell({ title, name, phone }: { title: string; name: string; phone: string }) {
  if (!name) return <span className="text-[12px] text-slate-600">—</span>

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        <User className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-slate-200">
          {name} <span className="text-slate-500">{title}</span>
        </p>
        {phone && (
          <p className="flex items-center gap-1 text-[10px] text-amber-400/70">
            <Phone className="h-2.5 w-2.5" />
            767-{phone}
          </p>
        )}
      </div>
    </div>
  )
}

function ContactDetail({ label, title, name, phone }: { label: string; title: string; name: string; phone: string }) {
  if (!name) return <div className="text-[12px] text-slate-600">{label}: 없음</div>

  return (
    <div>
      <p className="mb-1 text-[10px] font-medium text-slate-500">{label}</p>
      <p className="text-[13px] font-medium text-white">{name}</p>
      <p className="text-[11px] text-slate-400">{title}</p>
      {phone && (
        <a href={`tel:767${phone}`} className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300">
          <Phone className="h-3 w-3" />
          767-{phone}
        </a>
      )}
    </div>
  )
}
