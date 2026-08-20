'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AccountNav from '@/components/AccountNav'
import { useAuth } from '@/contexts/auth-context'
import { fetchCustomerOrders } from '@/lib/customer-account'
import { LKR } from '@/lib/format'
import { getWhatsAppLink } from '@/lib/config'
import type { Order } from '@/lib/types'

export default function RecentOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Guest lookup state
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const list = await fetchCustomerOrders(user?.email || undefined, user?.phoneNumber || undefined)
      setOrders(list)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadOrders()
    }
  }, [user, authLoading])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupQuery.trim()) return
    setLookupLoading(true)
    setLookupError('')
    try {
      const q = lookupQuery.trim()
      const isRef = q.toUpperCase().startsWith('NS-') || q.length >= 8
      const params = isRef ? `ref=${encodeURIComponent(q)}` : `phone=${encodeURIComponent(q)}`
      const res = await fetch(`/api/account/orders?${params}`)
      const data = await res.json()

      if (data.success && data.data && data.data.length > 0) {
        setOrders(data.data)
      } else {
        setLookupError(`No order found matching "${q}". Check the order reference or phone number.`)
      }
    } catch (err) {
      setLookupError('Failed to search order. Please try again.')
    } finally {
      setLookupLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-3 py-1 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-paper" />
          Delivered
        </span>
      )
    }
    if (s === 'dispatched' || s === 'shipped') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mist border border-line px-3 py-1 text-xs font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          Dispatched
        </span>
      )
    }
    if (s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mist border border-line px-3 py-1 text-xs font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          Processing
        </span>
      )
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line px-3 py-1 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted/60" />
          Cancelled
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mist/60 border border-line px-3 py-1 text-xs font-medium text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        Pending Confirmation
      </span>
    )
  }

  const getStepNumber = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'delivered') return 4
    if (s === 'dispatched' || s === 'shipped') return 3
    if (s === 'processing') return 2
    if (s === 'cancelled') return 0
    return 1 // pending
  }

  return (
    <div className="min-h-[80vh] bg-paper">
      <AccountNav activeTab="orders" />

      <div className="container-x py-8 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-line">
          <div>
            <h1 className="display text-3xl font-bold tracking-tight">Recent Orders</h1>
            <p className="text-sm text-muted mt-1">
              Track the status of your deliveries and view past purchase receipts.
            </p>
          </div>

          {/* Quick Track Order Bar */}
          <form onSubmit={handleLookup} className="flex items-center gap-2 max-w-md w-full md:w-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Enter Order # or Mobile No."
                className="w-full rounded-full border border-line bg-mist/40 px-4 py-2 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
              />
              {lookupQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLookupQuery('')
                    loadOrders()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !lookupQuery.trim()}
              className="btn btn-outline py-2 px-4 text-xs font-medium shrink-0 disabled:opacity-40"
            >
              {lookupLoading ? 'Tracking…' : 'Track'}
            </button>
          </form>
        </div>

        {lookupError && (
          <div className="mt-4 rounded-xl border border-line bg-mist/60 px-4 py-3 text-xs text-ink">
            {lookupError}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-muted">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent mb-3" />
            <p className="text-sm">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mist text-muted mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="display text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
              You haven&apos;t placed any orders with New Step Footwear yet, or your orders were made as guest.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn btn-solid text-xs">
                Start Shopping
              </Link>
              {!user && (
                <Link href="/account/login" className="btn btn-outline text-xs">
                  Sign in to Sync
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const orderId = order.id || (order as any).orderRef
              const step = getStepNumber(order.status)
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent'

              const items = order.lines || (order as any).items || []

              return (
                <div
                  key={orderId}
                  className="rounded-2xl border border-line bg-paper p-5 sm:p-7 shadow-sm transition-all hover:border-ink/30"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm sm:text-base font-bold text-ink">
                          {order.id || (order as any).orderRef}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Placed on {dateStr} &middot; Cash on Delivery (COD)
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted">Total Amount</p>
                      <p className="text-base sm:text-lg font-bold text-ink">{LKR(order.total)}</p>
                    </div>
                  </div>

                  {/* Visual Status Progress Tracker */}
                  {order.status?.toLowerCase() !== 'cancelled' && (
                    <div className="my-6 px-2 sm:px-6">
                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-line -z-0" />
                        <div
                          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink transition-all duration-500 -z-0"
                          style={{
                            width: `${((Math.max(1, step) - 1) / 3) * 100}%`,
                          }}
                        />

                        {[
                          { num: 1, label: 'Order Placed' },
                          { num: 2, label: 'Processing' },
                          { num: 3, label: 'Dispatched' },
                          { num: 4, label: 'Delivered' },
                        ].map((s) => (
                          <div key={s.num} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full text-[11px] font-bold transition-all ${
                                step >= s.num
                                  ? 'bg-ink text-paper ring-4 ring-paper'
                                  : 'bg-mist border border-line text-muted ring-4 ring-paper'
                              }`}
                            >
                              {step > s.num ? '✓' : s.num}
                            </div>
                            <span className="mt-2 text-[10px] sm:text-xs font-medium text-ink text-center">
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="divide-y divide-line">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 py-3.5">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                          <Image
                            src={item.image || '/images/p1.jpg'}
                            alt={item.name || item.productName || 'Footwear'}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm sm:text-base font-semibold text-ink">
                            {item.name || item.productName}
                          </h3>
                          <p className="text-xs text-muted mt-0.5">
                            {item.colour} &middot; Size EU {item.size} &middot; Qty {item.qty || item.quantity || 1}
                          </p>
                          <p className="mt-1 text-xs font-medium text-ink">
                            {LKR(item.price)} each
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-semibold text-ink">
                            {LKR(item.price * (item.qty || item.quantity || 1))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-muted">
                    <div>
                      <span>Delivery to: </span>
                      <strong className="text-ink font-medium">
                        {order.customer?.address || (order as any).deliveryAddress?.address},{' '}
                        {order.customer?.city || (order as any).deliveryAddress?.city} (
                        {order.customer?.district || (order as any).deliveryAddress?.district})
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={getWhatsAppLink(
                          `Hi New Step, I have an inquiry regarding my order ${orderId}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line bg-mist/40 px-3.5 py-1.5 text-xs text-ink hover:border-ink hover:bg-mist transition-colors flex items-center gap-1.5"
                      >
                        <span>WhatsApp Support</span>
                      </a>

                      <Link
                        href={`/order/confirmation/${orderId}`}
                        className="rounded-full border border-ink px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-paper transition-colors"
                      >
                        View Receipt
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
