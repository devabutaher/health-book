# SECURITY.md — HealthBook Security & Auth Guide

> Every developer and AI agent must follow these rules.
> Security is non-negotiable — health data is sensitive.

---

## 🔐 Authentication Flow

HealthBook uses **Supabase Auth** for identity + **custom JWT** for Express API authorization.

### Registration Flow
```
1. User fills register form (name, email, password)
2. Frontend → POST /api/auth/register (Express)
3. Express → Supabase Auth: createUser(email, password)
4. Supabase creates auth.users record + sends verification email
5. Express → Prisma: create User profile in public.users
6. Express returns { success: true, message: "Check your email" }
7. User clicks email link → Supabase verifies
8. User redirected to login
```

### Login Flow
```
1. User submits email + password
2. Frontend → POST /api/auth/login (Express)
3. Express → Supabase Auth: signInWithPassword(email, password)
4. Supabase returns { access_token, refresh_token, user }
5. Express returns tokens to frontend
6. Frontend stores:
   - access_token  → memory only (Redux state)
   - refresh_token → httpOnly cookie (set by Express)
7. Redux authSlice stores { user, isAuthenticated: true }
```

### Token Storage Rules
```
✅ access_token  → Redux state (memory) only — NEVER localStorage
✅ refresh_token → httpOnly cookie (Express sets it, JS cannot read it)
❌ NEVER store tokens in localStorage or sessionStorage
❌ NEVER store tokens in React state that persists to localStorage
```

### Token Refresh Flow
```
1. RTK Query detects 401 response
2. baseQuery triggers re-auth:
   - Sends refresh_token cookie to POST /api/auth/refresh
   - Express verifies with Supabase
   - Returns new access_token
3. Redux updates access_token in memory
4. Original request retried with new token
5. If refresh also fails → logout user, redirect to /login
```

### Logout Flow
```
1. Frontend dispatches logout action
2. POST /api/auth/logout (Express)
3. Express → Supabase Auth: signOut()
4. Express clears httpOnly refresh cookie
5. Redux clears auth state
6. Redirect to /login
```

---

## 🛡️ Express Middleware Stack

**Order matters — apply in this exact sequence:**

```typescript
// server.ts
app.use(helmet())           // 1. Security headers
app.use(cors(corsOptions))  // 2. CORS
app.use(express.json())     // 3. Body parsing
app.use(rateLimiter)        // 4. Rate limiting
app.use(requestLogger)      // 5. Logging (after rate limit)
// Routes below
app.use("/api/auth", authRoutes)           // Public
app.use("/api/posts", authenticate, postRoutes)    // Protected
app.use("/api/admin", authenticate, requireAdmin, adminRoutes) // Admin only
app.use(errorHandler)       // Last — global error handler
```

### authenticate Middleware
```typescript
// middleware/authenticate.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1]
  if (!token) return res.status(401).json({ success: false, message: "No token provided" })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ success: false, message: "Invalid token" })

  // Attach user to request
  req.user = { id: data.user.id, email: data.user.email }
  next()
}
```

### requireAdmin Middleware
```typescript
export const requireAdmin = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true }
  })
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access required" })
  }
  next()
}
```

---

## 🚦 Rate Limiting

```typescript
import rateLimit from "express-rate-limit"

// General API — 100 requests per 15 minutes per IP
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, slow down." }
})

// Auth endpoints — stricter (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // Only 10 login attempts per 15 min
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." }
})

// Post creation — prevent spam
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,  // Max 20 posts per hour
})
```

Apply specifically:
```typescript
app.use("/api/auth/login", authLimiter)
app.use("/api/auth/register", authLimiter)
app.use("/api/posts", postLimiter)
```

---

## 🗄️ Supabase Row Level Security (RLS)

Enable RLS on ALL tables. Never disable it.

### Users Table
```sql
-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Posts Table
```sql
-- Public posts visible to all
CREATE POLICY "Public posts viewable" ON posts
  FOR SELECT USING (privacy = 'PUBLIC' OR user_id = auth.uid());

-- Only owner can insert
CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only owner can update/delete
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users delete own posts" ON posts
  FOR DELETE USING (user_id = auth.uid());
```

### Health Logs Table (sensitive — private by default)
```sql
-- Health logs are PRIVATE — only owner can see
CREATE POLICY "Health logs are private" ON health_logs
  FOR ALL USING (user_id = auth.uid());
```

### Messages Table
```sql
-- Only sender or recipient can read messages
CREATE POLICY "Conversation participants only" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

-- Only sender can insert
CREATE POLICY "Users send own messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
```

---

## 🔒 Input Validation (Zod)

**Validate ALL incoming data before processing. No exceptions.**

```typescript
// backend/src/validators/post.validator.ts
import { z } from "zod"

export const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  privacy: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).default("PUBLIC"),
  templateType: z.enum(["ROUTINE", "GOAL", "WORKOUT", "MOOD"]).optional(),
})

// In controller:
const result = createPostSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: result.error.flatten()
  })
}
const data = result.data // ← fully typed and safe
```

---

## 🔑 Password & Credential Rules

- Passwords handled entirely by Supabase Auth — never stored in our DB
- Minimum password length: 8 characters (enforce on frontend + Supabase config)
- 2FA: optional for all users, mandatory for Admin accounts
- JWT_SECRET: minimum 64 characters, random, never committed to git

---

## 🌐 CORS Configuration

```typescript
// backend/src/config/cors.ts
const allowedOrigins = [
  "http://localhost:3000",
  "https://healthbook.vercel.app",  // production frontend
]

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("CORS not allowed"))
    }
  },
  credentials: true,  // Required for httpOnly cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}
```

---

## 🛑 Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "res.cloudinary.com", "*.supabase.co"],
      mediaSrc: ["'self'", "res.cloudinary.com"],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}))
```

---

## 📁 File Upload Security

All uploads go through **Cloudinary** — never store files locally on the server.

```typescript
// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

// Always validate on backend before uploading to Cloudinary
if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
  return res.status(400).json({ success: false, message: "File type not allowed" })
}
```

---

## 🚨 Error Handling — Don't Leak Info

```typescript
// ❌ Bad — exposes internal details
res.status(500).json({ error: err.message, stack: err.stack })

// ✅ Good — generic message to client, full details in logs only
console.error("[ERROR]", err)  // Log internally
res.status(500).json({ success: false, message: "Something went wrong. Please try again." })
```

### AppError — Business Logic Errors with Proper HTTP Status

Use `AppError` in services to return correct HTTP status codes instead of generic 500s:

```typescript
// utils/AppError.ts
export class AppError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

// Usage in services:
throw new AppError(404, "Group not found")
throw new AppError(403, "Only admins can perform this action")
throw new AppError(409, "Already a member of this group")
```

### Global Error Handler

```typescript
// middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message })
  }
  if (err.name === "ZodError") {
    return res.status(400).json({ success: false, message: "Validation failed", errors: err.flatten() })
  }
  if (err.code === "P2002") {  // Prisma unique constraint
    return res.status(409).json({ success: false, message: "Already exists" })
  }
  if (err.code === "P2025") {  // Prisma not found
    return res.status(404).json({ success: false, message: "Not found" })
  }

  res.status(500).json({ success: false, message: "Internal server error" })
}
```

---

## 👥 Group Access Control

Groups have three visibility types with different access rules:

### Group Types & Access
| Type | Browse | View Details | View Feed | Join |
|---|---|---|---|---|
| PUBLIC | Anyone | Anyone | Members | Anyone (one-click) |
| PRIVATE | Anyone | Anyone | Members | Request + admin approval |
| SECRET | Not listed | Members only | Members | Invite only |

### Backend Enforcement (in `group.service.ts`)
```typescript
// SECRET groups are hidden from browse/search results
if (group.type === "SECRET" && !isMember) {
  throw new AppError(404, "Group not found")  // Pretend it doesn't exist
}

// Private group details are accessible but join requires approval
if (group.type === "PRIVATE" && !isMember) {
  // Return basic info but deny member list and feed
  return sanitizedGroup
}

// Only admins can modify groups
if (member?.role !== "ADMIN" && member?.role !== "MODERATOR") {
  throw new AppError(403, "Only admins can do this")
}
```

### Join Request Flow (Private Groups)
1. User sends `POST /groups/:id/join-requests`
2. Admin reviews via `GET /groups/:id/join-requests`
3. Admin approves/rejects via `PUT /groups/:id/join-requests/:userId/approve|reject`
4. Only one pending request allowed per user per group (unique constraint)

### Invite Flow (Secret Groups)
1. Admin sends `POST /groups/:id/invite`
2. Recipient sees invites via `GET /groups/my/invites`
3. Recipient accepts/declines via `PUT /groups/invites/:inviteId/accept|decline`

---

## 🧹 Security Checklist Before Each Deploy

- [ ] No `.env` files committed to git (check `.gitignore`)
- [ ] All new routes have `authenticate` middleware
- [ ] All admin routes have `requireAdmin` middleware
- [ ] New Supabase tables have RLS policies enabled
- [ ] New inputs validated with Zod schemas
- [ ] No `console.log` with sensitive data in production
- [ ] Dependencies updated (`npm audit`)
