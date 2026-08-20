'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrders } from '@/lib/admin-client'
import { Bell } from 'lucide-react'
import type { AdminOrder } from '@/types'

export default function AdminNotifications() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<AdminOrder[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !hasPermission('orders:read')) return

    const poll = async () => {
      try {
        const token = await user.getIdToken()
        const orders = await fetchOrders(token, { status: 'pending' })
        setPendingOrders(orders.slice(0, 5))

        const newOrders = orders.filter((o) => !seenRef.current.has(o.id))
        if (newOrders.length > 0 && seenRef.current.size > 0) {
          // Play beep for new orders
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
        setUnseenCount(newOrders.length)
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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setOpen(!open); setUnseenCount(0) }}
        className="relative p-2 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unseenCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E05252] text-white text-[10px] flex items-center justify-center font-bold">
            {unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2A]">
            <h3 className="text-sm font-semibold text-[#F0EDE8]">Pending Orders</h3>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#6B6B6B] text-sm">
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
                  className="w-full px-4 py-3 text-left hover:bg-[#1E1E1E] transition-colors border-b border-[#2A2A2A]/50 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-mono text-[#C9A84C]">{order.orderRef}</span>
                    <span className="text-xs text-[#6B6B6B]">
                      {new Date(order.createdAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[#F0EDE8] mt-0.5">{order.customer?.name}</p>
                  <p className="text-xs text-[#6B6B6B]">Rs. {order.total?.toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setOpen(false); router.push('/admin/orders') }}
            className="w-full px-4 py-2.5 text-sm text-[#C9A84C] font-medium hover:bg-[#1E1E1E] transition-colors border-t border-[#2A2A2A]"
          >
            View all orders →
          </button>
        </div>
      )}
    </div>
  )
}
