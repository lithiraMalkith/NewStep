import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { products } from '@/lib/products'
import { DEFAULT_CATEGORY_NODES } from '@/lib/category-tree'
import { getAvailabilityStatus } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    let productsAdded = 0
    let productsUpdated = 0
    let categoriesAdded = 0
    let categoriesUpdated = 0

    // 1. Seed Hierarchical Categories (Root, Sub, and Sub-Sub)
    const canonicalCategoryIds = new Set(DEFAULT_CATEGORY_NODES.map((n) => n.id))
    
    // Clean up old legacy flat category documents with random auto-ids
    const existingCatsSnapshot = await adminDb.collection('categories').get()
    for (const doc of existingCatsSnapshot.docs) {
      if (!canonicalCategoryIds.has(doc.id)) {
        await doc.ref.delete()
      }
    }

    for (const node of DEFAULT_CATEGORY_NODES) {
      const catRef = adminDb.collection('categories').doc(node.id)
      const existing = await catRef.get()
      const payload = {
        name: node.name,
        slug: node.slug,
        description: node.description || '',
        image: node.image || '',
        blurb: node.blurb || '',
        parentId: node.parentId ?? null,
        depth: node.depth ?? 0,
        order: node.order ?? 0,
        isActive: node.isActive !== false,
        updatedAt: now,
      }
      if (!existing.exists) {
        await catRef.set({
          ...payload,
          createdAt: now,
        })
        categoriesAdded++
      } else {
        await catRef.update(payload)
        categoriesUpdated++
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
        subCategory: p.subCategory || null,
        subSubCategory: p.subSubCategory || null,
        categories: p.categories || [p.category],
        categoryLabels: p.categoryLabels || [p.categoryLabel],
        description: p.description,
        details: p.details || [],
        images: p.images || [],
        variants: p.variants || [],
        visibility: 'published' as const,
        isNew: !!p.isNew,
        isBestseller: !!p.isBestseller,
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

    // 3. Seed Sample Verified Customer Reviews
    const sampleReviews = [
      {
        id: 'review-seed-1',
        productId: 'velocity-runner-white',
        productName: 'New Step Velocity Runner',
        customer: {
          uid: 'seed_cust_1',
          name: 'Kasun Perera',
          email: 'kasun.perera@gmail.com',
        },
        rating: 5,
        title: 'Best running shoes for Colombo mornings',
        comment: 'Super lightweight and breathable. The cushioning handles city asphalt and long weekend road runs brilliantly without causing knee fatigue.',
        verifiedPurchase: true,
        status: 'approved',
        orderId: 'ORD-SEED-101',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'review-seed-2',
        productId: 'velocity-runner-white',
        productName: 'New Step Velocity Runner',
        customer: {
          uid: 'seed_cust_2',
          name: 'Dinuka Silva',
          email: 'dinuka.silva@yahoo.com',
        },
        rating: 5,
        title: 'Perfect fit and fast island-wide delivery',
        comment: 'Ordered EU 42 and it fits true to size. Delivered to Kandy in 2 days, paid cash on delivery. Extremely satisfied with the quality.',
        verifiedPurchase: true,
        status: 'approved',
        orderId: 'ORD-SEED-102',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'review-seed-3',
        productId: 'summit-trekker-boot-tobacco',
        productName: 'New Step Summit Trekker',
        customer: {
          uid: 'seed_cust_3',
          name: 'Tharindu Fernando',
          email: 'tharindu.f@gmail.com',
        },
        rating: 5,
        title: 'Survived Knuckles trail with zero blisters',
        comment: 'Tackled Knuckles mountain range in wet conditions. Full waterproofing held up through muddy rivers and the grip on wet granite was phenomenal.',
        verifiedPurchase: true,
        status: 'approved',
        orderId: 'ORD-SEED-103',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'review-seed-4',
        productId: 'stella-block-heel-cream',
        productName: 'New Step Stella Block Heel',
        customer: {
          uid: 'seed_cust_4',
          name: 'Anuki Jayawardena',
          email: 'anuki.j@gmail.com',
        },
        rating: 5,
        title: 'Elegant, comfortable for all-day weddings',
        comment: 'Wore these for a 10-hour wedding reception. The 6cm block heel gives great stability and the leather is super soft right out of the box.',
        verifiedPurchase: true,
        status: 'approved',
        orderId: 'ORD-SEED-104',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'review-seed-5',
        productId: 'kids-adventure-sandal-teal',
        productName: 'New Step Adventure Sandal',
        customer: {
          uid: 'seed_cust_5',
          name: 'Chamari Wickramasinghe',
          email: 'chamari.w@gmail.com',
        },
        rating: 5,
        title: 'Great beach & pool sandal for kids',
        comment: 'My son loves wearing these. Quick drying straps and easy velcro so he puts them on himself without any hassle.',
        verifiedPurchase: true,
        status: 'approved',
        orderId: 'ORD-SEED-105',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ]

    let reviewsAdded = 0
    for (const rev of sampleReviews) {
      const revRef = adminDb.collection('reviews').doc(rev.id)
      const existing = await revRef.get()
      if (!existing.exists) {
        await revRef.set(rev)
        reviewsAdded++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seed completed successfully',
      stats: {
        productsAdded,
        productsUpdated,
        categoriesAdded,
        categoriesUpdated,
        reviewsAdded,
        totalProducts: products.length,
        totalCategories: DEFAULT_CATEGORY_NODES.length,
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

