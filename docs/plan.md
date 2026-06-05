# PLAN — HealthBook

## Goal
Health-centric social media. Instagram+Facebook for wellness. Users share routines, workouts, moods, goals. 5 health templates. Real-time messaging, groups, challenges. Monetization via premium, consultations, tipping.

## Architecture
```
pnpm monorepo (Turborepo)
├── apps/
│   ├── web/    Next.js 16 App Router + React 19
│   └── api/    Express.js 5 + Prisma 7 + Supabase
└── packages/
    ├── shared/             Shared types/constants
    └── config-tsconfig/    Shared TS configs
```

**Data flow:** React → Redux/RTK Query → Express API → Prisma → PostgreSQL (Supabase)

**Realtime:** Supabase Realtime for messaging/notifications

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19 |
| UI | Shadcn/ui + Radix + Tailwind CSS v4 |
| State | Redux Toolkit + RTK Query |
| Backend | Express.js 5 + tsx (hot reload) |
| DB | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | Supabase Auth (JWT) |
| Realtime | Supabase Realtime |
| Media | Cloudinary |
| Email | Resend |
| Payments | Stripe + SSLCommerz (future) |
| Pkg Manager | pnpm@11.5.0 |
| Build | Turborepo |
| Lint | ESLint 9 + Prettier |

## Phases
1. **MVP** (~96%): Auth + Feed + Comments + Profile
2. **Health** (100%): 5 templates + My Book dashboard
3. **Social** (~92%): Messaging + Groups + Challenges + Reels/Stories
4. **Monetization** (FUTURE): Payments + Expert Marketplace
5. **Polish** (FUTURE): Analytics + Admin + Performance

See `PLANNING.md` for detailed checklist.

## Decisions
- **No `any` types** — proper types in `apps/web/src/types/`
- **Route→Controller→Service** pattern in backend
- **Zod** validation on all request bodies
- **No raw SQL** — Prisma everywhere (unless Prisma can't handle query)
- **No direct Supabase from frontend** — only Auth + Realtime subs; data via Express
- **No `useEffect` for data** — RTK Query only
- **`db:sync` script** instead of `prisma migrate dev` (VPN alternative via pooler)
- **Server Components** by default, `"use client"` only for interactivity/hooks

## Gotchas
- Prisma schema engine can't reach Supabase through pooler (port 6543). Use `npm run db:sync` for schema changes, not `migrate dev`/`db push`.
- `pnpm-workspace.yaml` allows builds for `prisma`, `sharp` — esbuild is blocked.
- `shadcn@4.9.0` excluded from minimumReleaseAge (pinned).
- Express 5 has breaking changes from v4 — route param syntax differs.
- Next.js 16 App Router — async component for data fetching, no `getServerSideProps`.
- Turborepo `typecheck` depends on `^build` — can't typecheck without building first.
- Tailwind CSS v4 uses `@tailwindcss/postcss` (not `tailwindcss` directly) and no `tailwind.config.js`.
- `apps/web/clean` uses `rm -rf` (Unix) — won't work on Windows CMD without Git Bash/WSL.

## Build Commands
```bash
pnpm install          # Install all deps (root)
pnpm dev              # Run both frontend + backend
pnpm build            # Build all (turbo)
pnpm lint             # Lint all
pnpm typecheck        # Type check (requires build first)
pnpm clean            # Clean all
```

## Relevant Skills
- next-best-practices
- nodejs-backend-patterns
- shadcn
- supabase
- prisma-client-api
- turborepo
- react-state-management
- tailwind-design-system
