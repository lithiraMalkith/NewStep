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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Products</h1>
          <p className="text-[#8A8478] text-sm mt-1">{items.length} total products in catalog</p>
        </div>
        <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs self-start">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-1.5 rounded-full text-sm border transition-colors capitalize font-medium', filter === f ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B]' : 'border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#3A352F] bg-[#121212]')}>
            {f === 'all' ? 'All' : f === 'mens' ? "Men's" : f === 'womens' ? "Women's" : f === 'kids' ? "Kids'" : 'Sale'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#24221F]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24221F]/50">
              {filtered.map((p) => {
                const stock = totalStock(p.variants || [])
                return (
                  <tr key={p.id} className="item-row hover:bg-[#181818] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1C1C1C] border border-[#24221F] overflow-hidden shrink-0 relative">
                          {p.images?.[0] ? <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" /> : <Package className="w-5 h-5 text-[#8A8478] absolute inset-0 m-auto" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#FAF8F5] truncate">{p.name}</p>
                          <p className="text-xs text-[#8A8478] truncate">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8A8478] capitalize hidden md:table-cell">{p.categoryLabel || p.category}</td>
                    <td className="px-4 py-3 text-[#FAF8F5] font-medium">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn('text-sm font-medium', stock === 0 ? 'text-[#E05252]' : stock <= 5 ? 'text-[#D4CBBF]' : 'text-[#FAF8F5]')}>
                        {stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', p.visibility === 'published' ? 'bg-[#FAF8F5]/15 text-[#FAF8F5] border border-[#FAF8F5]/30' : 'bg-[#8A8478]/15 text-[#8A8478]')}>
                        {p.visibility || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)} className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#141414] border border-[#24221F] rounded-lg shadow-xl z-10 py-1">
                            <button onClick={() => { setActiveMenu(null); router.push(`/admin/products/${p.id}`) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#FAF8F5] hover:bg-[#1C1C1C]"><Eye className="w-3.5 h-3.5" /> View</button>
                            <button onClick={() => { setActiveMenu(null); router.push(`/admin/products/${p.id}/edit`) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#FAF8F5] hover:bg-[#1C1C1C]"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                            <button onClick={() => { setActiveMenu(null); setDeleteConfirmId(p.id) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#E05252] hover:bg-[#E05252]/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[#8A8478] text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#24221F] rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#FAF8F5] mb-2">Delete Product?</h2>
            <p className="text-[#8A8478] text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="flex-1 px-4 py-2 border border-[#24221F] rounded-lg text-[#FAF8F5] hover:bg-[#1C1C1C] disabled:opacity-50">Cancel</button>
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
