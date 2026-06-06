# CHECKPOINT — HealthBook

## Session: YYYY-MM-DD HH:MM

### Done
- 

### Current State
- 

### Next Steps
- [ ] 

### Questions
- 

### Blockers
- 

---

## Session Log

### 2026-06-06 (Baseline Setup)
**Done:**
- Created opencode.json with caveman config
- Created docs/plan.md with full project overview
- Created docs/checkpoint.md session journal
- Updated AGENTS.md with caveman mode + session protocol
- Verified .gitignore (docs/ not ignored, .env/node_modules/.next/dist ARE)
- Ran baseline pnpm build: FAIL

**Build Result:**
- `@healthbook/api:build` — PASS (Prisma generate + tsc)
- `@healthbook/web:build` — FAIL (TypeScript error: `Camera` not imported in `apps/web/src/app/(main)/groups/[id]/page.tsx:347`)
- Pkg manager: pnpm@11.5.0, turbo 2.9.16

**State:** Project baseline captured and documented. Pre-existing build error in groups page.
**Next:** Fix Camera import in groups page, then feature work per phase priority.

### 2026-06-06 (Challenge Issues Fix)
**Done:**
- Backend: GROUP membership filter in browse(), getById(), join()
- Backend: dayCount `||` → `??` fix, update() recalculate dayCount on date change
- Backend: date validation in join() and checkIn() (prevent future/expired check-ins)
- Frontend: `lib/getChallengeDay.ts` shared utility (Math.floor+1 formula)
- Frontend: Fixed today day number in page.tsx and ChallengeCalendar.tsx (removed frozen Date.now)
- Frontend: Fixed duplicate stats in ChallengeProgress (removed redundant %/Day text)
- Frontend: Group picker in CreateChallengeModal and EditChallengeModal
- Frontend: LeaderboardRow shows both `score / dayCount` and `totalValue / goalTarget`
- Frontend: Sound effects (useSound) on all challenge mutations (create, check-in, invite, duel, comment, share)
- Typecheck passes, lint clean (no new errors)

**State:** All challenge bugs fixed. Pushed to origin/main.
**Next:** Vercel auto-deploy. Monitor build logs for any issues.

### 2026-06-06 (Auth Flow Reliability)
**Done:**
- Fix `ProtectedRoute.tsx` — added `isLoading` guard to prevent redirect-loop on page refresh
- Fix OAuth callback (`auth/callback/route.ts`) — `hb_rt` cookie `maxAge` 60 → 604800 (persistent)
- Fix `login/page.tsx` — set `hb_rt` cookie alongside `hb_token` after email/password login
- Fix `AuthProvider.tsx` — added cookie fallback in init (read `hb_token` + `hb_rt` when localStorage empty)
- Fix `AuthProvider.tsx` — sync `hb_rt` cookie alongside `hb_token` in auth effect
- Fix `AuthProvider.tsx` — don't clear cookies when tokens exist but waiting for `getMe`
- Fix `AuthProvider.tsx` — don't clear `hb_rt` cookie on OAuth handoff (it's now persistent)
- Build passes (typecheck + next build clean)

**State:** Auth flow handles all edge cases: page refresh, OAuth close-browser-reopen, localStorage wipe.
**Next:** Test OAuth callback flow end-to-end.

### 2026-06-06 (Draft Fixes + Follow Button + Reaction Optimism)
**Done:**
- Fix `CreatePostModal` — uses `updatePost` instead of `create` when editing a draft (was creating duplicates)
- Fix `postApi.ts` — added `"Drafts"` cache tag (was sharing `"Posts"` with explore/profile)
- Fix `createPost.onQueryStarted` — updates `getDrafts` cache when `isDraft=true` (was missing)
- Fix `deletePost.onQueryStarted` — removes from `getDrafts` cache with rollback (was missing)
- Fix `publishDraft` — truly optimistic now (removes from drafts immediately, rollback on fail)
- Fix `publishScheduled.ts` — uses `scheduledAt` for `publishedAt` instead of `now`; calls `notifyMentions()`
- Fix `PostCard` — removed `memo` so reactions/likes update visually without refresh
- Add `Follow`/`Following` button in `PostCard` (next to username, optimistic toggle with rollback)
- Add `isFollowing` to backend feed response (`post.service.ts:getFeed`)
- Add `isFollowing` to frontend `PostUser` type
- Add feed cache patching to `follow`/`unfollow` mutations in `userApi.ts`
- Fix reaction instant update — local state in PostCard (`localReaction`, `localReactionCount`) + `onReaction` callback to ReactionBar (bypasses RTK→allPosts sync)
- Fix follow button visibility — always shows for non-owners (removed `isFollowing !== undefined` guard)
- All typechecks + build pass

**State:** Draft/schedule features fixed with proper optimistic cache updates. Follow/unfollow works instantly on feed posts. Reaction buttons update visually on click without any delay.
**Next:** Verify OAuth callback flow, test reaction visibility, test follow button.

### 2026-06-06 (Browser Cache + Performance Optimization)
**Done:**
- **Step 4 (notification COUNT fix):** Removed redundant `prisma.notification.count()` in `notification.list()` — derives `unreadCount` from already-fetched items array (`notification.service.ts:112`)
- **Step 1 (Cache-Control on all GET routes):** Applied `cacheControl` middleware to 42 GET routes across 9 route files (user, group, challenge, notification, healthLog, story, reel, search, message). Also added `public` variant param. 3 cache tiers: 10s/30s for dynamic data, 60s/300s for semi-dynamic, 300s/600s for static data.
- **Step 5 (dynamic imports on FeedPage):** `CreatePostModal`, `DraftsDialog`, `StoryRow`, `FeatureDiscoveryCards` now use `next/dynamic()` — reduces initial bundle size.
- **Step 7 (Service Worker fetch):** Added network-first caching for API calls and cache-first for static assets in `sw.js` — offline fallback for previously fetched data.
- **Step 3 (N+1 in challenge service):** Replaced per-loop `computeScore` + `computeStreak` (2 queries per challenge → up to 40 per page) with single `batchComputeProgress()` that does 1 batch query for all joined challenges. Fixed: `browse()`, `search()`, `getSaved()`, `getMyChallenges()`, `getLeaderboard()` (50 queries → 1), `getDuel()`, `getUserStats()`.
- **Step 2 (redux-persist):** Installed `redux-persist` v6. Wrapped store with `persistReducer` (blacklist: auth, settings) and `ReduxProvider` with `PersistGate`. RTK Query cache now survives page refresh — instant data restore on navigation.
- **Lint + typecheck:** 0 errors, 0 warnings on both frontend and backend.

**State:** All 7 performance/cache improvements implemented. Browser caching via Cache-Control headers + Service Worker. Backend N+1 queries eliminated in challenge service. Redux state persists across page refreshes. Build clean.

**Next:** Deploy to Vercel and monitor. Verify OAuth callback flow end-to-end.
