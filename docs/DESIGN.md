# SalesHarness — Design Guide

> 코드 레벨의 설계 원칙, 프로젝트 구조, 네이밍 규칙, 패턴을 정의합니다.
> AI가 코드를 생성할 때 이 문서를 기준으로 일관성을 유지합니다.

## 1. Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지 그룹
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # 메인 대시보드 그룹
│   │   ├── page.tsx              # 홈 (대시보드)
│   │   ├── documents/            # 문서 관리
│   │   ├── meetings/             # 미팅/상담
│   │   ├── pipeline/             # 영업 파이프라인
│   │   ├── organizations/        # 고객사 관리
│   │   ├── intelligence/         # 시장 인텔리전스
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── ai/                   # AI 관련 엔드포인트
│   │   ├── documents/
│   │   ├── meetings/
│   │   ├── deals/
│   │   └── organizations/
│   ├── layout.tsx                # 루트 레이아웃
│   └── globals.css
│
├── features/                     # 기능 단위 모듈 (핵심)
│   ├── documents/                # 문서 생성 기능
│   │   ├── components/           # 문서 전용 컴포넌트
│   │   ├── hooks/                # 문서 전용 훅
│   │   ├── actions/              # Server Actions
│   │   ├── types.ts              # 문서 관련 타입
│   │   └── utils.ts              # 문서 관련 유틸
│   ├── meetings/                 # 미팅 준비 기능
│   ├── pipeline/                 # CRM/파이프라인
│   ├── intelligence/             # 시장 인텔리전스
│   └── organizations/            # 고객사 관리
│
├── components/                   # 공용 UI 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── layout/                   # 레이아웃 (Sidebar, Header 등)
│   └── shared/                   # 공통 비즈니스 컴포넌트
│
├── lib/                          # 공용 라이브러리/유틸
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── client.ts             # 브라우저용 클라이언트
│   │   ├── server.ts             # 서버용 클라이언트
│   │   └── middleware.ts         # Auth 미들웨어
│   ├── openai/                   # OpenAI 클라이언트
│   │   ├── client.ts
│   │   └── prompts/              # 프롬프트 템플릿
│   ├── utils/                    # 범용 유틸리티
│   └── constants.ts              # 상수 정의
│
└── types/                        # 전역 타입 정의
    ├── database.ts               # Supabase 생성 타입
    ├── api.ts                    # API 응답 타입
    └── index.ts
```

### 구조 원칙
- **기능(Feature) 단위 응집**: 각 기능에 필요한 컴포넌트, 훅, 타입을 함께 배치
- **공용은 명확할 때만**: 2개 이상의 기능에서 사용될 때만 `components/` 또는 `lib/`로 이동
- **app/ 디렉토리는 라우팅만**: 비즈니스 로직은 `features/`에, 라우트 핸들러는 `app/api/`에

## 2. Naming Conventions

### 파일명
| 종류 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ProposalEditor.tsx` |
| 훅 | camelCase, use 접두사 | `useDocumentGenerator.ts` |
| 유틸/헬퍼 | camelCase | `formatCurrency.ts` |
| 타입 | camelCase | `types.ts` |
| 상수 | camelCase | `constants.ts` |
| API Route | kebab-case(폴더) | `app/api/ai/generate/route.ts` |

### 변수/함수명
| 종류 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ProposalEditor` |
| 함수 | camelCase, 동사 시작 | `generateProposal()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_TOKEN_COUNT` |
| 타입/인터페이스 | PascalCase | `Organization`, `DealStage` |
| boolean | is/has/should 접두사 | `isLoading`, `hasPermission` |
| 이벤트 핸들러 | handle 접두사 | `handleSubmit`, `handleDealClick` |

### 금지 사항
- ❌ 한글 변수명/함수명 (주석은 허용)
- ❌ 약어 남용 (`org` 대신 `organization`, 단 `id`, `url` 등 관용어는 허용)
- ❌ 숫자로 구분 (`handler1`, `handler2`)

## 3. Component Patterns

### 컴포넌트 구조
```tsx
// 1. imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. types (간단하면 같은 파일, 복잡하면 types.ts로 분리)
interface ProposalEditorProps {
  organizationId: string
  onSave: (content: string) => void
}

// 3. component
export function ProposalEditor({ organizationId, onSave }: ProposalEditorProps) {
  // hooks
  const [content, setContent] = useState('')

  // handlers
  function handleSave() {
    onSave(content)
  }

  // render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### 규칙
- `export default` 금지 → **Named export만** 사용
- 한 파일에 **하나의 주 컴포넌트** (작은 서브 컴포넌트는 같은 파일 허용)
- Props는 **인터페이스**로 정의 (type alias도 허용하나 interface 선호)
- 컴포넌트 파일 **400줄 이하** 권장, 800줄 초과 시 분리 필수

## 4. Data Fetching Patterns

### Server Components (기본)
```tsx
// app/(dashboard)/organizations/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function OrganizationsPage() {
  const supabase = await createServerClient()
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  return <OrganizationList organizations={organizations ?? []} />
}
```

### Client-side (인터랙티브)
```tsx
// features/documents/hooks/useDocumentGenerator.ts
'use client'

export function useDocumentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  async function generate(params: GenerateParams) {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      // 스트리밍 처리...
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
```

### 원칙
- **Server Component가 기본** — `'use client'`는 인터랙션이 필요할 때만
- Server Actions은 **데이터 변경(mutation)**에 사용
- API Routes는 **AI 스트리밍, 외부 API 연동** 등 특수한 경우에 사용

## 5. AI Integration Patterns

### 프롬프트 관리
```
lib/openai/prompts/
├── proposal.ts        # 제안서 생성 프롬프트
├── email.ts           # 이메일 드래프트 프롬프트
├── briefing.ts        # 미팅 브리핑 프롬프트
├── analysis.ts        # 고객/시장 분석 프롬프트
└── system.ts          # 공통 시스템 프롬프트
```

### 프롬프트 구조
```typescript
// lib/openai/prompts/system.ts
export const SYSTEM_PROMPT = `
당신은 코스콤의 영업 지원 AI입니다.
PowerBase 서비스와 금융IT 영업에 특화되어 있습니다.

규칙:
- 한국어로 응답합니다.
- 존댓말을 사용합니다.
- 정확하지 않은 정보는 "확인이 필요합니다"라고 표시합니다.
- 고객 개인정보는 언급하지 않습니다.
`
```

### AI 응답 처리
- 모든 AI 생성물에는 `ai_generated: true`, `model`, `prompt_version` 메타데이터 저장
- 스트리밍 응답 사용 (사용자 대기 시간 체감 감소)
- 토큰 사용량 로깅 (비용 모니터링)

## 6. Error Handling

### API 응답 포맷
```typescript
// 성공
{ success: true, data: T }

// 실패
{ success: false, error: string, code?: string }
```

### 에러 처리 원칙
- Server Component: 에러 시 `error.tsx` 바운더리 활용
- Client Component: try/catch + 사용자 친화적 메시지
- API Route: 적절한 HTTP 상태 코드 + 구조화된 에러 응답
- **절대 금지**: 스택 트레이스, DB 쿼리, 내부 경로를 사용자에게 노출

## 7. State Management

| 상태 유형 | 도구 | 사용처 |
|-----------|------|--------|
| 서버 상태 | React Query (TanStack Query) | API 데이터 캐싱, 동기화 |
| UI 상태 | useState / useReducer | 폼 입력, 모달 열림/닫힘 |
| 글로벌 UI 상태 | Zustand | 사이드바 상태, 테마, 알림 |
| URL 상태 | Next.js searchParams | 필터, 정렬, 페이지네이션 |
| 폼 상태 | React Hook Form + Zod | 폼 검증, 제출 |

### 원칙
- **서버 상태와 UI 상태를 섞지 않음**
- 가능한 한 **URL로 상태 관리** (공유/북마크 가능)
- 전역 상태는 **최소화** — 정말 필요할 때만 Zustand

## 8. Database Conventions

### 테이블명
- **snake_case**, 복수형: `organizations`, `deal_stages`
- 조인 테이블: `deal_contacts` (양쪽 테이블명 조합)

### 컬럼명
- **snake_case**: `created_at`, `organization_id`
- ID: `id` (UUID), 외래키: `{table}_id`
- 타임스탬프: 모든 테이블에 `created_at`, `updated_at`
- Soft delete: `deleted_at` (nullable)

### RLS 패턴
```sql
-- 기본: 인증된 사용자만 접근
CREATE POLICY "authenticated_access" ON organizations
  FOR ALL TO authenticated
  USING (true);

-- 향후: 팀/역할 기반 접근 제어
```
