# Design Documents Index

> 설계 문서 목록. 각 문서는 주요 설계 결정과 그 근거를 기록합니다.

## Core

| 문서 | 상태 | 설명 |
|------|------|------|
| [Core Beliefs](core-beliefs.md) | ✅ 완료 | 불변 원칙 5가지 — 모든 결정의 최상위 기준 |
| [Glossary](glossary.md) | ✅ 완료 | 용어 사전 — 한글/영문 용어 통일 기준 |

## Feature Design (Phase별 추가)

| 문서 | Phase | 상태 | 설명 |
|------|-------|------|------|
| document-generation.md | Phase 1 | ⬜ 예정 | 문서 생성 기능 상세 설계 |
| meeting-prep.md | Phase 2 | ⬜ 예정 | 미팅 준비 기능 상세 설계 |
| pipeline-crm.md | Phase 3 | ⬜ 예정 | CRM/파이프라인 상세 설계 |
| market-intelligence.md | Phase 4 | ⬜ 예정 | 시장 인텔리전스 상세 설계 |

## Architecture Decision Records (ADRs)

각 Phase 진행 시 중요한 기술 결정은 ADR로 기록합니다.

### 형식
```markdown
# ADR-{번호}: {제목}

## 상태: 채택 / 검토중 / 폐기

## 맥락
왜 이 결정이 필요한가?

## 결정
무엇을 선택했는가?

## 대안
어떤 대안을 검토했는가?

## 결과
이 결정의 영향은?
```

### 기록된 ADRs
| # | 제목 | 상태 | 날짜 |
|---|------|------|------|
| 1 | Next.js 풀스택 선택 | 채택 | 2026-03-28 |
| 2 | Supabase BaaS 채택 | 채택 | 2026-03-28 |
| 3 | OpenAI GPT-4o 선택 | 채택 | 2026-03-28 |
| 4 | Feature 기반 프로젝트 구조 | 채택 | 2026-03-28 |

> ADR 상세 내용은 ARCHITECTURE.md Section 6 "Key Design Decisions" 참조
