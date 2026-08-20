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

export interface AdminVariant {
  size: number
  sku: string
  stockQty: number
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
  details: string[]
  variants: AdminVariant[]
  availabilityStatus: AvailabilityStatus
  visibility: VisibilityStatus
  isNew: boolean
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// ─── Categories ───

export interface SubCategory {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  blurb?: string
  subCategories: SubCategory[]
  order: number
  createdAt: Date
  updatedAt: Date
}

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

// ─── Dashboard ───

export interface DashboardStats {
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
