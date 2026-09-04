'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { createProduct } from '@/lib/admin-client'
import { uploadImage } from '@/lib/admin-client'
import { cn, slugify } from '@/lib/utils'
import { ArrowLeft, Plus, X, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Toast { id: string; type: 'success' | 'error'; message: string }

const CATEGORIES = [
  { value: 'mens', label: "Men's" },
  { value: 'womens', label: "Women's" },
  { value: 'kids', label: "Kids'" },
  { value: 'sale', label: 'Sale' },
]

const DEFAULT_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45]

export default function ProductNewPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlugVal] = useState('')
  const [brand, setBrand] = useState('New Step')
  const [description, setDescription] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [colour, setColour] = useState('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [category, setCategory] = useState('mens')
  const [categoryLabel, setCategoryLabel] = useState("Men's")
  const [details, setDetails] = useState<string[]>([''])
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState(DEFAULT_SIZES.map((s) => ({ size: s, sku: '', stockQty: 0 })))
  const [visibility, setVisibility] = useState<'draft' | 'published'>('draft')
  const [isNew, setIsNew] = useState(true)

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  useGSAP(() => {
    gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' })
  }, { scope: containerRef })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const token = await user.getIdToken()
        const result = await uploadImage(token, base64)
        setImages((prev) => [...prev, result.url])
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      addToast('error', 'Image upload failed')
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const activeVariants = variants.filter((v) => v.stockQty > 0 || v.sku)
      const finalVariants = activeVariants.length > 0 ? activeVariants : [{ size: 40, sku: `NS-${category.toUpperCase()}-001`, stockQty: 10 }]

      await createProduct(token, {
        name,
        slug: slug || slugify(name),
        brand,
        description,
        subtitle: subtitle || name,
        colour,
        colourway: colour ? [colour] : [],
        price: parseFloat(price) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        category,
        categoryLabel,
        details: details.filter((d) => d.trim()),
        images,
        variants: finalVariants.map((v, i) => ({ ...v, sku: v.sku || `NS-${category.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}` })),
        visibility,
        isNew,
        rating: 0,
        reviewCount: 0,
      } as never)

      addToast('success', 'Product created!')
      setTimeout(() => router.push('/admin/products'), 1000)
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/products')} className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-semibold text-[#FAF8F5]">New Product</h1>
      </div>

      {/* Basic Info */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-[#8A8478] mb-1 block">Product Name *</label><input value={name} onChange={(e) => { setName(e.target.value); setSlugVal(slugify(e.target.value)) }} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Slug</label><input value={slug} onChange={(e) => setSlugVal(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] font-mono text-xs" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Brand</label><input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Subtitle</label><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Short tagline" className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE]" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Colour</label><input value={colour} onChange={(e) => setColour(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Category *</label><select value={category} onChange={(e) => { setCategory(e.target.value); setCategoryLabel(CATEGORIES.find((c) => c.value === e.target.value)?.label || e.target.value) }} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
        </div>
        <div><label className="text-xs text-[#8A8478] mb-1 block">Description *</label><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
      </div>

      {/* Pricing */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-[#8A8478] mb-1 block">Price (Rs.) *</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" /></div>
          <div><label className="text-xs text-[#8A8478] mb-1 block">Compare At Price (Rs.)</label><input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="Original price for sale items" className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE]" /></div>
        </div>
      </div>

      {/* Images */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#24221F]">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-[#24221F] flex items-center justify-center cursor-pointer hover:border-[#F7F4EE] transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-[#8A8478] animate-spin" /> : <Upload className="w-5 h-5 text-[#8A8478]" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Sizes & Stock</h2>
        <p className="text-xs text-[#8A8478]">Set stock for each size. Sizes with 0 stock will be shown as &quot;Sold Out&quot;.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {variants.map((v, i) => (
            <div key={v.size} className={cn('p-3 rounded-lg border text-center', v.stockQty > 0 ? 'border-[#F7F4EE]/30 bg-[#F7F4EE]/5' : 'border-[#24221F] bg-[#0B0B0B]')}>
              <p className="text-xs text-[#8A8478] mb-1">EU {v.size}</p>
              <input type="number" min="0" value={v.stockQty} onChange={(e) => { const next = [...variants]; next[i] = { ...next[i]!, stockQty: Math.max(0, parseInt(e.target.value) || 0) }; setVariants(next) }} className="w-full bg-transparent text-center text-[#FAF8F5] text-sm font-medium outline-none border-b border-[#24221F] focus:border-[#F7F4EE] pb-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Product Details</h2>
        {details.map((d, i) => (
          <div key={i} className="flex gap-2">
            <input value={d} onChange={(e) => { const next = [...details]; next[i] = e.target.value; setDetails(next) }} placeholder={`Detail ${i + 1}`} className="flex-1 bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
            {details.length > 1 && <button onClick={() => setDetails((p) => p.filter((_, j) => j !== i))} className="p-2 text-[#8A8478] hover:text-[#E05252]"><X className="w-4 h-4" /></button>}
          </div>
        ))}
        <button onClick={() => setDetails((p) => [...p, ''])} className="flex items-center gap-1 text-xs text-[#F7F4EE] hover:text-white"><Plus className="w-3.5 h-3.5" /> Add detail</button>
      </div>

      {/* Visibility */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Publishing</h2>
        <div className="flex gap-3">
          <button onClick={() => setVisibility('published')} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', visibility === 'published' ? 'bg-white/10 border-white/30 text-white' : 'border-[#24221F] text-[#8A8478]')}>Published</button>
          <button onClick={() => setVisibility('draft')} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', visibility === 'draft' ? 'bg-[#F7F4EE]/10 border-[#F7F4EE]/30 text-[#F7F4EE]' : 'border-[#24221F] text-[#8A8478]')}>Draft</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#FAF8F5] cursor-pointer"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="rounded accent-[#F7F4EE]" /> Mark as &quot;New Arrival&quot;</label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push('/admin/products')} className="px-6 py-3 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#181818]">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !name.trim() || !price} className="flex-1 sm:flex-none px-8 py-3 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs">
          {saving && <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0B]" />}{saving ? 'Creating...' : 'Create Product'}
        </button>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">{toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{t.message}</div>))}</div>
    </div>
  )
}
