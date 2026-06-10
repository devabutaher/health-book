<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000?style=for-the-badge&logo=express&logoColor=fff" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=fff" alt="Prisma" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=fff" alt="Supabase" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=fff" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=fff" alt="Turborepo" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=fff" alt="Tailwind CSS" />
</div>

<br />

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://placehold.co/1200x630/1a1a2e/ffffff?text=HealthBook">
    <img src="https://placehold.co/1200x630/e8f5e9/1a1a2e?text=HealthBook" alt="HealthBook Hero" width="100%" style="max-width: 1200px; border-radius: 12px;" />
  </picture>
  <br />
  <sub><i>→ Replace with your homepage screenshot ←</i></sub>
</div>

<br />

<div align="center">
  <h1>HealthBook</h1>
  <p>A full-stack health-centric social media platform — Instagram + Facebook for wellness.</p>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a>
  </p>
</div>

---

## Features

| Area | Capabilities |
|---|---|
| **Auth** | Register/login · JWT auto-refresh · Forgot/reset password · Protected routes |
| **Profiles** | Avatar/cover (Cloudinary) · Follow/unfollow · Verified badge · Followers modals |
| **Posts** | Rich text + up to 5 images · Privacy selector · Edit/delete · Drafts · Scheduling · Polls · Quizzes · 5 health reactions · @mentions · #hashtags |
| **Comments** | 2-level nested replies · Pin comments · Full threads |
| **Health Templates** | Daily Routine · Today's Goal · Fitness/Workout · Mind & Mood · Quick Log |
| **My Book Dashboard** | Health calendar · Streaks (7/30/100 day badges) · Calorie/mood/goal charts · Health Score · At-risk alerts |
| **Challenges** | Solo · Group · Platform · Duel · Daily check-ins · Live leaderboard · Progress charts · Day plans · Streak · Completion badges · Before/after photos · Ratings · Invites |
| **Groups** | Public/Private/Secret · Member roles · Join requests · Invites · Feed · Polls · Events with RSVP |
| **Messaging** | 1-on-1 DMs · Realtime (Supabase) · Text/media/post sharing · Read receipts · Online presence · Mute · Shared media |
| **Stories** | Photo/video up to 30s · Text with customization · Quiz/poll stickers · Reactions · Viewers · Likes · 24h expiry · Highlights |
| **Reels** | Vertical video · Upload with caption · Autoplay scroll · Like · Comment |
| **Search** | Users · Posts · Hashtags · Explore with category tabs · Trending tags · Suggestions |
| **Notifications** | 11 types (follow, like, comment, mention, message, challenge, streak, etc.) · Bell dropdown · Full page · Mark read |
| **Health Widgets** | BMI calculator · Water tracker · Sleep logger · Medicine reminders · Period tracker · Weight tracker · Recipe template · Before/after slider |
| **News** | Curated articles (WHO, CDC, etc.) · Category filter · In Explore page |
| **Settings** | Dark/light theme · Sound effects · Persisted preferences |
| **Realtime** | Feed · Messages · Groups · Challenges · Stories · Reels · Health logs · Presence · Unread counts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui · Framer Motion |
| **State** | Redux Toolkit + RTK Query (21 APIs) |
| **Backend** | Express.js 5 · TypeScript (strict) · Zod validation |
| **Database** | PostgreSQL via Supabase · Prisma 7 ORM (27 models) |
| **Auth** | Supabase Auth (JWT) |
| **Realtime** | Supabase Realtime (11 subscriptions) |
| **Media** | Cloudinary |
| **Email** | Resend.com |
| **Monorepo** | Turborepo · pnpm workspaces |
| **Infra** | Helmet · CORS · Rate limiter · Global error handler · AppError class |
| **Deployment** | Vercel (frontend) · Render (backend) · Auto-deploy from git |

---

## Architecture

```
User Action → Redux/RTK Query → Express API → Prisma → PostgreSQL → Response → UI
```

### Project Structure

```
healthbook/
├── apps/
│   ├── web/                    # Next.js 16
│   │   ├── components/         # 130+ in 13 directories
│   │   ├── redux/api/          # 21 RTK Query API files
│   │   ├── hooks/              # 18 custom hooks
│   │   └── app/                # 20+ routes
│   └── api/                    # Express backend
│       ├── routes/             # 22 routes
│       ├── controllers/        # 21 controllers
│       ├── services/           # 24 services
│       ├── jobs/               # 4 cron jobs
│       └── prisma/             # 27 models · 10 enums
├── packages/
│   ├── shared/                 # Shared types
│   └── config-tsconfig/        # Shared TS configs
└── DEPLOY.md
```

---

## Getting Started

```bash
pnpm install
pnpm dev              # Frontend :3000 + Backend :5000
pnpm typecheck        # Full type checking
pnpm build            # Production build

# Seed health news (one-time)
cd apps/api && npm run seed:news
```

---

<div align="center">
  <p>Built with TypeScript · Next.js 16 · Express 5 · Prisma · Supabase · Tailwind CSS · Redux Toolkit · Turborepo</p>
  <p>20+ routes · 130+ components · 22 API routes · 27 DB models · 11 realtime subscriptions · 4 cron jobs</p>
</div>
