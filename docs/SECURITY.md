# SalesHarness — Security

> 보안 정책, 인증/인가, 데이터 보호, 감사 규칙을 정의합니다.
> Core Beliefs의 "고객 데이터는 성역이다"를 구체적으로 구현하는 문서.

## 1. Authentication (인증)

### Phase 0-1: Supabase Auth (Email/Password)
```
사용자 → Supabase Auth → JWT 발급 → API 접근
```

- 코스콤 직원만 가입 가능 (도메인 제한 또는 초대 방식)
- 비밀번호 정책: 8자 이상, 영문+숫자+특수문자
- 세션 만료: 24시간 (갱신 가능)

### Phase 2+: SSO 연동 (향후)
- 코스콤 사내 SSO 연동 고려
- SAML 또는 OAuth2.0

## 2. Authorization (인가)

### Role-Based Access Control (RBAC)

| 역할 | 권한 |
|------|------|
| `admin` | 전체 관리, 사용자 관리, 설정 |
| `manager` | 팀 파이프라인 조회, 보고서, 팀원 데이터 |
| `sales` | 자신의 데이터 CRUD, AI 기능 사용 |

### Row Level Security (RLS)

모든 테이블에 RLS 적용. 예외 없음.

```sql
-- 기본 정책: 자신의 데이터만 접근
CREATE POLICY "users_own_data" ON deals
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- 매니저: 팀원 데이터 조회 가능
CREATE POLICY "manager_team_read" ON deals
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.manager_id = auth.uid()
      AND team_members.user_id = deals.user_id
    )
  );
```

## 3. Data Protection (데이터 보호)

### 분류

| 등급 | 예시 | 보호 수준 |
|------|------|-----------|
| 기밀 | 계약 금액, 빌링 정보 | 암호화 + 접근 로그 + RLS |
| 내부 | 고객사 정보, 딜 현황 | RLS + 접근 로그 |
| 일반 | 상품 카탈로그, 시장 정보 | 인증 필요 |

### 암호화
- **전송 중(In Transit)**: HTTPS 필수 (Vercel 기본 제공)
- **저장 중(At Rest)**: Supabase PostgreSQL 암호화 (기본 제공)
- **민감 필드**: 필요 시 애플리케이션 레벨 암호화 추가

### AI 프롬프트 보안
- 고객 개인정보(주민번호, 계좌번호 등)는 **절대** AI 프롬프트에 포함하지 않음
- 프롬프트에 전달되는 데이터는 필요 최소한으로 제한
- AI 응답 로그에 민감 정보 포함 여부 검증

## 4. API Security

### 기본 규칙
- 모든 API 엔드포인트는 **인증 필수** (public API 없음)
- Rate Limiting: 분당 60회 (사용자당)
- Request body 크기 제한: 10MB
- CORS: 허용된 도메인만

### 입력 검증
```typescript
// 모든 API 입력은 Zod로 검증
import { z } from 'zod'

const createDealSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(200),
  value: z.number().positive().max(100_000_000_000), // 1000억 상한
  stageId: z.string().uuid(),
})
```

### 금지 사항
- ❌ SQL 직접 실행 (Supabase 클라이언트 사용)
- ❌ 사용자 입력을 직접 HTML에 렌더링 (XSS 방지)
- ❌ API Key를 클라이언트 코드에 포함
- ❌ 에러 메시지에 스택 트레이스/DB 구조 노출

## 5. Secret Management

```
환경변수 관리:
├── .env.local          # 로컬 개발 (git에 커밋 금지)
├── Vercel Dashboard     # 프로덕션 환경변수
└── .env.example         # 템플릿 (값 없이 키만)

필수 환경변수:
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
├── SUPABASE_SERVICE_ROLE_KEY      # 서버사이드 전용
├── OPENAI_API_KEY                 # 서버사이드 전용
└── (향후) KOSCOM_SSO_CLIENT_ID
```

## 6. Audit & Monitoring

### 감사 로그
기록 대상:
- 사용자 로그인/로그아웃
- 고객 데이터 조회/수정/삭제
- AI 기능 사용 (프롬프트, 모델, 토큰 사용량)
- 문서 생성/수정/삭제
- 관리자 설정 변경

### 로그 형식
```json
{
  "timestamp": "2026-03-28T09:00:00Z",
  "userId": "uuid",
  "action": "document.create",
  "resource": "documents/uuid",
  "metadata": { "model": "gpt-4o", "tokens": 2500 }
}
```

## 7. Security Checklist

매 Phase 완료 시 확인:
- [ ] 모든 API 엔드포인트에 인증 적용
- [ ] 모든 테이블에 RLS 적용
- [ ] 환경변수에 시크릿 없음 (코드 내 하드코딩)
- [ ] 사용자 입력 검증 (Zod)
- [ ] 에러 메시지에 내부 정보 미노출
- [ ] AI 프롬프트에 개인정보 미포함
- [ ] .env.local이 .gitignore에 포함
