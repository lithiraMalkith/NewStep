'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchCustomers } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import { Search, Users, Loader2 } from 'lucide-react'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setItems(await fetchCustomers(t)) } catch {}
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' })
    const r = document.querySelectorAll('.item-row')
    if (r.length) gsap.fromTo('.item-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const filtered = items.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header"><h1 className="text-2xl font-semibold text-[#F0EDE8]">Customers</h1><p className="text-[#6B6B6B] text-sm mt-1">{items.length} total</p></div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" /><input type="text" placeholder="Search by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C]" /></div>
      <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b border-[#2A2A2A]"><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Customer</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden sm:table-cell">Phone</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden md:table-cell">Orders</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Total Spent</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden lg:table-cell">Last Order</th></tr></thead>
        <tbody className="divide-y divide-[#2A2A2A]/50">
          {filtered.map((c) => (
            <tr key={c.id} className="item-row hover:bg-[#1A1A1A] transition-colors cursor-pointer" onClick={() => router.push(`/admin/customers/${c.id}`)}>
              <td className="px-4 py-3"><p className="font-medium text-[#F0EDE8]">{c.name}</p><p className="text-xs text-[#6B6B6B]">{c.email}</p></td>
              <td className="px-4 py-3 text-[#6B6B6B] hidden sm:table-cell">{c.phone}</td>
              <td className="px-4 py-3 hidden md:table-cell"><span className={cn('text-sm', c.isRepeat ? 'text-[#4CAF7D]' : 'text-[#F0EDE8]')}>{c.orderCount}{c.isRepeat ? ' (repeat)' : ''}</span></td>
              <td className="px-4 py-3 text-[#F0EDE8] font-medium">{formatPrice(c.totalSpent)}</td>
              <td className="px-4 py-3 text-[#6B6B6B] text-sm hidden lg:table-cell">{formatDate(c.lastOrderAt)}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-[#6B6B6B] text-sm">No customers found</td></tr>}
        </tbody>
      </table></div></div>
    </div>
  )
}
