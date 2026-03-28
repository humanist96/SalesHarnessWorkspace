# SalesHarness — Plans & Roadmap

> 단계별 구현 계획과 우선순위를 정의합니다.
> "무엇을 먼저 만들 것인가"에 대한 합의 문서.

## 1. Release Strategy

```
Phase 0: Foundation     (Week 1)      ← 기반 구축
Phase 1: Doc Generator  (Week 2-3)    ← MVP 핵심
Phase 2: Meeting Prep   (Week 3-4)    ← MVP 확장
Phase 3: CRM/Pipeline   (Month 2)     ← 성장
Phase 4: Intelligence   (Month 3)     ← 완성
```

## 2. Phase 0 — Foundation (Week 1)

> 목표: 개발 환경과 핵심 인프라 구축

### Deliverables
- [ ] Next.js 프로젝트 초기화 (App Router, TypeScript)
- [ ] Supabase 프로젝트 생성 및 연동
- [ ] 인증 시스템 (코스콤 직원 로그인)
- [ ] UI 프레임워크 세팅 (Tailwind + shadcn/ui)
- [ ] 기본 레이아웃 (사이드바, 헤더, 메인 영역)
- [ ] DB 스키마 Phase 0 테이블 생성 (users, organizations, contacts, products, ai_logs)
  > 전체 스키마는 [db-schema.md](generated/db-schema.md) 참조. Phase별 점진 생성.
- [ ] OpenAI API 연동 유틸리티

### Tech Decisions
- Supabase Auth: Email/Password (초기), SSO (향후)
- 상태 관리: TanStack React Query (서버 상태) + Zustand (글로벌 UI 상태)
- AI 모델 배분 (AGENTS.md와 동일):
  - **GPT-4o**: 제안서/보고서 생성, 미팅 브리핑, 분석/예측, 시장 분석
  - **GPT-4o-mini**: 이메일 드래프트, 미팅 노트 정리, 알림 메시지, 범용 질의응답

## 3. Phase 1 — Document Generator MVP (Week 2-3)

> 목표: "제안서 초안을 30분 안에 만들 수 있다"

### 핵심 기능
- [ ] **제안서 생성기**
  - 고객사 선택 → 상품 선택 → AI가 제안서 초안 생성
  - PowerBase 상품 정보 기반 맞춤형 내용
  - 실시간 스트리밍으로 생성 과정 표시
  - 사용자가 수정/보완 가능한 에디터

- [ ] **이메일 드래프트**
  - 상황별 템플릿 (소개, 후속조치, 감사, 미팅 요청)
  - 고객 컨텍스트 반영한 개인화
  - 원클릭 복사

- [ ] **보고서 생성**
  - 주간/월간 영업 활동 보고서
  - 데이터 기반 자동 요약

### Data Requirements
- `documents` 테이블 생성 (Phase 1 신규)
- `products` 테이블: Phase 0에서 이미 생성됨
- `organizations` 테이블: Phase 0에서 이미 생성됨
> 문서 템플릿은 코드 레벨에서 관리 (lib/openai/prompts/)

### Success Criteria
- 제안서 생성 시간: 4시간 → 30분 이내
- 생성된 문서 품질: 사용자가 70% 이상 "수정 후 사용 가능" 평가

## 4. Phase 2 — Meeting Prep (Week 3-4)

> 목표: "미팅 전 10분이면 브리핑 완료"

### 핵심 기능
- [ ] **고객 프로필 대시보드**
  - 고객사 기본 정보, IT 현황, 거래 이력 한눈에
  - 최근 상담 내용 요약

- [ ] **미팅 브리핑 자동 생성**
  - 고객사 최근 동향
  - 이전 미팅 내용 및 후속조치 현황
  - 추천 논의 주제 / 질문 리스트

- [ ] **상담 노트**
  - 미팅 중/후 빠른 메모 입력
  - AI가 구조화된 노트로 변환
  - 후속조치(Action Items) 자동 추출

### Data Requirements
- `meetings` 테이블 생성 (Phase 2 신규)
- `activities` 테이블 생성 (Phase 2 신규)
- `contacts` 테이블: Phase 0에서 이미 생성됨

## 5. Phase 3 — CRM & Pipeline (Month 2)

> 목표: "모든 딜이 시스템에 있고, 놓치는 것이 없다"

### 핵심 기능
- [ ] 딜 파이프라인 보드 (칸반 스타일)
- [ ] 딜 상세 페이지 (히스토리, 문서, 활동)
- [ ] 후속조치 자동 알림 (이메일/인앱)
- [ ] AI 기반 리드 스코어링
- [ ] 주간 파이프라인 요약 리포트

### Data Requirements
- `deals` 테이블 생성 (Phase 3 신규)
- `contracts` 테이블 생성 (Phase 3 신규)
- `reminders` 테이블 생성 (Phase 3 신규)
> 파이프라인 단계(stage)는 deals.stage 컬럼으로 관리 (별도 테이블 불필요)

## 6. Phase 4 — Market Intelligence (Month 3)

> 목표: "경쟁사보다 먼저 시장 변화를 알고, 제안에 반영한다"

### 핵심 기능
- [ ] 시장 동향 뉴스 요약 (금융IT 분야)
- [ ] 경쟁사 동향 트래킹
- [ ] PowerBase vs 경쟁 상품 비교표
- [ ] 증권사별 IT 인프라 현황 데이터베이스
- [ ] 인사이트 알림 (영업에 영향 줄 변화 감지)

### Data Requirements
- `intelligence_items` 테이블 생성 (Phase 4 신규)
- `competitors` 테이블 생성 (Phase 4 신규)
> 시장 동향은 intelligence_items 테이블의 type 컬럼으로 분류

## 7. Tech Debt & Maintenance

> 각 Phase 사이에 기술 부채 정리 시간을 확보한다.

- Phase 0→1: 코드 리뷰 기준 수립
- Phase 1→2: 테스트 커버리지 확보, 성능 최적화
- Phase 2→3: DB 인덱싱, API 리팩토링
- Phase 3→4: 보안 감사, 접근 제어 강화

## 8. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| OpenAI API 비용 초과 | High | Medium | GPT-4o-mini 우선 사용, 캐싱, 토큰 제한 |
| 제안서 품질 불만족 | High | Medium | 프롬프트 반복 개선, 사용자 피드백 루프 |
| Supabase 무료 티어 한계 | Medium | Low | Pro 플랜 전환 계획 수립 |
| 보안 우려 (고객 데이터) | High | Low | RLS, 암호화, 접근 로그 |
| 사용자 채택 저조 | High | Medium | 얼리 어답터 5명과 밀착 피드백 |

## 9. Definition of Done (Phase별 완료 기준)

### Phase 0 — Foundation
- [ ] Next.js 앱 Vercel 배포 성공
- [ ] Supabase Auth 로그인/로그아웃 동작
- [ ] 기본 레이아웃(사이드바, 헤더) 렌더링
- [ ] Phase 0 테이블(users, organizations, contacts, products, ai_logs) 생성 완료
- [ ] OpenAI API 호출 테스트 통과
- [ ] TypeScript strict, ESLint, Prettier 설정 완료

### Phase 1 — Document Generator
- [ ] 제안서 AI 생성 → 스트리밍 → 편집 → 저장 동작
- [ ] 이메일 드래프트 생성 동작
- [ ] 영업 보고서 생성 동작
- [ ] 제안서 생성 시간 30분 이내 (사용자 테스트)
- [ ] 문서 품질: 70% 이상 "수정 후 사용 가능" (QUALITY_SCORE.md 기준)
- [ ] 영업직원 3명 이상 테스트 완료
- [ ] 치명적 버그 0건

### Phase 2 — Meeting Prep
- [ ] 고객 프로필 대시보드 동작
- [ ] 미팅 브리핑 AI 생성 동작
- [ ] 미팅 노트 → 후속조치 자동 추출
- [ ] 브리핑 생성 10분 이내 (사용자 테스트)
- [ ] 테스트 커버리지 80%+ (핵심 로직)

### Phase 3 — CRM & Pipeline
- [ ] 칸반 보드 딜 관리 동작
- [ ] 후속조치 알림 발송 동작
- [ ] AI 리드 스코어링 동작
- [ ] 모든 딜이 시스템에 등록 (파이프라인 가시성 100%)
- [ ] 후속조치 완료율 90%+

### Phase 4 — Intelligence
- [ ] 시장 동향 요약 동작
- [ ] 경쟁사 분석/상품 비교 동작
- [ ] 영업직원 전체(20명+) 활성 사용
- [ ] 보안 감사 완료
