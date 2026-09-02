# New Step Footwear — Full Enhancement Implementation Plan

> **Developer**: Lithira Gunasekara | **Group**: C  
> **Stack**: Next.js 15 (App Router) · Firebase Auth + Firestore · Tailwind CSS v4 · GSAP · Recharts · Zod

This plan covers all 4 items from the Quality Checking Document. The changes are grouped into **4 phases** that can be executed sequentially, with each phase building on the previous.

---

## User Review Required

> [!IMPORTANT]
> **Product Data Strategy**: Item 3 requests adding more products. The current product catalog is **hardcoded** in [`products.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/products.ts) (8 products). The admin panel already supports adding products via Firestore. I propose:
> - Adding **20+ new products** directly to the `products.ts` static file (since the storefront reads from it)
> - Updating the seed route to sync them to Firestore
> - Generating product images via AI image generation for realistic visuals
> 
> **Alternative**: Should products be fetched from Firestore on the storefront too? This would require refactoring the storefront from static to dynamic data, which is a larger change.

> [!WARNING]
> **Swiper/Carousel Library**: The home page redesign requests carousels with swipe support. I plan to implement a **custom carousel using GSAP** (already a dependency) rather than adding a new library like Swiper. This keeps the bundle smaller and consistent with the existing animation system. Confirm if you'd prefer a third-party carousel library instead.

> [!IMPORTANT]
> **Discounts & Promotions Module**: The admin panel request includes a "Discounts & Promotions" section. This requires a full coupon/promo code system with:
> - Discount codes stored in Firestore
> - Validation at checkout
> - Admin CRUD for managing codes
> 
> This is a significant feature. Should I include it in this plan or defer it to a follow-up?

---

## Open Questions

1. **Review Moderation Default**: Should new reviews be auto-approved or require admin moderation before appearing on product pages? I'll default to **auto-approved** unless you prefer moderation.

2. **Wishlist**: Item 3 mentions "added to the wishlist" but there's currently no wishlist feature. Should I add a basic wishlist (localStorage-based for guests, Firestore-based for logged-in users)?

3. **Reports & Analytics Page**: The admin panel request includes a "Reports & Analytics" section. The current dashboard already has revenue/order charts. Should this be a **separate dedicated page** with more detailed reports, or is the enhanced dashboard sufficient?

4. **Promotional Videos**: The home page request mentions "promotional videos." Do you have any video files to use, or should I create the carousel with image-only slides and add video support structure?

---

## Phase 1 — Product Reviews System

### Summary
Build a complete reviews system: Firestore collection, API routes, customer submission UI on product pages, and admin management panel.

---

### Types & Validation

#### [MODIFY] [`index.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/types/index.ts)
Add `Review` and `ReviewStats` interfaces:
```typescript
// ─── Reviews ───
export type ReviewStatus = 'approved' | 'pending' | 'rejected'

export interface Review {
  id: string
  productId: string
  productName: string
  productSlug: string
  customerId: string       // Firebase UID
  customerName: string
  customerEmail: string
  rating: number           // 1-5
  title?: string
  comment: string
  status: ReviewStatus
  isVerifiedPurchase: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: { [key: number]: number } // { 5: 40, 4: 20, ... }
}
```

#### [MODIFY] [`validations.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/validations.ts)
Add review submission & admin review schemas:
```typescript
export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional().or(z.literal('')),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
})

export const reviewModerationSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
})
```

---

### Permissions & RBAC

#### [MODIFY] [`permissions.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/permissions.ts)
Add review permissions:
```typescript
REVIEWS_READ:    'reviews:read',
REVIEWS_WRITE:   'reviews:write',
REVIEWS_DELETE:  'reviews:delete',
```
Grant to `superadmin` (all), `manager` (read + write), `support` (read).

---

### API Routes

#### [NEW] `src/app/api/reviews/route.ts`
- **GET**: List reviews (admin: all reviews with filters; public: by productId, approved only)
- **POST**: Customer submits a review (requires auth, validates purchase history, prevents duplicates)

#### [NEW] `src/app/api/reviews/[id]/route.ts`
- **PUT**: Admin moderates review (approve/reject)
- **DELETE**: Admin deletes review

#### [NEW] `src/app/api/reviews/stats/route.ts`
- **GET**: Returns aggregate rating stats for a product (`?productId=xxx`)

---

### Client API Wrappers

#### [MODIFY] [`admin-client.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/admin-client.ts)
Add:
```typescript
// ─── Reviews ───
export async function fetchReviews(token: string, params?: Record<string, string>): Promise<Review[]>
export async function moderateReview(token: string, id: string, status: string): Promise<{ id: string; message: string }>
export async function deleteReview(token: string, id: string): Promise<{ id: string; message: string }>
```

---

### Customer-Facing Components

#### [NEW] `src/components/ReviewSection.tsx`
Client component displayed on product detail pages:
- Shows average rating with star bar chart distribution
- Lists approved reviews with star display, title, comment, customer name, date
- "Write a Review" button (visible only to logged-in users)
- Review submission form: star rating picker (1-5 interactive stars), optional title, comment textarea
- Verified purchase badge
- Pagination or "Load more" for reviews

#### [MODIFY] [`ProductDetail.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/components/ProductDetail.tsx)
- Import and render `<ReviewSection>` below the product accordions
- Replace hardcoded `★ {product.rating}` with live data from reviews API

#### [NEW] `src/components/StarRating.tsx`
Reusable star rating display component (read-only and interactive modes)

---

### Admin Panel — Reviews Management

#### [NEW] `src/app/admin/reviews/page.tsx`
Full reviews management page following the admin-panel-builder skill:
- Table: Customer name, product, rating (stars), review snippet, status badge, date
- Filter tabs: All | Pending | Approved | Rejected
- Search by product name or customer
- Actions: Approve, Reject, Delete
- GSAP entrance animations
- Empty state UI

#### [MODIFY] [`layout.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/admin/layout.tsx) (admin)
Add "Reviews" to `SIDEBAR_ITEMS`:
```typescript
{ label: 'Reviews', href: '/admin/reviews', permission: 'reviews:read', icon: <Star className="w-5 h-5" /> },
```

---

## Phase 2 — Home Page Redesign

### Summary
Transform the home page into a premium, modern e-commerce experience with hero carousel, scroll animations, swipeable product rails, promotional banners, and micro-interactions.

---

### Hero Section Enhancement

#### [MODIFY] [`Hero.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/components/Hero.tsx)
Complete redesign to a **multi-slide hero carousel**:
- 3-4 hero slides with different promotions (New Arrivals, Best Sellers, Sale)
- GSAP-powered auto-advancing carousel with crossfade transitions
- Navigation dots (bottom) + arrow buttons (sides)
- Touch/swipe support for mobile (GSAP Draggable or touch events)
- Parallax text effect on scroll
- Each slide: full-bleed background image + gradient overlay + headline + CTA button
- Pause on hover, resume on leave

---

### New Components

#### [NEW] `src/components/ProductCarousel.tsx`
Swipeable horizontal product carousel:
- GSAP-powered horizontal scrolling
- Touch/swipe support for mobile
- Arrow navigation for desktop
- Smooth momentum scrolling
- Used for: Best Sellers, New Arrivals, You May Also Like sections

#### [NEW] `src/components/PromoBanner.tsx`
Reusable promotional banner component:
- Full-width or contained layouts
- Background image/gradient + text overlay
- CTA button with hover animation
- Countdown timer variant (for flash sales)
- Scroll-triggered entrance animation

#### [NEW] `src/components/ScrollProgress.tsx`
Subtle scroll progress indicator at the top of the page

#### [NEW] `src/components/AnimatedCounter.tsx`
Number counting animation component for stats (e.g., "500+ Happy Customers")

---

### Home Page Restructure

#### [MODIFY] [`page.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/page.tsx) (home)
Complete restructure with these sections (top to bottom):

1. **Hero Carousel** — Multi-slide with GSAP transitions
2. **Marquee** — Existing, keep as-is
3. **Trust Strip** — Enhanced with icons and subtle hover animations
4. **New Arrivals Rail** — Swipeable `<ProductCarousel>` (8 products)
5. **Promotional Banner** — "Best Sellers" full-width banner with parallax
6. **Best Sellers Grid** — 4-column grid with hover card lift effect
7. **Shop by Category** — Existing category grid, enhanced with:
   - Hover zoom + overlay darkening
   - Scale-up micro-animation on scroll reveal
8. **Special Offers Banner** — Sale promotion with countdown
9. **On Sale Rail** — Swipeable product carousel
10. **Social Proof / Reviews** — Enhanced testimonial cards with star ratings, glassmorphism cards
11. **Stats Section** — "500+ Happy Customers" with animated counters
12. **Newsletter / CTA** — "Join the New Step Family" section

---

### Enhanced ProductCard

#### [MODIFY] [`ProductCard.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/components/ProductCard.tsx)
- Add hover lift effect (translateY + shadow)
- Quick "Add to Bag" button that appears on hover
- Star rating display below price
- Subtle image zoom on hover (already present, enhance timing)
- "Quick View" overlay badge on hover (optional)

---

### CSS Enhancements

#### [MODIFY] [`globals.css`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/globals.css)
Add:
- Glassmorphism utility classes
- Card hover lift animation
- Smooth gradient animations for banners
- Carousel indicator dot styles
- Enhanced scroll-snap utilities for mobile carousels

---

## Phase 3 — Product Catalog Expansion

### Summary
Add 20+ new products across all categories to fully populate the store, with AI-generated product images.

---

### Product Image Generation

Generate **high-quality product images** using image generation:
- 6-8 Men's shoes (runners, lifestyle, formal, boots)
- 6-8 Women's shoes (sneakers, heels, flats, sandals)
- 4-6 Kids' shoes (school, sports, casual)
- 3-4 Sale items (previous season colorways)

Each image: white/clean background, single shoe at 3/4 angle, studio lighting quality.

---

### Product Data

#### [MODIFY] [`products.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/products.ts)
Add 20+ products with complete data:
- Unique slugs, names, descriptions, details
- Realistic pricing in LKR (Rs. 3,900 – Rs. 19,900)
- Some with `compareAtPrice` for sale items
- Some with `isNew: true` for new arrivals
- Varied `rating` and `reviewCount` values
- Multiple size variants with varied stock levels

New products to add:

**Men's (8 new)**:
| # | Name | Category | Price | Type |
|---|------|----------|-------|------|
| 1 | Apex Trail Runner | mens | 13,900 | Trail Running |
| 2 | Metro Slip-On | mens | 8,900 | Casual |
| 3 | Elite Trainer Pro | mens | 15,900 | Performance |
| 4 | Classic Derby Brown | mens | 14,500 | Formal |
| 5 | StreetFlex High-Top | mens | 11,900 | Lifestyle |
| 6 | AirStride Mesh | mens | 10,500 | Running (Sale) |
| 7 | Summit Boot Black | mens | 17,900 | Boot |
| 8 | CoolWalk Loafer | mens | 9,900 | Casual |

**Women's (7 new)**:
| # | Name | Category | Price | Type |
|---|------|----------|-------|------|
| 1 | Bloom Runner Pink | womens | 12,500 | Running |
| 2 | Elegance Wedge Heel | womens | 11,900 | Heel |
| 3 | SoftStep Ballet Flat | womens | 7,900 | Flat |
| 4 | CloudWalk Trainer | womens | 13,500 | Training |
| 5 | Breeze Sandal Gold | womens | 5,900 | Sandal |
| 6 | Urban Sneaker White | womens | 10,900 | Lifestyle |
| 7 | ActiveFit Sport | womens | 14,900 | Performance (Sale) |

**Kids' (5 new)**:
| # | Name | Category | Price | Type |
|---|------|----------|-------|------|
| 1 | PlayPro Velcro Red | kids | 5,500 | Casual |
| 2 | SchoolMate Black | kids | 4,900 | School |
| 3 | LittleRunner Green | kids | 6,500 | Sport |
| 4 | SplashStep Sandal | kids | 3,900 | Sandal |
| 5 | JuniorStar Light-Up | kids | 7,500 | Fun/LED |

---

### Storefront Type Update

#### [MODIFY] [`types.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/types.ts)
- Add `"unisex"` to the category union if needed
- Add optional `bestseller?: boolean` flag for "Best Sellers" section

---

### Updated Products Utilities

#### [MODIFY] [`products.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/lib/products.ts)
Add helper functions:
```typescript
export const bestSellers = products.filter((p) => p.reviewCount > 50).slice(0, 8);
export const featuredProducts = products.filter((p) => p.isNew || p.rating >= 4.7).slice(0, 4);
```

---

### Seed Route Update

#### [MODIFY] [`route.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/api/seed/route.ts) (seed)
Automatically sync all new products to Firestore when seed endpoint is called.

---

## Phase 4 — Admin Panel Enhancement

### Summary
Redesign and enhance the admin panel with new modules: Reviews Management (Phase 1), Discounts & Promotions, Reports & Analytics, and improve existing modules.

---

### Enhanced Dashboard

#### [MODIFY] [`page.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/admin/page.tsx) (admin dashboard)
Enhancements:
- **Top Stat Cards**: Add "Completed Orders", "Low Stock Products" cards
- **Sales by Category Chart**: Pie/doughnut chart showing revenue by category
- **Top Selling Products**: Table showing top 5 products by order count
- **Recent Orders Widget**: Quick-view of latest 5 orders with status
- **Low Stock Alert Banner**: Warning banner when products are below threshold
- Improved card layouts with better spacing and glassmorphism borders

#### [MODIFY] [`DashboardStats`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/types/index.ts)
Extend with:
```typescript
completedOrders: number
categoryRevenue: { category: string; revenue: number }[]
topProducts: { name: string; sold: number; revenue: number }[]
```

#### [MODIFY] Dashboard API [`route.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/api/dashboard)
Add data aggregation for new widgets.

---

### Discounts & Promotions Module

#### [NEW] Types in [`index.ts`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/types/index.ts)
```typescript
export type DiscountType = 'percentage' | 'fixed'
export type DiscountStatus = 'active' | 'expired' | 'disabled'

export interface Discount {
  id: string
  code: string
  description: string
  type: DiscountType
  value: number              // percentage (e.g., 10) or fixed amount in LKR
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  startDate: Date
  endDate: Date
  status: DiscountStatus
  applicableCategories?: string[]  // empty = all categories
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### [NEW] `src/lib/validations.ts` — Add discount schema
#### [NEW] `src/lib/permissions.ts` — Add `discounts:read`, `discounts:write`, `discounts:delete`
#### [NEW] `src/app/api/discounts/route.ts` — GET (list), POST (create)
#### [NEW] `src/app/api/discounts/[id]/route.ts` — GET, PUT, DELETE
#### [NEW] `src/app/api/discounts/validate/route.ts` — POST (validate a code at checkout)
#### [NEW] `src/lib/admin-client.ts` — Add discount CRUD wrappers
#### [NEW] `src/app/admin/discounts/page.tsx` — Discounts list page with:
  - Table: Code, description, type, value, usage, status, dates
  - Filter: Active | Expired | Disabled
  - Create/Edit modal
  - Copy code to clipboard action
  - GSAP animations

#### [MODIFY] Admin sidebar — Add "Discounts" nav item with `Tag` icon

---

### Reports & Analytics Page

#### [NEW] `src/app/admin/reports/page.tsx`
Dedicated analytics page with:
- Date range picker (Last 7 days, 30 days, 90 days, custom)
- **Revenue Report**: Line chart with daily/weekly/monthly granularity
- **Sales Performance**: Bar chart comparing periods
- **Best-Selling Products**: Ranked table with revenue + units sold
- **Category Performance**: Pie chart + table
- **Customer Activity**: New vs returning customers chart
- **Order Status Breakdown**: Donut chart (pending/processing/delivered/cancelled)
- Export-to-CSV button for each report

#### [NEW] `src/app/api/reports/route.ts`
Aggregation endpoint that accepts date range and report type parameters.

#### [MODIFY] Admin sidebar — Add "Reports" nav item with `BarChart3` icon

---

### Inventory Management Enhancement

#### [MODIFY] [`page.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/admin/inventory/page.tsx)
Enhance with:
- **Low Stock Alerts**: Highlighted rows for products below threshold (≤5 units)
- **Out of Stock Tab**: Quick filter for zero-stock items
- **Bulk Stock Update**: Multi-select products and update stock levels
- **Stock History**: Show last updated timestamp
- **Export Inventory**: CSV download of current stock levels

---

### Customer Management Enhancement

#### [MODIFY] [`page.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/admin/customers/page.tsx)
Enhance with:
- **Customer Detail View**: Click to see full order history
- **Customer Activity Timeline**: Orders, reviews, account events
- **Total Spent Column**: Revenue per customer
- **Repeat Customer Badge**: Indicator for customers with 2+ orders
- **Search**: By name, email, phone

---

### Admin Panel UI Polish

#### [MODIFY] [`layout.tsx`](file:///d:/Downloads/CodeZela%20Projects/new-step-footwear/src/app/admin/layout.tsx)
- Add section dividers in sidebar (Core, Catalog, Sales, System)
- Smooth collapse/expand animation with GSAP
- Breadcrumb navigation in top bar
- Notification badges on sidebar items (pending orders count, new reviews)

#### [MODIFY] All admin pages
- Consistent responsive grid layouts
- Enhanced table designs with row hover states
- Improved filter/search bar alignment
- Better empty state illustrations
- Loading skeleton placeholders instead of spinners

---

## Verification Plan

### Automated Tests
```bash
npx playwright test
```
- Verify home page renders all new sections
- Verify product detail page shows review section
- Verify admin panel routes load correctly
- Verify review submission flow (login → navigate to product → submit review)
- Verify admin review moderation (approve/reject/delete)

### Manual Verification
1. **Home Page**: Load on desktop & mobile — verify carousel works, swipe gestures function, scroll animations trigger, all product sections populated
2. **Product Reviews**: Submit a review as a customer → verify it appears → moderate it in admin
3. **Admin Panel**: Navigate all modules, verify data loading, CRUD operations, responsive sidebar
4. **Products**: Verify all 28+ products render correctly with images in shop, cart, and checkout
5. **Performance**: Run Lighthouse audit — ensure home page scores ≥ 80 for performance despite new images

### Build Verification
```bash
npm run build
```
Ensure zero TypeScript errors and successful production build.

---

## Implementation Order

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| **Phase 1**: Reviews System | ~4-5 hours | None |
| **Phase 2**: Home Page Redesign | ~4-5 hours | None (parallel with Phase 1) |
| **Phase 3**: Product Catalog | ~2-3 hours | Phase 2 (images needed for home page) |
| **Phase 4**: Admin Enhancement | ~5-6 hours | Phase 1 (reviews module), Phase 3 (products) |

**Total estimated effort**: ~16-19 hours

---

## File Change Summary

| Action | Count | Files |
|--------|-------|-------|
| **NEW** | ~20 | API routes (reviews, discounts, reports), admin pages (reviews, discounts, reports), components (ReviewSection, StarRating, ProductCarousel, PromoBanner, etc.), product images |
| **MODIFY** | ~18 | types/index.ts, lib/types.ts, lib/products.ts, lib/permissions.ts, lib/validations.ts, lib/admin-client.ts, admin/layout.tsx, admin/page.tsx, app/page.tsx, Hero.tsx, ProductCard.tsx, ProductDetail.tsx, globals.css, seed/route.ts, inventory/page.tsx, customers/page.tsx, and more |
| **DELETE** | 0 | None |
