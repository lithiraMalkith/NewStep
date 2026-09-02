import { z } from 'zod'

// ─── Products ───

export const productSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  slug: z.string().min(2, 'Slug is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  subtitle: z.string().min(2, 'Subtitle is required'),
  colour: z.string().min(1, 'Colour is required'),
  colourway: z.array(z.string()).optional().default([]),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  category: z.string().min(1, 'Category is required'),
  categoryLabel: z.string().min(1, 'Category label is required'),
  details: z.array(z.string()).optional().default([]),
  variants: z.array(z.object({
    size: z.number(),
    sku: z.string(),
    stockQty: z.number().int().min(0),
  })).min(1, 'At least one variant is required'),
  images: z.array(z.string()).optional().default([]),
  visibility: z.enum(['published', 'draft']).default('draft'),
  isNew: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
})

export type ProductFormData = z.infer<typeof productSchema>

// ─── Checkout (customer order placement) ───

export const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  phone: z.string().regex(/^0\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  address: z.string().min(8, 'Enter your full delivery address'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  notes: z.string().max(500).optional().or(z.literal('')),
  userId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    slug: z.string(),
    name: z.string(),
    colour: z.string(),
    image: z.string(),
    size: z.number(),
    price: z.number(),
    qty: z.number().int().min(1),
  })).min(1, 'Cart must have at least one item'),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// ─── Categories ───

export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required').max(60),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().max(200).optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  blurb: z.string().max(100).optional().or(z.literal('')),
  order: z.number().int().min(0).default(0),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// ─── Custom Roles ───

export const customRoleSchema = z.object({
  name: z.string().min(2, 'Name is required').max(40),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
})

export type CustomRoleFormData = z.infer<typeof customRoleSchema>

// ─── User Invites ───

export const userInviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  displayName: z.string().min(2, 'Display name is required'),
  role: z.string().min(1, 'Role is required'),
})

export type UserInviteFormData = z.infer<typeof userInviteSchema>

// ─── Site Settings ───

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().max(300).optional().or(z.literal('')),
  ownerEmail: z.string().email('Enter a valid email'),
  ownerPhone: z.string().min(1, 'Phone is required'),
  codEnabled: z.boolean().default(true),
  socialLinks: z.object({
    tiktok: z.string().optional().or(z.literal('')),
    instagram: z.string().optional().or(z.literal('')),
    facebook: z.string().optional().or(z.literal('')),
  }).default({}),
  metaPixelId: z.string().optional().or(z.literal('')),
  tiktokPixelId: z.string().optional().or(z.literal('')),
})

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>

// ─── Messages (Contact Form) ───

export const messageSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact: z.string().min(5, 'Phone or email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export type MessageFormData = z.infer<typeof messageSchema>

// ─── Order Status Update ───

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'dispatched', 'delivered', 'cancelled']),
  note: z.string().optional().or(z.literal('')),
  cancellationReason: z.string().optional().or(z.literal('')),
  trackingNumber: z.string().optional().or(z.literal('')),
})

export type OrderStatusFormData = z.infer<typeof orderStatusSchema>

// ─── Reviews ───

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100).optional().or(z.literal('')),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

export const reviewModerationSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
})

export type ReviewModerationFormData = z.infer<typeof reviewModerationSchema>

// ─── Discounts ───

export const discountSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(30).transform(v => v.toUpperCase()),
  description: z.string().min(5, 'Description is required').max(200),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Value must be positive'),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  applicableCategories: z.array(z.string()).optional().default([]),
})

export type DiscountFormData = z.infer<typeof discountSchema>

export const discountValidateSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  orderTotal: z.number().positive(),
  categories: z.array(z.string()).optional().default([]),
})
