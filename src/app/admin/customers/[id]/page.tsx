'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchCustomer } from '@/lib/admin-client'
import { fetchOrders } from '@/lib/admin-client'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { ArrowLeft, Loader2, ShoppingCart, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import type { Customer, AdminOrder } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-[#D4CBBF]', bg: 'bg-[#D4CBBF]/10' },
  processing: { label: 'Processing', color: 'text-[#F7F4EE]', bg: 'bg-[#F7F4EE]/10' },
  dispatched: { label: 'Dispatched', color: 'text-[#FAF8F5]', bg: 'bg-[#FAF8F5]/10' },
  delivered: { label: 'Delivered', color: 'text-white', bg: 'bg-white/10' },
  cancelled: { label: 'Cancelled', color: 'text-[#E05252]', bg: 'bg-[#E05252]/10' },
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => {
    if (!user) return; const id = params.id as string
    try {
      const t = await user.getIdToken()
      const [c, allOrders] = await Promise.all([fetchCustomer(t, id), fetchOrders(t)])
      setCustomer(c)
      setOrders(allOrders.filter((o) => o.customer?.phone === c.phone || o.customer?.email === c.email))
    } catch {} finally { setLoading(false) }
  })() }, [user, params.id])

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>
  if (!customer) return <div className="text-center py-20 text-[#8A8478]">Customer not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4"><button onClick={() => router.push('/admin/customers')} className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818]"><ArrowLeft className="w-5 h-5" /></button><h1 className="text-2xl font-semibold text-[#FAF8F5]">{customer.name}</h1></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-6">
          <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Profile</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-[#8A8478]">Phone</span><p className="text-[#FAF8F5]">{customer.phone}</p></div>
            <div><span className="text-[#8A8478]">Email</span><p className="text-[#FAF8F5]">{customer.email || '—'}</p></div>
            <div><span className="text-[#8A8478]">Total Orders</span><p className="text-[#FAF8F5] font-semibold">{customer.orderCount}</p></div>
            <div><span className="text-[#8A8478]">Total Spent</span><p className="text-[#F7F4EE] font-bold">{formatPrice(customer.totalSpent)}</p></div>
            <div><span className="text-[#8A8478]">Customer Since</span><p className="text-[#FAF8F5]">{formatDate(customer.firstOrderAt)}</p></div>
            {customer.isRepeat && <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7F4EE]/10 text-[#F7F4EE] border border-[#F7F4EE]/20">Repeat Customer</span>}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Order History</h2>
          <div className="space-y-3">
            {orders.map((o) => {
              const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending!
              return (
                <div key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className="bg-[#121212] rounded-xl border border-[#24221F] p-4 hover:border-[#3A352F] cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-[#F7F4EE] font-semibold">{o.orderRef}</span>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', sc.color, sc.bg)}>{sc.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-[#8A8478]">{o.items?.length || 0} item(s)</span>
                    <span className="text-[#FAF8F5] font-medium">{formatPrice(o.total)}</span>
                  </div>
                  <p className="text-xs text-[#8A8478] mt-1">{formatDate(o.createdAt)}</p>
                </div>
              )
            })}
            {orders.length === 0 && <p className="text-center py-12 text-[#8A8478]">No orders found</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
