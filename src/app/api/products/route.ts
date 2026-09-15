import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { productSchema } from '@/lib/validations'
import { slugify, getAvailabilityStatus } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import { invalidateCache } from '@/lib/server-cache'

// GET /api/products — List all products
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const category = searchParams.get('category')
      const visibility = searchParams.get('visibility')

      let query: FirebaseFirestore.Query = adminDb.collection('products').orderBy('createdAt', 'desc')

      if (visibility) {
        query = query.where('visibility', '==', visibility)
      }

      const snapshot = await query.limit(200).get()
      let products = serializeDocs(snapshot)

      if (category && category !== 'all') {
        products = products.filter((p: any) =>
          p.category === category || (Array.isArray(p.categories) && p.categories.includes(category))
        )
      }

      return NextResponse.json({ success: true, data: products })
    } catch (error) {
      console.error('GET /api/products error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
    }
  }, 'products:read')
}

// POST /api/products — Create product
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()

      const parsed = productSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const now = new Date()
      const data = parsed.data

      // Normalize categories & primary category
      const categories = (data.categories && data.categories.length > 0)
        ? data.categories
        : data.category ? [data.category] : []
      const categoryLabels = (data.categoryLabels && data.categoryLabels.length > 0)
        ? data.categoryLabels
        : data.categoryLabel ? [data.categoryLabel] : []

      const primaryCategory = data.category || (categories.length > 0 ? categories[0] : '')
      const primaryCategoryLabel = data.categoryLabel || (categoryLabels.length > 0 ? categoryLabels[0] : '')

      const productData = {
        ...data,
        category: primaryCategory,
        categoryLabel: primaryCategoryLabel,
        categories,
        categoryLabels,
        slug: data.slug || slugify(data.name),
        availabilityStatus: getAvailabilityStatus(data.variants),
        createdBy: authedReq.user.uid,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await adminDb.collection('products').add(productData)
      invalidateCache()

      logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'create',
        resource: 'product',
        resourceId: docRef.id,
        resourceName: data.name,
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            id: docRef.id,
            ...productData,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/products error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
    }
  }, 'products:write')
}
