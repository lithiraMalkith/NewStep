'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrders } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import {
  Search, Clock, Package, Truck, CheckCircle, XCircle,
  Loader2, Eye, AlertCircle, CheckCircle2
} from 'lucide-react'
import type { AdminOrder } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'text-[#D4CBBF]',
    bg: 'bg-[#D4CBBF]/15 border border-[#D4CBBF]/20',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'Processing',
    color: 'text-[#F7F4EE]',
    bg: 'bg-[#F7F4EE]/10 border border-[#F7F4EE]/20',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  dispatched: {
    label: 'Dispatched',
    color: 'text-[#FAF8F5]',
    bg: 'bg-[#FAF8F5]/10 border border-[#FAF8F5]/20',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-[#0B0B0B]',
    bg: 'bg-[#F7F4EE] font-semibold',
    icon: <CheckCircle className="w-3.5 h-3.5 text-[#0B0B0B]" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-[#8A8478]',
    bg: 'bg-[#1C1C1C] border border-[#2E2E2E]',
    icon: <XCircle className="w-3.5 h-3.5 text-[#8A8478]" />,
  },
}

const TABS = ['all', 'pending', 'processing', 'dispatched', 'delivered', 'cancelled']

export default function OrdersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AdminOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchOrders(token)
        setItems(data)
      } catch {
        addToast('error', 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' })
      gsap.fromTo('.item-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, ease: 'power3.out', clearProps: 'opacity,y' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  const filtered = items.filter((o) => {
    const matchSearch =
      (o.orderRef || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.items || []).some(
        (it) =>
          it.productName.toLowerCase().includes(search.toLowerCase()) ||
          (it.colour || '').toLowerCase().includes(search.toLowerCase())
      )
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-semibold text-[#FAF8F5]">Orders</h1>
        <p className="text-[#8A8478] text-sm mt-1">{items.length} total orders across Sri Lanka</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t === 'all' ? items.length : items.filter((o) => o.status === t).length
          return (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize',
                statusFilter === t
                  ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B]'
                  : 'border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#3A352F] bg-[#121212]'
              )}
            >
              {t === 'all' ? 'All' : STATUS_CONFIG[t]?.label || t} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
        <input
          type="text"
          placeholder="Search by order ref, customer, or colour..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#24221F] bg-[#141414]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Order & Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24221F]/50">
              {filtered.map((o) => {
                const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending!
                return (
                  <tr
                    key={o.id}
                    className="item-row hover:bg-[#181818] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm text-[#FAF8F5] font-semibold">{o.orderRef}</p>
                      <p className="text-xs text-[#8A8478] sm:hidden">{o.customer?.name}</p>

                      {/* Items with explicit Colour & Size Badges */}
                      {o.items && o.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {o.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#161616] border border-[#24221F] text-[11px] text-[#FAF8F5]"
                            >
                              <span className="font-medium text-[#FAF8F5] truncate max-w-[140px]">{item.productName}</span>
                              <span className="text-[#8A8478]">·</span>
                              <span className="text-[#FAF8F5]">EU {item.size}</span>
                              <span className="text-[#8A8478]">·</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#24221F] border border-[#3A352F] text-[#F7F4EE] font-semibold">
                                {item.colour || 'Standard'}
                              </span>
                              <span className="text-[#8A8478]">×{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[#FAF8F5]">{o.customer?.name}</p>
                      <p className="text-xs text-[#8A8478]">{o.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-[#FAF8F5] font-medium">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', sc.color, sc.bg)}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8A8478] text-sm hidden md:table-cell">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C]"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#8A8478] text-sm">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto bg-[#141414] border',
              t.type === 'success'
                ? 'text-[#FAF8F5] border-[#F7F4EE]/30'
                : 'text-[#D4CBBF] border-[#3A352F]'
            )}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
