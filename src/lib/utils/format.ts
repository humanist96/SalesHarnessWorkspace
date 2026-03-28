export function formatCurrency(value: number): string {
  if (value >= 100_000_000) {
    const eok = value / 100_000_000
    return `${eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1)}억원`
  }
  if (value >= 10_000) {
    const man = value / 10_000
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만원`
  }
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return formatDate(d)
}
