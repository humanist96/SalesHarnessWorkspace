// Drizzle ORM에서 자동 추론된 타입을 사용합니다.
// 직접 타입 정의 대신 schema에서 re-export합니다.
export type {
  User,
  NewUser,
  Organization,
  NewOrganization,
  Contact,
  Product,
  Document,
  NewDocument,
  AiLog,
} from '@/lib/db/schema'
