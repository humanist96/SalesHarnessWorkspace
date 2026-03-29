'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from '@/types/api'

interface Suggestion {
  id: string
  raw_content: string
  type: string | null
  organization_id: string | null
  organization_name: string | null
  activity_date: string
  summary: string | null
  intent: string | null
  products: string[] | null
  text_score?: number
  total_score?: number
}

interface Template {
  organization_id: string
  intent: string
  products: string[] | null
  frequency: number
  example_content: string
}

interface SuggestionData {
  suggestions: Suggestion[]
  templates: Template[]
}

function useDebounce(value: string, delay: number, isComposing: boolean): string {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    if (isComposing) return // IME 조합 중에는 디바운스 안 함

    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay, isComposing])

  return debouncedValue
}

export function useActivitySuggestions(query: string, organizationId: string | null) {
  const isComposingRef = useRef(false)
  const [isComposing, setIsComposing] = useState(false)

  const debouncedQuery = useDebounce(query, 300, isComposing)

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true
    setIsComposing(true)
  }, [])

  const onCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    setIsComposing(false)
  }, [])

  // 유사 활동 검색
  const shouldSearch = debouncedQuery.length >= 5 || !!organizationId
  const { data: suggestData, isLoading: suggestLoading } = useQuery<{ suggestions: Suggestion[] }>({
    queryKey: ['activity-suggestions', debouncedQuery, organizationId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '5' })
      if (debouncedQuery.length >= 5) params.set('q', debouncedQuery)
      if (organizationId) params.set('organizationId', organizationId)
      const res = await fetch(`/api/activities/suggest?${params}`)
      const json: ApiResponse<{ suggestions: Suggestion[] }> = await res.json()
      return json.data ?? { suggestions: [] }
    },
    enabled: shouldSearch,
    staleTime: 30_000,
  })

  // 템플릿 (고객사 선택 시)
  const { data: templateData } = useQuery<{ templates: Template[] }>({
    queryKey: ['activity-templates', organizationId],
    queryFn: async () => {
      const params = new URLSearchParams({ mode: 'templates', limit: '3' })
      if (organizationId) params.set('organizationId', organizationId)
      const res = await fetch(`/api/activities/suggest?${params}`)
      const json: ApiResponse<{ templates: Template[] }> = await res.json()
      return json.data ?? { templates: [] }
    },
    enabled: !!organizationId,
    staleTime: 60_000,
  })

  return {
    suggestions: suggestData?.suggestions ?? [],
    templates: templateData?.templates ?? [],
    isLoading: suggestLoading,
    compositionHandlers: {
      onCompositionStart,
      onCompositionEnd,
    },
  }
}
