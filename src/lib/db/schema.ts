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
