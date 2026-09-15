/* ================================================================
   New Step Footwear — Admin Type System
   All admin/backend interfaces live here.
   Storefront types stay in src/lib/types.ts for the customer-facing app.
   ================================================================ */

// ─── Auth & Roles ───

export type BuiltInRole = 'superadmin' | 'manager' | 'fulfillment' | 'support'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: BuiltInRole | string
  phone?: string
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface CustomRole {
  id: string
  name: string
  permissions: string[]
  createdBy: string
  createdAt: Date
  isCustom: true
}

// ─── Products (Admin) ───

export type VisibilityStatus = 'published' | 'draft'
export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'low_stock'

export interface ColourVariant {
  colour: string
  sku: string
  stockQty: number
}

export interface AdminVariant {
  size: number
  colours: ColourVariant[]   // per-colour stock per size
  sku?: string               // legacy single-colour fallback
  stockQty?: number          // legacy single-colour fallback
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  brand: string
  description: string
  subtitle: string
  colour: string
  colourway: string[]
  price: number
  compareAtPrice?: number | null
  cost?: number | null
  images: string[]
  category: string
  categoryLabel: string
  categories?: string[]
  categoryLabels?: string[]
  subCategory?: string | null
  subSubCategory?: string | null
  details: string[]
  variants: AdminVariant[]
  availabilityStatus: AvailabilityStatus
  visibility: VisibilityStatus
  isNew: boolean
  isFeatured?: boolean
  featuredOrder?: number
  featuredBadge?: string
  isBestseller?: boolean
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// ─── Categories (Hierarchical Tree) ───

export interface CategoryNode {
  id: string
  name: string
  slug: string
  description?: string
  image?: string             // optional promo image
  blurb?: string
  parentId: string | null    // null = root category
  depth: number              // 0 = root, 1 = sub, 2 = sub-sub
  order: number              // sort order within siblings
  isActive: boolean          // admin can disable without deleting
  createdAt: Date
  updatedAt: Date
}

/** Hydrated tree shape (used on client after fetching flat list) */
export interface CategoryTreeNode extends CategoryNode {
  children: CategoryTreeNode[]
}

/** Backward-compat alias */
export type Category = CategoryNode

// ─── Orders ───

export type OrderStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  productName: string
  slug: string
  sku: string
  colour: string
  image: string
  size: number
  price: number
  quantity: number
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
}

export interface DeliveryAddress {
  address: string
  city: string
  district: string
  notes?: string
}

export interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: Date
  updatedBy: string
  note?: string
}

export interface AdminOrder {
  id: string
  orderRef: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  customer: CustomerInfo
  deliveryAddress: DeliveryAddress
  paymentMethod: 'COD'
  cancellationReason?: string
  trackingNumber?: string
  statusHistory: StatusHistoryEntry[]
  createdAt: Date
  updatedAt: Date
}

// ─── Customers ───

export type VerificationStatus = 'unverified' | 'verified' | 'suspended'

export interface Customer {
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
  verificationStatus: VerificationStatus
}

// ─── Messages (Contact Form) ───

export type MessageStatus = 'new' | 'read' | 'replied'

export interface Message {
  id: string
  name: string
  contact: string
  message: string
  status: MessageStatus
  repliedBy?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Reviews ───

export type ReviewStatus = 'approved' | 'pending' | 'rejected'

export interface Review {
  id: string
  productId: string
  productName: string
  productSlug: string
  customerId: string
  customerName: string
  customerEmail: string
  rating: number
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
  ratingDistribution: Record<number, number>
}

// ─── Discounts ───

export type DiscountType = 'percentage' | 'fixed'
export type DiscountStatus = 'active' | 'expired' | 'disabled'

export interface Discount {
  id: string
  code: string
  description: string
  type: DiscountType
  value: number
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  startDate: Date
  endDate: Date
  status: DiscountStatus
  applicableCategories?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// ─── Wishlist ───

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  productName: string
  productSlug: string
  productImage: string
  productPrice: number
  addedAt: Date
}

// ─── Dashboard ───

export interface DashboardStats {
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  totalRevenue?: number
  pendingOrders: number
  completedOrders: number
  lowStockProducts: number
  totalProducts: number
  totalCustomers: number
  revenueData: { day: string; revenue: number }[]
  ordersData: { day: string; orders: number; completed: number }[]
  categoryRevenue: { category: string; revenue: number }[]
  salesByCategory?: { name: string; value: number; color?: string }[]
  topProducts: { name: string; sold: number; revenue: number; image?: string; category?: string }[]
  recentOrders?: { id: string; orderRef: string; customerName: string; date: string; status: string; total: number; itemCount: number }[]
  recentActivities: { id: string; type: 'order' | 'product' | 'user'; message: string; time: string }[]
  revenueTrend: number
  ordersTrend: number
}

// ─── Settings ───

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  isActive: boolean
}

export interface SiteSettings {
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

// ─── API Response Envelope ───

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: Record<string, string[]>
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Audit Log ───

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'export' | 'feature' | 'unfeature'
export type AuditResource = 'product' | 'order' | 'user' | 'category' | 'discount' | 'review' | 'settings' | 'featured'

export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  resourceName?: string
  details?: string
  ip?: string
  createdAt: Date
}
