# SalesHarness — Reliability

> 시스템 안정성, 에러 처리, 모니터링, 복구 전략을 정의합니다.
> 영업직원이 미팅 직전에 "앱이 안 돼요"가 발생하면 안 됩니다.

## 1. Reliability Targets

| Metric | Target | 근거 |
|--------|--------|------|
| Uptime | 99.5% (월 3.6시간 다운타임 허용) | 업무 시간 기준 안정성 |
| API 응답 시간 (p95) | < 500ms | 체감 속도 |
| AI 생성 시작 시간 | < 3초 (스트리밍 첫 토큰) | 사용자 이탈 방지 |
| 에러율 | < 1% | 신뢰도 |

> Phase 0-1(MVP)에서는 모니터링 기반 확보가 우선.
> SLA를 공식적으로 정의하는 것은 Phase 3 이후.

## 2. Error Handling Strategy

### 계층별 에러 처리

```
Layer 1: UI (사용자에게 보이는 에러)
  → 친화적 메시지 + 행동 가이드
  → error.tsx 바운더리 활용

Layer 2: API (서버 에러)
  → 구조화된 에러 응답 { success: false, error: string }
  → 적절한 HTTP 상태 코드

Layer 3: External (외부 서비스 에러)
  → OpenAI API 실패 → 재시도 (3회) → 사용자 안내
  → Supabase 실패 → 재시도 (2회) → 에러 표시
```

### 에러 메시지 원칙
```
❌ "Error: OPENAI_RATE_LIMIT_EXCEEDED"
✅ "AI가 잠시 바쁩니다. 30초 후 다시 시도해주세요."

❌ "500 Internal Server Error"
✅ "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."

❌ "TypeError: Cannot read property 'name' of undefined"
✅ "데이터를 불러올 수 없습니다. 페이지를 새로고침해주세요."
```

## 3. External Service Dependencies

| 서비스 | 용도 | 장애 시 대응 |
|--------|------|-------------|
| Supabase | DB, Auth, Storage | 앱 전체 영향. Supabase 상태 페이지 모니터링 |
| OpenAI API | AI 기능 | AI 기능만 비활성화. 나머지 정상 동작 |
| Vercel | 호스팅 | 글로벌 CDN이므로 장애 가능성 낮음 |

### Graceful Degradation (단계적 기능 축소)
- OpenAI 장애 시: AI 기능 버튼 비활성화 + "AI 기능을 일시적으로 사용할 수 없습니다" 안내
- Supabase 장애 시: 로그인 불가 안내 + 상태 페이지 링크 제공

## 4. Retry & Timeout Policy

```typescript
// OpenAI API 호출
const OPENAI_CONFIG = {
  maxRetries: 3,
  retryDelay: [1000, 2000, 4000],  // 지수 백오프
  timeout: 30000,                    // 30초
}

// Supabase 쿼리
const SUPABASE_CONFIG = {
  maxRetries: 2,
  retryDelay: [500, 1000],
  timeout: 10000,                    // 10초
}
```

## 5. Monitoring (Phase 1+)

### 기본 모니터링
- **Vercel Analytics**: 페이지 성능, Core Web Vitals
- **Vercel Logs**: API 에러, 응답 시간
- **Supabase Dashboard**: DB 성능, Auth 로그

### 커스텀 로깅
```typescript
// 핵심 이벤트 로깅
logger.info('document.generated', {
  userId,
  documentType: 'proposal',
  model: 'gpt-4o',
  tokens: { input: 1500, output: 2000 },
  duration: 8500, // ms
})

logger.error('openai.failed', {
  userId,
  error: error.message,
  retryCount: 3,
})
```

### 알림 기준 (Phase 2+)
- API 에러율 > 5% → 알림
- OpenAI API 연속 실패 3회 → 알림
- 응답 시간 p95 > 2초 → 경고

## 6. Backup & Recovery

### 데이터 백업
- Supabase Pro: 자동 일일 백업 (7일 보관)
- Point-in-time Recovery 지원

### 복구 절차
1. Supabase 장애 → Supabase 자동 복구 대기 + 사용자 안내
2. 데이터 손실 → Supabase 백업에서 복원
3. 배포 문제 → Vercel 이전 배포로 롤백 (즉시)

## 7. Phase별 안정성 강화

| Phase | 안정성 목표 |
|-------|-----------|
| Phase 0 | 기본 에러 핸들링, Vercel 로그 확인 |
| Phase 1 | 커스텀 로깅 추가, AI 에러 재시도 |
| Phase 2 | 모니터링 대시보드, 알림 설정 |
| Phase 3 | SLA 정의, 장애 대응 매뉴얼 |
