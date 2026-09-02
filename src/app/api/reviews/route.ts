import { NextRequest, NextResponse } from 'next/server'
import { adminDb, firebaseAdminInitError } from '@/lib/firebase-admin'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { reviewSchema } from '@/lib/validations'

// GET /api/reviews — List reviews (admin: all; public: approved only by productId)
export async function GET(req: NextRequest) {
  try {
    if (firebaseAdminInitError) {
      return NextResponse.json({ success: false, error: firebaseAdminInitError }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const isAdmin = searchParams.get('admin') === 'true'

    // Admin requests require auth
    if (isAdmin) {
      return withAuth(req, async () => {
        let query: FirebaseFirestore.Query = adminDb.collection('reviews')

        // Fetch up to 500 reviews to filter/sort in memory to avoid composite index errors
        const snapshot = await query.limit(500).get()

        let reviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
        }))

        if (status) {
          reviews = reviews.filter((r: any) => r.status === status)
        }
        if (productId) {
          reviews = reviews.filter((r: any) => r.productId === productId)
        }

        reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json({ success: true, data: reviews.slice(0, 200) })
      }, 'reviews:read')
    }

    // Public: only approved reviews for a specific product
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 })
    }

    const snapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .get()

    let reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
    }))

    // Filter and sort in memory to avoid Firebase composite index requirements
    reviews = reviews
      .filter((r: any) => r.status === 'approved')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)

    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews — Customer submits a review (requires auth)
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = reviewSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { productId, rating, title, comment } = parsed.data
      const userId = authedReq.user.uid
      const userEmail = authedReq.user.email || ''
      const userName = authedReq.user.name || authedReq.user.email?.split('@')[0] || 'Customer'

      // Check for duplicate review from same user for same product
      const existingReview = await adminDb
        .collection('reviews')
        .where('productId', '==', productId)
        .where('customerId', '==', userId)
        .limit(1)
        .get()

      if (!existingReview.empty) {
        return NextResponse.json(
          { success: false, error: 'You have already reviewed this product' },
          { status: 409 }
        )
      }

      // Check if user has purchased this product (verified purchase)
      let isVerifiedPurchase = false
      try {
        const ordersSnapshot = await adminDb
          .collection('orders')
          .where('customer.email', '==', userEmail)
          .where('status', 'in', ['delivered', 'dispatched', 'processing'])
          .limit(50)
          .get()

        isVerifiedPurchase = ordersSnapshot.docs.some((orderDoc) => {
          const orderData = orderDoc.data()
          const items = orderData.items || []
          return items.some((item: { productId?: string }) => item.productId === productId)
        })
      } catch {
        // If order check fails, mark as unverified
      }

      // Get product info for denormalization
      let productName = ''
      let productSlug = ''
      try {
        // Try by document ID first
        const productDoc = await adminDb.collection('products').doc(productId).get()
        if (productDoc.exists) {
          productName = productDoc.data()?.name || ''
          productSlug = productDoc.data()?.slug || ''
        } else {
          // Try by slug
          const bySlug = await adminDb.collection('products').where('slug', '==', productId).limit(1).get()
          if (!bySlug.empty) {
            productName = bySlug.docs[0]!.data().name || ''
            productSlug = bySlug.docs[0]!.data().slug || ''
          }
        }
      } catch {
        // Product info not critical
      }

      const now = new Date()
      const reviewData = {
        productId,
        productName,
        productSlug,
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        rating,
        title: title || '',
        comment,
        status: 'pending' as const, // Admin approval required
        isVerifiedPurchase,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await adminDb.collection('reviews').add(reviewData)

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...reviewData, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        message: 'Review submitted successfully. It will appear after admin approval.',
      })
    } catch (error) {
      console.error('POST /api/reviews error:', error)
      return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 })
    }
  })
}
