'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImportResult {
  batchId: string
  totalRows: number
  successRows: number
  failedRows: number
  errors: { row: number; message: string }[]
}

export default function ImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [fileName, setFileName] = useState('')

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setResult(null)

    const text = await file.text()

    // CP949 CSV 파싱 시도
    const lines = text.split('\n').filter((l) => l.trim())
    const rows = lines.slice(1).map((line) => {
      // 간단한 CSV 파싱 (쉼표 구분, 따옴표 처리)
      const cols = parseCSVLine(line)
      return {
        date: cols[0]?.trim() || '',
        customer: cols[1]?.trim() || '',
        method: cols[2]?.trim() || '',
        customerContact: cols[3]?.trim() || '',
        koscomContact: cols[4]?.trim() || '',
        content: cols[5]?.trim() || '',
        note: cols[6]?.trim() || '',
      }
    }).filter((r) => r.content || r.customer)

    setPreview(rows.slice(0, 5))
    toast.success(`${rows.length}건의 데이터를 읽었습니다`)
  }

  async function handleImport() {
    if (!preview) return

    setIsImporting(true)
    try {
      // 전체 파일 다시 읽기
      const input = document.querySelector<HTMLInputElement>('input[type="file"]')
      const file = input?.files?.[0]
      if (!file) return

      const text = await file.text()
      const lines = text.split('\n').filter((l) => l.trim())
      const rows = lines.slice(1).map((line) => {
        const cols = parseCSVLine(line)
        return {
          date: cols[0]?.trim() || '',
          customer: cols[1]?.trim() || '',
          method: cols[2]?.trim() || '',
          customerContact: cols[3]?.trim() || '',
          koscomContact: cols[4]?.trim() || '',
          content: cols[5]?.trim() || '',
          note: cols[6]?.trim() || '',
        }
      }).filter((r) => r.content || r.customer)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, fileName }),
      })
      const json = await res.json()

      if (json.success) {
        setResult(json.data)
        toast.success(`임포트 완료: ${json.data.successRows}건 성공`)
      } else {
        toast.error(json.error || '임포트에 실패했습니다')
      }
    } catch {
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div>
      <PageHeader title="CSV 데이터 임포트" description="기존 영업활동 CSV 파일을 AI가 자동 분류하여 임포트합니다." />

      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* 파일 선택 */}
        <div>
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] py-10 transition-colors hover:border-amber-500/20 hover:bg-white/[0.03]">
            <Upload className="h-8 w-8 text-slate-500" />
            <div className="text-center">
              <p className="text-[14px] font-medium text-slate-300">CSV 파일을 선택하세요</p>
              <p className="mt-1 text-[12px] text-slate-500">영업활동 현황 CSV (CP949/UTF-8)</p>
            </div>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          </label>
          {fileName && <p className="mt-2 text-[12px] text-slate-400">선택된 파일: {fileName}</p>}
        </div>

        {/* 미리보기 */}
        {preview && (
          <div>
            <h3 className="mb-3 text-[14px] font-medium text-white">미리보기 (처음 5건)</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {preview.map((row, i) => (
                <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-[12px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500">{row.date}</span>
                    {row.customer && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">{row.customer}</span>}
                  </div>
                  <p className="text-slate-300 line-clamp-2">{row.content}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="mt-4 h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-semibold text-amber-950"
            >
              {isImporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI 분류하며 임포트 중...</>
              ) : (
                <><FileText className="mr-2 h-4 w-4" /> 전체 데이터 임포트 시작</>
              )}
            </Button>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              임포트 완료
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="전체" value={result.totalRows} />
              <Stat label="성공" value={result.successRows} color="emerald" />
              <Stat label="실패" value={result.failedRows} color="rose" />
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-[12px] text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> 에러 목록:
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-[11px] text-slate-500">Row {err.row}: {err.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  const textColor = color === 'emerald' ? 'text-emerald-400' : color === 'rose' ? 'text-rose-400' : 'text-white'
  return (
    <div className="text-center">
      <p className={`text-[24px] font-bold ${textColor}`}>{value}</p>
      <p className="text-[12px] text-slate-500">{label}</p>
    </div>
  )
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
