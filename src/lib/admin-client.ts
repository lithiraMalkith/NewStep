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

// ─── Products ───

export async function fetchProducts(token: string, params?: Record<string, string>): Promise<AdminProduct[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<AdminProduct[]>(`/api/products${query}`, token)
}

export async function fetchProduct(token: string, id: string): Promise<AdminProduct> {
  return fetchApi<AdminProduct>(`/api/products/${id}`, token)
}

export async function createProduct(token: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
  return fetchApi<AdminProduct>('/api/products', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProduct(token: string, id: string, payload: Partial<AdminProduct>): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProduct(token: string, id: string): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/products/${id}`, token, {
    method: 'DELETE',
  })
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
  return fetchApi<{ id: string; message: string }>(`/api/orders/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function createOrder(
  token: string,
  payload: Record<string, unknown>
): Promise<AdminOrder> {
  return fetchApi<AdminOrder>('/api/orders', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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

// ─── Inventory ───

export async function fetchInventory(token: string): Promise<AdminProduct[]> {
  return fetchApi<AdminProduct[]>('/api/inventory', token)
}

export async function updateInventoryStock(
  token: string,
  productId: string,
  variantUpdates: { size: number; stockQty: number }[]
): Promise<{ id: string; message: string }> {
  return fetchApi<{ id: string; message: string }>(`/api/inventory/${productId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ variants: variantUpdates }),
  })
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
