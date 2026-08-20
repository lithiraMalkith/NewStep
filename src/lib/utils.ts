import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format price in Sri Lankan Rupees */
export function formatPrice(amount?: number | null): string {
  if (amount == null) return 'Rs. 0'
  return 'Rs. ' + amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })
}

/** Generate SKU: NS-{CATEGORY}-{INDEX} */
export function generateSKU(category: string, index: number): string {
  const prefix = category.slice(0, 3).toUpperCase()
  return `NS-${prefix}-${String(index).padStart(4, '0')}`
}

/** Generate order reference: NS-{timestamp36}-{random4} */
export function generateOrderRef(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `NS-${ts}-${rand}`
}

/** Create URL-safe slug */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/** Truncate text with ellipsis */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

/** Format date for display in admin */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-LK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Calculate total stock across all variants */
export function totalStock(variants: { stockQty: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stockQty, 0)
}

/** Determine availability status from variants */
export function getAvailabilityStatus(variants: { stockQty: number }[]): 'in_stock' | 'out_of_stock' | 'low_stock' {
  const total = totalStock(variants)
  if (total === 0) return 'out_of_stock'
  if (total <= 5) return 'low_stock'
  return 'in_stock'
}
