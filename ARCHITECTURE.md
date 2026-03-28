# SalesHarness Architecture

> 코스콤 영업직원의 업무를 AI로 자동화하는 웹 애플리케이션

**관련 문서:**
- 제품 철학/타겟 유저 → [PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md)
- 불변 원칙 → [core-beliefs.md](docs/design-docs/core-beliefs.md)
- 로드맵/Phase → [PLANS.md](docs/PLANS.md)
- 코드 설계 규칙 → [DESIGN.md](docs/DESIGN.md)
- UI/UX → [FRONTEND.md](docs/FRONTEND.md)
- AI 에이전트 → [AGENTS.md](AGENTS.md)
- DB 스키마 → [db-schema.md](docs/generated/db-schema.md)
- 용어 사전 → [glossary.md](docs/design-docs/glossary.md)

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Hosting)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js App (Full-stack)              │  │
│  │                                                    │  │
│  │  ┌──────────────┐     ┌───────────────────────┐   │  │
│  │  │  React UI    │────▶│  API Routes (/api/*)  │   │  │
│  │  │  (App Router)│     │  - deals              │   │  │
│  │  │              │     │  - documents           │   │  │
│  │  │  Dashboard   │     │  - meetings            │   │  │
│  │  │  CRM Views   │     │  - intelligence        │   │  │
│  │  │  Doc Editor  │     │  - ai/generate         │   │  │
│  │  └──────────────┘     └──────────┬────────────┘   │  │
│  └──────────────────────────────────┼────────────────┘  │
└─────────────────────────────────────┼───────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │  Supabase  │   │  OpenAI API │   │  External   │
              │            │   │             │   │  Data       │
              │  - Auth    │   │  - GPT-4o   │   │             │
              │  - DB      │   │  - Embed    │   │  - 시장 데이터│
              │  - Storage │   │             │   │  - 뉴스 API  │
              │  - Realtime│   │             │   │  - 경쟁사 정보│
              └────────────┘   └─────────────┘   └─────────────┘
```

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | 풀스택 프레임워크, SSR/SSG |
| UI | React 19 + Tailwind CSS + shadcn/ui | 컴포넌트 기반 UI |
| Server State | TanStack React Query | API 데이터 캐싱, 동기화 |
| Client State | Zustand | 사이드바 상태, 테마 등 글로벌 UI 상태 |
| AI | OpenAI API (GPT-4o) | 문서 생성, 분석, 추천 |
| Database | Supabase (PostgreSQL) | 데이터 저장, 인증, 파일 스토리지 |
| Auth | Supabase Auth | 코스콤 직원 인증 |
| Deploy | Vercel | 호스팅, CI/CD, Edge Functions |
| Language | TypeScript | 타입 안전성 |

## 3. Core Modules & AI Agents

> 각 모듈은 대응하는 AI 에이전트를 가집니다. 상세 에이전트 정의는 [AGENTS.md](AGENTS.md) 참조.

| Module | AI Agent | Phase |
|--------|----------|-------|
| Document Generation | Document Agent | Phase 1 |
| Meeting Prep | Meeting Agent | Phase 2 |
| Pipeline & CRM | Pipeline Agent | Phase 3 |
| Market Intelligence | Intelligence Agent | Phase 4 |
| (공통) | Assistant Agent | Phase 0 |

### 3.1 Document Generation (영업 문서 자동생성) → Document Agent
- 제안서 자동 작성 (PowerBase 상품/서비스 기반)
- 영업 보고서 생성 (주간/월간)
- 이메일 드래프트 작성 (후속조치, 소개, 감사 등)
- 계약서 초안 생성 보조
- **AI 모델**: 제안서/보고서 → GPT-4o, 이메일 → GPT-4o-mini

### 3.2 Meeting Prep (고객 상담/미팅 준비) → Meeting Agent
- 고객 프로필 자동 분석 (거래 이력, 관심사, 과거 상담 내용)
- 맞춤형 상품 추천 (고객 니즈 기반)
- 상담 시나리오/질문 리스트 생성
- 미팅 브리핑 자료 자동 생성
- **AI 모델**: 브리핑 → GPT-4o, 노트 정리 → GPT-4o-mini

### 3.3 Pipeline & CRM (파이프라인/CRM 관리) → Pipeline Agent
- 딜(영업 기회) 파이프라인 시각화 (단계별 현황)
- 리드 스코어링 (AI 기반 전환 확률 예측)
- 후속조치 자동 알림 및 제안
- 매출 예측 (Forecast)
- **AI 모델**: 분석/예측 → GPT-4o, 알림 메시지 → GPT-4o-mini

### 3.4 Market Intelligence (시장/상품 인텔리전스) → Intelligence Agent
- 시장 동향 요약 (금융 IT 시장)
- 경쟁사 분석 (서비스 비교)
- PowerBase 상품 지식베이스
- 증권사별 IT 인프라 현황 트래킹
- **AI 모델**: 분석/요약 → GPT-4o, 뉴스 요약 → GPT-4o-mini

## 4. Data Architecture

### 4.1 Primary Entities

> 상세 스키마는 [db-schema.md](docs/generated/db-schema.md) 참조.
> 테이블은 Phase별로 점진적으로 생성합니다.

```
Phase 0 (기반):
  User (코스콤 영업직원)
  Organization (고객사/증권사)
  Contact (고객사 담당자)
  Product (PowerBase 상품/서비스)
  AiLog (AI 사용 이력)

Phase 1 (문서생성):
  Document (AI 생성 문서)

Phase 2 (미팅준비):
  Meeting (미팅/상담)
  Activity (영업 활동 로그)

Phase 3 (파이프라인):
  Deal (영업 기회/딜)
  Contract (계약)
  Reminder (후속조치 알림)

Phase 4 (인텔리전스):
  IntelligenceItem (시장 동향/인사이트)
  Competitor (경쟁사/경쟁 상품)
```

> Note(메모)는 독립 테이블이 아닌 각 엔티티의 `notes` 필드로 관리합니다.

### 4.2 AI-Generated Content
- 모든 AI 생성 콘텐츠는 `ai_generated` 플래그와 `prompt_id`를 저장
- 사용자 피드백(승인/수정/거절)을 통한 품질 개선 루프
- 생성 이력 관리로 감사 추적(Audit Trail) 지원

## 5. API Structure

```
/api
├── /auth            # Supabase Auth 연동
├── /organizations   # 고객사 CRUD
├── /contacts        # 담당자 CRUD
├── /deals           # 딜 파이프라인
├── /meetings        # 미팅 관리
├── /documents       # 문서 관리
├── /contracts       # 계약/빌링
├── /products        # PowerBase 상품
├── /ai
│   ├── /generate    # 문서/이메일 생성
│   ├── /analyze     # 고객/시장 분석
│   ├── /recommend   # 상품 추천
│   └── /summarize   # 미팅/시장 요약
└── /intelligence    # 시장 인텔리전스
```

## 6. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 풀스택 프레임워크 | Next.js | Vercel 최적화, SSR로 빠른 초기 로딩, API Routes로 백엔드 통합 |
| BaaS | Supabase | Auth/DB/Storage 통합, PostgreSQL 기반 확장성, RLS로 데이터 보안 |
| AI Provider | OpenAI | GPT-4o의 한국어 성능, Function Calling 지원, 안정적인 API |
| UI Framework | shadcn/ui | 커스터마이징 가능, 접근성 내장, 빠른 개발 |
| Monorepo | 불필요 | 단일 Next.js 앱으로 충분한 규모 |

## 7. Security Considerations

- Supabase RLS (Row Level Security)로 데이터 접근 제어
- 코스콤 직원만 접근 가능한 인증 체계
- API Key는 서버사이드에서만 사용 (클라이언트 노출 금지)
- 고객사 데이터 암호화 (at rest, in transit)
- AI 생성 콘텐츠에 대한 감사 로그

## 8. Performance Targets

| Metric | Target |
|--------|--------|
| 페이지 로딩 (LCP) | < 2.5s |
| AI 문서 생성 응답 | < 10s (스트리밍) |
| 검색 응답 | < 500ms |
| 동시 사용자 | 50명+ (코스콤 영업팀 규모) |

## 9. Future Considerations

- [ ] 코스콤 사내 시스템(SAP 등) 연동
- [ ] 모바일 앱 (PWA 또는 React Native)
- [ ] 다중 LLM 지원 (Claude, Gemini 등 비용 최적화)
- [ ] RAG 파이프라인 (내부 문서 기반 지식 검색)
- [ ] 실시간 협업 기능 (팀 파이프라인 공유)
