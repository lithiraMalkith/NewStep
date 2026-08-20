'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchInventory, updateInventoryStock } from '@/lib/admin-client'
import { cn, formatPrice, totalStock } from '@/lib/utils'
import { Search, Loader2, AlertCircle, CheckCircle2, Save, AlertTriangle } from 'lucide-react'
import type { AdminProduct } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function InventoryPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVariants, setEditVariants] = useState<{ size: number; stockQty: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setItems(await fetchInventory(t)) } catch { addToast('error', 'Failed to load') }
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
    const r = document.querySelectorAll('.item-row')
    if (r.length) gsap.fromTo('.item-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, delay: 0.2, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleSave = async (productId: string) => {
    if (!user) return; setSaving(true)
    try { const t = await user.getIdToken(); await updateInventoryStock(t, productId, editVariants); const data = await fetchInventory(t); setItems(data); setEditingId(null); addToast('success', 'Stock updated') }
    catch { addToast('error', 'Failed to update') } finally { setSaving(false) }
  }

  const filtered = items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const stock = totalStock(p.variants || [])
    if (filter === 'low') return matchSearch && stock > 0 && stock <= 5
    if (filter === 'out') return matchSearch && stock === 0
    return matchSearch
  })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header"><h1 className="text-2xl font-semibold text-[#F0EDE8]">Inventory</h1><p className="text-[#6B6B6B] text-sm mt-1">Manage stock levels across all sizes</p></div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'low', 'out'] as const).map((f) => (<button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-1.5 rounded-full text-sm border transition-colors', filter === f ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]' : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F0EDE8]')}>{f === 'all' ? 'All' : f === 'low' ? '⚠️ Low Stock' : '🔴 Out of Stock'}</button>))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C]" /></div>

      <div className="space-y-4">
        {filtered.map((p) => {
          const stock = totalStock(p.variants || [])
          const isEditing = editingId === p.id
          return (
            <div key={p.id} className="item-row bg-[#161616] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#3A3A3A] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-[#F0EDE8]">{p.name}</h3>
                  <p className="text-xs text-[#6B6B6B]">{p.categoryLabel} · {formatPrice(p.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-medium', stock === 0 ? 'text-[#E05252]' : stock <= 5 ? 'text-[#E8B86D]' : 'text-[#4CAF7D]')}>
                    {stock === 0 && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}{stock} total
                  </span>
                  {!isEditing ? (
                    <button onClick={() => { setEditingId(p.id); setEditVariants((p.variants || []).map((v) => ({ size: v.size, stockQty: v.stockQty }))) }} className="px-3 py-1.5 text-xs bg-[#C9A84C]/10 text-[#C9A84C] rounded-lg hover:bg-[#C9A84C]/20">Edit Stock</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border border-[#2A2A2A] text-[#6B6B6B] rounded-lg hover:bg-[#1E1E1E]">Cancel</button>
                      <button onClick={() => handleSave(p.id)} disabled={saving} className="px-3 py-1.5 text-xs bg-[#C9A84C] text-[#0D0D0D] rounded-lg hover:bg-[#E2C270] disabled:opacity-50 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editVariants : (p.variants || [])).map((v, i) => (
                  <div key={v.size} className={cn('px-3 py-2 rounded-lg border text-sm', v.stockQty === 0 ? 'border-[#E05252]/30 bg-[#E05252]/5' : v.stockQty <= 3 ? 'border-[#E8B86D]/30 bg-[#E8B86D]/5' : 'border-[#2A2A2A] bg-[#0D0D0D]')}>
                    <span className="text-[#6B6B6B] text-xs">EU {v.size}</span>
                    {isEditing ? (
                      <input type="number" min="0" value={v.stockQty} onChange={(e) => { const next = [...editVariants]; next[i] = { ...next[i]!, stockQty: Math.max(0, parseInt(e.target.value) || 0) }; setEditVariants(next) }} className="w-12 bg-transparent border-b border-[#2A2A2A] text-[#F0EDE8] text-center outline-none focus:border-[#C9A84C] ml-1" />
                    ) : (
                      <span className={cn('ml-1 font-medium', v.stockQty === 0 ? 'text-[#E05252]' : 'text-[#F0EDE8]')}>{v.stockQty}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-center py-12 text-[#6B6B6B]">No products found</p>}
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{t.message}</div>))}
      </div>
    </div>
  )
}
