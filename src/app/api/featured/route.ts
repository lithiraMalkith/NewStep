import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { featuredUpdateSchema } from '@/lib/validations'
import { logAudit } from '@/lib/audit'
import { products as staticCatalogue } from '@/lib/products'

// GET /api/featured — Get featured products in order
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb
        .collection('products')
        .where('isFeatured', '==', true)
        .where('visibility', '==', 'published')
        .orderBy('featuredOrder', 'asc')
        .get()

      let products = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          categoryLabel: data.categoryLabel,
          price: data.price,
          images: data.images || [],
          visibility: data.visibility,
          isFeatured: data.isFeatured ?? false,
          featuredOrder: data.featuredOrder ?? 0,
          featuredBadge: data.featuredBadge || (data.isBestseller ? 'Bestseller' : data.isNew ? 'New Arrival' : 'Featured'),
          availabilityStatus: data.availabilityStatus,
        }
      })

      // If database is not seeded or has no featured products, fallback to static catalogue
      if (products.length === 0) {
        products = staticCatalogue
          .filter((p) => p.isBestseller || p.isNew)
          .slice(0, 6)
          .map((p, idx) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category,
            categoryLabel: p.categoryLabel,
            price: p.price,
            images: p.images || [],
            visibility: 'published',
            isFeatured: true,
            featuredOrder: idx,
            featuredBadge: p.isBestseller ? 'Bestseller' : 'New Arrival',
            availabilityStatus: 'in_stock',
          }))
      }

      return NextResponse.json({ success: true, data: products })
    } catch (error) {
      console.error('GET /api/featured error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch featured products' }, { status: 500 })
    }
  }, 'featured:read')
}

// POST /api/featured — Add a single product to featured
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const { id, featuredOrder = 0, badge = 'Featured' } = body

      if (!id) {
        return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
      }

      let docRef = adminDb.collection('products').doc(id)
      let doc = await docRef.get()

      if (!doc.exists) {
        const slugSnap = await adminDb.collection('products').where('slug', '==', id).limit(1).get()
        if (!slugSnap.empty) {
          docRef = slugSnap.docs[0]!.ref
          doc = slugSnap.docs[0]!
        }
      }

      if (doc.exists) {
        await docRef.update({
          isFeatured: true,
          featuredOrder,
          featuredBadge: badge,
          updatedAt: new Date(),
        })
      } else {
        // Find in static catalogue if doc doesn't exist yet
        const staticItem = staticCatalogue.find((p) => p.id === id || p.slug === id)
        if (staticItem) {
          await docRef.set({
            ...staticItem,
            visibility: 'published',
            isFeatured: true,
            featuredOrder,
            featuredBadge: badge,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }

      await logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'feature',
        resource: 'featured',
        resourceId: id,
        details: `Added product to featured (order: ${featuredOrder}, badge: ${badge})`,
      })

      return NextResponse.json({ success: true, data: { message: 'Product added to featured', id } })
    } catch (error) {
      console.error('POST /api/featured error:', error)
      return NextResponse.json({ success: false, error: 'Failed to add product to featured' }, { status: 500 })
    }
  }, 'featured:write')
}

// DELETE /api/featured — Remove a product from featured
export async function DELETE(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      let id = searchParams.get('id')

      if (!id) {
        try {
          const body = await req.json()
          id = body?.id
        } catch {
          // body not JSON
        }
      }

      if (!id) {
        return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
      }

      let docRef = adminDb.collection('products').doc(id)
      let doc = await docRef.get()
      if (!doc.exists) {
        const slugSnap = await adminDb.collection('products').where('slug', '==', id).limit(1).get()
        if (!slugSnap.empty) {
          docRef = slugSnap.docs[0]!.ref
          doc = slugSnap.docs[0]!
        }
      }

      if (doc.exists) {
        await docRef.update({
          isFeatured: false,
          featuredOrder: null,
          updatedAt: new Date(),
        })
      }

      await logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'unfeature',
        resource: 'featured',
        resourceId: id,
        details: `Removed product from featured list: ${id}`,
      })

      return NextResponse.json({ success: true, data: { message: 'Product removed from featured', id } })
    } catch (error) {
      console.error('DELETE /api/featured error:', error)
      return NextResponse.json({ success: false, error: 'Failed to remove product from featured' }, { status: 500 })
    }
  }, 'featured:write')
}

// PUT /api/featured — Save featured product list (reorder & badges)
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = featuredUpdateSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { featured } = parsed.data
      const batch = adminDb.batch()

      // First, clear current featured flags in DB
      try {
        const currentFeatured = await adminDb
          .collection('products')
          .where('isFeatured', '==', true)
          .get()

        currentFeatured.docs.forEach((doc) => {
          batch.update(doc.ref, { isFeatured: false, featuredOrder: null })
        })
      } catch {
        // collection might be empty
      }

      // Then set new featured products
      for (const item of featured) {
        const ref = adminDb.collection('products').doc(item.id)
        const staticItem = staticCatalogue.find((p) => p.id === item.id || p.slug === item.id)
        const updatePayload: Record<string, unknown> = {
          isFeatured: true,
          featuredOrder: item.featuredOrder,
          featuredBadge: item.badge || 'Featured',
          updatedAt: new Date(),
        }
        if (staticItem) {
          batch.set(ref, {
            name: staticItem.name,
            slug: staticItem.slug,
            category: staticItem.category,
            categoryLabel: staticItem.categoryLabel,
            price: staticItem.price,
            images: staticItem.images || [],
            visibility: 'published',
            ...updatePayload,
          }, { merge: true })
        } else {
          batch.set(ref, updatePayload, { merge: true })
        }
      }

      await batch.commit()

      await logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'feature',
        resource: 'featured',
        details: `Updated featured products list: ${featured.length} products`,
      })

      return NextResponse.json({ success: true, data: { message: 'Featured products updated', count: featured.length } })
    } catch (error) {
      console.error('PUT /api/featured error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update featured products' }, { status: 500 })
    }
  }, 'featured:write')
}
