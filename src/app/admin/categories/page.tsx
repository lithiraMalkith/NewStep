'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchCategories, createCategory, deleteCategory } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, FolderTree } from 'lucide-react'
import type { Category } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function CategoriesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setItems(await fetchCategories(t)) } catch {}
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
    const c = document.querySelectorAll('.cat-card')
    if (c.length) gsap.fromTo('.cat-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, delay: 0.2, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleCreate = async () => {
    if (!user || !name.trim()) return; setSaving(true)
    try { const t = await user.getIdToken(); await createCategory(t, { name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), order: items.length }); setItems(await fetchCategories(t)); setShowForm(false); setName(''); setSlug(''); addToast('success', 'Category created') }
    catch { addToast('error', 'Failed to create') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!user || !deleteId) return
    try { const t = await user.getIdToken(); await deleteCategory(t, deleteId); setItems((p) => p.filter((c) => c.id !== deleteId)); setDeleteId(null); addToast('success', 'Deleted') }
    catch { addToast('error', 'Failed to delete') }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-[#FAF8F5]">Categories</h1><p className="text-[#8A8478] text-sm mt-1">{items.length} categories</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"><Plus className="w-4 h-4" /> Add Category</button>
      </div>

      {showForm && (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#FAF8F5]">New Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-[#8A8478] mb-1 block">Name</label><input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
            <div><label className="text-xs text-[#8A8478] mb-1 block">Slug</label><input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
          </div>
          <div className="flex gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#181818]">Cancel</button><button onClick={handleCreate} disabled={saving || !name.trim()} className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs">{saving ? 'Creating...' : 'Create'}</button></div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((cat) => (
          <div key={cat.id} className="cat-card bg-[#121212] rounded-xl border border-[#24221F] p-5 hover:border-[#3A352F] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-lg bg-[#F7F4EE]/10 text-[#F7F4EE]"><FolderTree className="w-5 h-5" /></div>
                <div><h3 className="text-sm font-medium text-[#FAF8F5]">{cat.name}</h3><p className="text-xs text-[#8A8478] font-mono">{cat.slug}</p></div>
              </div>
              <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center py-12 text-[#8A8478]">No categories yet</p>}
      </div>

      {deleteId && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="bg-[#141414] border border-[#24221F] rounded-xl p-6 w-full max-w-sm mx-4"><h2 className="text-lg font-semibold text-[#FAF8F5] mb-4">Delete Category?</h2><div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-[#24221F] rounded-lg text-[#FAF8F5] hover:bg-[#181818]">Cancel</button><button onClick={handleDelete} className="flex-1 px-4 py-2 bg-[#1C1C1C] border border-[#3A352F] text-[#FAF8F5] rounded-lg hover:bg-[#252525]">Delete</button></div></div></div>)}

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">{toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto bg-[#141414] border', t.type === 'success' ? 'text-[#FAF8F5] border-[#F7F4EE]/30' : 'text-[#D4CBBF] border-[#3A352F]')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />}{t.message}</div>))}</div>
    </div>
  )
}
