# SalesHarness — Glossary (용어 사전)

> 프로젝트 전체에서 사용하는 용어의 한글/영문 정의.
> 문서 작성과 코드 구현 시 이 용어를 일관되게 사용합니다.

## 핵심 용어

| 한글 | 영문 (코드명) | 정의 | DB 테이블 |
|------|-------------|------|-----------|
| **고객사** | Organization | 코스콤의 영업 대상 (증권사, 자산운용사 등) | `organizations` |
| **담당자** | Contact | 고객사 내 연락 대상 직원 | `contacts` |
| **딜 (영업 기회)** | Deal | 고객사와의 영업 기회 단위. 파이프라인의 기본 단위 | `deals` |
| **파이프라인** | Pipeline | 딜의 진행 단계를 시각화한 흐름. 개인별 관리 | `deals` (stage 필드) |
| **후속조치** | Reminder / Action Item | 미팅 후 수행해야 할 태스크 | `reminders`, `meetings.action_items` |
| **제안서** | Proposal | AI가 생성하는 영업 제안 문서 | `documents` (type='proposal') |
| **미팅 브리핑** | Briefing | 미팅 전 AI가 생성하는 준비 자료 | `documents` (type='briefing') |
| **활동** | Activity | 전화, 이메일, 방문 등 영업 활동 기록 | `activities` |
| **인텔리전스** | Intelligence | 시장 동향, 경쟁사 정보 등 영업 인사이트 | `intelligence_items` |

## AI 관련 용어

| 한글 | 영문 | 정의 |
|------|------|------|
| **에이전트** | Agent | 특정 도메인 업무를 수행하는 AI 모듈. 앱의 Core Module과 1:1 대응 |
| **프롬프트** | Prompt | AI에게 전달하는 지시문. `lib/openai/prompts/`에서 관리 |
| **스트리밍** | Streaming | AI 응답을 실시간으로 화면에 표시하는 방식 |

## 파이프라인 단계 (Deal Stage)

| 한글 | 영문 (코드값) | 설명 |
|------|-------------|------|
| 발굴 | `discovery` | 영업 기회 식별 |
| 접촉 | `contact` | 고객사와 첫 접촉 |
| 제안 | `proposal` | 제안서 발송 |
| 협상 | `negotiation` | 조건 협의 |
| 계약 성사 | `closed_won` | 계약 체결 |
| 기회 소멸 | `closed_lost` | 영업 기회 종료 |

## 문서 유형 (Document Type)

| 한글 | 영문 (코드값) | 생성 에이전트 |
|------|-------------|-------------|
| 제안서 | `proposal` | Document Agent |
| 보고서 | `report` | Document Agent |
| 이메일 | `email` | Document Agent |
| 미팅 브리핑 | `briefing` | Meeting Agent |

## 사용자 역할 (User Role)

| 한글 | 영문 (코드값) | 권한 |
|------|-------------|------|
| 관리자 | `admin` | 전체 관리, 사용자 관리, 설정 |
| 팀장 | `manager` | 팀 데이터 조회, 보고서 |
| 영업직원 | `sales` | 자신의 데이터 CRUD, AI 기능 |
