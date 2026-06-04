# PLANNING.md — HealthBook Feature Planning

> This file defines what to build, in what order, and why.

---

## 🗺️ Big Picture

HealthBook is built in 5 phases.

```
Phase 1 (MVP): Auth + Feed + Profile          → ~96% complete
Phase 2 (Health): Templates + My Book          → 100% complete
Phase 3 (Social): Messaging + Groups + Reels   → ~92% complete
Phase 4 (Monetization): Payments + Experts     → FUTURE
Phase 5 (Polish): Analytics + Admin + Perf     → FUTURE
```

---

## ✅ Phase 1 — MVP Core

### 1.1 Project Setup
- [x] Initialize Next.js 16 with TypeScript + App Router
- [x] Install and configure Shadcn/ui + Tailwind CSS
- [x] Setup Redux Toolkit + RTK Query
- [x] Initialize Express.js backend with TypeScript
- [x] Setup Prisma + connect to Supabase PostgreSQL
- [x] Configure Supabase Auth
- [x] Setup Cloudinary account and integration
- [x] Create `.env.example` files for both frontend and backend
- [x] Setup ESLint + Prettier
- [x] Create basic folder structure (Turborepo monorepo)

### 1.2 Authentication
- [x] Register page (name, email, password, username, gender)
- [x] Login page (email, password)
- [x] Forgot password + reset password flow
- [ ] Google OAuth (Supabase social login) — NOT STARTED
- [x] Auth middleware on Express (see SECURITY.md)
- [x] JWT token refresh logic
- [x] Protected route wrapper on frontend
- [x] Redirect unauthenticated users to /login

### 1.3 User Profile
- [x] Profile page (`/[username]`)
- [x] Edit profile (name, bio, avatar, cover photo)
- [x] Avatar upload via Cloudinary
- [x] Follow / Unfollow button
- [x] Followers and Following count + modal list
- [x] Profile tabs: Posts | Health Logs | Saved
- [x] Verified badge display (blue tick)

### 1.4 Post System
- [x] Create post (text, photo up to 5 images)
- [x] Image upload to Cloudinary
- [x] Post privacy selector (Public / Friends / Only Me)
- [ ] Post scheduling (save as draft, publish later) — NOT STARTED
- [x] Delete own post
- [x] Edit own post (within 15 minutes)
- [x] Save / Bookmark post

### 1.5 Home Feed
- [x] Feed page (`/feed`) — paginated, infinite scroll
- [x] Show posts from followed users + own posts
- [x] 5 health reactions (Inspired, Clap, Keep it Up, Healing, Love)
- [x] Reaction count display
- [x] Comment section (2-level nested replies)
- [x] Pin/unpin comment (post owner only)
- [x] Share post to profile or via DM
- [x] Suggested users sidebar (desktop)

### 1.6 Search & Discovery (Basic)
- [x] Search bar (users, posts, hashtags)
- [x] Explore page with category tabs
- [x] Hashtag pages (`/hashtag/[tag]`)
- [x] User search results page

### 1.7 Notifications (Basic)
- [x] In-app notification dropdown
- [x] Notify on: new follower, reaction, comment, reply
- [x] Mark all as read
- [x] Notification badge count on bell icon
- [x] Delete individual notification

### 1.8 Navigation
- [x] Bottom nav bar (mobile): Home, Search, Create, My Book, Profile
- [x] Left sidebar (desktop): Home, Explore, Reels, Messages, Groups, Profile, Settings
- [x] Top header with logo and notification bell
- [x] Create post floating button (mobile)

---

## ✅ Phase 2 — Health Features

### 2.1 Health Templates
- [x] Template selector UI (modal with 5 options)
- [x] Daily Routine Template (wake/sleep, meals, water, screen time)
- [x] Today's Goal Template (checklist, priorities, completion %)
- [x] Fitness & Workout Template (activity, duration, calories, sets/reps, intensity)
- [x] Mind & Mood Template (mood emoji, gratitude, reflection, stress level)
- [x] Quick Log (water/sleep/weight/period one-tap)

### 2.2 Health Logs (My Book Dashboard)
- [x] My Book page (`/my-book`)
- [x] Health calendar (month view, color-coded)
- [x] Health streaks — calculate and display (7, 30, 100 day milestones)
- [x] Streak badges — award and display on profile
- [x] Calorie trend chart (7/30/90 day toggle) using Recharts
- [x] Mood trend chart (weekly)
- [x] Workout history table (sortable)
- [x] Goal completion rate per week (bar chart)
- [x] Health Score (0-100, calculated weekly)
- [x] Streak at Risk Alert (notification if no log by 8PM)

### 2.3 Additional Health Widgets
- [x] BMI calculator (height + weight, healthy range)
- [x] Water intake widget (quick-add, 8-glass goal)
- [x] Sleep quality logger (hours + quality rating)
- [x] Medicine reminder (browser localStorage CRUD)
- [x] Period/cycle tracker (female-only, gated by gender)
- [x] Weight & measurements log (optional, private)

### 2.4 Health Post Features
- [x] Recipe post template (ingredients, steps, nutrition info)
- [x] Before & After transformation post type
- [x] Health log auto-share option (share today's routine to feed)
- [x] Saved routines from other users (copy to own My Book)

---

## ✅ Phase 3 — Social Features

### 3.1 Direct Messaging
- [x] DM inbox page (`/messages`)
- [x] 1-on-1 conversations with real-time updates (Supabase Realtime)
- [x] Send text messages + media + shared posts
- [x] Message deletion (self or both sides)
- [x] Read receipts
- [x] Online/last seen status
- [ ] Group chats (schema supports it, no UI) — NOT IMPLEMENTED
- [x] Shared media library
- [x] Mute conversation
- [ ] Do Not Disturb mode — NOT IMPLEMENTED

### 3.2 Groups & Communities
- [x] Create group (name, description, cover photo, type)
- [x] Group types: Public / Private / Secret
- [x] Group feed with member posts
- [x] Group search (by name/description)
- [x] Delete group (admin only)
- [x] Group moderation (admin can remove members, change roles, delete posts)
- [x] Member roles: Admin, Moderator, Member
- [x] Join request approval (Private groups)
- [x] Invite system (Secret groups)
- [x] Browse public groups with pagination
- [x] Group media upload (cover photo)
- [ ] Group polls and quizzes — NOT IMPLEMENTED
- [ ] Group events (date, description, RSVP) — NOT IMPLEMENTED
- [ ] Shared health files (PDF, guides upload) — NOT IMPLEMENTED
- [ ] Expert badge in group for verified professionals — NOT IMPLEMENTED

### 3.3 Challenges
- [x] Solo Challenge (personal goal + daily tracking)
- [x] Group Challenge (admin creates, members join + log progress)
- [x] Live leaderboard with rankings
- [x] Daily progress using health templates
- [x] Completion badges for finishers
- [x] Platform Challenge (HealthBook-wide)
- [x] Challenge browse page (`/challenges`)
- [x] My active challenges section in My Book

### 3.4 Reels & Stories
- [x] Stories: Upload photo/video (up to 30 sec)
- [x] Stories: Text overlays
- [ ] Stories: Interactive polls — NOT IMPLEMENTED
- [ ] Stories: Question sticker — NOT IMPLEMENTED
- [x] Stories: Viewers list
- [x] Stories: Highlights (permanent collections on profile)
- [x] Stories: Expire after 24 hours (with cron cleanup)
- [x] Health Reels: Upload vertical video
- [ ] Reels: Speed controls (0.5x, 1x, 1.5x, 2x) — NOT IMPLEMENTED
- [ ] Reels: Text overlays — NOT IMPLEMENTED
- [ ] Reels: Background music library — NOT IMPLEMENTED
- [ ] Reels: Duet/Remix functionality — NOT IMPLEMENTED
- [x] Reels feed page (`/reels`)
- [x] Reels: Autoplay on scroll

### 3.5 Discovery Improvements
- [x] Explore page category tabs (Fitness, Nutrition, Mental Health, etc.)
- [x] People You May Know (mutual followers algorithm)
- [x] Trending hashtags
- [ ] Health News Feed (curated articles) — NOT IMPLEMENTED
- [ ] Related hashtags suggestions — NOT IMPLEMENTED
- [x] Most Active Users This Week widget

---

## ✅ Phase 4 — Monetization (FUTURE)

### 4.1 Premium Subscription (HealthBook Pro)
- [ ] Premium page (`/premium`) with feature comparison
- [ ] Stripe integration (international cards)
- [ ] SSLCommerz integration (Bangladesh: bKash, Nagad, Rocket)
- [ ] Monthly ($4.99) and yearly ($49.99) plans
- [ ] Premium badge on profile
- [ ] Gate premium features
- [ ] Cancel subscription flow
- [ ] Billing history page

### 4.2 Expert Marketplace
- [ ] Expert application form
- [ ] Admin review and approval flow
- [ ] Verified professional profile with blue tick
- [ ] Expert directory page (`/experts`)
- [ ] Filter by specialty
- [ ] Consultation booking system
- [ ] Built-in video call
- [ ] Expert earnings dashboard
- [ ] Platform commission: 20%

### 4.3 Creator Tipping
- [ ] Tip button on creator profiles and posts
- [ ] Tip amount selector
- [ ] Payment via Stripe/SSLCommerz
- [ ] 70/30 split

### 4.4 Digital Products
- [ ] Upload and sell digital products
- [ ] Sales dashboard

### 4.5 Paid Group Challenges
- [ ] Entry fee option
- [ ] Prize pool display

---

## ✅ Phase 5 — Polish & Scale (FUTURE)

### 5.1 Advanced Analytics
- [ ] Personal Health Report (auto-generated monthly PDF)
- [ ] Community Health Insights
- [ ] Health Pattern Detection
- [ ] Post insights for Premium users

### 5.2 Admin Dashboard
- [ ] Admin login with 2FA
- [ ] User management (search, filter, ban, suspend)
- [ ] Content moderation queue
- [ ] Platform analytics (DAU, MAU, revenue)
- [ ] Create platform-wide challenges

### 5.3 Content Moderation
- [ ] Report system
- [ ] 3-strike violation system
- [ ] Health misinformation flagging

### 5.4 Performance Optimization
- [ ] Redis caching for feed
- [ ] Image lazy loading everywhere
- [ ] Virtual scrolling for large lists
- [ ] Lighthouse score > 90 on mobile

### 5.5 Privacy & Settings
- [ ] Block / Restrict users
- [ ] Hide stories from specific people
- [ ] Private account mode
- [ ] Two-factor authentication
- [ ] Download my data (GDPR)
- [ ] Delete account with 30-day grace period
- [ ] Notification preferences (granular control)
- [ ] Sound effects toggle (done) + Dark mode toggle (done)
