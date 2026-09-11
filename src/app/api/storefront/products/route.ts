import { NextRequest, NextResponse } from 'next/server'
import { adminDb, firebaseAdminInitError } from '@/lib/firebase-admin'

// GET /api/storefront/products — Public API for storefront product data
export async function GET(req: NextRequest) {
  try {
    if (firebaseAdminInitError) {
      return NextResponse.json({ success: false, error: firebaseAdminInitError }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Fetch single product by slug
    if (slug) {
      const snapshot = await adminDb
        .collection('products')
        .where('slug', '==', slug)
        .where('visibility', '==', 'published')
        .limit(1)
        .get()

      if (snapshot.empty) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const doc = snapshot.docs[0]!
      const data = doc.data()
      const product = {
        id: doc.id,
        slug: data.slug,
        name: data.name,
        brand: data.brand || 'New Step',
        category: data.category,
        categoryLabel: data.categoryLabel,
        categories: data.categories || (data.category ? [data.category] : []),
        categoryLabels: data.categoryLabels || (data.categoryLabel ? [data.categoryLabel] : []),
        subtitle: data.subtitle,
        colour: data.colour,
        colourway: data.colourway || [],
        price: data.price,
        compareAtPrice: data.compareAtPrice || undefined,
        images: data.images || [],
        description: data.description,
        details: data.details || [],
        variants: data.variants || [],
        isNew: data.isNew || false,
        isBestseller: data.isBestseller || false,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
      }

      return NextResponse.json({ success: true, data: product })
    }

    // Fetch products list
    let query: FirebaseFirestore.Query = adminDb
      .collection('products')
      .where('visibility', '==', 'published')

    query = query.limit(limit)
    const snapshot = await query.get()

    let products = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        slug: data.slug,
        name: data.name,
        brand: data.brand || 'New Step',
        category: data.category,
        categoryLabel: data.categoryLabel,
        categories: data.categories || (data.category ? [data.category] : []),
        categoryLabels: data.categoryLabels || (data.categoryLabel ? [data.categoryLabel] : []),
        subtitle: data.subtitle,
        colour: data.colour,
        colourway: data.colourway || [],
        price: data.price,
        compareAtPrice: data.compareAtPrice || undefined,
        images: data.images || [],
        description: data.description,
        details: data.details || [],
        variants: data.variants || [],
        isNew: data.isNew || false,
        isBestseller: data.isBestseller || false,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
      }
    })

    if (category && category !== 'all') {
      products = products.filter((p) =>
        p.category === category || (Array.isArray(p.categories) && p.categories.includes(category))
      )
    }

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('GET /api/storefront/products error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
  }
}
