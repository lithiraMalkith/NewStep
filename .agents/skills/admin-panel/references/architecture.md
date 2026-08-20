# Admin Panel — Architecture Reference

This document is the exhaustive reference for implementing admin panels. Read this BEFORE writing any code.

---

## 1. Complete Type System

All types live in `src/types/index.ts`. Here is the complete type registry:

### Auth & Roles
```typescript
type BuiltInRole = 'superadmin' | 'manager' | 'fulfillment' | 'support'

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: BuiltInRole | string   // string for custom roles
  phone?: string
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

interface CustomRole {
  id: string
  name: string
  permissions: string[]
  createdBy: string
  createdAt: Date
  isCustom: true
}
```

### Products
```typescript
type VisibilityStatus = 'published' | 'draft'
type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'low_stock'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cost?: number | null
  dimensions?: string
  material?: string
  color?: string
  weight?: string
  stockQty: number
  images: string[]
  category: string
  subCategory: string
  availabilityStatus: AvailabilityStatus
  sku: string
  visibility: VisibilityStatus
  slug: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

### Categories
```typescript
interface Category {
  id: string
  name: string
  slug: string
  description?: string
  subCategories: SubCategory[]
  order: number
  createdAt: Date
  updatedAt: Date
}

interface SubCategory {
  id: string
  name: string
  slug: string
  description?: string
}
```

### Orders
```typescript
type OrderStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'

interface OrderItem {
  productId: string
  productName: string
  sku: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  orderRef: string          // Format: "LS-{timestamp36}-{random4}"
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  customer: CustomerInfo
  deliveryAddress: DeliveryAddress
  notes?: string
  cancellationReason?: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
  statusHistory: StatusHistoryEntry[]
  createdAt: Date
  updatedAt: Date
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  uid?: string
}

interface DeliveryAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  postalCode: string
}

interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: Date
  updatedBy: string
  note?: string
}
```

### Customers
```typescript
type VerificationStatus = 'unverified' | 'verified' | 'suspended'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: DeliveryAddress
  orderCount: number
  totalSpent: number
  isRepeat: boolean
  firstOrderAt?: Date
  lastOrderAt?: Date
  createdAt: Date
  verificationStatus?: VerificationStatus
}
```

### Dashboard
```typescript
interface DashboardStats {
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  pendingOrders: number
  lowStockProducts: number
  totalProducts: number
  totalCustomers: number
  revenueData: { day: string; revenue: number }[]
  ordersData: { day: string; orders: number; completed: number }[]
  recentActivities: { id: string; type: 'order' | 'product' | 'user'; message: string; time: string }[]
  revenueTrend: number    // % change vs yesterday
  ordersTrend: number     // absolute change vs yesterday
}
```

### Settings
```typescript
interface SiteSettings {
  siteName: string
  siteDescription: string
  ownerEmail: string
  ownerPhone: string
  currency: string
  codEnabled: boolean
  deliveryZones: DeliveryZone[]
  socialLinks: { tiktok?: string; instagram?: string; facebook?: string }
  metaPixelId?: string
  tiktokPixelId?: string
}

interface DeliveryZone {
  id: string
  name: string
  fee: number
  isActive: boolean
}
```

### API Response Envelope
```typescript
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
```

---

## 2. Permission Registry — Complete

```typescript
const PERMISSIONS = {
  DASHBOARD_READ:   'dashboard:read',
  PRODUCTS_READ:    'products:read',
  PRODUCTS_WRITE:   'products:write',
  PRODUCTS_DELETE:  'products:delete',
  ORDERS_READ:      'orders:read',
  ORDERS_WRITE:     'orders:write',
  ORDERS_CREATE:    'orders:create',
  CUSTOMERS_READ:   'customers:read',
  CUSTOMERS_WRITE:  'customers:write',
  INVENTORY_READ:   'inventory:read',
  INVENTORY_WRITE:  'inventory:write',
  CATEGORIES_READ:  'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  CATEGORIES_DELETE:'categories:delete',
  MESSAGES_READ:    'messages:read',
  MESSAGES_WRITE:   'messages:write',
  MESSAGES_DELETE:  'messages:delete',
  ROLES_READ:       'roles:read',
  ROLES_WRITE:      'roles:write',
  ROLES_DELETE:     'roles:delete',
  USERS_READ:       'users:read',
  USERS_WRITE:      'users:write',
  SETTINGS_READ:    'settings:read',
  SETTINGS_WRITE:   'settings:write',
} as const

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
```

### Built-In Role Matrix

| Permission | superadmin | manager | fulfillment | support |
|---|---|---|---|---|
| dashboard:read | ✅ | ✅ | ✅ | ✅ |
| products:read | ✅ | ✅ | ❌ | ❌ |
| products:write | ✅ | ✅ | ❌ | ❌ |
| products:delete | ✅ | ❌ | ❌ | ❌ |
| orders:read | ✅ | ✅ | ✅ | ✅ |
| orders:write | ✅ | ✅ | ✅ | ❌ |
| orders:create | ✅ | ❌ | ❌ | ❌ |
| customers:read | ✅ | ✅ | ✅ | ✅ |
| customers:write | ✅ | ❌ | ❌ | ❌ |
| inventory:read | ✅ | ✅ | ❌ | ❌ |
| inventory:write | ✅ | ✅ | ❌ | ❌ |
| categories:read | ✅ | ✅ | ❌ | ❌ |
| categories:write | ✅ | ❌ | ❌ | ❌ |
| categories:delete | ✅ | ❌ | ❌ | ❌ |
| messages:read | ✅ | ✅ | ❌ | ✅ |
| messages:write | ✅ | ✅ | ❌ | ✅ |
| messages:delete | ✅ | ✅ | ❌ | ❌ |
| roles:* | ✅ | ❌ | ❌ | ❌ |
| users:* | ✅ | ❌ | ❌ | ❌ |
| settings:* | ✅ | ❌ | ❌ | ❌ |

---

## 3. Order Status State Machine

```
pending → processing → dispatched → delivered (terminal)
pending → cancelled (terminal)
processing → cancelled (terminal)
dispatched → cancelled (terminal)
```

Valid transitions:
```typescript
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['processing', 'dispatched', 'delivered', 'cancelled'],
  processing: ['dispatched', 'delivered', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered:  [],        // terminal
  cancelled:  [],        // terminal
}
```

Cancellation REQUIRES a reason string.

Status display config:
```typescript
const STATUS_CONFIG: Record<OrderStatus, { label: string; class: string; icon: ReactNode }> = {
  pending:    { label: 'Pending',    class: 'status-pending',    icon: <Clock /> },
  processing: { label: 'Processing', class: 'status-processing', icon: <Package /> },
  dispatched: { label: 'Dispatched', class: 'status-dispatched', icon: <Truck /> },
  delivered:  { label: 'Delivered',  class: 'status-delivered',  icon: <CheckCircle /> },
  cancelled:  { label: 'Cancelled',  class: 'status-cancelled',  icon: <XCircle /> },
}
```

---

## 4. Client API Wrapper — Complete Function List

All functions in `src/lib/admin-client.ts`:

```typescript
// Core wrapper
fetchApi<T>(path, token, options?)

// Dashboard
fetchDashboardStats(token): Promise<DashboardStats>

// Products
fetchProducts(token, params?): Promise<Product[]>

// Orders
fetchOrders(token, params?): Promise<Order[]>
fetchOrder(token, orderId): Promise<Order>
updateOrderStatus(token, orderId, { status, note?, cancellationReason? })
updateOrderDetails(token, orderId, { customerName?, customerEmail?, ... })
createOrder(token, { items, customer, deliveryAddress, notes?, deliveryFee? })

// Customers
fetchCustomers(token): Promise<Customer[]>
updateCustomer(token, customerId, payload)
deleteCustomer(token, customerId)

// Categories
fetchCategories(token): Promise<Category[]>

// Users
fetchUsers(token): Promise<UserProfile[]>

// Roles
fetchRoles(token): Promise<CustomRole[]>

// Messages
fetchMessages(token): Promise<Message[]>
updateMessageStatus(id, status, token)
deleteMessage(id, token)

// Settings
fetchSettings(token): Promise<SiteSettings>
updateSettings(token, settings)

// Inventory
fetchInventory(token): Promise<Product[]>
updateInventoryStock(token, productId, newStockQty)
```

---

## 5. Utility Functions

```typescript
// Class merging (clsx + tailwind-merge)
cn(...inputs: ClassValue[]): string

// Currency formatting
formatPrice(amount?: number | null): string
// Output: "LKR 12,500.00"

// SKU generation
generateSKU(category: string, index: number): string
// Output: "LS-FUR-0001"

// Order reference generation
generateOrderRef(): string
// Output: "LS-M3K2J1-A4BF"

// Text truncation
truncate(str: string, length: number): string

// URL slug generation
slugify(str: string): string
```

---

## 6. Sidebar Navigation Items

```typescript
const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard',  href: '/admin',            permission: 'dashboard:read',  icon: <LayoutDashboard /> },
  { label: 'Products',   href: '/admin/products',   permission: 'products:read',   icon: <Package /> },
  { label: 'Orders',     href: '/admin/orders',     permission: 'orders:read',     icon: <ShoppingCart /> },
  { label: 'Customers',  href: '/admin/customers',  permission: 'customers:read',  icon: <Users /> },
  { label: 'Inventory',  href: '/admin/inventory',  permission: 'inventory:read',  icon: <Boxes /> },
  { label: 'Categories', href: '/admin/categories', permission: 'categories:read', icon: <FolderTree /> },
  { label: 'Roles',      href: '/admin/roles',      permission: 'roles:read',      icon: <Shield /> },
  { label: 'Users',      href: '/admin/users',      permission: 'users:read',      icon: <UserCog /> },
  { label: 'Messages',   href: '/admin/messages',   permission: 'messages:read',   icon: <MessageSquare /> },
  { label: 'Settings',   href: '/admin/settings',   permission: 'settings:read',   icon: <Settings /> },
]
```

---

## 7. GSAP Animation Presets

Defined in `src/lib/gsap-config.ts`:

```typescript
const ANIMATION_PRESETS = {
  fadeInUp:        { opacity: 0, y: 30,     duration: 0.6, ease: 'power3.out' },
  fadeIn:          { opacity: 0,            duration: 0.4, ease: 'power2.out' },
  scaleIn:         { scale: 0.95, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' },
  slideInRight:    { x: '100%',             duration: 0.4, ease: 'expo.out' },
  slideInLeft:     { x: '-100%',            duration: 0.4, ease: 'expo.out' },
  staggerChildren: { opacity: 0, y: 30, stagger: 0.08, duration: 0.6, ease: 'power3.out' },
  counterUp:       { snap: { innerText: 1 }, duration: 1.2, ease: 'power2.out' },
}
```

---

## 8. Zod Validation Schemas — Complete

```typescript
// Products
const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  price: z.number().positive(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  weight: z.string().optional(),
  stockQty: z.number().int().min(0),
  category: z.string().min(1),
  subCategory: z.string().min(1),
  visibility: z.enum(['published', 'draft']),
  sku: z.string().min(1),
  images: z.array(z.string()).optional(),
  cost: z.number().min(0).optional(),
})

// Checkout (customer orders)
const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^(?:\+94|0)\d{9}$/),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().min(4),
  notes: z.string().max(500).optional(),
})

// Categories
const categorySchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
})

// Custom Roles
const customRoleSchema = z.object({
  name: z.string().min(2).max(40),
  permissions: z.array(z.string()).min(1),
})

// User Invites
const userInviteSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  role: z.string().min(1),
})

// Settings
const siteSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().max(300),
  ownerEmail: z.string().email(),
  ownerPhone: z.string(),
  codEnabled: z.boolean(),
  socialLinks: z.object({
    tiktok: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
  }),
  metaPixelId: z.string().optional(),
  tiktokPixelId: z.string().optional(),
})
```

---

## 9. Email Template Structure

Emails are sent via Resend. Key templates:

1. **Order Confirmation** — sent to customer on order placement
2. **New Order Alert** — sent to admin when a new order is placed
3. **Order Status Update** — sent to customer when status changes
4. **Order Cancellation** — sent to customer with cancellation reason

All email functions are fire-and-forget (`.catch()` to prevent blocking the API response).

---

## 10. Dashboard Stat Cards Pattern

```typescript
const statCards = [
  { label: 'Revenue Today',  value: stats.revenueToday,    format: 'currency', icon: <DollarSign />,     color: 'text-brand-gold',   bgColor: 'bg-brand-gold/10', trend: '+12%' },
  { label: 'Orders Today',   value: stats.ordersToday,     format: 'number',   icon: <ShoppingCart />,   color: 'text-brand-gold',   bgColor: 'bg-brand-gold/10', trend: '+5' },
  { label: 'Pending Orders', value: stats.pendingOrders,   format: 'number',   icon: <Clock />,          color: 'text-brand-gold',   bgColor: 'bg-brand-gold/10' },
  { label: 'Low Stock Alert', value: stats.lowStockProducts, format: 'number', icon: <AlertTriangle />,  color: 'text-brand-danger', bgColor: 'bg-brand-danger/10' },
]
```

Render each as:
```tsx
<div className="stat-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover relative overflow-hidden">
  <div className="relative z-10">
    {/* Icon + label + value + optional trend indicator */}
  </div>
  <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl" />
</div>
```

---

## 11. Chart Configuration (Recharts)

### Line Chart (Revenue)
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={stats.revenueData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
    <XAxis dataKey="day" stroke="#6B6B6B" style={{ fontSize: '12px' }} />
    <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
    <Tooltip
      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
      labelStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
      formatter={(value) => `LKR ${Number(value).toLocaleString()}`}
    />
    <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={3}
      dot={{ fill: '#C9A84C', r: 5 }} activeDot={{ r: 7, fill: '#E8B86D' }} />
  </LineChart>
</ResponsiveContainer>
```

### Bar Chart (Orders)
```tsx
<BarChart data={stats.ordersData}>
  <Bar dataKey="orders"    fill="#C9A84C" radius={[8, 8, 0, 0]} name="Total Orders" />
  <Bar dataKey="completed" fill="#6B6B6B" radius={[8, 8, 0, 0]} name="Completed" />
</BarChart>
```

---

## 12. Firebase Configuration

### Client (`lib/firebase.ts`)
```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = { /* from env */ }
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
```

### Admin (`lib/firebase-admin.ts`)
```typescript
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })})
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
```

---

## 13. Firestore Collection Structure

```
/orders/{orderId}
/products/{productId}
/categories/{categoryId}
/customers/{customerId}
/users/{uid}
  /cart/{productId}
/roles/{roleId}
/settings/site
```

---

## 14. Dependency Install Command

```bash
npm install next react react-dom firebase firebase-admin lucide-react gsap @gsap/react recharts zod resend clsx tailwind-merge cloudinary react-hot-toast date-fns
npm install -D tailwindcss @tailwindcss/postcss @types/react @types/react-dom typescript
```
