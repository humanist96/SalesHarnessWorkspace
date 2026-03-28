import type { ClassificationResultV2, SalesIntent, SalesStage, ActivitySentiment } from './types'

export function isV2Content(parsed: unknown): parsed is ClassificationResultV2 {
  return parsed !== null
    && typeof parsed === 'object'
    && 'intent' in (parsed as Record<string, unknown>)
}

export function getIntent(parsed: unknown): SalesIntent | null {
  if (isV2Content(parsed)) return parsed.intent
  return null
}

export function getStage(parsed: unknown): SalesStage | null {
  if (isV2Content(parsed)) return parsed.stage
  return null
}

export function getProducts(parsed: unknown): string[] {
  if (isV2Content(parsed)) return parsed.products ?? []
  return []
}

export function getSentiment(parsed: unknown): ActivitySentiment | null {
  if (isV2Content(parsed)) return parsed.sentiment
  return null
}

export function getRiskFlags(parsed: unknown): string[] {
  if (isV2Content(parsed)) return parsed.riskFlags ?? []
  return []
}

export function getReasoning(parsed: unknown): string | null {
  if (isV2Content(parsed)) return parsed.reasoning
  return null
}

export function getSummary(parsed: unknown): string | null {
  if (parsed !== null && typeof parsed === 'object' && 'summary' in (parsed as Record<string, unknown>)) {
    return (parsed as Record<string, unknown>).summary as string
  }
  return null
}

export function getKeywords(parsed: unknown): string[] {
  if (parsed !== null && typeof parsed === 'object' && 'keywords' in (parsed as Record<string, unknown>)) {
    const kw = (parsed as Record<string, unknown>).keywords
    return Array.isArray(kw) ? kw : []
  }
  return []
}

export function getAmounts(parsed: unknown): { value: number; unit: string; description: string }[] {
  if (parsed !== null && typeof parsed === 'object' && 'amounts' in (parsed as Record<string, unknown>)) {
    const amounts = (parsed as Record<string, unknown>).amounts
    return Array.isArray(amounts) ? amounts : []
  }
  return []
}

export function getFollowUps(parsed: unknown): { action: string; dueDescription: string; priority: string }[] {
  if (parsed !== null && typeof parsed === 'object' && 'followUps' in (parsed as Record<string, unknown>)) {
    const fus = (parsed as Record<string, unknown>).followUps
    return Array.isArray(fus) ? fus : []
  }
  return []
}

/** 원문 내 금액, 고객사명, 날짜를 하이라이트할 패턴 */
export const HIGHLIGHT_PATTERNS = {
  amount: /(\d+\.?\d*억|\d+\.?\d*만|[\d,]+원)/g,
  date: /(\d{4}[.\-/]\d{1,2}[.\-/]?\d{0,2}|'\d{2}\.\d{1,2})/g,
}
