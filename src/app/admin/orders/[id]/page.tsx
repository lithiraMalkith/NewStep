'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrder, updateOrderStatus } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle,
  Loader2, AlertCircle, CheckCircle2
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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'dispatched', 'delivered', 'cancelled'],
  processing: ['dispatched', 'delivered', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export default function OrderDetailPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const orderId = params.id as string

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || !orderId) { setLoading(false); return }
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchOrder(token, orderId)
        setOrder(data)
        setTrackingNumber(data.trackingNumber || '')
      } catch { addToast('error', 'Failed to load order') }
      finally { setLoading(false) }
    }
    load()
  }, [user, authLoading, orderId])

  useGSAP(() => {
    const sections = document.querySelectorAll('.form-section')
    if (sections.length > 0) {
      gsap.fromTo(
        '.form-section',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' }
      )
    }
  }, { scope: containerRef, dependencies: [loading] })

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user || !order) return
    if (newStatus === 'cancelled') { setCancelModal(true); return }
    setUpdating(true)
    try {
      const token = await user.getIdToken()
      await updateOrderStatus(token, orderId, { status: newStatus, trackingNumber: trackingNumber || undefined })
      const updated = await fetchOrder(token, orderId)
      setOrder(updated)
      addToast('success', `Status updated to ${newStatus}`)
    } catch { addToast('error', 'Failed to update status') }
    finally { setUpdating(false) }
  }

  const handleCancel = async () => {
    if (!user || !cancelReason.trim()) return
    setUpdating(true)
    try {
      const token = await user.getIdToken()
      await updateOrderStatus(token, orderId, { status: 'cancelled', cancellationReason: cancelReason })
      const updated = await fetchOrder(token, orderId)
      setOrder(updated)
      setCancelModal(false)
      addToast('success', 'Order cancelled')
    } catch { addToast('error', 'Failed to cancel order') }
    finally { setUpdating(false) }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>
  if (!order) return <div className="text-center py-20 text-[#8A8478]">Order not found</div>

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending!
  const nextStatuses = STATUS_TRANSITIONS[order.status] || []

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/orders')}
          className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#FAF8F5] font-mono">{order.orderRef}</h1>
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', sc.color, sc.bg)}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <p className="text-[#8A8478] text-sm mt-1">Placed {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section with prominent Colour and Size Details */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-4">
              Order Items &amp; Colour Selection
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-start gap-4 py-3.5 border-b border-[#24221F]/50 last:border-0">
                  <div className="w-16 h-16 rounded-lg bg-[#1C1C1C] border border-[#24221F] overflow-hidden relative shrink-0">
                    {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#FAF8F5]">{item.productName}</p>

                    {/* Prominent Colour, Size, and Quantity badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#1C1C1C] border border-[#3A352F] text-xs text-[#F7F4EE] font-semibold">
                        Colour: {item.colour || 'Standard'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#161616] border border-[#24221F] text-xs text-[#FAF8F5]">
                        Size: EU {item.size}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#161616] border border-[#24221F] text-xs text-[#8A8478]">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#FAF8F5] font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs text-[#8A8478]">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t border-[#24221F] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8A8478]">Subtotal</span>
                <span className="text-[#FAF8F5]">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8478]">Delivery &mdash; {order.deliveryAddress?.district}</span>
                <span className="text-[#FAF8F5]">{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#24221F]">
                <span className="text-[#FAF8F5]">Total</span>
                <span className="text-[#F7F4EE] font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#8A8478] text-xs">Name</span><p className="text-[#FAF8F5] mt-0.5 font-medium">{order.customer?.name}</p></div>
              <div><span className="text-[#8A8478] text-xs">Phone</span><p className="text-[#FAF8F5] mt-0.5 font-medium">{order.customer?.phone}</p></div>
              <div><span className="text-[#8A8478] text-xs">Email</span><p className="text-[#FAF8F5] mt-0.5">{order.customer?.email || '—'}</p></div>
              <div><span className="text-[#8A8478] text-xs">Payment</span><p className="text-[#FAF8F5] mt-0.5 font-medium">Cash on Delivery</p></div>
            </div>
          </div>

          {/* Delivery */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Delivery Address</h2>
            <div className="text-sm text-[#FAF8F5] space-y-1">
              <p>{order.deliveryAddress?.address}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.district}</p>
              {order.deliveryAddress?.notes && <p className="text-[#8A8478] italic mt-2">Note: {order.deliveryAddress.notes}</p>}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Update Status</h2>
            {nextStatuses.length > 0 ? (
              <div className="space-y-2">
                {(order.status === 'pending' || order.status === 'processing') && (
                  <div className="mb-3">
                    <label className="text-xs text-[#8A8478] mb-1 block">Tracking Number (optional)</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking #"
                      className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
                    />
                  </div>
                )}
                {nextStatuses.filter((s) => s !== 'cancelled').map((s) => {
                  const statusConf = STATUS_CONFIG[s]!
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(s)}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs disabled:opacity-50 bg-[#F7F4EE] text-[#0B0B0B] hover:bg-[#FFFFFF]"
                    >
                      {statusConf.icon} Mark as {statusConf.label}
                    </button>
                  )
                })}
                {nextStatuses.includes('cancelled') && (
                  <button
                    onClick={() => setCancelModal(true)}
                    disabled={updating}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[#3A352F] text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#8A8478]">This order is {order.status} &mdash; no further actions.</p>
            )}

            {order.cancellationReason && (
              <div className="mt-4 p-3 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E]">
                <p className="text-xs text-[#8A8478] font-medium">Cancellation Reason</p>
                <p className="text-sm text-[#FAF8F5] mt-1">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Status History</h2>
            <div className="space-y-4">
              {(order.statusHistory || []).map((entry, i) => {
                const entryConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending!
                return (
                  <div key={i} className="flex gap-3">
                    <div className={cn('p-1.5 rounded-full shrink-0 mt-0.5', entryConfig.bg, entryConfig.color)}>
                      {entryConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm text-[#FAF8F5] font-medium">{entryConfig.label}</p>
                      <p className="text-xs text-[#8A8478]">{formatDate(entry.timestamp)}</p>
                      {entry.note && <p className="text-xs text-[#8A8478] mt-0.5">{entry.note}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#24221F] rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#FAF8F5] mb-2">Cancel Order?</h2>
            <p className="text-[#8A8478] text-sm mb-4">Please provide a reason for cancellation.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Enter reason..."
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModal(false); setCancelReason('') }}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-[#24221F] rounded-lg text-[#FAF8F5] hover:bg-[#181818]"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={updating || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-[#1C1C1C] border border-[#3A352F] text-[#FAF8F5] rounded-lg hover:bg-[#252525] disabled:opacity-50"
              >
                {updating ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

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
