import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrders, fetchInventory } from '@/lib/admin-client'
import { totalStock } from '@/lib/utils'
import { Bell, AlertTriangle, ShoppingCart, ArrowRight } from 'lucide-react'
import type { AdminOrder, AdminProduct } from '@/types'

export default function AdminNotifications() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders')
  const [pendingOrders, setPendingOrders] = useState<AdminOrder[]>([])
  const [lowStockItems, setLowStockItems] = useState<AdminProduct[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const poll = async () => {
      try {
        const token = await user.getIdToken()
        let newCount = 0

        // Poll pending orders if allowed
        if (hasPermission('orders:read')) {
          const orders = await fetchOrders(token, { status: 'pending' })
          setPendingOrders(orders.slice(0, 5))

          const newOrders = orders.filter((o) => !seenRef.current.has(o.id))
          if (newOrders.length > 0 && seenRef.current.size > 0) {
            try {
              const ctx = new AudioContext()
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.frequency.value = 800
              gain.gain.value = 0.1
              osc.start()
              setTimeout(() => { osc.stop(); ctx.close() }, 150)
            } catch { /* audio not supported */ }
          }
          orders.forEach((o) => seenRef.current.add(o.id))
          newCount += newOrders.length
        }

        // Poll low-stock items if allowed
        if (hasPermission('inventory:read')) {
          const inventory = await fetchInventory(token)
          const low = inventory.filter((p) => {
            const stock = totalStock(p.variants || [])
            return stock <= 5
          })
          setLowStockItems(low.slice(0, 5))
        }

        setUnseenCount(newCount)
      } catch {
        // Silently fail
      }
    }

    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [user, hasPermission])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const totalBadge = unseenCount + (lowStockItems.length > 0 ? 1 : 0)

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setOpen(!open); setUnseenCount(0) }}
        className="relative p-2 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E] transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E05252] text-white text-[10px] flex items-center justify-center font-bold">
            {totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-[#141414] border border-[#24221F] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between border-b border-[#24221F] bg-[#0B0B0B] px-2 pt-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-[#F7F4EE] text-[#F7F4EE]'
                  : 'border-transparent text-[#8A8478] hover:text-[#F7F4EE]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Pending Orders ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-[#D4CBBF] text-[#D4CBBF]'
                  : 'border-transparent text-[#8A8478] hover:text-[#F7F4EE]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock ({lowStockItems.length})
            </button>
          </div>

          {activeTab === 'orders' ? (
            <div>
              {pendingOrders.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#8A8478] text-sm">
                  No pending orders 🎉
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {pendingOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setOpen(false)
                        router.push(`/admin/orders/${order.id}`)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#1C1C1C] transition-colors border-b border-[#24221F]/60 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-mono text-[#F7F4EE] font-semibold">{order.orderRef}</span>
                        <span className="text-xs text-[#8A8478]">
                          {new Date(order.createdAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-[#FAF8F5] mt-0.5">{order.customer?.name}</p>
                      <p className="text-xs text-[#8A8478]">Rs. {order.total?.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setOpen(false); router.push('/admin/orders') }}
                className="w-full px-4 py-2.5 text-xs text-[#F7F4EE] font-medium hover:bg-[#1C1C1C] transition-colors border-t border-[#24221F] flex items-center justify-center gap-1"
              >
                View all orders <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div>
              {lowStockItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#8A8478] text-sm">
                  All inventory stock levels healthy ✅
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {lowStockItems.map((item) => {
                    const stock = totalStock(item.variants || [])
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setOpen(false)
                          router.push('/admin/inventory')
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-[#1C1C1C] transition-colors border-b border-[#24221F]/60 last:border-0 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#FAF8F5]">{item.name}</p>
                          <p className="text-xs text-[#8A8478]">{item.categoryLabel}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          stock === 0
                            ? 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30'
                            : 'bg-[#F7F4EE]/10 text-[#F7F4EE] border border-[#F7F4EE]/30'
                        }`}>
                          {stock === 0 ? 'Out of Stock' : `${stock} left`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => { setOpen(false); router.push('/admin/inventory') }}
                className="w-full px-4 py-2.5 text-xs text-[#D4CBBF] font-medium hover:bg-[#1C1C1C] transition-colors border-t border-[#24221F] flex items-center justify-center gap-1"
              >
                Manage inventory stock <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
