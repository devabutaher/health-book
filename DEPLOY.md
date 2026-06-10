# Deploy — HealthBook

## Architecture

| Layer | Platform | Code |
|---|---|---|
| Frontend (Next.js 16) | **Vercel** | `apps/web` |
| Backend (Express) | **Render** | `apps/api` |
| Database (PostgreSQL) | **Supabase** | Managed |
| Auth | **Supabase Auth** | Managed via Supabase |
| Media | **Cloudinary** | External |
| Email | **Resend** | External |
| Payments | **Stripe + SSLCommerz** | External |
| Push notifications | **Web Push (VAPID)** | Self-managed |

Both Vercel and Render are configured for **auto-deploy on git push** (main branch).

---

## Prerequisites

- Node.js >= 22 (see `.nvmrc`)
- `pnpm` >= 11 (install: `npm i -g pnpm`)
- A Supabase project (with pooler connection)
- Cloudinary account
- Resend API key
- Stripe + SSLCommerz accounts (for payments)

---

## Environment Variables

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Backend (`apps/api/.env`)

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db.your-project.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-64-chars
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWD=
RESEND_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CLIENT_URL=https://your-frontend.vercel.app
```

---

## Vercel (Frontend)

Already configured:
- `vercel.json` — framework Next.js, build command, install command
- `.vercelignore` — excludes `apps/api` and `.git`

**Steps:**
1. Connect repo to Vercel (root directory)
2. Framework preset: **Next.js**
3. Root directory: **`./`** (Vercel detects monorepo from `vercel.json`)
4. Add all `NEXT_PUBLIC_*` env vars in Vercel dashboard
5. Deploy — auto-deploys on every push to main

---

## Render (Backend)

**Service type:** Web Service

**Settings:**
| Field | Value |
|---|---|
| Build Command | `pnpm install && pnpm --filter @healthbook/api build` |
| Start Command | `node apps/api/dist/index.js` |
| Root Directory | `./` |
| Node Version | 22 |
| Health Check Path | `/api/health` |

**Environment variables:** Add all from `apps/api/.env.example` in Render dashboard.

Render auto-deploys on every push to main.

---

## Database Schema Sync

After deployment, the `news_articles` table needs to be populated:

```bash
# Run once after deploy
cd apps/api && npm run seed:news
```

If you need to push schema changes later:
```bash
npm run db:sync describe_your_change
```

---

## Monitoring

- **Health endpoint:** `GET /api/health` — returns `{ status, db, timestamp }`
- Render provides built-in logging and metrics
- Vercel provides analytics and logging

---

## Build Locally

```bash
pnpm install
pnpm build     # builds both frontend + backend
pnpm typecheck # type checking
```
