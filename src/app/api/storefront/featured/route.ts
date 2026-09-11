import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { products as staticCatalogue } from '@/lib/products'

// GET /api/storefront/featured — Public endpoint, no auth required
// Returns featured products for the home page carousel
export async function GET(_req: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('products')
      .where('isFeatured', '==', true)
      .where('visibility', '==', 'published')
      .orderBy('featuredOrder', 'asc')
      .limit(12)
      .get()

    let products = snapshot.docs.map((doc) => {
      const data = doc.data()
      const { createdAt, updatedAt, ...rest } = data
      const staticMatch = staticCatalogue.find((p) => p.slug === data.slug || p.id === doc.id)
      const variants = (data.variants && data.variants.length > 0) ? data.variants : (staticMatch?.variants || [])
      const rawImages = (data.images && data.images.length > 0) ? data.images : (staticMatch?.images || ['/images/p1.jpg'])
      const cleanImages = rawImages.map((img: string) => img === '/images/hero.jpg' ? '/images/p10.jpg' : img)

      return {
        id: doc.id,
        slug: data.slug || staticMatch?.slug || '',
        name: data.name || staticMatch?.name || '',
        brand: data.brand || staticMatch?.brand || 'New Step',
        category: data.category || staticMatch?.category || 'mens',
        categoryLabel: data.categoryLabel || staticMatch?.categoryLabel || "Men's",
        subtitle: data.subtitle || staticMatch?.subtitle || '',
        colour: data.colour || staticMatch?.colour || 'Standard',
        price: data.price || staticMatch?.price || 0,
        compareAtPrice: data.compareAtPrice ?? staticMatch?.compareAtPrice,
        ...rest,
        images: cleanImages,
        variants,
        details: data.details?.length ? data.details : (staticMatch?.details || []),
        colourway: data.colourway?.length ? data.colourway : (staticMatch?.colourway || []),
        isNew: data.isNew ?? staticMatch?.isNew ?? false,
        isBestseller: data.isBestseller ?? staticMatch?.isBestseller ?? false,
        rating: data.rating || staticMatch?.rating || 4.8,
        reviewCount: data.reviewCount || staticMatch?.reviewCount || 10,
        isFeatured: true,
        featuredOrder: data.featuredOrder ?? 0,
        featuredBadge: data.featuredBadge || 'Featured',
        createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : typeof createdAt === 'string' ? createdAt : undefined,
        updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : typeof updatedAt === 'string' ? updatedAt : undefined,
      }
    })

    // Fallback to static catalogue bestsellers if no featured products in Firestore
    if (products.length === 0) {
      products = staticCatalogue
        .filter((p) => p.isBestseller || p.isNew)
        .slice(0, 8)
        .map((p, idx) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          category: p.category,
          categoryLabel: p.categoryLabel,
          subtitle: p.subtitle,
          colour: p.colour,
          colourway: p.colourway,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          images: p.images || [],
          description: p.description,
          details: p.details || [],
          variants: p.variants || [],
          isNew: p.isNew || false,
          isBestseller: p.isBestseller || false,
          rating: p.rating || 4.8,
          reviewCount: (p as any).reviewCount || 10,
          isFeatured: true,
          featuredOrder: idx,
          featuredBadge: p.isBestseller ? 'Bestseller' : 'New Arrival',
          createdAt: undefined,
          updatedAt: undefined,
        }))
    }

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('GET /api/storefront/featured error:', error)

    // Fallback to static on error
    const fallback = staticCatalogue
      .filter((p) => p.isBestseller || p.isNew)
      .slice(0, 8)
      .map((p, idx) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel,
        subtitle: p.subtitle,
        colour: p.colour,
        colourway: p.colourway,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: p.images || [],
        description: p.description,
        details: p.details || [],
        variants: p.variants || [],
        isNew: p.isNew || false,
        isBestseller: p.isBestseller || false,
        rating: p.rating || 4.8,
        reviewCount: (p as any).reviewCount || 10,
        isFeatured: true,
        featuredOrder: idx,
        featuredBadge: p.isBestseller ? 'Bestseller' : 'New Arrival',
        createdAt: undefined,
        updatedAt: undefined,
      }))

    return NextResponse.json({ success: true, data: fallback })
  }
}
