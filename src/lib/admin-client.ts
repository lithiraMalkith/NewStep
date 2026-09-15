/* ================================================================
   Admin Client API — Client-side fetch wrappers for admin panel
   All functions use fetchApi<T> which handles auth headers and
   the { success, data, error } response envelope.
   ================================================================ */

import type {
  AdminProduct,
  AdminOrder,
  Category,
  Customer,
  DashboardStats,
  Message,
  UserProfile,
  CustomRole,
  SiteSettings,
  Review,
  Discount,
  WishlistItem,
} from '@/types'

// ─── Core Wrapper ───

async function fetchApi<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {}),
  }

  const response = await fetch(path, { ...options, headers })
  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `API fetch failed: ${response.statusText}`)
  }

  return payload.data as T
}

// ─── Dashboard ───

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/api/dashboard', token)
}

// ─── Notification & Real-time Event Broadcaster ───

export function notifyAdminDataChange(type: 'orders' | 'inventory' | 'products' = 'orders') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:notifications-refresh', { detail: { type } }))
    try {
      localStorage.setItem('admin:last-data-update', `${type}:${Date.now()}`)
    } catch {
      // ignore storage errors
    }
  }
}

// ─── Products ───

export async function fetchProducts(token: string, params?: Record<string, string>): Promise<AdminProduct[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<AdminProduct[]>(`/api/products${query}`, token)
}

export async function fetchProduct(token: string, id: string): Promise<AdminProduct> {
  return fetchApi<AdminProduct>(`/api/products/${id}`, token)
}

export async function createProduct(token: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
  const result = await fetchApi<AdminProduct>('/api/products', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  notifyAdminDataChange('products')
  return result
}

export async function updateProduct(token: string, id: string, payload: Partial<AdminProduct>): Promise<{ id: string; message: string }> {
  const result = await fetchApi<{ id: string; message: string }>(`/api/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  notifyAdminDataChange('products')
  return result
}

export async function deleteProduct(token: string, id: string): Promise<{ id: string; message: string }> {
  const result = await fetchApi<{ id: string; message: string }>(`/api/products/${id}`, token, {
    method: 'DELETE',
  })
  notifyAdminDataChange('products')
  return result
}

// ─── Orders ───

export async function fetchOrders(token: string, params?: Record<string, string>): Promise<AdminOrder[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<AdminOrder[]>(`/api/orders${query}`, token)
}

export async function fetchOrder(token: string, id: string): Promise<AdminOrder> {
  return fetchApi<AdminOrder>(`/api/orders/${id}`, token)
}

export async function updateOrderStatus(
  token: string,
  id: string,
  payload: { status: string; note?: string; cancellationReason?: string; trackingNumber?: string }
): Promise<{ id: string; message: string }> {
  const result = await fetchApi<{ id: string; message: string }>(`/api/orders/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  notifyAdminDataChange('orders')
  return result
}

export async function createOrder(
  token: string,
  payload: Record<string, unknown>
): Promise<AdminOrder> {
  const result = await fetchApi<AdminOrder>('/api/orders', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  notifyAdminDataChange('orders')
  return result
}

// ─── Customers ───

export async function fetchCustomers(token: string): Promise<Customer[]> {
  return fetchApi<Customer[]>('/api/customers', token)
}

export async function fetchCustomer(token: string, id: string): Promise<Customer> {
  return fetchApi<Customer>(`/api/customers/${id}`, token)
}

export async function deleteCustomer(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/customers/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Categories ───

export async function fetchCategories(token: string): Promise<Category[]> {
  return fetchApi<Category[]>('/api/categories', token)
}

export async function createCategory(token: string, payload: Partial<Category>): Promise<Category> {
  return fetchApi<Category>('/api/categories', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCategory(token: string, id: string, payload: Partial<Category>): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/categories/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteCategory(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/categories/${id}`, token, {
    method: 'DELETE',
  })
}

export async function reorderCategories(
  token: string,
  updates: { id: string; order: number; parentId?: string | null }[]
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/api/categories/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ updates }),
  })
}

// ─── Inventory ───

export async function fetchInventory(token: string): Promise<AdminProduct[]> {
  return fetchApi<AdminProduct[]>('/api/inventory', token)
}

export async function updateInventoryStock(
  token: string,
  productId: string,
  variantUpdates: {
    size: number
    stockQty?: number
    colours?: { colour: string; stockQty: number; sku?: string }[]
  }[]
): Promise<{ id: string; message: string }> {
  const result = await fetchApi<{ id: string; message: string }>(`/api/inventory/${productId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ variants: variantUpdates }),
  })
  notifyAdminDataChange('inventory')
  return result
}

// ─── Messages ───

export async function fetchMessages(token: string): Promise<Message[]> {
  return fetchApi<Message[]>('/api/messages', token)
}

export async function updateMessageStatus(
  token: string,
  id: string,
  status: string
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/messages/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteMessage(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/messages/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Users ───

export async function fetchUsers(token: string): Promise<UserProfile[]> {
  return fetchApi<UserProfile[]>('/api/users', token)
}

export async function createUser(
  token: string,
  payload: { email: string; displayName: string; role: string; password?: string }
): Promise<UserProfile> {
  return fetchApi<UserProfile>('/api/users', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(
  token: string,
  id: string,
  payload: Partial<UserProfile>
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/users/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteUser(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/users/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Roles ───

export async function fetchRoles(token: string): Promise<CustomRole[]> {
  return fetchApi<CustomRole[]>('/api/roles', token)
}

export async function createRole(
  token: string,
  payload: { name: string; permissions: string[] }
): Promise<CustomRole> {
  return fetchApi<CustomRole>('/api/roles', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateRole(
  token: string,
  id: string,
  payload: { name: string; permissions: string[] }
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/roles/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteRole(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/roles/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Settings ───

export async function fetchSettings(token: string): Promise<SiteSettings> {
  return fetchApi<SiteSettings>('/api/settings', token)
}

export async function updateSettings(token: string, settings: Partial<SiteSettings>): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/api/settings', token, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

// ─── Upload ───

export async function uploadImage(token: string, base64Data: string): Promise<{ url: string }> {
  return fetchApi<{ url: string }>('/api/upload', token, {
    method: 'POST',
    body: JSON.stringify({ image: base64Data }),
  })
}

// ─── Reviews ───

export async function fetchReviews(token: string, params?: Record<string, string>): Promise<Review[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<Review[]>(`/api/reviews${query}`, token)
}

export async function moderateReview(
  token: string,
  id: string,
  status: string
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/reviews/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function deleteReview(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/reviews/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Discounts ───

export async function fetchDiscounts(token: string, params?: Record<string, string>): Promise<Discount[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<Discount[]>(`/api/discounts${query}`, token)
}

export async function createDiscount(token: string, payload: Record<string, unknown>): Promise<Discount> {
  return fetchApi<Discount>('/api/discounts', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDiscount(
  token: string,
  id: string,
  payload: Record<string, unknown>
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/discounts/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteDiscount(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/discounts/${id}`, token, {
    method: 'DELETE',
  })
}

export async function validateDiscount(
  code: string,
  orderTotal: number,
  categories: string[] = []
): Promise<{ valid: boolean; discount?: Discount; discountAmount?: number; error?: string }> {
  const response = await fetch('/api/discounts/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, orderTotal, categories }),
  })
  const payload = await response.json()
  return payload.data || payload
}

// ─── Wishlist ───

export async function fetchWishlist(token: string): Promise<WishlistItem[]> {
  return fetchApi<WishlistItem[]>('/api/wishlist', token)
}

export async function addToWishlist(
  token: string,
  payload: { productId: string; productName: string; productSlug: string; productImage: string; productPrice: number }
): Promise<WishlistItem> {
  return fetchApi<WishlistItem>('/api/wishlist', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removeFromWishlist(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/wishlist/${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Featured Products ───

export async function fetchFeaturedProducts(token: string): Promise<AdminProduct[]> {
  return fetchApi<AdminProduct[]>('/api/featured', token)
}

export async function updateFeaturedProducts(
  token: string,
  featured: { id: string; featuredOrder: number; badge?: string }[]
): Promise<{ message: string; count: number }> {
  return fetchApi<{ message: string; count: number }>('/api/featured', token, {
    method: 'PUT',
    body: JSON.stringify({ featured }),
  })
}

export async function addFeaturedProduct(
  token: string,
  payload: { id: string; featuredOrder?: number; badge?: string }
): Promise<{ message: string; id: string }> {
  return fetchApi<{ message: string; id: string }>('/api/featured', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removeFeaturedProduct(
  token: string,
  id: string
): Promise<{ message: string; id: string }> {
  return fetchApi<{ message: string; id: string }>(`/api/featured?id=${id}`, token, {
    method: 'DELETE',
  })
}

// ─── Audit Log ───

export async function fetchAuditLogs(
  token: string,
  params?: Record<string, string>
): Promise<{ items: import('@/types').AuditLog[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<{ items: import('@/types').AuditLog[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `/api/audit${query}`,
    token
  )
}

export async function createAuditLog(
  token: string,
  payload: { action: string; resource: string; resourceName?: string; details?: string }
): Promise<{ success: boolean; data: import('@/types').AuditLog }> {
  return fetchApi<{ success: boolean; data: import('@/types').AuditLog }>('/api/audit', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function seedAuditLogs(
  token: string,
  count: number = 25
): Promise<{ message: string; seeded: number }> {
  return fetchApi<{ message: string; seeded: number }>('/api/audit', token, {
    method: 'POST',
    body: JSON.stringify({ action: 'seed', count }),
  })
}

export async function deleteAuditLog(
  token: string,
  id: string
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/api/audit?id=${id}`, token, {
    method: 'DELETE',
  })
}

export async function clearAuditLogs(
  token: string
): Promise<{ message: string; deleted: number }> {
  return fetchApi<{ message: string; deleted: number }>('/api/audit?clearAll=true', token, {
    method: 'DELETE',
  })
}
