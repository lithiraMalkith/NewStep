---
name: admin-panel-builder
description: >
  Build production-grade admin panels with Next.js App Router, Firebase Auth + Firestore,
  RBAC permissions, GSAP animations, Tailwind dark theme, and full CRUD operations.
  Triggers on requests to create admin dashboards, admin pages, CRUD modules, role-based
  access control panels, order management, product management, inventory systems,
  customer management, or any back-office / internal tool UI.
---

# Admin Panel Builder — Master Skill

You are building a **premium dark-themed admin panel** using the CodeZela Admin Panel Architecture. This skill encodes every convention, pattern, and decision so that future admin panels are architecturally identical to the Lola Studio reference implementation.

> **Read `references/architecture.md` before writing any code.** It contains the full type system, API patterns, component anatomy, and file-by-file implementation guide.

---

## 1. Tech Stack (Non-Negotiable)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Auth | Firebase Auth + Custom Claims | firebase 12.x / firebase-admin 14.x |
| Database | Firebase Firestore (Admin SDK) | firebase-admin 14.x |
| Styling | Tailwind CSS v4 + custom `brand-*` tokens | tailwindcss 4.x |
| Animations | GSAP + `@gsap/react` (`useGSAP`) | gsap 3.x |
| Icons | Lucide React | lucide-react 1.x |
| Charts | Recharts | recharts 3.x |
| Validation | Zod | zod 4.x |
| Email | Resend | resend 6.x |
| Image Hosting | Cloudinary | cloudinary 2.x |
| Utilities | clsx, tailwind-merge | latest |

---

## 2. Design System — Brand Tokens

Every admin panel MUST use this dark-themed color palette. Define these in `tailwind.config.ts` under `theme.extend.colors.brand`:

```typescript
brand: {
  bg:             '#0D0D0D',    // Page background
  'bg-hover':     '#1A1A1A',
  surface:        '#161616',    // Cards, panels, sidebar
  'surface-hover':'#1E1E1E',
  border:         '#2A2A2A',    // Borders, dividers
  gold:           '#C9A84C',    // Primary accent (buttons, links, highlights)
  'gold-muted':   '#3D3D24',    // Active sidebar item background
  'gold-hover':   '#E2C270',
  muted:          '#6B6B6B',    // Secondary text
  text:           '#F0EDE8',    // Primary text
  danger:         '#E05252',    // Error / destructive actions
  success:        '#4CAF7D',    // Success states
}
```

### Fonts
- **Serif**: Used for brand logo in sidebar (`font-serif`)
- **Sans**: Inter / system sans for all body text (`font-sans`)
- **Mono**: Fira Code for order refs, SKUs, codes (`font-mono`)

### CSS Class Conventions
- Cards: `bg-brand-surface rounded-xl border border-brand-border p-6`
- Tables: `admin-table` class on `<table>`
- Form inputs: `form-input` class
- Status badges: `status-pending`, `status-processing`, `status-dispatched`, `status-delivered`, `status-cancelled`
- Buttons primary: `bg-brand-gold text-brand-bg rounded-lg hover:bg-brand-gold-hover`
- Buttons secondary: `bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-surface-hover`
- Card hover effect: `card-hover` class

---

## 3. Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Sidebar + top-bar shell (client component)
│   │   ├── page.tsx                # Dashboard with stats, charts, activity feed
│   │   ├── AdminNotifications.tsx  # Bell icon + pending orders dropdown
│   │   ├── [module]/
│   │   │   ├── page.tsx            # List view (table + search + filters)
│   │   │   ├── new/page.tsx        # Create form
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Detail / view page
│   │   │       └── edit/page.tsx   # Edit form (optional, or inline)
│   ├── api/
│   │   ├── [module]/
│   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   └── [id]/route.ts       # GET (single), PUT (update), PATCH (partial), DELETE
│   │   └── auth/
│   │       └── sync/route.ts       # POST — sync Firebase user role on login
│   ├── adminlogin/page.tsx         # Login page (email + Google OAuth)
│   └── layout.tsx                  # Root layout with AuthProvider
├── components/
│   ├── button.tsx                  # Reusable button
│   ├── modal.tsx                   # Reusable modal
│   └── storefront/                 # Customer-facing components (separate)
├── contexts/
│   ├── auth-context.tsx            # Firebase Auth context + role/permission resolution
│   └── cart-context.tsx            # (Storefront only)
├── lib/
│   ├── admin-client.ts             # Client-side API wrapper functions (fetchApi<T>)
│   ├── admin-service.ts            # Server-side Firestore service helpers
│   ├── auth-middleware.ts          # withAuth() wrapper for API routes
│   ├── firebase.ts                 # Client-side Firebase init
│   ├── firebase-admin.ts           # Server-side Firebase Admin init
│   ├── permissions.ts              # RBAC permission registry + built-in roles
│   ├── validations.ts              # Zod schemas for all entities
│   ├── utils.ts                    # cn(), formatPrice(), generateSKU(), slugify()
│   ├── gsap-config.ts              # GSAP plugin registration + animation presets
│   ├── email.ts                    # Resend email templates
│   └── cloudinary.ts               # Cloudinary config
└── types/
    └── index.ts                    # ALL TypeScript interfaces and type unions
```

---

## 4. Authentication Architecture

### Client Side (`contexts/auth-context.tsx`)
- Wrap app in `<AuthProvider>`.
- Use `onIdTokenChanged` to listen for auth state.
- Extract `role` from custom claims: `tokenResult.claims.role`.
- Resolve permissions via `BUILT_IN_ROLE_PERMISSIONS[role]`.
- Expose: `user`, `role`, `permissions`, `hasPermission(p)`, `isAdmin`, `signInWithEmail()`, `signInWithGoogle()`, `signOut()`.
- On login, call `POST /api/auth/sync` to sync custom claims.

### Server Side (`lib/auth-middleware.ts`)
- `withAuth(req, handler, requiredPermission?)` — verifies Firebase ID token, optionally checks permission.
- Superadmin bypasses ALL permission checks.
- Built-in roles checked against `BUILT_IN_ROLE_PERMISSIONS`.
- Custom roles fetched from Firestore `/roles/{roleId}`.
- Attach decoded token to `req.user`.

### Permission System (`lib/permissions.ts`)
- Permissions follow `module:action` format: `products:read`, `orders:write`, `categories:delete`
- Actions: `read`, `write`, `create`, `delete`
- Built-in roles: `superadmin` (all), `manager`, `fulfillment`, `support`
- Custom roles stored in Firestore with `permissions: string[]`
- `PERMISSION_GROUPS` for role editor UI

---

## 5. API Route Pattern

Every API route follows this exact structure:

```typescript
// GET /api/[module] — List all
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      // 1. Parse query params
      // 2. Build Firestore query
      // 3. Convert Firestore timestamps to ISO strings
      // 4. Return { success: true, data: [...] }
    } catch (error) {
      console.error('GET /api/[module] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
    }
  }, 'module:read') // Optional permission check
}

// POST /api/[module] — Create
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      // 1. Validate with Zod schema
      // 2. Build document
      // 3. Save to Firestore
      // 4. Return { success: true, data: createdEntity }
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to create' }, { status: 500 })
    }
  }, 'module:write')
}
```

### Response envelope — ALWAYS:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Human-readable message" }
```

### Client-side API wrapper (`lib/admin-client.ts`):
```typescript
async function fetchApi<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }
  const response = await fetch(path, { ...options, headers })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `API fetch failed: ${response.statusText}`)
  }
  return payload.data as T
}
```

---

## 6. Admin Page Anatomy

### List Page Pattern
Every list page (`/admin/[module]/page.tsx`) follows this structure:

```
'use client'
1. Import hooks: useState, useEffect, useRef
2. Import navigation: useRouter from next/navigation
3. Import animations: useGSAP from @gsap/react, gsap from @/lib/gsap-config
4. Import auth: useAuth from @/contexts/auth-context
5. Import API: fetch functions from @/lib/admin-client
6. Import utils: cn, formatPrice from @/lib/utils
7. Import icons: from lucide-react
8. Import types: from @/types

Component:
  - containerRef = useRef<HTMLDivElement>(null)
  - State: items[], search, filter, loading, modals
  - useEffect: load data with user.getIdToken()
  - useGSAP: animate .page-header and .item-row elements
  - Filter logic: client-side filtering
  - Render: header + filters + search + table + modals + toasts
```

### Key UI Patterns:
1. **Page Header**: Title + count + primary action button (e.g., "Add Product")
2. **Filter Tabs**: Horizontal pill buttons with active state using `bg-brand-gold/10 border-brand-gold/30 text-brand-gold`
3. **Search Bar**: `form-input pl-10` with Search icon absolutely positioned
4. **Data Table**: `admin-table` class, rows with hover states
5. **Action Menus**: 3-dot `MoreVertical` with dropdown (View / Edit / Delete)
6. **Delete Confirmation**: Modal overlay with `bg-black/60`, centered card
7. **Toast Notifications**: Fixed bottom-right, with success/error/info variants
8. **Empty States**: Icon + text centered in table cell

### Detail/View Page Pattern
- Back button with `ArrowLeft` icon
- Header: entity title + status badge
- Content grid: `grid grid-cols-1 lg:grid-cols-3 gap-6`
- Left column (2/3): main content cards
- Right column (1/3): metadata, status controls, actions
- Each section wrapped in: `form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4`

---

## 7. GSAP Animation Conventions

### Setup
```typescript
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
```

### List Page Animations
```typescript
useGSAP(() => {
  gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
  const rows = document.querySelectorAll('.item-row')
  if (rows.length > 0) {
    gsap.from('.item-row', { opacity: 0, y: 15, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2 })
  }
}, { scope: containerRef })
```

### Detail Page Animations
```typescript
useGSAP(() => {
  const sections = document.querySelectorAll('.form-section')
  if (sections.length > 0) {
    gsap.from('.form-section', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
  }
}, { scope: containerRef, dependencies: [loading] })
```

### Dashboard Animations (Multi-layered Timeline)
Use `gsap.timeline()` with staggered sequences for stat cards, charts, activity items, and quick actions.

---

## 8. Data Flow Pattern

```
User Action → Component State → API Client (fetchApi<T>) 
    → Next.js API Route → withAuth() middleware 
    → Firebase Admin SDK → Firestore
    → JSON Response { success, data } → Component State Update → Re-render
```

### Token Management
```typescript
const token = await user.getIdToken()
const data = await fetchSomething(token)
```

### Date Handling
- Firestore stores `Timestamp` objects
- API routes convert to ISO strings: `data.createdAt?.toDate?.()?.toISOString()`
- Client components convert back: `new Date(data.createdAt)`

---

## 9. Admin Layout Architecture

### Sidebar (`layout.tsx`)
- Collapsible (72px collapsed / 260px expanded)
- Mobile: slide-out with overlay
- Navigation items filtered by `hasPermission(item.permission)`
- Each item: `{ label, href, permission, icon }`
- Active state detection: exact match for `/admin`, prefix match for sub-routes
- User section: email + role display + sign out

### Top Bar
- Mobile menu toggle (hamburger)
- Notifications bell (`AdminNotifications` component)
- User avatar (first letter of email)
- Sticky with backdrop blur: `bg-brand-bg/80 backdrop-blur-md sticky top-0 z-30`

### Content Area
- GSAP page transition on pathname change
- `flex-1 p-6` container

---

## 10. Validation Pattern (Zod)

Define schemas in `lib/validations.ts`:

```typescript
export const entitySchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  // ... fields
})
export type EntityFormData = z.infer<typeof entitySchema>
```

Validate in API routes:
```typescript
const parsed = entitySchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json(
    { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
    { status: 400 }
  )
}
```

---

## 11. Notification System

### Toasts (In-page)
```typescript
interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string }

const addToast = (type: Toast['type'], message: string) => {
  const id = Math.random().toString(36).substr(2, 9)
  setToasts(prev => [...prev, { id, type, message }])
  setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
}
```

### Real-time Notifications (AdminNotifications)
- Poll every 30 seconds via `setInterval`
- Track seen activities with `useRef<Set<string>>`
- Play Web Audio API beep for new activities
- Use `react-hot-toast` for system-wide toasts
- Dropdown shows pending orders with click-to-navigate

---

## 12. Adding a New Module Checklist

When adding a new admin module (e.g., "Coupons"):

1. **Types**: Add interfaces to `src/types/index.ts`
2. **Validation**: Add Zod schema to `src/lib/validations.ts`
3. **Permissions**: Add `coupons:read`, `coupons:write`, `coupons:delete` to `src/lib/permissions.ts`
4. **API Routes**: Create `src/app/api/coupons/route.ts` (GET, POST) and `[id]/route.ts` (GET, PUT, PATCH, DELETE)
5. **Client API**: Add `fetchCoupons()`, `createCoupon()`, etc. to `src/lib/admin-client.ts`
6. **List Page**: Create `src/app/admin/coupons/page.tsx` following the List Page Pattern
7. **Detail Page**: Create `src/app/admin/coupons/[id]/page.tsx`
8. **Create Page**: Create `src/app/admin/coupons/new/page.tsx`
9. **Sidebar**: Add navigation item to `SIDEBAR_ITEMS` in `src/app/admin/layout.tsx`
10. **Roles**: Update `BUILT_IN_ROLE_PERMISSIONS` to grant appropriate access

---

## 13. Currency & Locale

- Currency: **LKR** (Sri Lankan Rupee)
- Locale: `en-LK`
- Format: `LKR 12,500.00` via `formatPrice()` utility
- Phone validation: Sri Lankan format `^(?:\+94|0)\d{9}$`
- Date format: `toLocaleDateString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })`

---

## 14. Critical Rules

1. **ALWAYS** use `'use client'` directive on admin pages (they use hooks, state, GSAP)
2. **NEVER** trust client-side prices — always re-fetch from Firestore in API routes
3. **ALWAYS** wrap API calls in try/catch with proper error responses
4. **ALWAYS** convert Firestore `Timestamp` to ISO string in API responses
5. **ALWAYS** filter sidebar items by permission
6. **ALWAYS** use the `fetchApi<T>` wrapper — never raw `fetch` in admin pages
7. **ALWAYS** show loading spinners during data fetches (use `Loader2` from lucide with `animate-spin`)
8. **ALWAYS** include empty state UI when lists are empty
9. **ALWAYS** use `containerRef` + `useGSAP` for entrance animations
10. **NEVER** use inline styles — use Tailwind classes with brand tokens
11. **ALWAYS** handle the case where `user` is null (redirect to login)
12. **ALWAYS** use `cn()` for conditional class merging (clsx + tailwind-merge)
