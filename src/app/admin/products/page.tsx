'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchProducts, deleteProduct } from '@/lib/admin-client'
import { cn, formatPrice, totalStock } from '@/lib/utils'
import { Plus, Search, Eye, Edit2, Trash2, MoreVertical, Loader2, AlertCircle, CheckCircle2, Package } from 'lucide-react'
import type { AdminProduct } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

const FILTERS = ['all', 'mens', 'womens', 'kids', 'sale']

export default function ProductsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchProducts(token)
        setItems(data)
      } catch { addToast('error', 'Failed to load products') }
      finally { setLoading(false) }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' })
    const rows = document.querySelectorAll('.item-row')
    if (rows.length > 0) {
      gsap.fromTo('.item-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2, clearProps: 'opacity,y' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  const handleDelete = async () => {
    if (!deleteConfirmId || !user) return
    setIsDeleting(true)
    try {
      const token = await user.getIdToken()
      await deleteProduct(token, deleteConfirmId)
      setItems((prev) => prev.filter((p) => p.id !== deleteConfirmId))
      addToast('success', 'Product deleted')
    } catch { addToast('error', 'Failed to delete product') }
    finally { setIsDeleting(false); setDeleteConfirmId(null) }
  }

  const filtered = items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.category === filter
    return matchSearch && matchFilter
  })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F0EDE8]">Products</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">{items.length} total</p>
        </div>
        <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium hover:bg-[#E2C270] transition-colors self-start">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-1.5 rounded-full text-sm border transition-colors capitalize', filter === f ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]' : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F0EDE8] hover:border-[#3A3A3A]')}>
            {f === 'all' ? 'All' : f === 'mens' ? "Men's" : f === 'womens' ? "Women's" : f === 'kids' ? "Kids'" : 'Sale'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C] transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/50">
              {filtered.map((p) => {
                const stock = totalStock(p.variants || [])
                return (
                  <tr key={p.id} className="item-row hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] overflow-hidden shrink-0 relative">
                          {p.images?.[0] ? <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" /> : <Package className="w-5 h-5 text-[#6B6B6B] absolute inset-0 m-auto" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#F0EDE8] truncate">{p.name}</p>
                          <p className="text-xs text-[#6B6B6B] truncate">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B] capitalize hidden md:table-cell">{p.categoryLabel || p.category}</td>
                    <td className="px-4 py-3 text-[#F0EDE8] font-medium">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn('text-sm', stock === 0 ? 'text-[#E05252]' : stock <= 5 ? 'text-[#E8B86D]' : 'text-[#4CAF7D]')}>
                        {stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', p.visibility === 'published' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D]' : 'bg-[#6B6B6B]/10 text-[#6B6B6B]')}>
                        {p.visibility || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)} className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E] transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#161616] border border-[#2A2A2A] rounded-lg shadow-xl z-10 py-1">
                            <button onClick={() => { setActiveMenu(null); router.push(`/admin/products/${p.id}`) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#F0EDE8] hover:bg-[#1E1E1E]"><Eye className="w-3.5 h-3.5" /> View</button>
                            <button onClick={() => { setActiveMenu(null); router.push(`/admin/products/${p.id}/edit`) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#F0EDE8] hover:bg-[#1E1E1E]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                            <button onClick={() => { setActiveMenu(null); setDeleteConfirmId(p.id) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#E05252] hover:bg-[#E05252]/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[#6B6B6B] text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#F0EDE8] mb-2">Delete Product?</h2>
            <p className="text-[#6B6B6B] text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="flex-1 px-4 py-2 border border-[#2A2A2A] rounded-lg text-[#F0EDE8] hover:bg-[#1E1E1E] disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-[#E05252] text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button>
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
