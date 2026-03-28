# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SalesHarness — 코스콤 영업직원의 업무를 AI로 자동화하는 웹 애플리케이션. Korean-language sales CRM with AI-powered document generation, meeting prep, pipeline management, and market intelligence.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
```

No test runner is configured. QA is done via structured logging and Docker log monitoring (Zero Script QA).

## Tech Stack

- **Next.js 16 (App Router)** + React 19 + TypeScript
- **Drizzle ORM** with Neon PostgreSQL (serverless HTTP driver)
- **NextAuth 5 (beta)** — Credentials provider, JWT strategy (24h expiry), roles: admin/manager/sales
- **OpenAI** — GPT-4o (proposals/reports), GPT-4o-mini (emails/quick tasks)
- **UI** — Tailwind CSS 4 + shadcn/ui (base-nova style) + Motion animations
- **State** — TanStack React Query (server), Zustand (client UI)
- **Forms** — React Hook Form + Zod 4

## Architecture

### Route Groups
- `src/app/(auth)/` — Login page (unprotected)
- `src/app/(dashboard)/` — All authenticated pages (protected via middleware)
- `src/app/api/` — API routes

### Feature Modules (`src/features/`)
Each feature is self-contained with `components/`, `hooks/`, `actions/`, `types.ts`:
- `documents` — AI document generation (proposals, reports, emails)
- `meetings` — Meeting prep, briefings, scenarios
- `pipeline` — Deal tracking, AI scoring, forecasting
- `organizations` — Customer company management
- `activities` — Sales activity logging, CSV import

### Core Libraries (`src/lib/`)
- `db/schema.ts` — Single-file Drizzle schema (all tables)
- `db/index.ts` — Database client initialization
- `auth/` — NextAuth configuration
- `openai/client.ts` — OpenAI client + prompt builder

### AI Agents
Five AI agents map 1:1 to core modules (defined in `AGENTS.md`):
- Document Agent, Meeting Agent, Pipeline Agent, Intelligence Agent, Assistant Agent
- All agents output in Korean business-formal tone
- AI usage is logged to `aiLogs` table (tokens, duration, cost)

### Database
- Schema in `src/lib/db/schema.ts` — UUID PKs, timestamptz, JSONB fields
- Deal stages: discovery → proposal → negotiation → contract → billing → closed_won/lost
- Activity types: call, email, visit, meeting, contract, billing, inspection
- Amounts in KRW (Korean Won)

## Key Conventions

- **Path alias**: `@/*` → `./src/*`
- **File naming**: Components PascalCase, hooks `use*` camelCase, API routes kebab-case folders
- **Feature-first organization**: Business logic in `features/`, routes in `app/` are thin wrappers
- **Shared components**: Only extract to `components/` when used by 2+ features
- **Korean UI**: All user-facing text in Korean; comments and code in English
- **Fonts**: Bricolage Grotesque (display) + Noto Sans KR (body)
- **Theme**: Aurora Finance — dark theme with gold accents, deep blues, emerald data viz

## Environment Variables

```
DATABASE_URL          # Neon PostgreSQL connection string
AUTH_SECRET           # NextAuth secret (base64)
OPENAI_API_KEY        # OpenAI API key
NEXT_PUBLIC_APP_URL   # App URL (http://localhost:3000 in dev)
```

## Related Documentation

- `ARCHITECTURE.md` — System overview, module map, data flow
- `AGENTS.md` — AI agent definitions, prompts, constraints
- `docs/DESIGN.md` — Code conventions, naming rules, component patterns
- `docs/FRONTEND.md` — UI/UX guidelines, design system
- `docs/PRODUCT_SENSE.md` — Product philosophy, target users
- `docs/design-docs/glossary.md` — Domain terminology dictionary
