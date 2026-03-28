import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const AI_MODELS = {
  /** 제안서, 보고서, 브리핑, 분석 등 고품질 출력 */
  quality: 'gpt-4o' as const,
  /** 이메일, 노트 정리, 알림, 질의응답 등 빠른 응답 */
  fast: 'gpt-4o-mini' as const,
}
