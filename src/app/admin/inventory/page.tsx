'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchInventory, updateInventoryStock } from '@/lib/admin-client'
import { cn, formatPrice, totalStock } from '@/lib/utils'
import {
  Search, Loader2, CheckCircle2, AlertCircle, Save, X, Plus,
  Layers, Package, RefreshCw, ArrowUpRight
} from 'lucide-react'
import type { AdminProduct, AdminVariant, ColourVariant } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface RestockDraftVariant {
  size: number
  colours: { colour: string; stockQty: number; sku?: string }[]
}

export default function InventoryPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Modal Restock State
  const [restockProduct, setRestockProduct] = useState<AdminProduct | null>(null)
  const [draftVariants, setDraftVariants] = useState<RestockDraftVariant[]>([])
  const [newSizeInput, setNewSizeInput] = useState('')
  const [newColourInput, setNewColourInput] = useState('')

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  const loadInventory = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const data = await fetchInventory(token)
      setItems(data)
    } catch {
      addToast('error', 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    loadInventory()
  }, [user, authLoading])

  useGSAP(
    () => {
      if (loading) return
      gsap.fromTo(
        '.page-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' }
      )
      const r = document.querySelectorAll('.item-row')
      if (r.length) {
        gsap.fromTo(
          '.item-row',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, delay: 0.1, clearProps: 'opacity,y' }
        )
      }
    },
    { scope: containerRef, dependencies: [loading] }
  )

  // Open restock modal and prepare draft data
  const openRestockModal = (product: AdminProduct) => {
    setRestockProduct(product)
    const productColours = product.colourway && product.colourway.length > 0
      ? (product.colour?.includes(' / ') ? product.colour.split(' / ').map(c => c.trim()) : [product.colour || 'White'])
      : ['White', 'Black']

    const variants: RestockDraftVariant[] = (product.variants || []).map((v) => {
      let cols: { colour: string; stockQty: number; sku?: string }[] = []
      if (v.colours && v.colours.length > 0) {
        cols = v.colours.map((c) => ({
          colour: c.colour,
          stockQty: Number(c.stockQty) || 0,
          sku: c.sku,
        }))
      } else {
        // Fallback: assign existing stockQty across shoe colours
        cols = productColours.map((c, idx) => ({
          colour: c,
          stockQty: idx === 0 ? (v.stockQty ?? 0) : 0,
          sku: `NS-${v.size}-${c.slice(0, 3).toUpperCase()}`,
        }))
      }
      return {
        size: v.size,
        colours: cols,
      }
    })

    setDraftVariants(variants.sort((a, b) => a.size - b.size))
    setNewSizeInput('')
    setNewColourInput('')
  }

  // Update specific colour quantity within a size
  const handleQuantityChange = (sizeIdx: number, colIdx: number, val: number) => {
    const updated = [...draftVariants]
    const sizeVar = updated[sizeIdx]
    if (!sizeVar) return
    const targetCol = sizeVar.colours[colIdx]
    if (!targetCol) return

    targetCol.stockQty = Math.max(0, val)
    setDraftVariants(updated)
  }

  // Quick Restock increment (+5, +10, etc.)
  const handleQuickAdd = (sizeIdx: number, colIdx: number, delta: number) => {
    const updated = [...draftVariants]
    const targetCol = updated[sizeIdx]?.colours[colIdx]
    if (!targetCol) return
    targetCol.stockQty = Math.max(0, (targetCol.stockQty || 0) + delta)
    setDraftVariants(updated)
  }

  // Add a new size to the draft
  const handleAddNewSize = () => {
    const sizeNum = parseInt(newSizeInput)
    if (isNaN(sizeNum) || sizeNum < 20 || sizeNum > 55) {
      addToast('error', 'Please enter a valid EU shoe size (20-55)')
      return
    }
    if (draftVariants.some((v) => v.size === sizeNum)) {
      addToast('error', `Size EU ${sizeNum} already exists`)
      return
    }

    // Default to existing product colours
    const existingColours = draftVariants[0]?.colours.map((c) => c.colour) || ['White', 'Black']
    const newVariant: RestockDraftVariant = {
      size: sizeNum,
      colours: existingColours.map((c) => ({
        colour: c,
        stockQty: 0,
        sku: `NS-${sizeNum}-${c.slice(0, 3).toUpperCase()}`,
      })),
    }

    setDraftVariants([...draftVariants, newVariant].sort((a, b) => a.size - b.size))
    setNewSizeInput('')
    addToast('success', `Added Size EU ${sizeNum}`)
  }

  // Add a new colour variant across all sizes
  const handleAddNewColour = () => {
    const colName = newColourInput.trim()
    if (!colName) return
    if (draftVariants[0]?.colours.some((c) => c.colour.toLowerCase() === colName.toLowerCase())) {
      addToast('error', `Colour "${colName}" already exists`)
      return
    }

    const updated = draftVariants.map((v) => ({
      ...v,
      colours: [
        ...v.colours,
        { colour: colName, stockQty: 0, sku: `NS-${v.size}-${colName.slice(0, 3).toUpperCase()}` },
      ],
    }))

    setDraftVariants(updated)
    setNewColourInput('')
    addToast('success', `Added colour "${colName}" across all sizes`)
  }

  // Save changes to Firestore
  const handleSaveRestock = async () => {
    if (!user || !restockProduct) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const payload = draftVariants.map((v) => ({
        size: v.size,
        colours: v.colours,
        stockQty: v.colours.reduce((s, c) => s + c.stockQty, 0),
      }))

      await updateInventoryStock(token, restockProduct.id, payload)
      await loadInventory()
      setRestockProduct(null)
      addToast('success', `Restocked inventory for ${restockProduct.name}`)
    } catch {
      addToast('error', 'Failed to save restock updates')
    } finally {
      setSaving(false)
    }
  }

  // Calculate total draft units in modal
  const totalDraftUnits = draftVariants.reduce(
    (sum, v) => sum + v.colours.reduce((s, c) => s + (c.stockQty || 0), 0),
    0
  )

  const filtered = items.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryLabel || '').toLowerCase().includes(search.toLowerCase())
    const stock = totalStock(p.variants || [])
    if (filter === 'low') return matchSearch && stock > 0 && stock <= 5
    if (filter === 'out') return matchSearch && stock === 0
    return matchSearch
  })

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Inventory & Restocking</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            Manage and restock inventory across specific sizes and colours
          </p>
        </div>
        <button
          onClick={loadInventory}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24221F] bg-[#141414] text-xs text-[#FAF8F5] hover:bg-[#1C1C1C] hover:border-[#3A352F] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8A8478]" />
          Refresh Stock
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              filter === f
                ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B]'
                : 'border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#3A352F] bg-[#121212]'
            )}
          >
            {f === 'all'
              ? `All (${items.length})`
              : f === 'low'
              ? `Low Stock (≤5)`
              : `Out of Stock (0)`}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
        <input
          type="text"
          placeholder="Search products by name, category, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] transition-colors"
        />
      </div>

      {/* Inventory Cards List */}
      <div className="space-y-4">
        {filtered.map((p) => {
          const totalUnits = totalStock(p.variants || [])
          return (
            <div
              key={p.id}
              className="item-row bg-[#121212] rounded-xl border border-[#24221F] p-5 hover:border-[#3A352F] transition-colors"
            >
              {/* Product Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#1C1C1C] border border-[#24221F] overflow-hidden shrink-0 relative">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-[#8A8478] absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#FAF8F5]">{p.name}</h3>
                    <p className="text-xs text-[#8A8478]">
                      {p.categoryLabel || p.category} · {formatPrice(p.price)} · {p.colour}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-semibold border',
                      totalUnits === 0
                        ? 'bg-[#1C1C1C] text-[#8A8478] border-[#2E2E2E]'
                        : totalUnits <= 5
                        ? 'bg-[#D4CBBF]/15 text-[#D4CBBF] border-[#D4CBBF]/30'
                        : 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/20'
                    )}
                  >
                    {totalUnits === 0 ? '0 🚫 Out of Stock' : `${totalUnits} units total`}
                  </span>

                  <button
                    onClick={() => openRestockModal(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F7F4EE] text-[#0B0B0B] rounded-lg hover:bg-[#FFFFFF] transition-all shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Restock Sizes & Colours
                  </button>
                </div>
              </div>

              {/* Sizes with Colour Breakdown Display */}
              <div className="pt-2 border-t border-[#24221F]/60">
                <p className="text-[11px] font-semibold text-[#8A8478] uppercase tracking-wider mb-2">
                  Sizes & Colour Breakdown:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(p.variants || []).map((v) => {
                    const sizeTotal =
                      v.colours && v.colours.length > 0
                        ? v.colours.reduce((s, c) => s + (c.stockQty || 0), 0)
                        : (v.stockQty ?? 0)

                    return (
                      <div
                        key={v.size}
                        className={cn(
                          'p-2.5 rounded-lg border text-xs bg-[#0B0B0B]',
                          sizeTotal === 0 ? 'border-[#24221F] opacity-75' : 'border-[#24221F]'
                        )}
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-[#24221F]/50 mb-1.5">
                          <span className="font-semibold text-[#FAF8F5]">EU {v.size}</span>
                          <span
                            className={cn(
                              'text-[11px] font-medium px-1.5 py-0.2 rounded',
                              sizeTotal === 0 ? 'text-[#8A8478] bg-[#161616]' : 'text-[#F7F4EE] bg-[#1C1C1C]'
                            )}
                          >
                            {sizeTotal === 0 ? '0 🚫' : `${sizeTotal} total`}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {v.colours && v.colours.length > 0 ? (
                            v.colours.map((c) => (
                              <div
                                key={c.colour}
                                className="flex items-center justify-between text-[11px]"
                              >
                                <span className="text-[#8A8478]">{c.colour}:</span>
                                <span
                                  className={cn(
                                    'font-medium',
                                    (c.stockQty || 0) === 0 ? 'text-[#8A8478]' : 'text-[#FAF8F5]'
                                  )}
                                >
                                  {(c.stockQty || 0) === 0 ? '0 🚫' : `${c.stockQty} units`}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#8A8478]">Standard:</span>
                              <span className="text-[#FAF8F5] font-medium">{v.stockQty ?? 0} units</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-[#24221F] bg-[#121212]">
            <p className="text-[#8A8478] text-sm">No inventory items matched your criteria.</p>
          </div>
        )}
      </div>

      {/* ─── RESTOCK MODAL ─── */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#24221F] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#24221F] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#FAF8F5]">
                  Restock Sizes & Colours &mdash; {restockProduct.name}
                </h2>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  Update quantities per size and colour variant, or add new sizes.
                </p>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Add Bar */}
              <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-[#0E0E0E] border border-[#24221F]">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="New Size (e.g. 42)"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    className="w-36 bg-[#161616] border border-[#24221F] rounded-lg px-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/60 outline-none focus:border-[#F7F4EE]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSize}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5] rounded-lg text-xs hover:bg-[#252525] hover:border-[#3A352F] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Size
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New Colour (e.g. Sand)"
                    value={newColourInput}
                    onChange={(e) => setNewColourInput(e.target.value)}
                    className="w-36 bg-[#161616] border border-[#24221F] rounded-lg px-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/60 outline-none focus:border-[#F7F4EE]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewColour}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5] rounded-lg text-xs hover:bg-[#252525] hover:border-[#3A352F] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Colour
                  </button>
                </div>
              </div>

              {/* Sizes & Colours Restock Table */}
              <div className="space-y-4">
                {draftVariants.map((v, sizeIdx) => {
                  const sizeTotal = v.colours.reduce((s, c) => s + (c.stockQty || 0), 0)
                  return (
                    <div
                      key={v.size}
                      className="p-4 rounded-xl border border-[#24221F] bg-[#161616] space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#24221F] pb-2">
                        <span className="font-semibold text-sm text-[#FAF8F5]">
                          Size EU {v.size}
                        </span>
                        <span className="text-xs text-[#D4CBBF] font-medium">
                          Total for EU {v.size}:{' '}
                          <strong className="text-[#FAF8F5]">{sizeTotal} units</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {v.colours.map((col, colIdx) => (
                          <div
                            key={col.colour}
                            className="p-3 rounded-lg border border-[#24221F] bg-[#0E0E0E] space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#FAF8F5]">{col.colour}</span>
                              <span className="text-[#8A8478]">
                                Current:{' '}
                                <strong className="text-[#FAF8F5]">{col.stockQty}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={col.stockQty}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    sizeIdx,
                                    colIdx,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 bg-[#161616] border border-[#24221F] rounded px-2.5 py-1 text-xs text-[#FAF8F5] text-center outline-none focus:border-[#F7F4EE]"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(sizeIdx, colIdx, 1)}
                                  className="px-2 py-1 text-[11px] rounded bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5] hover:bg-[#252525]"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(sizeIdx, colIdx, 5)}
                                  className="px-2 py-1 text-[11px] rounded bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5] hover:bg-[#252525]"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(sizeIdx, colIdx, 10)}
                                  className="px-2 py-1 text-[11px] rounded bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5] hover:bg-[#252525]"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#24221F] bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#8A8478]">Calculated Total Product Units:</span>
                <p className="text-sm font-semibold text-[#FAF8F5]">{totalDraftUnits} units total</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  disabled={saving}
                  className="px-4 py-2 text-xs border border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRestock}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-[#F7F4EE] text-[#0B0B0B] rounded-lg hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Stock Levels
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATIONS ─── */}
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
