'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchProduct, updateProduct, uploadImage } from '@/lib/admin-client'
import { cn, slugify } from '@/lib/utils'
import { ArrowLeft, Plus, X, Upload, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface ColourRow { colour: string; sku: string; stockQty: number }
interface SizeVariant { size: number; colours: ColourRow[]; expanded: boolean }
interface Toast { id: string; type: 'success' | 'error'; message: string }

const STATIC_CATEGORIES = [
  { value: 'mens', label: "Men's" },
  { value: 'womens', label: "Women's" },
  { value: 'kids', label: "Kids'" },
  { value: 'sale', label: 'Sale' },
]

const DEFAULT_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45]

function makeDefaultVariants(): SizeVariant[] {
  return DEFAULT_SIZES.map((s) => ({ size: s, colours: [], expanded: false }))
}

/** Convert saved Firestore variants to UI SizeVariant list */
function adaptVariants(saved: unknown[]): SizeVariant[] {
  const sizesMap: Record<number, ColourRow[]> = {}
  for (const v of saved as Record<string, unknown>[]) {
    const size = v.size as number
    const colours = v.colours as ColourRow[] | undefined
    if (!sizesMap[size]) sizesMap[size] = []
    if (colours && colours.length > 0) {
      sizesMap[size] = [...(sizesMap[size] || []), ...colours]
    } else if (v.sku || (v.stockQty as number) > 0) {
      // Legacy flat variant — wrap as single colour row
      sizesMap[size] = [{ colour: 'Default', sku: v.sku as string || '', stockQty: v.stockQty as number || 0 }]
    }
  }

  return DEFAULT_SIZES.map((s) => ({
    size: s,
    colours: sizesMap[s] ?? [],
    expanded: (sizesMap[s] ?? []).length > 0,
  }))
}

export default function ProductEditPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [categoryOptions, setCategoryOptions] = useState(STATIC_CATEGORIES)

  // Fetch categories from admin panel or storefront
  useEffect(() => {
    async function loadCategories() {
      try {
        let items: { slug: string; name: string }[] = []
        if (user) {
          try {
            const token = await user.getIdToken()
            const authRes = await fetch('/api/categories', {
              headers: { Authorization: `Bearer ${token}` }
            })
            const authJson = await authRes.json()
            if (authJson.success && authJson.data?.length > 0) {
              items = authJson.data
            }
          } catch { /* fallback */ }
        }

        if (items.length === 0) {
          const res = await fetch('/api/storefront/navigation')
          const json = await res.json()
          if (json.success && json.data?.length > 0) {
            items = json.data
          }
        }

        if (items.length > 0) {
          const fetched = items.map((c) => ({ value: c.slug, label: c.name }))
          STATIC_CATEGORIES.forEach((sc) => {
            if (!fetched.some((c) => c.value === sc.value)) {
              fetched.push(sc)
            }
          })
          setCategoryOptions(fetched)
        }
      } catch { /* keep static fallback */ }
    }
    loadCategories()
  }, [user])

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlugVal] = useState('')
  const [brand, setBrand] = useState('')
  const [description, setDescription] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [details, setDetails] = useState<string[]>([''])
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<SizeVariant[]>(makeDefaultVariants())
  const [visibility, setVisibility] = useState<'draft' | 'published'>('draft')
  const [isNew, setIsNew] = useState(false)

  const toggleCategory = (val: string) => {
    setSelectedCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    )
  }

  const setAsPrimaryCategory = (e: React.MouseEvent, val: string) => {
    e.stopPropagation()
    setSelectedCategories((prev) => [val, ...prev.filter((c) => c !== val)])
  }

  useEffect(() => {
    const loadProduct = async () => {
      if (!user || !productId) return
      try {
        const token = await user.getIdToken()
        const data = await fetchProduct(token, productId)
        setName(data.name || '')
        setSlugVal(data.slug || '')
        setBrand(data.brand || '')
        setDescription(data.description || '')
        setSubtitle(data.subtitle || '')
        setPrice(data.price?.toString() || '')
        setCompareAtPrice(data.compareAtPrice?.toString() || '')

        // Load multiple categories or single legacy category
        const initialCategories = (data.categories && Array.isArray(data.categories) && data.categories.length > 0)
          ? data.categories
          : data.category ? [data.category] : []
        setSelectedCategories(initialCategories)

        // If product has category values not in current categoryOptions, append them
        if (initialCategories.length > 0) {
          setCategoryOptions((prev) => {
            const existingVals = new Set(prev.map((c) => c.value))
            const newOpts = [...prev]
            initialCategories.forEach((catVal: string, idx: number) => {
              if (!existingVals.has(catVal)) {
                const lbl = data.categoryLabels?.[idx] || (catVal === data.category ? data.categoryLabel : undefined) || catVal
                newOpts.push({ value: catVal, label: lbl })
                existingVals.add(catVal)
              }
            })
            return newOpts
          })
        }

        setDetails(data.details?.length ? data.details : [''])
        setImages(data.images || [])
        if (data.variants?.length) {
          setVariants(adaptVariants(data.variants as unknown[]))
        }
        setVisibility(data.visibility || 'draft')
        setIsNew(data.isNew || false)
      } catch {
        // product not found
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [user, productId])

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' })
    }
  }, { scope: containerRef, dependencies: [loading] })

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

  // Colour variant helpers
  const toggleSize = (i: number) => {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, expanded: !v.expanded } : v))
  }

  const addColour = (sizeIdx: number) => {
    setVariants((prev) => prev.map((v, idx) => {
      if (idx !== sizeIdx) return v
      const primaryCat = selectedCategories[0] || 'GEN'
      const catPrefix = primaryCat.slice(0, 3).toUpperCase()
      const newSku = `NS-${catPrefix}-${v.size}-${String(v.colours.length + 1).padStart(2, '0')}`
      return { ...v, colours: [...v.colours, { colour: '', sku: newSku, stockQty: 0 }], expanded: true }
    }))
  }

  const updateColour = (sizeIdx: number, colIdx: number, field: keyof ColourRow, value: string | number) => {
    setVariants((prev) => prev.map((v, idx) => {
      if (idx !== sizeIdx) return v
      return { ...v, colours: v.colours.map((c, ci) => ci === colIdx ? { ...c, [field]: value } : c) }
    }))
  }

  const removeColour = (sizeIdx: number, colIdx: number) => {
    setVariants((prev) => prev.map((v, idx) => {
      if (idx !== sizeIdx) return v
      return { ...v, colours: v.colours.filter((_, ci) => ci !== colIdx) }
    }))
  }

  const totalStock = (v: SizeVariant) => v.colours.reduce((sum, c) => sum + (c.stockQty || 0), 0)

  const handleSubmit = async () => {
    if (!user || !name.trim() || !price || selectedCategories.length === 0) {
      addToast('error', 'Please fill in all required fields and select at least one category')
      return
    }
    setSaving(true)
    try {
      const token = await user.getIdToken()

      const primaryCategory = selectedCategories[0] || ''
      const primaryCategoryLabel = categoryOptions.find((c) => c.value === primaryCategory)?.label || primaryCategory
      const categoryLabels = selectedCategories.map(
        (val) => categoryOptions.find((c) => c.value === val)?.label || val
      )
      const catPrefix = primaryCategory.slice(0, 3).toUpperCase() || 'GEN'

      const apiVariants = variants
        .filter((v) => v.colours.length > 0)
        .map((v) => ({
          size: v.size,
          colours: v.colours,
          sku: v.colours[0]?.sku || `NS-${catPrefix}-${v.size}`,
          stockQty: totalStock(v),
        }))

      const finalVariants = apiVariants.length > 0
        ? apiVariants
        : [{ size: 40, colours: [], sku: `NS-${catPrefix}-001`, stockQty: 0 }]

      await updateProduct(token, productId, {
        name,
        slug: slug || slugify(name),
        brand,
        description,
        subtitle: subtitle || name,
        colour: variants.flatMap(v => v.colours.map(c => c.colour)).filter(Boolean)[0] || '',
        colourway: [...new Set(variants.flatMap(v => v.colours.map(c => c.colour)).filter(Boolean))],
        price: parseFloat(price) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        category: primaryCategory,
        categoryLabel: primaryCategoryLabel,
        categories: selectedCategories,
        categoryLabels,
        details: details.filter((d) => d.trim()),
        images,
        variants: finalVariants as never,
        visibility,
        isNew,
      } as never)

      addToast('success', 'Product updated!')
      setTimeout(() => router.push(`/admin/products/${productId}`), 1000)
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/admin/products/${productId}`)} className="p-2 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-semibold text-[#FAF8F5]">Edit Product</h1>
      </div>

      {/* Basic Info */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Product Name *</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setSlugVal(slugify(e.target.value)) }} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Slug</label>
            <input value={slug} onChange={(e) => setSlugVal(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] font-mono text-xs" />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Brand</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#8A8478] font-medium">
                Categories * <span className="text-[#8A8478]/70 font-normal">(Select one or more)</span>
              </label>
              {selectedCategories.length > 0 && (
                <span className="text-xs text-[#FAF8F5]/80 bg-[#1C1C1C] px-2 py-0.5 rounded-full border border-[#24221F]">
                  {selectedCategories.length} selected
                </span>
              )}
            </div>

            <div
              className={cn(
                'flex flex-wrap gap-2 p-3 bg-[#0B0B0B] border rounded-lg min-h-[52px] items-center transition-colors',
                selectedCategories.length === 0 ? 'border-[#E05252]' : 'border-[#24221F]'
              )}
            >
              {categoryOptions.map((c) => {
                const isSelected = selectedCategories.includes(c.value)
                const isPrimary = selectedCategories[0] === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCategory(c.value)}
                    className={cn(
                      'group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-[#F7F4EE] text-[#0B0B0B] shadow-xs'
                        : 'bg-[#141414] text-[#8A8478] border border-[#24221F] hover:text-[#FAF8F5] hover:border-[#3A352F]'
                    )}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#0B0B0B] shrink-0" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-[#8A8478] group-hover:text-[#FAF8F5] shrink-0" />
                    )}
                    <span>{c.label}</span>
                    {isSelected && isPrimary && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded bg-[#0B0B0B]/15 text-[#0B0B0B]">
                        Primary
                      </span>
                    )}
                    {isSelected && !isPrimary && (
                      <span
                        onClick={(e) => setAsPrimaryCategory(e, c.value)}
                        title="Set as Primary Category"
                        className="ml-1 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-medium rounded hover:bg-[#0B0B0B]/15 text-[#0B0B0B]/60 hover:text-[#0B0B0B] transition-colors"
                      >
                        Make Primary
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedCategories.length === 0 && (
              <p className="text-xs text-[#E05252] mt-1">Please select at least one category</p>
            )}
            {selectedCategories.length > 1 && (
              <p className="text-[11px] text-[#8A8478] mt-1.5">
                Primary category: <span className="text-[#FAF8F5] font-medium">{categoryOptions.find((c) => c.value === selectedCategories[0])?.label || selectedCategories[0]}</span> (used as main tag and SKU prefix).
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#8A8478] mb-1 block">Description *</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
        </div>
      </div>

      {/* Pricing */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Price (Rs.) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]" />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1 block">Compare At Price (Rs.)</label>
            <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="Original price for sale items" className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE]" />
          </div>
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

      {/* Sizes & Colour Variants */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Sizes &amp; Colour Variants</h2>
          <p className="text-xs text-[#8A8478] mt-1">Expand a size to manage colour variants. Sizes without colours show 🚫 on the storefront.</p>
        </div>
        <div className="space-y-2">
          {variants.map((v, sizeIdx) => {
            const stock = totalStock(v)
            const hasColours = v.colours.length > 0
            return (
              <div key={v.size} className={cn('rounded-lg border transition-colors', hasColours ? 'border-[#F7F4EE]/20 bg-[#F7F4EE]/5' : 'border-[#24221F] bg-[#0B0B0B]')}>
                {/* Size header row */}
                <div className="w-full flex items-center justify-between px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleSize(sizeIdx)}
                    className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                  >
                    <span className="font-medium text-[#FAF8F5]">EU {v.size}</span>
                    {!hasColours && <span className="text-base" title="No variants — unavailable">🚫</span>}
                    {hasColours && <span className="text-xs text-[#8A8478]">{v.colours.length} colour{v.colours.length !== 1 ? 's' : ''} · {stock} in stock</span>}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addColour(sizeIdx)}
                      className="text-xs text-[#F7F4EE] hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#F7F4EE]/10 hover:bg-[#F7F4EE]/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Colour
                    </button>
                    {hasColours && (
                      <button
                        type="button"
                        onClick={() => toggleSize(sizeIdx)}
                        className="p-1 text-[#8A8478] hover:text-[#FAF8F5] focus:outline-none"
                        aria-label={v.expanded ? "Collapse size" : "Expand size"}
                      >
                        {v.expanded ? <ChevronUp className="w-4 h-4 text-[#8A8478]" /> : <ChevronDown className="w-4 h-4 text-[#8A8478]" />}
                      </button>
                    )}
                  </div>
                </div>

                {v.expanded && hasColours && (
                  <div className="px-4 pb-4 space-y-2 border-t border-[#24221F]">
                    <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 pt-3 pb-1">
                      <span className="text-xs text-[#8A8478]">Colour</span>
                      <span className="text-xs text-[#8A8478]">SKU</span>
                      <span className="text-xs text-[#8A8478]">Stock</span>
                      <span />
                    </div>
                    {v.colours.map((c, colIdx) => (
                      <div key={colIdx} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
                        <input value={c.colour} onChange={(e) => updateColour(sizeIdx, colIdx, 'colour', e.target.value)} placeholder="e.g. Black" className="bg-[#0B0B0B] border border-[#24221F] rounded px-2 py-1.5 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE] placeholder:text-[#8A8478]/40" />
                        <input value={c.sku} onChange={(e) => updateColour(sizeIdx, colIdx, 'sku', e.target.value)} className="bg-[#0B0B0B] border border-[#24221F] rounded px-2 py-1.5 text-xs text-[#FAF8F5] font-mono outline-none focus:border-[#F7F4EE]" />
                        <div className="relative">
                          <input type="number" min="0" value={c.stockQty} onChange={(e) => updateColour(sizeIdx, colIdx, 'stockQty', Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-[#0B0B0B] border border-[#24221F] rounded px-2 py-1.5 text-xs text-[#FAF8F5] text-center outline-none focus:border-[#F7F4EE]" />
                          {c.stockQty === 0 && <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-sm" title="Out of stock">🚫</span>}
                        </div>
                        <button type="button" onClick={() => removeColour(sizeIdx, colIdx)} className="p-1 rounded text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Product Details */}
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

      {/* Publishing */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#8A8478] uppercase tracking-wider">Publishing</h2>
        <div className="flex gap-3">
          <button onClick={() => setVisibility('published')} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', visibility === 'published' ? 'bg-white/10 border-white/30 text-white' : 'border-[#24221F] text-[#8A8478]')}>Published</button>
          <button onClick={() => setVisibility('draft')} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', visibility === 'draft' ? 'bg-[#F7F4EE]/10 border-[#F7F4EE]/30 text-[#F7F4EE]' : 'border-[#24221F] text-[#8A8478]')}>Draft</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#FAF8F5] cursor-pointer">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="rounded accent-[#F7F4EE]" />
          Mark as &quot;New Arrival&quot;
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push(`/admin/products/${productId}`)} className="px-6 py-3 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#181818]">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !name.trim() || !price} className="flex-1 sm:flex-none px-8 py-3 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs">
          {saving && <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0B]" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto bg-[#141414] border', t.type === 'success' ? 'text-[#FAF8F5] border-[#F7F4EE]/30' : 'text-[#D4CBBF] border-[#3A352F]')}>
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
