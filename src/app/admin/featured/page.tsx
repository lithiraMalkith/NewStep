'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import {
  fetchProducts,
  updateFeaturedProducts,
  addFeaturedProduct,
  removeFeaturedProduct,
} from '@/lib/admin-client'
import { products as staticCatalogue } from '@/lib/products'
import { cn, formatPrice } from '@/lib/utils'
import {
  Sparkles,
  Search,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  Edit2,
  X,
  ArrowUp,
  ArrowDown,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'
import type { AdminProduct } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

const BADGE_OPTIONS = [
  'Featured',
  'Bestseller',
  'New Arrival',
  'Trending',
  'Limited Edition',
  'Top Pick',
  'Exclusive',
]

export default function FeaturedProductsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  // Featured list (ordered)
  const [featured, setFeatured] = useState<AdminProduct[]>([])

  // Tab: 'featured' table vs 'catalogue' picker
  const [activeTab, setActiveTab] = useState<'featured' | 'catalogue'>('featured')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminProduct | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdminProduct | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Modal Form State
  const [modalSearch, setModalSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedBadge, setSelectedBadge] = useState('Featured')
  const [customBadge, setCustomBadge] = useState('')
  const [addPosition, setAddPosition] = useState<'end' | 'start'>('end')

  // Edit Modal Form State
  const [editBadge, setEditBadge] = useState('Featured')
  const [editCustomBadge, setEditCustomBadge] = useState('')
  const [editOrder, setEditOrder] = useState<number>(1)

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  const loadAll = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      let dbProducts: AdminProduct[] = []
      try {
        dbProducts = await fetchProducts(token, { visibility: 'published' })
      } catch {
        // collection might be empty
      }

      // Merge static catalogue with DB products so full catalogue of 27 shoes is always available
      const productMap = new Map<string, AdminProduct>()

      staticCatalogue.forEach((p, idx) => {
        productMap.set(p.id, {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: 'New Step',
          category: p.category,
          categoryLabel: p.categoryLabel,
          price: p.price,
          images: p.images || [],
          description: p.description,
          subtitle: p.subtitle || '',
          colour: p.colour || '',
          colourway: p.colourway || [],
          details: p.details || [],
          variants: (p.variants || []) as any,
          availabilityStatus: 'in_stock',
          visibility: 'published',
          isNew: p.isNew ?? false,
          isBestseller: p.isBestseller ?? false,
          isFeatured: p.isBestseller || p.isNew,
          featuredOrder: idx,
          featuredBadge: p.isBestseller ? 'Bestseller' : p.isNew ? 'New Arrival' : 'Featured',
          rating: p.rating ?? 4.8,
          reviewCount: p.reviewCount ?? 12,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        } as AdminProduct)
      })

      dbProducts.forEach((p) => {
        productMap.set(p.id, {
          ...p,
          featuredBadge: p.featuredBadge || (p.isBestseller ? 'Bestseller' : p.isNew ? 'New Arrival' : 'Featured'),
        })
      })

      const allMerged = Array.from(productMap.values())
      setAllProducts(allMerged)

      // Initialize featured products
      const dbFeatured = dbProducts.filter((p) => p.isFeatured)
      if (dbFeatured.length > 0) {
        setFeatured(dbFeatured.sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99)))
      } else {
        const defaultFeatured = allMerged
          .filter((p) => p.isFeatured)
          .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
          .slice(0, 6)
        setFeatured(defaultFeatured.length > 0 ? defaultFeatured : allMerged.slice(0, 6))
      }
    } catch {
      addToast('error', 'Failed to load products')
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
    loadAll()
  }, [user, authLoading])

  useGSAP(
    () => {
      if (loading) return
      gsap.fromTo(
        '.page-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' }
      )
      const rows = document.querySelectorAll('.item-row')
      if (rows.length > 0) {
        gsap.fromTo(
          '.item-row',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.35, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,y' }
        )
      }
    },
    { scope: containerRef, dependencies: [loading, activeTab, featured] }
  )

  const featuredIds = new Set(featured.map((f) => f.id))

  // ─── CRUD OPERATION: CREATE ──────────────────────────────
  const handleCreateFeatured = async () => {
    if (!selectedProductId || !user) return
    const product = allProducts.find((p) => p.id === selectedProductId)
    if (!product) return

    setIsSubmitting(true)
    const badgeToUse = selectedBadge === 'Custom' ? (customBadge.trim() || 'Featured') : selectedBadge
    const newOrder = addPosition === 'start' ? 0 : featured.length

    try {
      const token = await user.getIdToken()
      await addFeaturedProduct(token, {
        id: product.id,
        featuredOrder: newOrder,
        badge: badgeToUse,
      })

      const newEntry: AdminProduct = {
        ...product,
        isFeatured: true,
        featuredBadge: badgeToUse,
        featuredOrder: newOrder,
      }

      if (addPosition === 'start') {
        const updated = [newEntry, ...featured.filter((p) => p.id !== product.id)].map((p, i) => ({
          ...p,
          featuredOrder: i,
        }))
        setFeatured(updated)
      } else {
        const updated = [...featured.filter((p) => p.id !== product.id), newEntry].map((p, i) => ({
          ...p,
          featuredOrder: i,
        }))
        setFeatured(updated)
      }

      addToast('success', `Added "${product.name}" to featured products (${badgeToUse})`)
      setIsAddModalOpen(false)
      setSelectedProductId('')
      setCustomBadge('')
    } catch {
      addToast('error', 'Failed to add product to featured')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── CRUD OPERATION: UPDATE ──────────────────────────────
  const openEditModal = (product: AdminProduct, index: number) => {
    setEditingItem(product)
    setEditBadge(BADGE_OPTIONS.includes(product.featuredBadge || '') ? (product.featuredBadge || 'Featured') : 'Custom')
    setEditCustomBadge(BADGE_OPTIONS.includes(product.featuredBadge || '') ? '' : (product.featuredBadge || ''))
    setEditOrder(index + 1)
    setIsEditModalOpen(true)
  }

  const handleUpdateFeatured = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !user) return

    setIsSubmitting(true)
    const badgeToUse = editBadge === 'Custom' ? (editCustomBadge.trim() || 'Featured') : editBadge
    const targetIdx = Math.max(0, Math.min(featured.length - 1, editOrder - 1))

    try {
      // Reorder and update badge
      const without = featured.filter((p) => p.id !== editingItem.id)
      const updatedItem: AdminProduct = {
        ...editingItem,
        featuredBadge: badgeToUse,
      }
      without.splice(targetIdx, 0, updatedItem)
      const reordered = without.map((p, i) => ({ ...p, featuredOrder: i }))

      setFeatured(reordered)

      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        reordered.map((p, i) => ({
          id: p.id,
          featuredOrder: i,
          badge: p.featuredBadge || 'Featured',
        }))
      )

      addToast('success', `Updated "${editingItem.name}" (Badge: ${badgeToUse}, Position: #${targetIdx + 1})`)
      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch {
      addToast('error', 'Failed to update featured product')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick inline badge change
  const handleQuickBadgeChange = async (productId: string, newBadge: string) => {
    const updated = featured.map((p) => (p.id === productId ? { ...p, featuredBadge: newBadge } : p))
    setFeatured(updated)
    if (!user) return
    try {
      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        updated.map((p, i) => ({
          id: p.id,
          featuredOrder: i,
          badge: p.featuredBadge || 'Featured',
        }))
      )
      addToast('success', `Badge updated to "${newBadge}"`)
    } catch {
      addToast('error', 'Failed to update badge')
    }
  }

  // Reorder up / down
  const moveUp = async (idx: number) => {
    if (idx === 0 || !user) return
    const next = [...featured]
    ;[next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!]
    const reordered = next.map((p, i) => ({ ...p, featuredOrder: i }))
    setFeatured(reordered)

    try {
      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        reordered.map((p, i) => ({ id: p.id, featuredOrder: i, badge: p.featuredBadge }))
      )
    } catch {
      addToast('error', 'Failed to save new order')
    }
  }

  const moveDown = async (idx: number) => {
    if (idx >= featured.length - 1 || !user) return
    const next = [...featured]
    ;[next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!]
    const reordered = next.map((p, i) => ({ ...p, featuredOrder: i }))
    setFeatured(reordered)

    try {
      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        reordered.map((p, i) => ({ id: p.id, featuredOrder: i, badge: p.featuredBadge }))
      )
    } catch {
      addToast('error', 'Failed to save new order')
    }
  }

  // ─── CRUD OPERATION: DELETE / REMOVE ──────────────────────
  const handleDeleteFeatured = async (product: AdminProduct) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const token = await user.getIdToken()
      await removeFeaturedProduct(token, product.id)
      const updated = featured.filter((p) => p.id !== product.id).map((p, i) => ({ ...p, featuredOrder: i }))
      setFeatured(updated)
      setDeleteConfirmItem(null)
      addToast('success', `Removed "${product.name}" from featured products`)
    } catch {
      addToast('error', 'Failed to remove product from featured')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Batch Save all changes
  const handleSaveAll = async () => {
    if (!user) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        featured.map((p, i) => ({
          id: p.id,
          featuredOrder: i,
          badge: p.featuredBadge || 'Featured',
        }))
      )
      addToast('success', `Saved ${featured.length} featured products to storefront`)
    } catch {
      addToast('error', 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Seed default featured
  const handleSeedDefaults = async () => {
    if (!user) return
    setSaving(true)
    try {
      const defaults = allProducts.slice(0, 6).map((p, i) => ({
        ...p,
        isFeatured: true,
        featuredOrder: i,
        featuredBadge: p.isBestseller ? 'Bestseller' : p.isNew ? 'New Arrival' : 'Featured',
      }))
      setFeatured(defaults)

      const token = await user.getIdToken()
      await updateFeaturedProducts(
        token,
        defaults.map((p, i) => ({
          id: p.id,
          featuredOrder: i,
          badge: p.featuredBadge,
        }))
      )
      addToast('success', 'Default featured products populated')
    } catch {
      addToast('error', 'Failed to populate defaults')
    } finally {
      setSaving(false)
    }
  }

  const filteredFeatured = featured.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryLabel || p.category).toLowerCase().includes(search.toLowerCase()) ||
      (p.featuredBadge || '').toLowerCase().includes(search.toLowerCase())
  )

  const unfeaturedProducts = allProducts.filter((p) => !featuredIds.has(p.id))
  const filteredModalProducts = unfeaturedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      (p.categoryLabel || p.category).toLowerCase().includes(modalSearch.toLowerCase()) ||
      (p.colour || '').toLowerCase().includes(modalSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-16">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Featured Products</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            Manage, reorder, badge, and feature products showcased on the customer storefront.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-xs font-semibold hover:bg-white transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Feature New Product
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#FAF8F5] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#F7F4EE]" />}
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      {/* Navigation tabs & quick filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24221F] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('featured')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
              activeTab === 'featured'
                ? 'bg-[#1C1C1C] text-[#FAF8F5] border border-[#2E2E2E]'
                : 'text-[#8A8478] hover:text-[#FAF8F5]'
            )}
          >
            <Star className="w-3.5 h-3.5" />
            Featured List ({featured.length})
          </button>

          <button
            onClick={() => setActiveTab('catalogue')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
              activeTab === 'catalogue'
                ? 'bg-[#1C1C1C] text-[#FAF8F5] border border-[#2E2E2E]'
                : 'text-[#8A8478] hover:text-[#FAF8F5]'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Store Catalogue ({allProducts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8478]" />
          <input
            type="text"
            placeholder={activeTab === 'featured' ? 'Search featured...' : 'Search catalogue...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] transition-colors"
          />
        </div>
      </div>

      {/* ─── TAB 1: FEATURED PRODUCTS MANAGEMENT TABLE (CRUD) ─── */}
      {activeTab === 'featured' && (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
          {featured.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Sparkles className="w-12 h-12 text-[#8A8478]/30 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-[#FAF8F5]">No featured products configured</h3>
                <p className="text-xs text-[#8A8478] mt-1">
                  Add products to highlight them on the storefront homepage and shop banners.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] text-xs font-semibold rounded-lg hover:bg-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Product to Featured
                </button>
                <button
                  onClick={handleSeedDefaults}
                  className="px-4 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#FAF8F5] text-xs font-semibold rounded-lg hover:bg-[#262626] transition-all"
                >
                  Feature Top Bestsellers
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#24221F] bg-[#0E0E0E]">
                    <th className="text-center w-16 px-3 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                      Showcase Badge
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden md:table-cell">
                      Price
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                      Order
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24221F]/50">
                  {filteredFeatured.map((p, idx) => (
                    <tr key={p.id} className="item-row hover:bg-[#181818] transition-colors">
                      {/* Rank */}
                      <td className="text-center px-3 py-3 font-mono font-bold text-xs text-[#8A8478]">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#161616] border border-[#24221F] text-[#FAF8F5]">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#1C1C1C] border border-[#24221F] overflow-hidden shrink-0 relative">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-[#8A8478] absolute inset-0 m-auto" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#FAF8F5] truncate max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-[#8A8478] truncate">
                              {p.categoryLabel || p.category} {p.colour ? `· ${p.colour}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Showcase Badge dropdown */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 bg-[#181818] border border-[#2E2E2E] rounded-md px-2.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FAF8F5]" />
                          <select
                            value={p.featuredBadge || 'Featured'}
                            onChange={(e) => handleQuickBadgeChange(p.id, e.target.value)}
                            className="bg-transparent text-xs text-[#FAF8F5] font-medium outline-none cursor-pointer"
                          >
                            {BADGE_OPTIONS.map((b) => (
                              <option key={b} value={b} className="bg-[#1C1C1C] text-[#FAF8F5]">
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-xs font-medium text-[#FAF8F5] hidden md:table-cell">
                        {formatPrice(p.price)}
                      </td>

                      {/* Reorder Up/Down */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#161616] border border-[#24221F] rounded-lg p-0.5">
                          <button
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#222222] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move up in showcase"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveDown(idx)}
                            disabled={idx === featured.length - 1}
                            className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#222222] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move down in showcase"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* CRUD Actions: Edit & Delete */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p, idx)}
                            className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
                            title="Edit featured details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteConfirmItem(p)}
                            className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
                            title="Remove from featured"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: STORE CATALOGUE QUICK FEATURE PICKER ─── */}
      {activeTab === 'catalogue' && (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
          <div className="p-4 border-b border-[#24221F] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
              Published Store Products ({allProducts.length})
            </span>
            <span className="text-xs text-[#8A8478]">
              {featured.length} featured · {allProducts.length - featured.length} available
            </span>
          </div>

          <div className="divide-y divide-[#24221F]/50 max-h-[600px] overflow-y-auto">
            {allProducts
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                  (p.categoryLabel || p.category).toLowerCase().includes(search.toLowerCase()) ||
                  (p.colour || '').toLowerCase().includes(search.toLowerCase())
              )
              .map((p) => {
                const isAlreadyFeatured = featuredIds.has(p.id)
                const featIndex = featured.findIndex((f) => f.id === p.id)
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between gap-4 px-4 py-3 transition-colors',
                      isAlreadyFeatured ? 'bg-[#F7F4EE]/5' : 'hover:bg-[#181818]'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#1C1C1C] border border-[#24221F] overflow-hidden shrink-0 relative">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-[#8A8478] absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#FAF8F5] truncate">{p.name}</p>
                        <p className="text-xs text-[#8A8478] truncate">
                          {p.categoryLabel || p.category} · {formatPrice(p.price)} · Colour: {p.colour || 'Standard'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isAlreadyFeatured ? (
                        <>
                          <span className="text-xs font-medium text-[#FAF8F5] bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 px-2.5 py-0.5 rounded-full">
                            Rank #{featIndex + 1}
                          </span>
                          <button
                            onClick={() => setDeleteConfirmItem(p)}
                            className="px-3 py-1 text-xs font-medium rounded-md text-[#8A8478] border border-[#2E2E2E] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProductId(p.id)
                            setIsAddModalOpen(true)
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md text-[#0B0B0B] bg-[#F7F4EE] hover:bg-white transition-colors"
                        >
                          + Feature Product
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ─── CREATE MODAL: ADD PRODUCT TO FEATURED ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#24221F] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#FAF8F5]">Feature a Product</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  Select shoe from catalogue, assign showcase badge, and choose placement.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8A8478] hover:text-[#FAF8F5] p-1.5 rounded-lg hover:bg-[#1C1C1C] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#8A8478] uppercase tracking-wider">
                Select Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
                <input
                  type="text"
                  placeholder="Search catalogue by name, colour..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg pl-10 pr-4 py-2 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] mb-2"
                />
              </div>

              <div className="max-h-44 overflow-y-auto border border-[#24221F] rounded-lg divide-y divide-[#24221F]/50 bg-[#0B0B0B]">
                {filteredModalProducts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[#8A8478]">
                    No unfeatured products matching criteria
                  </p>
                ) : (
                  filteredModalProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-xs',
                        selectedProductId === p.id
                          ? 'bg-[#F7F4EE]/10 border-l-2 border-[#F7F4EE]'
                          : 'hover:bg-[#161616]'
                      )}
                    >
                      <div className="w-9 h-9 rounded bg-[#1C1C1C] border border-[#24221F] overflow-hidden shrink-0 relative">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#8A8478] absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#FAF8F5] truncate">{p.name}</p>
                        <p className="text-[11px] text-[#8A8478] truncate">
                          {p.categoryLabel || p.category} · {formatPrice(p.price)} · {p.colour || 'Standard'}
                        </p>
                      </div>
                      {selectedProductId === p.id && (
                        <Check className="w-4 h-4 text-[#F7F4EE] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Badge Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#8A8478] uppercase tracking-wider">
                Showcase Badge Tag
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BADGE_OPTIONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBadge(b)}
                    className={cn(
                      'px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all text-center truncate',
                      selectedBadge === b
                        ? 'bg-[#F7F4EE] text-[#0B0B0B] border-[#F7F4EE]'
                        : 'bg-[#0B0B0B] text-[#8A8478] border-[#24221F] hover:text-[#FAF8F5]'
                    )}
                  >
                    {b}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedBadge('Custom')}
                  className={cn(
                    'px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all text-center truncate',
                    selectedBadge === 'Custom'
                      ? 'bg-[#F7F4EE] text-[#0B0B0B] border-[#F7F4EE]'
                      : 'bg-[#0B0B0B] text-[#8A8478] border-[#24221F] hover:text-[#FAF8F5]'
                  )}
                >
                  Custom...
                </button>
              </div>

              {selectedBadge === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom badge (e.g. Flash Deal, 50% Off)..."
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE] mt-1.5"
                />
              )}
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#8A8478] uppercase tracking-wider">
                Display Order Placement
              </label>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#FAF8F5]">
                  <input
                    type="radio"
                    name="addPos"
                    checked={addPosition === 'end'}
                    onChange={() => setAddPosition('end')}
                    className="accent-[#F7F4EE]"
                  />
                  Append to End (Position #{featured.length + 1})
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#FAF8F5]">
                  <input
                    type="radio"
                    name="addPos"
                    checked={addPosition === 'start'}
                    onChange={() => setAddPosition('start')}
                    className="accent-[#F7F4EE]"
                  />
                  Prepend to Top (Position #1)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#24221F]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs text-[#8A8478] hover:text-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedProductId || isSubmitting}
                onClick={handleCreateFeatured}
                className="flex items-center gap-2 px-5 py-2 bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-xs rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {isSubmitting ? 'Adding...' : 'Add to Featured'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── UPDATE MODAL: EDIT FEATURED PRODUCT ─── */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#24221F] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#FAF8F5]">Edit Featured Product</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">{editingItem.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#8A8478] hover:text-[#FAF8F5] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFeatured} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8A8478] block mb-1.5 uppercase tracking-wider">
                  Showcase Badge
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BADGE_OPTIONS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setEditBadge(b)}
                      className={cn(
                        'px-2 py-1.5 text-xs rounded-lg border font-medium text-center truncate',
                        editBadge === b
                          ? 'bg-[#F7F4EE] text-[#0B0B0B] border-[#F7F4EE]'
                          : 'bg-[#0B0B0B] text-[#8A8478] border-[#24221F] hover:text-[#FAF8F5]'
                      )}
                    >
                      {b}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditBadge('Custom')}
                    className={cn(
                      'px-2 py-1.5 text-xs rounded-lg border font-medium text-center truncate',
                      editBadge === 'Custom'
                        ? 'bg-[#F7F4EE] text-[#0B0B0B] border-[#F7F4EE]'
                        : 'bg-[#0B0B0B] text-[#8A8478] border-[#24221F] hover:text-[#FAF8F5]'
                    )}
                  >
                    Custom...
                  </button>
                </div>

                {editBadge === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom badge text..."
                    value={editCustomBadge}
                    onChange={(e) => setEditCustomBadge(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE] mt-2"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-[#8A8478] block mb-1 uppercase tracking-wider">
                  Showcase Position Rank (1 to {featured.length})
                </label>
                <input
                  type="number"
                  min={1}
                  max={featured.length}
                  value={editOrder}
                  onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24221F]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#8A8478] hover:text-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-xs rounded-lg hover:bg-white disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#3A352F] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#FAF8F5]">
              <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-[#24221F] flex items-center justify-center shrink-0 text-[#FAF8F5]">
                <Trash2 className="w-5 h-5 text-[#8A8478]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#FAF8F5]">Remove from Featured?</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  "{deleteConfirmItem.name}" will no longer appear on the storefront featured showcase.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs text-[#8A8478] hover:text-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDeleteFeatured(deleteConfirmItem)}
                className="px-4 py-2 bg-[#1C1C1C] border border-[#3A352F] text-[#FAF8F5] font-semibold text-xs rounded-lg hover:bg-[#252525] disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Remove
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
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto border shadow-xl bg-[#141414]',
              t.type === 'success'
                ? 'text-[#FAF8F5] border-[#F7F4EE]/30'
                : 'text-[#D4CBBF] border-[#3A352F]'
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
