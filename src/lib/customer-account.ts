import type { Order } from './types'
import { readOrders } from './orders'

export interface SavedAddress {
  id: string
  label: string // 'Home' | 'Work' | 'Other' | custom
  fullName: string
  phone: string
  address: string
  city: string
  district: string
  notes?: string
  isDefault: boolean
  createdAt: string
}

const ADDRESSES_KEY = 'newstep.addresses.v1'

export function getLocalAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY)
    return raw ? (JSON.parse(raw) as SavedAddress[]) : []
  } catch {
    return []
  }
}

export function saveLocalAddresses(addresses: SavedAddress[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses))
}

export function addLocalAddress(addr: Omit<SavedAddress, 'id' | 'createdAt'>): SavedAddress {
  const list = getLocalAddresses()
  const newAddr: SavedAddress = {
    ...addr,
    id: 'addr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    isDefault: addr.isDefault || list.length === 0, // First address is default
  }

  const updated = addr.isDefault
    ? list.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
    : list.concat(newAddr)

  saveLocalAddresses(updated)
  return newAddr
}

export function updateLocalAddress(id: string, data: Partial<SavedAddress>): SavedAddress[] {
  const list = getLocalAddresses()
  const updated = list.map((a) => {
    if (a.id === id) {
      return { ...a, ...data }
    }
    if (data.isDefault) {
      return { ...a, isDefault: false }
    }
    return a
  })
  saveLocalAddresses(updated)
  return updated
}

export function deleteLocalAddress(id: string): SavedAddress[] {
  const list = getLocalAddresses()
  const filtered = list.filter((a) => a.id !== id)
  // If deleted address was default, set next as default
  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0]!.isDefault = true
  }
  saveLocalAddresses(filtered)
  return filtered
}

export function setDefaultLocalAddress(id: string): SavedAddress[] {
  const list = getLocalAddresses()
  const updated = list.map((a) => ({
    ...a,
    isDefault: a.id === id,
  }))
  saveLocalAddresses(updated)
  return updated
}

export function getDefaultAddress(): SavedAddress | null {
  const list = getLocalAddresses()
  return list.find((a) => a.isDefault) || list[0] || null
}

export async function fetchCustomerOrders(email?: string, phone?: string): Promise<Order[]> {
  const localMap = readOrders()
  const localList = Object.values(localMap)

  if (!email && !phone) {
    return localList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  try {
    const params = new URLSearchParams()
    if (email) params.set('email', email)
    if (phone) params.set('phone', phone)

    const res = await fetch(`/api/account/orders?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        // Map server orders to frontend Order format
        const serverOrders: Order[] = data.data.map((sOrder: any) => ({
          id: sOrder.orderRef || sOrder.id,
          createdAt: sOrder.createdAt || new Date().toISOString(),
          customer: {
            fullName: sOrder.customer?.name || sOrder.customer?.fullName || '',
            phone: sOrder.customer?.phone || '',
            email: sOrder.customer?.email || '',
            address: sOrder.deliveryAddress?.address || sOrder.customer?.address || '',
            city: sOrder.deliveryAddress?.city || sOrder.customer?.city || '',
            district: sOrder.deliveryAddress?.district || sOrder.customer?.district || '',
            notes: sOrder.deliveryAddress?.notes || sOrder.customer?.notes,
          },
          lines: (sOrder.items || sOrder.lines || []).map((item: any) => ({
            productId: item.productId || '',
            slug: item.slug || '',
            name: item.productName || item.name || '',
            colour: item.colour || '',
            image: item.image || '',
            size: item.size || 0,
            price: item.price || 0,
            qty: item.quantity ?? item.qty ?? 1,
            maxQty: 10,
          })),
          subtotal: sOrder.subtotal || 0,
          delivery: sOrder.deliveryFee ?? sOrder.delivery ?? 0,
          total: sOrder.total || 0,
          paymentMethod: sOrder.paymentMethod || 'COD',
          status: sOrder.status
            ? (sOrder.status.charAt(0).toUpperCase() + sOrder.status.slice(1).toLowerCase() as any)
            : 'Pending',
        }))

        const map = new Map<string, Order>()
        for (const o of localList) map.set(o.id, o)
        for (const o of serverOrders) map.set(o.id, o)
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    }
  } catch (err) {
    console.error('Error fetching server orders:', err)
  }

  return localList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
