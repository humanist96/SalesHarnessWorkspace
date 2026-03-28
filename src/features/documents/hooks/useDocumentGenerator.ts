'use client'

import { useState, useCallback } from 'react'
import type { GenerateRequest } from '../types'

interface UseDocumentGeneratorReturn {
  content: string
  isGenerating: boolean
  error: string | null
  generate: (request: GenerateRequest) => Promise<void>
  reset: () => void
}

export function useDocumentGenerator(): UseDocumentGeneratorReturn {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (request: GenerateRequest) => {
    setContent('')
    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error || '생성에 실패했습니다.')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('스트리밍을 시작할 수 없습니다.')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                setContent((prev) => prev + parsed.text)
              }
              if (parsed.error) {
                setError(parsed.error)
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setContent('')
    setError(null)
    setIsGenerating(false)
  }, [])

  return { content, isGenerating, error, generate, reset }
}
