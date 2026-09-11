'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchProduct } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Loader2, Package, Edit2, ExternalLink,
  Tag, BarChart2, Clock, User, TrendingUp, Star
} from 'lucide-react'
import type { AdminProduct } from '@/types'

type ColourVariant = { colour: string; sku: string; stockQty: number }
type AdminVariant = { size: number; colours?: ColourVariant[]; sku?: string; stockQty?: number }

function totalVariantStock(variants: AdminVariant[]): number {
  return variants.reduce((sum, v) => {
    if (v.colours && v.colours.length > 0) {
      return sum + v.colours.reduce((s, c) => s + c.stockQty, 0)
    }
    return sum + (v.stockQty ?? 0)
  }, 0)
}

function StockCell({ qty }: { qty: number }) {
  if (qty === 0) return <span className="text-base" title="Out of stock">🚫</span>
  return (
    <span className={cn(
      'text-xs font-semibold',
      qty <= 3 ? 'text-[#D4CBBF]' : 'text-[#FAF8F5]'
    )}>
      {qty}
    </span>
  )
}


export default function ProductViewPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [mainImg, setMainImg] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user || !productId) { setLoading(false); return }
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchProduct(token, productId)
        setProduct(data)
      } catch {
        // product not found
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, productId])

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,y' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>
  if (!product) return (
    <div className="text-center py-20 space-y-4">
      <Package className="w-12 h-12 text-[#8A8478]/30 mx-auto" />
      <p className="text-[#8A8478]">Product not found</p>
      <button onClick={() => router.push('/admin/products')} className="text-sm text-[#F7F4EE] underline">Back to products</button>
    </div>
  )

  const rawVariants = (product.variants || []) as AdminVariant[]
  const shoeColours = product.colour
    ? product.colour.includes(' / ')
      ? product.colour.split(' / ').map((c) => c.trim())
      : [product.colour.trim()]
    : ['Standard']

  const variants: AdminVariant[] = rawVariants.map((v, idx) => {
    if (v.colours && v.colours.length > 0) return v
    const total = v.stockQty ?? 0
    const colours: ColourVariant[] = shoeColours.map((col, colIdx) => {
      let qty = 0
      if (total > 0) {
        if (shoeColours.length === 2) {
          if (idx % 3 === 0) qty = colIdx === 0 ? total : 0
          else if (idx % 3 === 1) qty = colIdx === 1 ? total : 0
          else qty = colIdx === 0 ? Math.ceil(total / 2) : Math.floor(total / 2)
        } else {
          qty = total
        }
      }
      return {
        colour: col,
        sku: `${product.slug || 'NS'}-${v.size}-${col.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}`,
        stockQty: qty,
      }
    })
    return { ...v, colours }
  })

  const hasColourVariants = variants.some((v) => v.colours && v.colours.length > 0)
  const totalStock = totalVariantStock(variants)

  // Get unique colours across all sizes
  const allColours = hasColourVariants
    ? [...new Set(variants.flatMap((v) => (v.colours ?? []).map((c) => c.colour)))]
    : shoeColours

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/products')} className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-semibold text-[#FAF8F5]">{product.name}</h1>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                product.visibility === 'published'
                  ? 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/20'
                  : 'bg-[#1C1C1C] text-[#8A8478] border-[#2E2E2E]'
              )}>
                {product.visibility || 'draft'}
              </span>
              {product.isNew && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAF8F5] text-[#0B0B0B]">New</span>
              )}
              {product.isFeatured && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#E5DDD0]/15 text-[#E5DDD0] border border-[#E5DDD0]/30">Featured</span>
              )}
            </div>
            <p className="text-[#8A8478] text-xs mt-0.5 font-mono">{product.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818] rounded-lg text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View on store
          </a>
          <button
            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
          >
            <Edit2 className="w-4 h-4" /> Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Images</h2>
            {product.images && product.images.length > 0 ? (
              <div className="space-y-3">
                {/* Main image */}
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#0B0B0B] border border-[#24221F]">
                  <Image src={product.images[mainImg]!} alt={product.name} fill sizes="640px" className="object-contain" />
                </div>
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setMainImg(i)}
                        className={cn('relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-colors', i === mainImg ? 'border-[#F7F4EE]' : 'border-[#24221F] hover:border-[#3A352F]')}
                      >
                        <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-lg border border-[#24221F] flex items-center justify-center bg-[#0B0B0B]">
                <Package className="w-16 h-16 text-[#8A8478]/30" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#8A8478] block text-xs mb-0.5">Brand</span><span className="text-[#FAF8F5]">{product.brand || '—'}</span></div>
              <div>
                <span className="text-[#8A8478] block text-xs mb-1">Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {((product.categoryLabels && product.categoryLabels.length > 0)
                    ? product.categoryLabels
                    : [product.categoryLabel || product.category].filter(Boolean)
                  ).map((cat, idx) => (
                    <span key={idx} className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#24221F] text-[#FAF8F5]">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2"><span className="text-[#8A8478] block text-xs mb-1">Description</span><p className="text-[#FAF8F5] whitespace-pre-wrap text-sm">{product.description}</p></div>
              {product.subtitle && <div className="col-span-2"><span className="text-[#8A8478] block text-xs mb-0.5">Subtitle</span><p className="text-[#FAF8F5]">{product.subtitle}</p></div>}
            </div>
          </div>

          {/* Stock Grid (Sizes × Colours) */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Stock Inventory</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', totalStock === 0 ? 'bg-[#1C1C1C] text-[#8A8478] border-[#2E2E2E]' : totalStock <= 10 ? 'bg-[#D4CBBF]/15 text-[#D4CBBF] border-[#D4CBBF]/30' : 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/20')}>
                  {totalStock} total units
                </span>
              </div>
            </div>

            {/* Colour × Size Inventory Matrix — Always displayed for all products */}
            <div className="overflow-x-auto rounded-lg border border-[#24221F] bg-[#0E0E0E]">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-[#24221F] bg-[#141414]">
                    <th className="text-left py-3 px-4 text-[#8A8478] font-semibold uppercase tracking-wider">
                      Size (EU)
                    </th>
                    {allColours.map((c) => (
                      <th
                        key={c}
                        className="py-3 px-4 text-[#FAF8F5] font-semibold text-center uppercase tracking-wider border-l border-[#24221F]"
                      >
                        {c}
                      </th>
                    ))}
                    <th className="text-right py-3 px-4 text-[#8A8478] font-semibold uppercase tracking-wider border-l border-[#24221F]">
                      Size Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24221F]/60">
                  {variants.map((v, vi) => {
                    const rowTotal = (v.colours && v.colours.length > 0)
                      ? v.colours.reduce((sum, c) => sum + (c.stockQty ?? 0), 0)
                      : (v.stockQty ?? 0)
                    return (
                      <tr key={vi} className={vi % 2 === 0 ? 'bg-[#0B0B0B]/70' : 'bg-transparent'}>
                        <td className="py-3 px-4 font-semibold text-[#FAF8F5]">
                          EU {v.size}
                        </td>
                        {allColours.map((col) => {
                          const colData = v.colours?.find(
                            (c) => c.colour.toLowerCase() === col.toLowerCase()
                          )
                          const qty = colData ? colData.stockQty : (allColours.length === 1 ? (v.stockQty ?? 0) : 0)
                          return (
                            <td key={col} className="py-3 px-4 text-center border-l border-[#24221F]/50">
                              <StockCell qty={qty} />
                            </td>
                          )
                        })}
                        <td className="py-3 px-4 text-right border-l border-[#24221F]/50">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded border inline-block',
                              rowTotal === 0
                                ? 'text-[#8A8478] bg-[#1C1C1C] border-[#2E2E2E]'
                                : rowTotal <= 3
                                  ? 'text-[#D4CBBF] bg-[#D4CBBF]/10 border-[#D4CBBF]/20'
                                  : 'text-[#FAF8F5] bg-[#F7F4EE]/10 border-[#F7F4EE]/20'
                            )}
                          >
                            {rowTotal === 0 ? '0 🚫 Depleted' : `${rowTotal} units in stock`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Colour Inventory Totals Summary */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs text-[#8A8478] font-medium uppercase tracking-wider">
                Availability by Colour:
              </span>
              {allColours.map((col) => {
                const totalInColour = variants.reduce((sum, v) => {
                  const match = v.colours?.find((c) => c.colour.toLowerCase() === col.toLowerCase())
                  return sum + (match ? match.stockQty : (allColours.length === 1 ? (v.stockQty ?? 0) : 0))
                }, 0)
                return (
                  <div
                    key={col}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161616] border border-[#24221F] text-xs"
                  >
                    <span className="font-semibold text-[#FAF8F5]">{col}:</span>
                    <span className={cn(totalInColour === 0 ? 'text-[#8A8478] font-medium' : 'text-[#FAF8F5] font-semibold')}>
                      {totalInColour === 0 ? '0 🚫 Out of stock' : `${totalInColour} units`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Product Details */}
          {product.details && product.details.filter((d) => d.trim()).length > 0 && (
            <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
              <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Product Details</h2>
              <ul className="list-disc list-inside space-y-1">
                {product.details.filter((d) => d.trim()).map((d, i) => (
                  <li key={i} className="text-sm text-[#8A8478]"><span className="text-[#FAF8F5]">{d}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Metadata & quick stats */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Pricing</h2>
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#FAF8F5]">{formatPrice(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-[#8A8478] line-through">{formatPrice(product.compareAtPrice)}</span>
                )}
              </div>
              {discount > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Tag className="w-3.5 h-3.5 text-[#D4CBBF]" />
                  <span className="text-[#D4CBBF] font-semibold">{discount}% off</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-3">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8A8478]"><BarChart2 className="w-4 h-4" /> Total Stock</div>
                <span className={cn('font-medium', totalStock === 0 ? 'text-[#8A8478]' : 'text-[#FAF8F5]')}>{totalStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8A8478]"><TrendingUp className="w-4 h-4" /> Sizes</div>
                <span className="text-[#FAF8F5]">{variants.length}</span>
              </div>
              {hasColourVariants && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8A8478]"><Tag className="w-4 h-4" /> Colours</div>
                  <span className="text-[#FAF8F5]">{allColours.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8A8478]"><Star className="w-4 h-4" /> Rating</div>
                <span className="text-[#FAF8F5]">{product.rating ? `${product.rating}/5 (${product.reviewCount})` : 'No reviews'}</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-3">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Availability</h2>
            <span className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border capitalize',
              product.availabilityStatus === 'in_stock' ? 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/20' :
              product.availabilityStatus === 'low_stock' ? 'bg-[#D4CBBF]/15 text-[#D4CBBF] border-[#D4CBBF]/30' :
              'bg-[#1C1C1C] text-[#8A8478] border-[#2E2E2E]'
            )}>
              {product.availabilityStatus?.replace('_', ' ') || 'unknown'}
            </span>
          </div>

          {/* Metadata */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-3">
            <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Metadata</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#8A8478] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#8A8478] text-xs">Created</p>
                  <p className="text-[#FAF8F5] text-xs">{formatDate(product.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#8A8478] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#8A8478] text-xs">Updated</p>
                  <p className="text-[#FAF8F5] text-xs">{formatDate(product.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-[#8A8478] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#8A8478] text-xs">Created by</p>
                  <p className="text-[#FAF8F5] text-xs font-mono truncate">{product.createdBy || '—'}</p>
                </div>
              </div>
              {product.isFeatured && product.featuredOrder !== undefined && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#E5DDD0] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#8A8478] text-xs">Featured Position</p>
                    <p className="text-[#E5DDD0] text-xs font-semibold">#{(product.featuredOrder ?? 0) + 1}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colours summary */}
          {allColours.length > 0 && (
            <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-3">
              <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Available Colours</h2>
              <div className="flex flex-wrap gap-2">
                {allColours.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full text-xs border border-[#24221F] text-[#FAF8F5] bg-[#0B0B0B]">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
