import type { ApiResponse } from '@/types/api'

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function createApiError(error: string, code?: string): ApiResponse<never> {
  return { success: false, error, ...(code && { code }) }
}
