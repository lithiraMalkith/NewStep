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
