'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { fetchDiscounts, createDiscount, updateDiscount, deleteDiscount } from '@/lib/admin-client'
import { cn, formatPrice } from '@/lib/utils'
import {
  Tag,
  Search,
  Plus,
  Trash2,
  Loader2,
  Edit,
  Copy,
  Check,
  X
} from 'lucide-react'
import type { Discount } from '@/types'
import toast from 'react-hot-toast'

export default function AdminDiscountsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    minOrderAmount: '',
    maxUses: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  })

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchDiscounts(token)
        setDiscounts(data)
      } catch (err) {
        toast.error('Failed to load discounts')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
    const rows = document.querySelectorAll('.item-row')
    if (rows.length > 0) {
      gsap.from('.item-row', { opacity: 0, y: 15, stagger: 0.04, duration: 0.4, ease: 'power2.out', delay: 0.15, clearProps: 'all' })
    }
  }, { scope: containerRef, dependencies: [loading, discounts] })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Code copied to clipboard')
  }

  const openModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount)
      setFormData({
        code: discount.code,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount ? discount.minOrderAmount.toString() : '',
        maxUses: discount.maxUses ? discount.maxUses.toString() : '',
        startDate: new Date(discount.startDate).toISOString().slice(0, 16),
        endDate: new Date(discount.endDate).toISOString().slice(0, 16),
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        code: '',
        description: '',
        type: 'percentage',
        value: 10,
        minOrderAmount: '',
        maxUses: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    
    try {
      const token = await user.getIdToken()
      const payload = {
        ...formData,
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }

      if (editingDiscount) {
        await updateDiscount(token, editingDiscount.id, payload)
        setDiscounts(prev => prev.map(d => d.id === editingDiscount.id ? { ...d, ...payload } as any : d))
        toast.success('Discount updated')
      } else {
        const newDiscount = await createDiscount(token, payload)
        setDiscounts(prev => [newDiscount, ...prev])
        toast.success('Discount created')
      }
      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save discount')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteId) return
    try {
      const token = await user.getIdToken()
      await deleteDiscount(token, deleteId)
      setDiscounts(prev => prev.filter(d => d.id !== deleteId))
      toast.success('Discount deleted')
    } catch (err) {
      toast.error('Failed to delete discount')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = discounts.filter(d => 
    d.code.toLowerCase().includes(search.toLowerCase()) || 
    d.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Discounts & Promotions</h1>
          <p className="text-[#8A8478] text-sm mt-1">Manage coupon codes and promotional offers</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] text-sm font-semibold rounded-lg hover:bg-[#FFFFFF] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Discount
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or description..."
          className="w-full rounded-lg bg-[#121212] border border-[#24221F] pl-10 pr-4 py-2 text-sm text-[#FAF8F5] placeholder:text-[#8A8478] outline-none focus:border-[#F7F4EE]"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-12 text-center">
          <Tag className="w-10 h-10 text-[#8A8478] mx-auto" />
          <p className="mt-3 text-sm text-[#FAF8F5]">No discounts found</p>
          <p className="mt-1 text-xs text-[#8A8478]">Create a discount to start running promotions.</p>
        </div>
      ) : (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#24221F] text-[#8A8478]">
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Value</th>
                  <th className="text-left px-4 py-3 font-medium">Usage</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Dates</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((discount) => {
                  const isActive = discount.status === 'active'
                  const now = new Date()
                  const isExpired = new Date(discount.endDate) < now
                  const status = isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'
                  const statusColor = isExpired ? 'text-[#8A8478]' : isActive ? 'text-[#FAF8F5]' : 'text-[#E05252]'

                  return (
                    <tr key={discount.id} className="item-row border-b border-[#24221F]/50 last:border-0 hover:bg-[#181818] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#F7F4EE] tracking-wide font-mono">{discount.code}</span>
                          <button onClick={() => copyCode(discount.code)} className="text-[#8A8478] hover:text-[#FAF8F5]">
                            {copied === discount.code ? <Check className="w-3.5 h-3.5 text-[#FAF8F5]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#8A8478] truncate max-w-[200px] mt-0.5">{discount.description}</p>
                      </td>
                      <td className="px-4 py-3 text-[#FAF8F5]">
                        {discount.type === 'percentage' ? `${discount.value}% OFF` : `${formatPrice(discount.value)} OFF`}
                        {discount.minOrderAmount && <p className="text-xs text-[#8A8478] mt-0.5">Min: {formatPrice(discount.minOrderAmount)}</p>}
                      </td>
                      <td className="px-4 py-3 text-[#FAF8F5]">
                        {discount.usedCount} {discount.maxUses ? `/ ${discount.maxUses}` : 'uses'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-[#8A8478]">
                        {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-current ${statusColor} bg-white/5`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(discount)} className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#F7F4EE] hover:bg-[#F7F4EE]/10 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(discount.id)} className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !saving && setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#141414] rounded-xl border border-[#24221F] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#24221F]">
              <h3 className="text-lg font-semibold text-[#FAF8F5]">{editingDiscount ? 'Edit Discount' : 'Create Discount'}</h3>
              <button onClick={() => !saving && setIsModalOpen(false)} className="text-[#8A8478] hover:text-[#FAF8F5]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Discount Code *</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" placeholder="e.g. SUMMER20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Discount Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8A8478]">Description *</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" placeholder="e.g. 20% off all orders over 10000" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Value *</label>
                  <input required type="number" min="1" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Min Order (Opt)</label>
                  <input type="number" min="0" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" placeholder="None" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Max Uses (Opt)</label>
                  <input type="number" min="1" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" placeholder="Unlimited" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">Start Date *</label>
                  <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8A8478]">End Date *</label>
                  <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] [color-scheme:dark]" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#24221F] mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-[#24221F] text-[#FAF8F5] hover:bg-[#1C1C1C]">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-sm rounded-lg hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs">
                  {saving && <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0B]" />} Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#141414] rounded-xl border border-[#24221F] p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-[#FAF8F5]">Delete Discount</h3>
            <p className="mt-2 text-sm text-[#8A8478]">Are you sure you want to delete this discount? It cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg text-sm border border-[#24221F] text-[#FAF8F5] hover:bg-[#1C1C1C]">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm bg-[#E05252] text-white hover:bg-[#C84040]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
