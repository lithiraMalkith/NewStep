<div align="center">

<br/>

<img src="public/images/banner.jpg" alt="New Step Footwear" width="100%" style="border-radius:12px;"/>

<br/><br/>

# New Step Footwear

**Premium shoe store for Sri Lanka — built to be fast, lean, and production-ready.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev)

</div>

---

## Stack

<div align="center">

<br/>

[![My Skills](https://skillicons.dev/icons?i=nextjs,react,ts,firebase,tailwind,cloudinary,vercel&theme=dark&perline=7)](https://skillicons.dev)

</div>

<br/>

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 · App Router · React 19 |
| **Language** | TypeScript 5 |
| **Auth & DB** | Firebase Auth · Firestore · Firebase Admin SDK |
| **Styling** | Tailwind CSS v4 · Vanilla CSS |
| **Animations** | GSAP 3 · `@gsap/react` |
| **Charts** | Recharts |
| **Images** | Cloudinary · Next/Image |
| **Email** | Resend |
| **Validation** | Zod 4 |
| **Icons** | Lucide React |
| **Testing** | Playwright (19 automated tests) |

---

## Features

**Storefront**
- Catalog with real-time size-level stock availability
- Category browsing — Men · Women · Kids · Sale
- Product Detail Page with variant size picker and gallery
- Slide-out cart drawer with localStorage persistence
- Cash on Delivery checkout with island-wide delivery fee calculation
- Order tracking by reference ID
- Customer account — sign up, sign in, profile, address book, order history

**Admin Panel** (`/admin`)
- RBAC role system — Superadmin · Manager · Fulfillment · Support
- Dashboard with 7-day revenue & order charts
- Products CRUD with Cloudinary image upload
- Orders lifecycle management with status history
- Inventory quick-edit matrix by size variant
- Categories · Messages inbox · User management · Site settings

**Security**
- Firebase ID token verification on every admin API route
- Permission-level guards via custom claims
- Auth context with `onIdTokenChanged` for session sync

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Back-office pages (RBAC-protected)
│   ├── api/            # Next.js route handlers
│   ├── account/        # Customer portal
│   ├── shop/           # Catalog & PDP
│   ├── checkout/       # COD checkout
│   └── order/          # Order tracking
├── components/         # Shared UI components
├── contexts/           # AuthContext
├── lib/                # Firebase, products, utils, validations
└── types/              # Shared TypeScript interfaces
tests/
├── e2e/                # Playwright storefront & admin tests
└── api/                # API security tests
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables (copy and fill)
cp .env.example .env.local

# Run development server
npm run dev

# Run automated test suite
npm test
```

### Required Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
```

---

## Testing

The project ships with a **Playwright** test suite covering 19 automated test scenarios.

```bash
npm test                     # Run all tests (headless)
npx playwright test --ui     # Interactive Playwright UI
```

**Test coverage**

| Suite | Tests | Coverage |
|---|---|---|
| API Security | 10 | All admin routes → `401` without token |
| Admin Panel | 3 | Auth guard · Login UI · Subpage routing |
| Storefront | 6 | Homepage · Shop · PDP · Cart · Auth · Policies |

---

<div align="center">

<br/>

*Built with ♥ for New Step Footwear — Sri Lanka*

</div>
