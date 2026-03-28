import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  date,
  bigint,
} from 'drizzle-orm/pg-core'

// ==================
// Phase 0: Foundation
// ==================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default(''),
  password: text('password').notNull(), // bcrypt hashed
  department: text('department'),
  role: text('role', { enum: ['admin', 'manager', 'sales'] }).notNull().default('sales'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  onboardingStep: integer('onboarding_step').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  industry: text('industry'),
  size: text('size', { enum: ['large', 'medium', 'small'] }),
  website: text('website'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  pricingInfo: text('pricing_info'),
  features: jsonb('features'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const aiLogs = pgTable('ai_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  agentType: text('agent_type', { enum: ['document', 'meeting', 'pipeline', 'intelligence', 'assistant'] }).notNull(),
  action: text('action', { enum: ['generate', 'analyze', 'recommend', 'summarize'] }).notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Phase 1: Documents
// ==================

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  dealId: uuid('deal_id'), // Phase 3에서 FK 추가
  type: text('type', { enum: ['proposal', 'report', 'email', 'briefing'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  aiModel: text('ai_model'),
  aiPromptVersion: text('ai_prompt_version'),
  userFeedback: text('user_feedback', { enum: ['approved', 'edited', 'rejected'] }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Phase 2: Activities & Reminders
// ==================

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  dealId: uuid('deal_id').references(() => deals.id),

  type: text('type', {
    enum: ['call', 'email', 'visit', 'meeting', 'contract', 'billing', 'inspection', 'other'],
  }),
  rawContent: text('raw_content').notNull(),
  parsedContent: jsonb('parsed_content'),
  // { summary, keywords[], amounts[], dates[], entities[] }

  activityDate: timestamp('activity_date', { withTimezone: true }).notNull().defaultNow(),
  source: text('source', { enum: ['manual', 'csv_import', 'voice'] }).notNull().default('manual'),
  aiClassified: boolean('ai_classified').notNull().default(false),
  aiConfidence: integer('ai_confidence'),

  // 파이프라인 상태
  pipelineStatus: text('pipeline_status', {
    enum: ['pending', 'processing', 'completed', 'failed'],
  }).notNull().default('pending'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  activityId: uuid('activity_id').references(() => activities.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  dealId: uuid('deal_id').references(() => deals.id),

  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] }).notNull().default('medium'),
  status: text('status', { enum: ['pending', 'completed', 'overdue', 'cancelled'] }).notNull().default('pending'),

  aiExtracted: boolean('ai_extracted').notNull().default(false),
  sourceText: text('source_text'),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  fileName: text('file_name'),
  totalRows: integer('total_rows').notNull().default(0),
  processedRows: integer('processed_rows').notNull().default(0),
  successRows: integer('success_rows').notNull().default(0),
  failedRows: integer('failed_rows').notNull().default(0),
  status: text('status', {
    enum: ['uploading', 'parsing', 'processing', 'completed', 'failed'],
  }).notNull().default('uploading'),
  errors: jsonb('errors'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Phase 3: Deals (Pipeline/CRM)
// ==================

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  contactId: uuid('contact_id').references(() => contacts.id),

  title: text('title').notNull(),
  description: text('description'),

  stage: text('stage', {
    enum: ['discovery', 'proposal', 'negotiation', 'contract', 'billing', 'closed_won', 'closed_lost'],
  }).notNull().default('discovery'),

  amount: bigint('amount', { mode: 'number' }),
  currency: text('currency').notNull().default('KRW'),
  term: text('term', { enum: ['one_time', 'monthly', 'yearly'] }).notNull().default('yearly'),

  aiScore: integer('ai_score'),
  aiScoreReason: text('ai_score_reason'),

  expectedCloseDate: date('expected_close_date'),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  closedAt: timestamp('closed_at', { withTimezone: true }),

  source: text('source', { enum: ['manual', 'csv_import', 'ai_extracted'] }).notNull().default('manual'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Phase 2: Meetings
// ==================

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),

  title: text('title').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  location: text('location'),
  attendees: jsonb('attendees'), // [{ contactId?, name, role }]
  agenda: text('agenda'),
  notes: text('notes'),
  aiSummary: text('ai_summary'),
  aiBriefing: text('ai_briefing'),
  status: text('status', { enum: ['scheduled', 'completed', 'cancelled'] }).notNull().default('scheduled'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Phase 4: Reports
// ==================

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),

  type: text('type', { enum: ['weekly', 'monthly'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),

  stats: jsonb('stats'),
  aiModel: text('ai_model'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ==================
// Type exports
// ==================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type Contact = typeof contacts.$inferSelect
export type Product = typeof products.$inferSelect
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type AiLog = typeof aiLogs.$inferSelect
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
export type ImportBatch = typeof importBatches.$inferSelect
export type Meeting = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert
export type Deal = typeof deals.$inferSelect
export type NewDeal = typeof deals.$inferInsert
export type Report = typeof reports.$inferSelect
