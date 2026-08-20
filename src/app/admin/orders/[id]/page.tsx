'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrder, updateOrderStatus } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { AdminOrder } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-[#E8B86D]', bg: 'bg-[#E8B86D]/10', icon: <Clock className="w-4 h-4" /> },
  processing: { label: 'Processing', color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', icon: <Package className="w-4 h-4" /> },
  dispatched: { label: 'Dispatched', color: 'text-[#5BA3E0]', bg: 'bg-[#5BA3E0]/10', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Delivered', color: 'text-[#4CAF7D]', bg: 'bg-[#4CAF7D]/10', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'text-[#E05252]', bg: 'bg-[#E05252]/10', icon: <XCircle className="w-4 h-4" /> },
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
    const id = Math.random().toString(36).substr(2, 9)
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
    if (sections.length > 0) gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' })
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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>
  if (!order) return <div className="text-center py-20 text-[#6B6B6B]">Order not found</div>

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending!
  const nextStatuses = STATUS_TRANSITIONS[order.status] || []

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/orders')} className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#161616]"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#F0EDE8] font-mono">{order.orderRef}</h1>
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', sc.color, sc.bg)}>{sc.icon} {sc.label}</span>
          </div>
          <p className="text-[#6B6B6B] text-sm mt-1">Placed {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-[#2A2A2A]/50 last:border-0">
                  <div className="w-14 h-14 rounded-lg bg-[#2A2A2A] overflow-hidden relative shrink-0">
                    {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F0EDE8]">{item.productName}</p>
                    <p className="text-xs text-[#6B6B6B]">EU {item.size} · {item.colour} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm text-[#F0EDE8] font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#2A2A2A] space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Subtotal</span><span className="text-[#F0EDE8]">{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Delivery — {order.deliveryAddress?.district}</span><span className="text-[#F0EDE8]">{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span></div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[#2A2A2A]"><span className="text-[#F0EDE8]">Total</span><span className="text-[#C9A84C]">{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Customer */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Customer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#6B6B6B]">Name</span><p className="text-[#F0EDE8] mt-0.5">{order.customer?.name}</p></div>
              <div><span className="text-[#6B6B6B]">Phone</span><p className="text-[#F0EDE8] mt-0.5">{order.customer?.phone}</p></div>
              <div><span className="text-[#6B6B6B]">Email</span><p className="text-[#F0EDE8] mt-0.5">{order.customer?.email || '—'}</p></div>
              <div><span className="text-[#6B6B6B]">Payment</span><p className="text-[#F0EDE8] mt-0.5">Cash on Delivery</p></div>
            </div>
          </div>

          {/* Delivery */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Delivery Address</h2>
            <div className="text-sm text-[#F0EDE8] space-y-1">
              <p>{order.deliveryAddress?.address}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.district}</p>
              {order.deliveryAddress?.notes && <p className="text-[#6B6B6B] italic mt-2">Note: {order.deliveryAddress.notes}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Actions */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Update Status</h2>
            {nextStatuses.length > 0 ? (
              <div className="space-y-2">
                {order.status === 'pending' || order.status === 'processing' ? (
                  <div className="mb-3">
                    <label className="text-xs text-[#6B6B6B] mb-1 block">Tracking Number (optional)</label>
                    <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter tracking #" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" />
                  </div>
                ) : null}
                {nextStatuses.filter((s) => s !== 'cancelled').map((s) => {
                  const statusConf = STATUS_CONFIG[s]!
                  return (
                    <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updating} className={cn('w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50', 'bg-[#C9A84C] text-[#0D0D0D] hover:bg-[#E2C270]')}>
                      {statusConf.icon} Mark as {statusConf.label}
                    </button>
                  )
                })}
                {nextStatuses.includes('cancelled') && (
                  <button onClick={() => setCancelModal(true)} disabled={updating} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[#E05252]/30 text-[#E05252] hover:bg-[#E05252]/10 transition-colors disabled:opacity-50">
                    Cancel Order
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6B6B6B]">This order is {order.status} — no further actions.</p>
            )}
            {order.cancellationReason && (
              <div className="mt-4 p-3 rounded-lg bg-[#E05252]/10 border border-[#E05252]/20">
                <p className="text-xs text-[#E05252] font-medium">Cancellation Reason</p>
                <p className="text-sm text-[#F0EDE8] mt-1">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Status History</h2>
            <div className="space-y-4">
              {(order.statusHistory || []).map((entry, i) => {
                const entryConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending!
                return (
                  <div key={i} className="flex gap-3">
                    <div className={cn('p-1.5 rounded-full shrink-0 mt-0.5', entryConfig.bg, entryConfig.color)}>{entryConfig.icon}</div>
                    <div>
                      <p className="text-sm text-[#F0EDE8] font-medium">{entryConfig.label}</p>
                      <p className="text-xs text-[#6B6B6B]">{formatDate(entry.timestamp)}</p>
                      {entry.note && <p className="text-xs text-[#6B6B6B] mt-0.5">{entry.note}</p>}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#F0EDE8] mb-2">Cancel Order?</h2>
            <p className="text-[#6B6B6B] text-sm mb-4">Please provide a reason for cancellation.</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Enter reason..." className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C] mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setCancelModal(false); setCancelReason('') }} disabled={updating} className="flex-1 px-4 py-2 border border-[#2A2A2A] rounded-lg text-[#F0EDE8] hover:bg-[#1E1E1E]">Keep Order</button>
              <button onClick={handleCancel} disabled={updating || !cancelReason.trim()} className="flex-1 px-4 py-2 bg-[#E05252] text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{updating ? 'Cancelling...' : 'Cancel Order'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
