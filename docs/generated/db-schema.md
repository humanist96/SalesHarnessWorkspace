# Database Schema

> Supabase PostgreSQL 스키마 정의.
> 이 문서는 실제 DB 스키마의 소스 오브 트루스(source of truth)입니다.
> 테이블 변경 시 이 문서를 먼저 업데이트한 후 마이그레이션을 실행합니다.

## Phase별 테이블 생성 계획

| Phase | 테이블 | 설명 |
|-------|--------|------|
| **Phase 0** | users, organizations, contacts, products, ai_logs | 기반 엔티티 |
| **Phase 1** | documents | 문서 생성 |
| **Phase 2** | meetings, activities | 미팅/활동 |
| **Phase 3** | deals, contracts, reminders | 파이프라인/CRM |
| **Phase 4** | intelligence_items, competitors | 시장 인텔리전스 |

> Note(메모)는 독립 테이블이 아닌 각 엔티티의 `notes` 필드로 관리합니다.

## Entity Relationship

```
[Phase 0]
users ─────────────────── organizations
  │                            │
  │                            └── contacts
  │
  └── ai_logs                 products

[Phase 1] documents (user, organization)

[Phase 2] meetings (user, organization) ── activities (user, organization, deal)

[Phase 3] deals (user, organization) ── contracts (organization, product)
                                      └── reminders (user, deal)

[Phase 4] intelligence_items, competitors
```

## Tables

### users
코스콤 영업직원 (Supabase Auth와 연동)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | auth.uid() | PK, Supabase Auth UID |
| email | text | NO | | 이메일 |
| name | text | NO | | 이름 |
| department | text | YES | | 부서 |
| role | text | NO | 'sales' | admin / manager / sales |
| onboarding_completed | boolean | NO | false | 온보딩 완료 여부 |
| onboarding_step | integer | NO | 0 | 현재 온보딩 단계 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### organizations
고객사 (증권사 등)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | | 회사명 |
| industry | text | YES | | 업종 (증권, 자산운용 등) |
| size | text | YES | | 규모 (대형/중형/소형) |
| website | text | YES | | 웹사이트 |
| notes | text | YES | | 메모 |
| created_by | uuid | NO | | FK → users.id |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| deleted_at | timestamptz | YES | | Soft delete |

### contacts
고객사 담당자

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | | FK → organizations.id |
| name | text | NO | | 이름 |
| title | text | YES | | 직함 |
| email | text | YES | | 이메일 |
| phone | text | YES | | 전화번호 |
| notes | text | YES | | 메모 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### deals
영업 기회 (딜)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | | FK → organizations.id |
| user_id | uuid | NO | | FK → users.id (담당자) |
| title | text | NO | | 딜 이름 |
| value | bigint | YES | | 예상 금액 (원) |
| stage | text | NO | 'discovery' | discovery/contact/proposal/negotiation/closed_won/closed_lost |
| probability | integer | YES | | 전환 확률 (0-100) |
| expected_close_date | date | YES | | 예상 계약일 |
| notes | text | YES | | 메모 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| closed_at | timestamptz | YES | | 종결일 |

### documents
AI 생성 문서

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → users.id |
| organization_id | uuid | YES | | FK → organizations.id |
| deal_id | uuid | YES | | FK → deals.id |
| type | text | NO | | proposal/report/email/briefing |
| title | text | NO | | 문서 제목 |
| content | text | NO | | 문서 내용 |
| ai_generated | boolean | NO | false | AI 생성 여부 |
| ai_model | text | YES | | 사용된 AI 모델 |
| ai_prompt_version | text | YES | | 프롬프트 버전 |
| user_feedback | text | YES | | approved/edited/rejected |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### meetings
미팅/상담

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → users.id |
| organization_id | uuid | NO | | FK → organizations.id |
| title | text | NO | | 미팅 제목 |
| scheduled_at | timestamptz | NO | | 미팅 일시 |
| location | text | YES | | 장소 |
| agenda | text | YES | | 안건 |
| notes | text | YES | | 미팅 노트 |
| action_items | jsonb | YES | | 후속조치 [{task, assignee, due}] |
| briefing_id | uuid | YES | | FK → documents.id (AI 브리핑) |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### activities
영업 활동 로그 (Phase 2)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → users.id |
| organization_id | uuid | YES | | FK → organizations.id |
| deal_id | uuid | YES | | FK → deals.id |
| meeting_id | uuid | YES | | FK → meetings.id |
| type | text | NO | | call/email/visit/note/other |
| title | text | NO | | 활동 제목 |
| description | text | YES | | 활동 내용 |
| occurred_at | timestamptz | NO | now() | 활동 일시 |
| created_at | timestamptz | NO | now() | |

### reminders
후속조치 알림 (Phase 3)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → users.id |
| deal_id | uuid | YES | | FK → deals.id |
| meeting_id | uuid | YES | | FK → meetings.id |
| title | text | NO | | 알림 제목 |
| description | text | YES | | 상세 내용 |
| due_at | timestamptz | NO | | 기한 |
| completed | boolean | NO | false | 완료 여부 |
| completed_at | timestamptz | YES | | 완료 일시 |
| created_at | timestamptz | NO | now() | |

### products
PowerBase 상품/서비스

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | | 상품명 |
| description | text | YES | | 상품 설명 |
| category | text | YES | | 카테고리 |
| pricing_info | text | YES | | 가격 정보 |
| features | jsonb | YES | | 주요 기능 목록 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### contracts
계약

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | | FK → organizations.id |
| product_id | uuid | NO | | FK → products.id |
| deal_id | uuid | YES | | FK → deals.id |
| start_date | date | NO | | 계약 시작일 |
| end_date | date | YES | | 계약 종료일 |
| value | bigint | NO | | 계약 금액 (원) |
| billing_cycle | text | YES | 'monthly' | monthly/quarterly/yearly |
| status | text | NO | 'active' | active/expired/cancelled |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### ai_logs
AI 사용 이력 (감사 + 비용 모니터링)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → users.id |
| agent_type | text | NO | | document/meeting/pipeline/intelligence/assistant |
| action | text | NO | | generate/analyze/recommend/summarize |
| model | text | NO | | gpt-4o / gpt-4o-mini |
| input_tokens | integer | NO | | 입력 토큰 수 |
| output_tokens | integer | NO | | 출력 토큰 수 |
| duration_ms | integer | YES | | 응답 시간 (ms) |
| created_at | timestamptz | NO | now() | |

## Indexes

```sql
-- 자주 조회되는 패턴에 인덱스
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_organization_id ON deals(organization_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_organization_id ON activities(organization_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_due_at ON reminders(due_at);
CREATE INDEX idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);
```

## RLS Policies

모든 테이블에 RLS 활성화. 기본 정책:
```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자: 자신이 생성한 데이터만 접근
CREATE POLICY "own_data" ON {table}
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR created_by = auth.uid());
```

> 상세 RLS 정책은 SECURITY.md 참조
