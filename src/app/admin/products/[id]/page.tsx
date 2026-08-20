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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>
  if (!product) return <div className="text-center py-20 text-[#6B6B6B]">Product not found</div>

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#161616] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#F0EDE8]">{product.name}</h1>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', product.visibility === 'published' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D]' : 'bg-[#6B6B6B]/10 text-[#6B6B6B]')}>
                {product.visibility || 'draft'}
              </span>
            </div>
            <p className="text-[#6B6B6B] text-sm mt-1">{product.slug}</p>
          </div>
        </div>
        <button onClick={() => router.push(`/admin/products/${product.id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-[#161616] text-[#F0EDE8] border border-[#2A2A2A] rounded-lg text-sm font-medium hover:bg-[#1E1E1E] transition-colors">
          <Edit2 className="w-4 h-4" /> Edit Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#6B6B6B] block">Brand</span><span className="text-[#F0EDE8]">{product.brand}</span></div>
              <div><span className="text-[#6B6B6B] block">Category</span><span className="text-[#F0EDE8] capitalize">{product.categoryLabel || product.category}</span></div>
              <div><span className="text-[#6B6B6B] block">Colour</span><span className="text-[#F0EDE8]">{product.colour || '—'}</span></div>
              <div><span className="text-[#6B6B6B] block">Subtitle</span><span className="text-[#F0EDE8]">{product.subtitle || '—'}</span></div>
              <div className="col-span-2"><span className="text-[#6B6B6B] block mb-1">Description</span><p className="text-[#F0EDE8] whitespace-pre-wrap">{product.description}</p></div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#6B6B6B] block">Price</span><span className="text-[#F0EDE8] text-lg font-medium">{formatPrice(product.price)}</span></div>
              <div><span className="text-[#6B6B6B] block">Compare At Price</span><span className="text-[#F0EDE8]">{product.compareAtPrice ? formatPrice(product.compareAtPrice) : '—'}</span></div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Images</h2>
            <div className="flex flex-wrap gap-4">
              {product.images && product.images.length > 0 ? (
                product.images.map((img, i) => (
                  <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#2A2A2A]">
                    <Image src={img} alt="" fill sizes="128px" className="object-cover" />
                  </div>
                ))
              ) : (
                <div className="w-32 h-32 rounded-lg border border-[#2A2A2A] flex items-center justify-center bg-[#0D0D0D]">
                  <Package className="w-8 h-8 text-[#6B6B6B]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Created</span><span className="text-[#F0EDE8]">{formatDate(product.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Updated</span><span className="text-[#F0EDE8]">{formatDate(product.updatedAt)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Status</span><span className={cn('capitalize', product.availabilityStatus === 'out_of_stock' ? 'text-[#E05252]' : product.availabilityStatus === 'low_stock' ? 'text-[#E8B86D]' : 'text-[#4CAF7D]')}>{product.availabilityStatus?.replace('_', ' ')}</span></div>
            </div>
          </div>

          {/* Variants/Stock */}
          <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Inventory</h2>
            <div className="space-y-2">
              {product.variants?.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] text-sm">
                  <span className="text-[#F0EDE8] font-medium">EU {v.size}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#6B6B6B] font-mono text-xs">{v.sku}</span>
                    <span className={cn('w-12 text-right', v.stockQty === 0 ? 'text-[#E05252]' : v.stockQty <= 5 ? 'text-[#E8B86D]' : 'text-[#4CAF7D]')}>{v.stockQty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Details */}
          {product.details && product.details.length > 0 && (
            <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Additional Details</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-[#F0EDE8]">
                {product.details.filter(d => d.trim()).map((d, i) => (
                  <li key={i} className="text-[#6B6B6B]"><span className="text-[#F0EDE8]">{d}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
