'use client'

import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from '@/types/api'
import type { SalesIntent, SalesStage, ActivitySentiment } from '@/lib/pipeline/types'

export interface InsightsData {
  intentDistribution: { intent: SalesIntent; count: number; percentage: number }[]
  stageFunnel: { stage: SalesStage; count: number }[]
  sentimentDistribution: { sentiment: ActivitySentiment; count: number; percentage: number }[]
  orgIntentMatrix: {
    organizationId: string
    organizationName: string
    intents: Record<string, number>
    total: number
  }[]
  productTrend: { month: string; products: Record<string, number> }[]
  riskSummary: { flag: string; count: number; recentOrgs: string[] }[]
}

export function useInsights(period: string = '30d') {
  return useQuery<InsightsData>({
    queryKey: ['intelligence', 'insights', period],
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/insights?period=${period}`)
      const json: ApiResponse<InsightsData> = await res.json()
      return json.data!
    },
  })
}
