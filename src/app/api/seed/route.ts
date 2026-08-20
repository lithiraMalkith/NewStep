import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { products, categories } from '@/lib/products'
import { getAvailabilityStatus } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    let productsAdded = 0
    let productsUpdated = 0
    let categoriesAdded = 0

    // 1. Seed Categories
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i]!
      const catRef = adminDb.collection('categories').doc(cat.slug)
      const existing = await catRef.get()
      if (!existing.exists) {
        await catRef.set({
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          blurb: cat.blurb,
          description: cat.blurb,
          order: i,
          createdAt: now,
          updatedAt: now,
        })
        categoriesAdded++
      }
    }

    // 2. Seed Products
    for (const p of products) {
      const existing = await adminDb.collection('products').where('slug', '==', p.slug).limit(1).get()
      const productPayload = {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        subtitle: p.subtitle,
        colour: p.colour,
        colourway: p.colourway || [],
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        category: p.category,
        categoryLabel: p.categoryLabel,
        description: p.description,
        details: p.details || [],
        images: p.images || [],
        variants: p.variants || [],
        visibility: 'published' as const,
        isNew: !!p.isNew,
        rating: p.rating || 4.5,
        reviewCount: p.reviewCount || 10,
        availabilityStatus: getAvailabilityStatus(p.variants),
        updatedAt: now,
      }

      if (existing.empty) {
        await adminDb.collection('products').add({
          ...productPayload,
          createdAt: now,
          createdBy: 'system_seed',
        })
        productsAdded++
      } else {
        await existing.docs[0]!.ref.update(productPayload)
        productsUpdated++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seed completed successfully',
      stats: {
        productsAdded,
        productsUpdated,
        categoriesAdded,
        totalProducts: products.length,
        totalCategories: categories.length,
      },
    })
  } catch (error) {
    console.error('Database seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
