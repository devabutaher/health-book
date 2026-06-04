# AGENTS.md — HealthBook Project Guide

> This file is the primary reference for AI agents (DeepSeek via OpenCode) working on HealthBook.
> Read this entire file before writing any code or making any changes.

---

## 🧠 Project Overview

**HealthBook** is a health-centric social media platform — think Instagram + Facebook, but focused on wellness.

- Users share health routines, workouts, moods, and goals
- 5 smart health templates for structured logging
- Real-time messaging, groups, challenges, expert marketplace
- Monetization: Premium subscription, consultations, tipping

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| UI | Shadcn/ui + Tailwind CSS |
| State | Redux Toolkit + RTK Query |
| Backend | Node.js + Express.js |
| Database | PostgreSQL via Supabase (managed) |
| ORM | Prisma |
| Auth | Supabase Auth (JWT) |
| Realtime | Supabase Realtime |
| Media | Cloudinary |
| Email | Resend.com |
| Payments | Stripe + SSLCommerz |
| Package Manager | pnpm (workspaces) |
| Build System | Turborepo |

---

## 📁 Project Structure

```
healthbook/                   # pnpm workspace root
├── apps/
│   ├── web/                  # Next.js 16 frontend
│   │   ├── src/
│   │   │   ├── app/          # App Router pages & layouts
│   │   │   ├── components/
│   │   │   │   ├── ui/       # Shadcn/ui base components
│   │   │   │   ├── shared/   # Reusable app components
│   │   │   │   ├── feed/     # Feed-specific components
│   │   │   │   ├── post/     # Post components
│   │   │   │   ├── health/   # Health template components
│   │   │   │   ├── messaging/# DM and chat components
│   │   │   │   ├── profile/  # Profile components
│   │   │   │   ├── groups/   # Group components
│   │   │   │   ├── challenges/ # Challenge components
│   │   │   │   ├── stories/  # Story components
│   │   │   │   ├── reels/    # Reels components
│   │   │   │   ├── notifications/ # Notification components
│   │   │   │   └── discovery/# Explore/discovery components
│   │   │   ├── redux/
│   │   │   │   ├── store.ts
│   │   │   │   ├── slices/   # Redux slices
│   │   │   │   └── api/      # RTK Query API definitions
│   │   │   ├── lib/          # Utilities (supabase, utils, theme, sounds)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── types/        # TypeScript type definitions
│   │   │   └── public/       # Static assets
│   │   └── package.json
│   └── api/                  # Express.js backend
│       ├── src/
│       │   ├── routes/       # API route definitions
│       │   ├── controllers/  # Business logic
│       │   ├── middleware/   # auth, validation, rate limiting
│       │   ├── services/     # Business services + integrations
│       │   ├── jobs/         # Cron jobs
│       │   └── utils/        # Zod validators etc.
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   ├── schema_baseline.prisma # Snapshot for db:sync diffing
│       │   └── migrations/           # Auto-generated migrations
│       ├── scripts/
│       │   └── dbSync.cjs            # Pooler-compatible schema sync script
│       └── package.json
├── packages/
│   ├── shared/               # Shared types and constants
│   └── config-tsconfig/      # Shared TypeScript configs
├── AGENTS.md
├── PLANNING.md
├── DATABASE.md
├── API.md
├── DESIGN.md
├── SECURITY.md
└── DEPLOY.md
```

---

## ⚙️ Dev Commands

```bash
# Install all dependencies (from root)
pnpm install

# Run both frontend and backend
pnpm dev

# Frontend only
cd apps/web && npm run dev    # http://localhost:3000

# Backend only
cd apps/api && npm run dev    # http://localhost:5000

# Type check
pnpm typecheck

# Build
pnpm build

# Database
cd apps/api
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Run migrations in development (VPN required)
npx prisma studio            # Open Prisma GUI at localhost:5555
npx prisma db push           # Push schema without migration (VPN required, prototyping)
npm run db:sync <name>       # Sync schema to remote via pooler (no VPN needed)
```

---

## 🔑 Environment Variables

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

**Backend** (`apps/api/.env`):
```
PORT=5000
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWD=
RESEND_API_KEY=
CLIENT_URL=http://localhost:3000
```

---

## 📐 Coding Conventions

### General
- Language: **TypeScript** everywhere (frontend + backend)
- No `any` types — always define proper types in `types/`
- Use `async/await`, never raw `.then()` chains
- All user-facing strings in English (Bengali support planned later)

### Frontend
- File naming: `kebab-case` for files, `PascalCase` for components
- Every component gets its own file
- Use Shadcn/ui components first before building custom
- Tailwind only — no inline styles, no separate CSS files
- Use `cn()` from `lib/utils.ts` for conditional classes
- All API calls go through **RTK Query** — never `fetch()` directly in components
- Server Components by default, `"use client"` only when needed (interactivity, hooks)

```tsx
// ✅ Good
import { cn } from "@/lib/utils"
const Card = ({ active }: { active: boolean }) => (
  <div className={cn("rounded-lg p-4", active && "bg-primary")} />
)

// ❌ Bad
const Card = ({ active }) => (
  <div style={{ borderRadius: 8 }} className={active ? "bg-primary" : ""} />
)
```

### Backend
- File naming: `camelCase` for files
- Route → Controller → Service pattern (never put logic in routes)
- Always validate request body with `zod` before controller logic
- Return consistent JSON responses:

```typescript
// Success
res.json({ success: true, data: result })

// Error
res.status(400).json({ success: false, message: "Validation failed", errors: [...] })

// Business logic errors — use AppError for proper HTTP status codes
import { AppError } from "../utils/AppError"
throw new AppError(404, "Group not found")
throw new AppError(403, "Only admins can do this")
throw new AppError(409, "Already a member")
```

### Database (Prisma)
- Model names: `PascalCase` singular (`User`, `Post`, `HealthLog`)
- Field names: `camelCase`
- Always use Prisma — never raw SQL unless absolutely necessary
- Prisma schema engine cannot reach Supabase through the pooler (port 6543).
  Use `prisma generate` for client updates and `npm run db:sync` for schema changes.

### Schema Change Workflow (no VPN)
```bash
# 1. Edit schema.prisma with your changes

# 2. Sync to remote DB (generates diff, applies it, creates migration, updates baseline)
npm run db:sync describe_your_change

# 3. For client-only changes (no DB schema change needed):
npx prisma generate
```

The `db:sync` script:
- Diffs `schema_baseline.prisma` → current `schema.prisma`
- Connects through Supabase pooler (dotted user format) to execute SQL
- Creates migration files locally
- Registers the migration in `_prisma_migrations`
- Updates the baseline snapshot for future diffs
- Regenerates Prisma client

`prisma migrate dev` / `prisma db push` / `prisma migrate status` DO NOT work
through the pooler (schema engine limitation). Do not use them.

---

## 🔄 Data Flow

```
User Action (React)
    → Redux dispatch / RTK Query mutation
    → Express API (backend)
    → Prisma query
    → PostgreSQL (Supabase)
    → Response back up the chain
    → Redux state updated
    → UI re-renders
```

**Realtime flow (messaging/notifications):**
```
User sends message
    → Optimistic UI update (Redux)
    → POST /api/messages (Express)
    → Prisma saves to DB
    → Supabase Realtime broadcasts
    → Recipient's useEffect listener triggers
    → Recipient's Redux state updated
```

---

## 🚫 What NOT To Do

- Never put business logic in Next.js API routes — use Express backend
- Never call Supabase directly from frontend for data — only for Auth and Realtime subscriptions
- Never skip Prisma migrations — always `migrate dev` (with VPN) or `db:sync` (without VPN) after schema changes
- Never hardcode secrets — always use `.env` files
- Never use `useEffect` for data fetching — use RTK Query
- Never install a new package without checking if Shadcn/ui already has it
- Never write raw SQL unless Prisma cannot handle the query

---

## 🧩 Key Features Reference

| Feature | Location | Status |
|---|---|---|
| Auth | Supabase Auth + frontend pages | ✅ Complete (no OAuth) |
| Feed | `app/(main)/feed` | ✅ Complete |
| Health Templates | `components/health/` | ✅ Complete (5 types) |
| My Book Dashboard | `app/(main)/my-book` | ✅ Complete |
| Messaging | `components/messaging/` | ✅ Complete (1-on-1) |
| Groups | `app/(main)/groups` | ✅ Complete (search, join requests, invites, roles, member management, group feed, browse, my groups) |
| Challenges | `app/(main)/challenges` | ✅ Complete (create, join, progress, leaderboard, update, leave, delete) |
| Stories | `components/stories/` | ✅ Complete (create, friend stories, views, likes) |
| Reels | `components/reels/` | ✅ Complete (browse, create, like, comment) |
| Expert Marketplace | `app/(main)/experts` | ❌ Future |
| Admin Panel | `app/admin` | ❌ Future |
| Payments | backend/services/ | ❌ Future |

---

## 📦 Phase Priority

1. **Phase 1** — Auth + Post Feed + Comments + Profile (MVP) — ~96% complete
2. **Phase 2** — 5 Health Templates + My Book Dashboard — 100% complete
3. **Phase 3** — Messaging + Groups + Challenges + Reels/Stories — ~92% complete
4. **Phase 4** — Payments + Expert Marketplace + Premium — FUTURE
5. **Phase 5** — Analytics + Admin Dashboard + Performance — FUTURE

See `PLANNING.md` for detailed breakdown.
