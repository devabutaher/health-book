# DESIGN.md — HealthBook Premium Design System v2.0

> AI Agent Instructions: This is the single source of truth for all UI decisions.
> Every component, animation, color, and spacing must follow this document exactly.
> Design philosophy: "Clean Energy" — premium, vibrant, trustworthy, health-focused.
> Default theme is DARK MODE. Light mode is secondary.

---

## 🎨 Core Design Philosophy

HealthBook sits at the intersection of **Instagram's smoothness**, **Apple Health's trustworthiness**, and **Linear's premium feel**.

- **Not** clinical and white (boring health app)
- **Not** overdone neon (cheap fitness app)
- **Yes** vibrant but refined, energetic but calm, premium but approachable

Every pixel should feel intentional. Every interaction should feel satisfying.

---

## 🌈 Color System

### Primary Palette
```css
:root {
  /* === BRAND GRADIENTS === */
  --gradient-primary:    linear-gradient(135deg, #0EA5E9 0%, #10B981 100%);  /* teal → green */
  --gradient-energy:     linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%);  /* indigo → teal */
  --gradient-warm:       linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);  /* amber → coral */
  --gradient-health:     linear-gradient(135deg, #10B981 0%, #84CC16 100%);  /* green → lime */
  --gradient-mood:       linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);  /* purple → pink */
  --gradient-mesh-1:     radial-gradient(at 40% 20%, #0EA5E920 0px, transparent 50%),
                         radial-gradient(at 80% 0%, #10B98115 0px, transparent 50%),
                         radial-gradient(at 0% 50%, #6366F110 0px, transparent 50%);

  /* === DARK MODE (DEFAULT) === */
  --bg-base:             #080C14;   /* near-black, OLED friendly */
  --bg-elevated:         #0D1117;   /* cards, modals */
  --bg-overlay:          #161B27;   /* hover surfaces */
  --bg-subtle:           #1C2333;   /* input backgrounds */
  --bg-glass:            rgba(13, 17, 23, 0.7);  /* frosted glass */
  --bg-glass-border:     rgba(255, 255, 255, 0.06);

  /* === BRAND COLORS === */
  --teal-400:            #2DD4BF;
  --teal-500:            #14B8A6;
  --green-400:           #4ADE80;
  --green-500:           #22C55E;
  --blue-400:            #38BDF8;
  --blue-500:            #0EA5E9;
  --indigo-400:          #818CF8;
  --coral-400:           #FB7185;
  --amber-400:           #FBBF24;
  --purple-400:          #C084FC;
  --lime-400:            #A3E635;

  /* === TEXT === */
  --text-primary:        #F1F5F9;   /* main text */
  --text-secondary:      #94A3B8;   /* subtext */
  --text-muted:          #475569;   /* placeholders, disabled */
  --text-inverse:        #0F172A;   /* text on light bg */

  /* === BORDERS === */
  --border-default:      rgba(255, 255, 255, 0.06);
  --border-subtle:       rgba(255, 255, 255, 0.03);
  --border-strong:       rgba(255, 255, 255, 0.12);
  --border-brand:        rgba(14, 165, 233, 0.4);

  /* === SEMANTIC === */
  --success:             #22C55E;
  --warning:             #F59E0B;
  --error:               #EF4444;
  --info:                #0EA5E9;

  /* === GLOW EFFECTS === */
  --glow-teal:           0 0 20px rgba(20, 184, 166, 0.3), 0 0 60px rgba(20, 184, 166, 0.1);
  --glow-green:          0 0 20px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1);
  --glow-blue:           0 0 20px rgba(14, 165, 233, 0.3), 0 0 60px rgba(14, 165, 233, 0.1);
  --glow-coral:          0 0 20px rgba(251, 113, 133, 0.3), 0 0 60px rgba(251, 113, 133, 0.1);
  --glow-purple:         0 0 20px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1);

  /* === SHADOWS === */
  --shadow-sm:           0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md:           0 4px 20px rgba(0, 0, 0, 0.5);
  --shadow-lg:           0 8px 40px rgba(0, 0, 0, 0.6);
  --shadow-card:         0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5);
}

/* === LIGHT MODE (secondary) === */
[data-theme="light"] {
  --bg-base:             #F8FAFC;
  --bg-elevated:         #FFFFFF;
  --bg-overlay:          #F1F5F9;
  --bg-subtle:           #E2E8F0;
  --bg-glass:            rgba(255, 255, 255, 0.8);
  --bg-glass-border:     rgba(0, 0, 0, 0.06);
  --text-primary:        #0F172A;
  --text-secondary:      #475569;
  --text-muted:          #94A3B8;
  --border-default:      rgba(0, 0, 0, 0.06);
  --border-subtle:       rgba(0, 0, 0, 0.03);
  --border-strong:       rgba(0, 0, 0, 0.12);
  --shadow-card:         0 1px 0 rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.08);
}
```

### Health Template Color Identities
```css
/* Each template has its own gradient + glow identity */
--template-routine:   linear-gradient(135deg, #0EA5E9, #06B6D4);  /* blue → cyan */
--template-goal:      linear-gradient(135deg, #F59E0B, #EF4444);  /* amber → coral */
--template-workout:   linear-gradient(135deg, #10B981, #84CC16);  /* green → lime */
--template-mood:      linear-gradient(135deg, #8B5CF6, #EC4899);  /* purple → pink */

--glow-routine:       0 0 30px rgba(14, 165, 233, 0.25);
--glow-goal:          0 0 30px rgba(245, 158, 11, 0.25);
--glow-workout:       0 0 30px rgba(16, 185, 129, 0.25);
--glow-mood:          0 0 30px rgba(139, 92, 246, 0.25);
```

### Mood Colors (5-level system)
```css
--mood-5-great:   #22C55E;   /* green */
--mood-4-good:    #84CC16;   /* lime */
--mood-3-okay:    #EAB308;   /* yellow */
--mood-2-low:     #F97316;   /* orange */
--mood-1-bad:     #EF4444;   /* red */
```

---

## 🔤 Typography System

```css
/* Fonts — import in layout.tsx */
/* Display: Bricolage Grotesque — bold, characterful headings */
/* Body: DM Sans — clean, modern, readable */
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

:root {
  --font-display: 'Bricolage Grotesque', sans-serif;
  --font-body:    'DM Sans', sans-serif;
}

/* Type Scale */
/* 2xs */ font-size: 0.625rem; /* 10px — badges, labels */
/* xs  */ font-size: 0.75rem;  /* 12px — timestamps, captions */
/* sm  */ font-size: 0.875rem; /* 14px — secondary text */
/* md  */ font-size: 1rem;     /* 16px — body text */
/* lg  */ font-size: 1.125rem; /* 18px — card titles */
/* xl  */ font-size: 1.25rem;  /* 20px — section headings */
/* 2xl */ font-size: 1.5rem;   /* 24px — page headings */
/* 3xl */ font-size: 1.875rem; /* 30px — feature headings */
/* 4xl */ font-size: 2.25rem;  /* 36px — hero text */
/* 5xl */ font-size: 3rem;     /* 48px — display text */
```

### Gradient Text (use on key headings)
```tsx
// className for gradient text
"bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent"

// For hero sections
"bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 bg-clip-text text-transparent"
```

---

## 📐 Spacing & Grid System

```
Base unit: 4px (Tailwind default)
8px grid: All major spacing uses multiples of 8

Spacing tokens:
  1  =  4px  — micro gaps
  2  =  8px  — tight spacing (between icon and label)
  3  = 12px  — compact spacing
  4  = 16px  — standard padding (card inner)
  5  = 20px  — comfortable spacing
  6  = 24px  — section padding
  8  = 32px  — between sections
  10 = 40px  — large section gap
  12 = 48px  — page sections
  16 = 64px  — hero padding

Page layout:
  Mobile:  max-width: 100%, px-4 (16px horizontal margin)
  Tablet:  max-width: 768px, centered
  Desktop: 3-column grid:
           Left sidebar:  240px (fixed)
           Center feed:   600px (max-width)
           Right sidebar: 320px (fixed)
```

---

## 🏗️ Component Library

### Glassmorphism Card (base card component)
```tsx
// Base glass card — use for all cards
className="
  relative overflow-hidden
  bg-[var(--bg-glass)]
  backdrop-blur-xl
  border border-[var(--bg-glass-border)]
  rounded-2xl
  shadow-[var(--shadow-card)]
  transition-all duration-300
  hover:border-[var(--border-strong)]
  hover:shadow-[var(--shadow-lg)]
"

// With noise texture overlay (add inside card)
<div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] pointer-events-none" />
```

### Navbar — Frosted Glass
```tsx
// Top navbar
className="
  fixed top-0 left-0 right-0 z-50
  bg-[var(--bg-glass)]
  backdrop-blur-2xl
  border-b border-[var(--bg-glass-border)]
  h-14 px-4
  flex items-center justify-between
"

// Logo — gradient text
<span className="font-display font-bold text-xl bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
  HealthBook
</span>

// Nav icon buttons
className="
  relative p-2.5 rounded-xl
  text-[var(--text-secondary)]
  hover:text-[var(--text-primary)]
  hover:bg-[var(--bg-overlay)]
  transition-all duration-200
  active:scale-95
"

// Notification badge
className="
  absolute -top-0.5 -right-0.5
  w-4 h-4 rounded-full
  bg-gradient-to-r from-coral-400 to-red-500
  text-white text-[10px] font-bold
  flex items-center justify-center
  animate-pulse
"
```

### Bottom Navigation (Mobile)
```tsx
// Container
className="
  fixed bottom-0 left-0 right-0 z-50
  bg-[var(--bg-glass)]
  backdrop-blur-2xl
  border-t border-[var(--bg-glass-border)]
  pb-safe  /* safe area inset */
  px-2 pt-2
  flex items-center justify-around
"

// Nav item — active state has pill indicator + gradient icon
// Active:
className="
  flex flex-col items-center gap-0.5
  relative px-4 py-1.5 rounded-2xl
  bg-gradient-to-r from-teal-500/20 to-green-500/20
  border border-teal-500/20
"
// Icon active: className="text-teal-400"
// Label active: className="text-[10px] font-semibold text-teal-400"

// Inactive:
className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl"
// Icon: className="text-[var(--text-muted)]"

// Center Create button — special
className="
  w-12 h-12 rounded-2xl
  bg-gradient-to-br from-teal-500 to-green-500
  flex items-center justify-center
  shadow-[var(--glow-teal)]
  active:scale-95 transition-transform duration-150
"
```

### Buttons — Full System
```tsx
// PRIMARY — gradient, glowing
className="
  inline-flex items-center justify-center gap-2
  px-5 py-2.5 rounded-xl
  bg-gradient-to-r from-teal-500 to-green-500
  text-white font-semibold text-sm
  shadow-[var(--glow-green)]
  hover:shadow-[0_0_30px_rgba(34,197,94,0.4),_0_0_80px_rgba(34,197,94,0.15)]
  hover:scale-[1.02]
  active:scale-[0.98]
  transition-all duration-200
  disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
"

// SECONDARY — glass
className="
  inline-flex items-center justify-center gap-2
  px-5 py-2.5 rounded-xl
  bg-[var(--bg-overlay)]
  border border-[var(--border-default)]
  text-[var(--text-primary)] font-semibold text-sm
  hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]
  active:scale-[0.98]
  transition-all duration-200
"

// GHOST — minimal
className="
  inline-flex items-center justify-center gap-2
  px-5 py-2.5 rounded-xl
  text-[var(--text-secondary)] font-medium text-sm
  hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]
  active:scale-[0.98]
  transition-all duration-200
"

// DANGER
className="
  inline-flex items-center justify-center gap-2
  px-5 py-2.5 rounded-xl
  bg-red-500/10 border border-red-500/20
  text-red-400 font-semibold text-sm
  hover:bg-red-500/20 hover:border-red-500/40
  active:scale-[0.98] transition-all duration-200
"

// FOLLOW button — morphing
// Unfollow state:
className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 text-white text-sm font-semibold"
// Following state (hover shows unfollow):
className="px-4 py-1.5 rounded-xl border border-[var(--border-strong)] text-[var(--text-secondary)] text-sm font-semibold hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"

// Loading state inside button
<Loader2 className="w-4 h-4 animate-spin" />
```

### Avatar Component
```tsx
// Standard avatar with ring
className="
  relative rounded-full
  ring-2 ring-[var(--bg-base)]
  ring-offset-0
"

// Online indicator dot
<span className="
  absolute bottom-0 right-0
  w-3 h-3 rounded-full
  bg-green-400
  ring-2 ring-[var(--bg-base)]
" />

// Premium avatar — gradient ring
className="
  relative rounded-full
  p-[2px]
  bg-gradient-to-br from-teal-400 to-green-400
"

// Story ring (has story) — animated gradient border
className="
  relative rounded-full p-[2px]
  bg-gradient-to-br from-blue-400 via-teal-400 to-green-400
  animate-[spin_3s_linear_infinite]
"
// Actual image wrapped in white ring inside
```

### Post Card
```tsx
// Container
className="
  relative overflow-hidden
  bg-[var(--bg-elevated)]
  border border-[var(--border-default)]
  rounded-2xl
  shadow-[var(--shadow-card)]
  mb-3
  hover:border-[var(--border-subtle)]
  transition-all duration-300
"

// Post header (avatar + name + time + menu)
className="flex items-center gap-3 p-4 pb-3"

// Post content text
className="px-4 pb-3 text-[var(--text-primary)] text-sm leading-relaxed"

// Image container — rounded corners, overflow hidden
className="mx-4 mb-3 rounded-xl overflow-hidden bg-[var(--bg-subtle)]"

// Action bar (reactions, comment, share)
className="
  flex items-center gap-1 px-3 py-2
  border-t border-[var(--border-subtle)]
"

// Reaction button
className="
  flex items-center gap-1.5 px-3 py-2 rounded-xl
  text-[var(--text-muted)] text-sm
  hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)]
  active:scale-95
  transition-all duration-150
"
// Active reaction: text-teal-400 bg-teal-500/10
```

### Health Template Cards
```tsx
// Base template card — border-left accent with glow
// ROUTINE
className="
  relative overflow-hidden rounded-2xl p-4
  bg-[var(--bg-elevated)]
  border border-blue-500/20
  shadow-[0_0_30px_rgba(14,165,233,0.08)]
"
// Left accent bar:
<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-l-2xl" />

// WORKOUT
// border-green-500/20, shadow uses --glow-workout
// Left bar: from-green-400 to-lime-500

// MOOD
// border-purple-500/20, shadow uses --glow-mood
// Left bar: from-purple-400 to-pink-500

// GOAL
// border-amber-500/20, shadow uses amber glow
// Left bar: from-amber-400 to-coral-500

// Template type badge (top right)
className="
  inline-flex items-center gap-1.5
  px-2.5 py-1 rounded-lg text-xs font-semibold
  bg-gradient-to-r [from-color] [to-color]
  text-white
"
```

### Input Fields
```tsx
// Standard input
className="
  w-full px-4 py-3 rounded-xl
  bg-[var(--bg-subtle)]
  border border-[var(--border-default)]
  text-[var(--text-primary)] text-sm
  placeholder:text-[var(--text-muted)]
  focus:outline-none
  focus:border-teal-500/50
  focus:ring-2 focus:ring-teal-500/10
  focus:bg-[var(--bg-overlay)]
  transition-all duration-200
"

// Textarea
className="
  ... (same as input)
  resize-none
  min-h-[80px]
"

// Character count
className="text-xs text-[var(--text-muted)] text-right mt-1"
// Near limit (>80%): text-amber-400
// At limit: text-red-400

// Error state
className="border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"

// Error message
className="flex items-center gap-1 text-xs text-red-400 mt-1"
```

### My Book — Stat Cards
```tsx
// Stat card with gradient background
className="
  relative overflow-hidden rounded-2xl p-5
  bg-gradient-to-br from-teal-500/10 to-green-500/5
  border border-teal-500/15
"
// Icon container: bg-gradient-to-br from-teal-500 to-green-500, rounded-xl p-2.5
// Value: font-display font-bold text-3xl text-[var(--text-primary)]
// Label: text-sm text-[var(--text-secondary)]

// Health Score — circular progress ring
// Use SVG with stroke-dasharray animation
// Ring color: gradient from teal to green
// Score number: font-display font-bold text-4xl, gradient text

// Streak display
className="flex items-center gap-2"
// Fire emoji animated: animate-bounce (only on milestone days)
// Number: font-display font-bold text-2xl text-amber-400
```

### Notifications
```tsx
// Notification item — color coded by type
// NEW_FOLLOWER: left border teal
// POST_REACTION: left border coral
// COMMENT: left border blue
// STREAK_MILESTONE: left border amber + bg glow

className="
  relative flex items-start gap-3 px-4 py-3
  hover:bg-[var(--bg-overlay)]
  transition-colors duration-150
  cursor-pointer
"
// Unread dot:
className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400"

// Type-specific left accent:
className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[type-color]"
```

### Badges & Tags
```tsx
// Verified badge (blue tick)
className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500"
// Checkmark icon white, size 10px

// Premium badge
className="
  inline-flex items-center gap-1 px-2 py-0.5
  rounded-full text-xs font-semibold
  bg-gradient-to-r from-amber-400 to-orange-500
  text-white
"

// Hashtag pill
className="
  inline-flex px-2.5 py-1 rounded-lg text-xs font-medium
  bg-teal-500/10 text-teal-400
  hover:bg-teal-500/20 transition-colors
  cursor-pointer
"

// Streak badge
className="
  inline-flex items-center gap-1 px-2.5 py-1
  rounded-full text-xs font-bold
  bg-amber-500/10 text-amber-400
  border border-amber-500/20
"
```

---

## ✨ Animation System (Framer Motion)

### Core Principles
```
1. Only animate: transform, opacity, filter — NEVER height, width, margin, padding
2. Duration sweet spots:
   - Micro (button press, icon):    100–150ms
   - Element (card, modal open):    200–300ms
   - Page transition:               300–400ms
   - Celebration (streak, badge):   600–800ms
3. Easing:
   - Entering:  ease-out (starts fast, slows down)
   - Exiting:   ease-in  (starts slow, speeds up)
   - Spring:    stiffness 300, damping 30 (for natural feel)
4. always set will-change: transform on animated elements
5. Wrap lists in AnimatePresence for mount/unmount
```

### Standard Variants (reusable)
```tsx
// variants/index.ts — import these everywhere

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } }
}

export const slideUp = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit:    { opacity: 0, y: "100%", transition: { duration: 0.2, ease: "easeIn" } }
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
}
```

### Page Transitions
```tsx
// app/(main)/layout.tsx — wrap page content
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Feed — Staggered Load
```tsx
// Feed posts stagger in on load
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {posts.map((post) => (
    <motion.div key={post.id} variants={staggerItem}>
      <PostCard post={post} />
    </motion.div>
  ))}
</motion.div>
```

### Modal / Bottom Sheet
```tsx
// Backdrop
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
  onClick={onClose}
/>

// Modal (desktop — scale in)
<motion.div
  variants={scaleIn}
  initial="initial" animate="animate" exit="exit"
  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
/>

// Bottom sheet (mobile — slide up)
<motion.div
  variants={slideUp}
  initial="initial" animate="animate" exit="exit"
  className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pb-safe"
/>
```

### Reaction Button — Pop Animation
```tsx
// When user reacts
<motion.button
  whileTap={{ scale: 1.3 }}
  transition={{ type: "spring", stiffness: 500, damping: 15 }}
>
  <motion.span
    animate={isActive ? {
      scale: [1, 1.4, 0.9, 1.1, 1],
      rotate: [0, -10, 10, -5, 0]
    } : { scale: 1 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {icon}
  </motion.span>
</motion.button>
```

### Follow Button — Morphing
```tsx
<motion.button
  layout
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
>
  <AnimatePresence mode="wait">
    <motion.span
      key={isFollowing ? "following" : "follow"}
      variants={fadeIn}
      initial="initial" animate="animate" exit="exit"
    >
      {isFollowing ? "Following" : "Follow"}
    </motion.span>
  </AnimatePresence>
</motion.button>
```

### Streak Milestone — Celebration
```tsx
// Full screen overlay on streak achievement (7, 30, 100 days)
// 1. Show confetti (use canvas-confetti library)
// 2. Badge scales in with spring
// 3. Streak number counts up (useMotionValue + useSpring)

<motion.div
  initial={{ scale: 0, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
>
  <BadgeDisplay />
</motion.div>

// Number count up
const count = useMotionValue(0)
const springCount = useSpring(count, { stiffness: 100, damping: 30 })
useEffect(() => { count.set(streakDays) }, [streakDays])
```

### Health Score — Animated Ring
```tsx
// SVG circle with stroke-dasharray
// On mount: animate from 0 to score value
<motion.circle
  strokeDasharray={circumference}
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
/>
```

### Pull-to-Refresh — Heartbeat
```tsx
// Custom pull-to-refresh indicator
// Shows heartbeat ECG line animation while refreshing
// Use Framer Motion path drawing animation on SVG path
<motion.path
  d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50"
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
  stroke="url(#gradient-teal-green)"
  strokeWidth={2}
  fill="none"
/>
```

### Shared Element Transitions (layoutId)
```tsx
// Post card → Post detail page
// Card image gets layoutId="post-image-{id}"
// Detail page image gets same layoutId → smooth expansion

// Profile avatar → Story viewer
// Avatar gets layoutId="avatar-{userId}"
// Story header gets same layoutId → smooth zoom in
```

---

## 🔊 Sound Effects System

```tsx
// hooks/useSound.ts — COMPLETE IMPLEMENTATION
import { useCallback, useRef } from "react"
import { useSelector } from "react-redux"

type SoundKey =
  | "post-publish"
  | "reaction"
  | "message-send"
  | "message-receive"
  | "streak-milestone"
  | "badge-earned"
  | "follow"
  | "error"
  | "success"

const SOUNDS: Record<SoundKey, { src: string; volume: number }> = {
  "post-publish":      { src: "/sounds/post-publish.mp3",      volume: 0.4 },
  "reaction":          { src: "/sounds/reaction.mp3",          volume: 0.3 },
  "message-send":      { src: "/sounds/message-send.mp3",      volume: 0.3 },
  "message-receive":   { src: "/sounds/message-receive.mp3",   volume: 0.35 },
  "streak-milestone":  { src: "/sounds/streak-milestone.mp3",  volume: 0.5 },
  "badge-earned":      { src: "/sounds/badge-earned.mp3",      volume: 0.5 },
  "follow":            { src: "/sounds/follow.mp3",            volume: 0.3 },
  "error":             { src: "/sounds/error.mp3",             volume: 0.25 },
  "success":           { src: "/sounds/success.mp3",           volume: 0.3 },
}

export const useSound = () => {
  const soundEnabled = useSelector((s: RootState) => s.settings.soundEnabled)
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  const play = useCallback((key: SoundKey) => {
    if (!soundEnabled) return
    if (typeof window === "undefined") return

    try {
      let audio = audioCache.current.get(key)
      if (!audio) {
        audio = new Audio(SOUNDS[key].src)
        audio.volume = SOUNDS[key].volume
        audioCache.current.set(key, audio)
      }
      // Reset and play (handles rapid repeated plays)
      audio.currentTime = 0
      audio.play().catch(() => {}) // Silently catch autoplay policy errors
    } catch {
      // Never crash on sound failure
    }
  }, [soundEnabled])

  return { play }
}

// Usage in any component:
const { play } = useSound()
const handlePublish = async () => {
  await createPost(data)
  play("post-publish")
  toast.success("Post shared!")
}
```

**Sound files needed** (place in `frontend/public/sounds/`):
```
post-publish.mp3      — soft satisfying "whoosh" + subtle chime
reaction.mp3          — gentle "ding" (like a soft bell)
message-send.mp3      — subtle "pop" (like a bubble)
message-receive.mp3   — soft notification chime (2 notes)
streak-milestone.mp3  — celebratory short fanfare (1–2 sec)
badge-earned.mp3      — achievement unlock sound (triumphant, short)
follow.mp3            — warm connection sound (soft chord)
error.mp3             — gentle low tone (not jarring)
success.mp3           — quick positive tone
```
**Sound rules:**
- OFF by default — user enables in Settings → Preferences
- Store preference in Redux + localStorage
- Max volume: 0.5 — never jarring
- Never play without prior user interaction (browser policy)
- Preload sounds on first user interaction event

---

## ⏳ Loading States — Skeleton System

```tsx
// Skeleton base — shimmer effect
className="
  relative overflow-hidden
  bg-[var(--bg-subtle)] rounded-lg
  before:absolute before:inset-0
  before:-translate-x-full
  before:animate-[shimmer_1.5s_infinite]
  before:bg-gradient-to-r
  before:from-transparent
  before:via-white/5
  before:to-transparent
"
// Add to tailwind.config: keyframes: { shimmer: { '100%': { transform: 'translateX(100%)' } } }

// PostSkeleton — show 3 while feed loads
const PostSkeleton = () => (
  <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-4 mb-3">
    <div className="flex gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
    <Skeleton className="h-44 w-full rounded-xl mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-3/4 rounded-md" />
    </div>
    <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
      <Skeleton className="h-8 w-20 rounded-xl" />
      <Skeleton className="h-8 w-20 rounded-xl" />
      <Skeleton className="h-8 w-20 rounded-xl" />
    </div>
  </div>
)

// ProfileSkeleton
// StatCardSkeleton (4 per row)
// MessageSkeleton
// NotificationSkeleton
// ChartSkeleton
// GridSkeleton (explore page — 3×N grid of squares)
```

**Loading rules:**
- ALWAYS skeleton, NEVER blank screen
- NEVER full-page spinner for partial loads
- Button loading state: spinner inside button + disabled
- Images: `next/image` with `placeholder="blur"` always
- Stagger skeleton items with 50ms delay for natural feel

---

## ❌ Error States

```tsx
// Empty state — no content
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div variants={fadeUp} initial="initial" animate="animate"
    className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-3xl bg-[var(--bg-subtle)] border border-[var(--border-default)]
      flex items-center justify-center mb-6 shadow-[var(--shadow-md)]">
      <Icon className="w-9 h-9 text-[var(--text-muted)]" />
    </div>
    <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">{title}</h3>
    <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">{description}</p>
    {action}
  </motion.div>
)

// Network error / fetch failed
const ErrorState = ({ onRetry }) => (
  <div className="text-center py-10 px-6">
    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20
      flex items-center justify-center mx-auto mb-4">
      <WifiOff className="w-6 h-6 text-red-400" />
    </div>
    <p className="text-[var(--text-secondary)] text-sm mb-4">
      Something went wrong. Check your connection.
    </p>
    <button onClick={onRetry} className="[secondary button styles]">
      Try again
    </button>
  </div>
)
```

---

## 🍞 Toast System (Sonner)

```tsx
// globals.css or layout — Sonner theme config
<Toaster
  theme="dark"
  position="bottom-center"
  toastOptions={{
    style: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
      borderRadius: '14px',
      backdropFilter: 'blur(20px)',
    },
  }}
/>

// Usage
toast.success("Post shared!", { duration: 3000 })
toast.error("Failed to load. Please try again.", { duration: 5000 })
toast.info("🔥 Streak at risk! Log today's routine.")
toast("🏆 7-day streak achieved!", {
  description: "You're on a roll! Keep going.",
  duration: 5000,
  icon: "🎉",
})

// With promise (async actions)
toast.promise(publishPost(), {
  loading: "Sharing your post...",
  success: "Post shared with your followers!",
  error: "Failed to share. Try again.",
})
```

---

## 📱 Responsiveness Rules

```
Design order: Mobile → Tablet → Desktop (ALWAYS)

Mobile (< 640px):
  - Single column
  - Bottom navigation (fixed)
  - Full-width cards (mx-4)
  - Modals → bottom sheets
  - Touch targets: minimum 44×44px (NO exceptions)
  - Font sizes slightly smaller (text-sm for body)
  - Compressed stats (2×2 grid)

Tablet (640px – 1024px):
  - Top navigation (no bottom nav)
  - Feed max-width: 560px, centered
  - Side panels as drawers/overlays

Desktop (> 1024px):
  - 3-column layout
  - Left sidebar: 240px fixed
  - Center: max-w-[600px]
  - Right sidebar: 320px (suggestions, trending)
  - Hover states active
  - Keyboard shortcuts

Safe area insets (iOS notch/home bar):
  pt-safe = padding-top: env(safe-area-inset-top)
  pb-safe = padding-bottom: env(safe-area-inset-bottom)
  Apply to: bottom nav, top nav, modals
```

---

## ⚡ Performance Rules (No Glitch, No Lag)

```
Animation performance:
  ✅ Only animate: transform, opacity, filter, backdropFilter
  ❌ Never animate: height, width, top, left, margin, padding, border-radius (on large elements)
  ✅ Use will-change: transform on elements before they animate
  ✅ Use GPU-accelerated properties (transform3d trick if needed)
  ✅ Framer Motion's layout prop for smooth height changes (not animating height directly)

Bundle performance:
  ✅ Dynamic import heavy components (charts, editors, video player)
  ✅ next/image for all images (auto optimization, lazy load, blur placeholder)
  ✅ next/dynamic for below-fold components
  ✅ Code split by route (App Router does this automatically)

List performance:
  ✅ react-virtual for lists > 50 items (feed, notifications, messages)
  ✅ Memoize PostCard with React.memo
  ✅ useMemo for expensive feed calculations
  ✅ Debounce search input (300ms)
  ✅ Throttle scroll events (16ms = 60fps)

Image performance:
  ✅ Always specify width + height on next/image
  ✅ priority={true} only for above-fold images (first 2 feed posts)
  ✅ sizes prop for responsive images

CSS performance:
  ✅ backdrop-blur only on fixed/sticky elements (not every card)
  ✅ Reduce backdrop-blur on mobile if performance issues detected
  ✅ No box-shadow with high blur radius on lists (use border instead)

Reduced motion:
  // Wrap all animations
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Framer Motion handles this automatically with reducedMotion prop on MotionConfig
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
```

---

## ♿ Accessibility

```
Color contrast:
  - Body text on dark bg: minimum 4.5:1 ratio
  - Large text (>24px): minimum 3:1 ratio
  - Interactive elements: minimum 3:1 vs adjacent colors
  - Never rely on color alone to convey meaning

Touch targets:
  - Minimum 44×44px for ALL interactive elements
  - Add padding if visual size is smaller
  - Use className="p-2" on small icon buttons to expand hit area

Focus management:
  - Never outline-none without visible replacement
  - Focus ring: className="focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
  - Trap focus inside modals (Radix UI handles this automatically)
  - Return focus to trigger on modal close

ARIA:
  - Icon-only buttons: aria-label="[action]"
  - Loading states: aria-busy="true" + aria-live="polite"
  - Images: alt="" for decorative, descriptive for informational
  - Dynamic content: aria-live="polite" (notifications, errors)

Semantic HTML:
  - <nav> for navigation
  - <main> for main content
  - <aside> for sidebars
  - <article> for post cards
  - <button> not <div onClick>
  - Heading hierarchy: one h1 per page, logical h2→h3 nesting
```

---

## 🌐 Content-Aware States

```
Long content rules:
  Name:      max 1 line, truncate with ellipsis (line-clamp-1)
  Bio:       max 3 lines on profile card (line-clamp-3)
  Post text: max 5 lines in feed (line-clamp-5), "See more" link
  Message:   full text always visible, no truncation
  Username:  always fit — use text-xs if very long
  Numbers:   1,000 → 1K | 1,000,000 → 1M (format in lib/utils.ts)

Zero state (brand new user):
  Feed:          Onboarding card + suggested users + trending posts
  My Book:       "Log your first health entry" CTA with template picker
  Messages:      "Start a conversation" with search for users
  Notifications: "Follow people to see activity here"
  Profile:       "Add your bio" + "Share your first post" prompts

No results (search):
  Icon + "No results for '[query]'" + "Try different keywords"

Offline state:
  Toast: "You're offline. Some features may not work."
  Cache: Show stale feed data from RTK Query cache
  Queue: Queue post/reactions for sync when back online
```

---

## 🏷️ Interaction States — 5 States Per Element

```
Every interactive element must have ALL 5 states:

1. DEFAULT   — base appearance
2. HOVER     — mouse over (desktop only — use @media hover: hover)
3. ACTIVE    — mouse/finger press (scale-95 or scale-[0.98])
4. LOADING   — async operation in progress (spinner, disabled, reduced opacity)
5. DISABLED  — not interactive (opacity-40, cursor-not-allowed, no hover effects)

Button example:
  Default:  bg-gradient-to-r from-teal-500 to-green-500
  Hover:    shadow increases, scale-[1.02]
  Active:   scale-[0.98], shadow reduces
  Loading:  opacity-80, spinner inside, pointer-events-none
  Disabled: opacity-40, cursor-not-allowed, no transform
```

---

## 🎮 Gamification UI

```tsx
// XP Progress bar on profile
<div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
  <motion.div
    className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full"
    initial={{ width: 0 }}
    animate={{ width: `${xpPercent}%` }}
    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
  />
</div>

// Badge display — glowing, animated on earn
<motion.div
  className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
  style={{
    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    boxShadow: '0 0 20px rgba(245,158,11,0.4), 0 0 60px rgba(245,158,11,0.15)'
  }}
  whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <span className="text-3xl">{badge.emoji}</span>
  {badge.isNew && (
    <motion.div
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral-400"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    />
  )}
</motion.div>

// Leaderboard rank change
// +1 rank: green arrow up with slide-in animation
// -1 rank: red arrow down
// Same: gray dash
```

---

## 🖥️ Major Page Layouts

### Feed Page
```
[Navbar — frosted glass, fixed top]
[Left sidebar — hidden mobile, fixed desktop]
  - Nav links with active gradient pill
  - Create post button (gradient)
  - My streak mini widget (fire + number)
[Center feed — max-w-600px]
  - Stories row (horizontal scroll)
  - Create post card (avatar + "What's on your health journey?")
  - Posts (stagger load animation)
  - Infinite scroll trigger
[Right sidebar — hidden mobile, fixed desktop]
  - Health score widget (circular ring)
  - Trending hashtags card
  - Suggested users card (3 users, Follow buttons)
[Bottom nav — mobile only, frosted glass]
```

### Profile Page
```
[Cover photo — gradient if none, Cloudinary if set]
[Avatar — overlapping cover, gradient ring if premium]
[Name + verified badge + username]
[Bio]
[Stats row: Posts | Followers | Following]
[Follow / Edit Profile button]
[Health streaks row: 🔥 14 days | 💪 48 workouts]
[Tabs: Posts | Health Logs | Saved]
[Tab content: grid (photos) or list (health logs)]
```

### My Book Dashboard
```
[Health Score — large circular ring, center]
[Streak card — fire animation, milestone progress]
[4 stat cards: Total Logs | Best Streak | This Week | Goals Hit]
[Activity calendar — GitHub-style heatmap, colored by completion]
[Charts row:
  - Calorie trend (line chart — teal)
  - Mood trend (area chart — purple)
  - Workout frequency (bar chart — green)
]
[Log type breakdown (donut chart)]
[Recent logs list (last 7 entries)]
```

### Messaging
```
[Conversation list — left panel (desktop), full screen (mobile)]
  - Search input
  - Conversation items: avatar, name, last message, time, unread count
[Chat panel — right panel (desktop), full screen (mobile)]
  - Chat header: avatar + name + online status + video call button
  - Messages: bubbles (own: teal gradient right, other: glass left)
  - Typing indicator: 3 animated dots
  - Input bar: attach, text, emoji, send button
```