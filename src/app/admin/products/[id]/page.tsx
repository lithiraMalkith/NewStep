'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchProduct } from '@/lib/admin-client'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, Loader2, Package, Edit2 } from 'lucide-react'
import type { AdminProduct } from '@/types'

export default function ProductViewPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !productId) { setLoading(false); return }
    const loadProduct = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchProduct(token, productId)
        setProduct(data)
      } catch (err) {
        // Handle error if needed
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [user, authLoading, productId])

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>
  if (!product) return <div className="text-center py-20 text-[#8A8478]">Product not found</div>

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#FAF8F5]">{product.name}</h1>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', product.visibility === 'published' ? 'bg-white/10 text-white border border-white/20' : 'bg-[#8A8478]/10 text-[#8A8478]')}>
                {product.visibility || 'draft'}
              </span>
            </div>
            <p className="text-[#8A8478] text-sm mt-1">{product.slug}</p>
          </div>
        </div>
        <button onClick={() => router.push(`/admin/products/${product.id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs">
          <Edit2 className="w-4 h-4" /> Edit Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#8A8478] block">Brand</span><span className="text-[#FAF8F5]">{product.brand}</span></div>
              <div><span className="text-[#8A8478] block">Category</span><span className="text-[#FAF8F5] capitalize">{product.categoryLabel || product.category}</span></div>
              <div><span className="text-[#8A8478] block">Colour</span><span className="text-[#FAF8F5]">{product.colour || '—'}</span></div>
              <div><span className="text-[#8A8478] block">Subtitle</span><span className="text-[#FAF8F5]">{product.subtitle || '—'}</span></div>
              <div className="col-span-2"><span className="text-[#8A8478] block mb-1">Description</span><p className="text-[#FAF8F5] whitespace-pre-wrap">{product.description}</p></div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#8A8478] block">Price</span><span className="text-[#FAF8F5] text-lg font-medium">{formatPrice(product.price)}</span></div>
              <div><span className="text-[#8A8478] block">Compare At Price</span><span className="text-[#FAF8F5]">{product.compareAtPrice ? formatPrice(product.compareAtPrice) : '—'}</span></div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Images</h2>
            <div className="flex flex-wrap gap-4">
              {product.images && product.images.length > 0 ? (
                product.images.map((img, i) => (
                  <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#24221F]">
                    <Image src={img} alt="" fill sizes="128px" className="object-cover" />
                  </div>
                ))
              ) : (
                <div className="w-32 h-32 rounded-lg border border-[#24221F] flex items-center justify-center bg-[#0B0B0B]">
                  <Package className="w-8 h-8 text-[#8A8478]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#8A8478]">Created</span><span className="text-[#FAF8F5]">{formatDate(product.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-[#8A8478]">Updated</span><span className="text-[#FAF8F5]">{formatDate(product.updatedAt)}</span></div>
              <div className="flex justify-between"><span className="text-[#8A8478]">Status</span><span className={cn('capitalize', product.availabilityStatus === 'out_of_stock' ? 'text-[#E05252]' : product.availabilityStatus === 'low_stock' ? 'text-[#D4CBBF]' : 'text-[#FAF8F5]')}>{product.availabilityStatus?.replace('_', ' ')}</span></div>
            </div>
          </div>

          {/* Variants/Stock */}
          <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Inventory</h2>
            <div className="space-y-2">
              {product.variants?.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#24221F] bg-[#0B0B0B] text-sm">
                  <span className="text-[#FAF8F5] font-medium">EU {v.size}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#8A8478] font-mono text-xs">{v.sku}</span>
                    <span className={cn('w-12 text-right', v.stockQty === 0 ? 'text-[#E05252]' : v.stockQty <= 5 ? 'text-[#D4CBBF]' : 'text-[#FAF8F5]')}>{v.stockQty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Details */}
          {product.details && product.details.length > 0 && (
            <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider mb-4">Additional Details</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-[#FAF8F5]">
                {product.details.filter(d => d.trim()).map((d, i) => (
                  <li key={i} className="text-[#8A8478]"><span className="text-[#FAF8F5]">{d}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
