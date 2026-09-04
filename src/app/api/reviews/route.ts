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
    const ratingParam = searchParams.get('rating')
    const ratingFilter = ratingParam ? parseInt(ratingParam, 10) : null
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

        if (status && status !== 'all') {
          reviews = reviews.filter((r: any) => r.status === status)
        }
        if (productId) {
          reviews = reviews.filter((r: any) => r.productId === productId || r.productSlug === productId)
        }
        if (ratingFilter && !isNaN(ratingFilter)) {
          reviews = reviews.filter((r: any) => r.rating === ratingFilter)
        }

        reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json({ success: true, data: reviews.slice(0, 200) })
      }, 'reviews:read')
    }

    // Public: only approved reviews for a specific product
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 })
    }

    // Match by productId or productSlug
    const [byPid, bySlug] = await Promise.all([
      adminDb.collection('reviews').where('productId', '==', productId).get(),
      adminDb.collection('reviews').where('productSlug', '==', productId).get(),
    ])

    const reviewMap = new Map<string, any>()
    const addDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      if (!reviewMap.has(doc.id)) {
        reviewMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
        })
      }
    }
    byPid.docs.forEach(addDoc)
    bySlug.docs.forEach(addDoc)

    let reviews = Array.from(reviewMap.values())
      .filter((r: any) => r.status === 'approved')

    if (ratingFilter && !isNaN(ratingFilter)) {
      reviews = reviews.filter((r: any) => r.rating === ratingFilter)
    }

    reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
      const userEmail = (authedReq.user.email || '').toLowerCase().trim()
      const userName = authedReq.user.name || authedReq.user.email?.split('@')[0] || 'Customer'

      // Get product info for denormalization
      let productName = ''
      let productSlug = ''
      let canonicalProductId = productId

      try {
        const productDoc = await adminDb.collection('products').doc(productId).get()
        if (productDoc.exists) {
          productName = productDoc.data()?.name || ''
          productSlug = productDoc.data()?.slug || ''
          canonicalProductId = productDoc.id
        } else {
          const bySlugSnap = await adminDb.collection('products').where('slug', '==', productId).limit(1).get()
          if (!bySlugSnap.empty) {
            productName = bySlugSnap.docs[0]!.data().name || ''
            productSlug = bySlugSnap.docs[0]!.data().slug || ''
            canonicalProductId = bySlugSnap.docs[0]!.id
          }
        }
      } catch {
        // Product info lookup best effort
      }

      // Check for duplicate review from same user for same product (by ID or slug)
      const existingReviews = await adminDb
        .collection('reviews')
        .where('customerId', '==', userId)
        .get()

      const alreadyReviewed = existingReviews.docs.some((d) => {
        const data = d.data()
        return (
          data.productId === canonicalProductId ||
          data.productId === productId ||
          (productSlug && (data.productSlug === productSlug || data.productId === productSlug))
        )
      })

      if (alreadyReviewed) {
        return NextResponse.json(
          { success: false, error: 'You have already reviewed this product' },
          { status: 409 }
        )
      }

      // Check if user has purchased this product (verified purchase)
      let isVerifiedPurchase = false
      try {
        const orderSnapshots: FirebaseFirestore.DocumentData[] = []
        if (userId) {
          const snapUid = await adminDb
            .collection('orders')
            .where('customer.uid', '==', userId)
            .limit(50)
            .get()
          snapUid.docs.forEach((doc) => orderSnapshots.push(doc.data()))
        }
        if (userEmail) {
          const snapEmail = await adminDb
            .collection('orders')
            .where('customer.email', '==', userEmail)
            .limit(50)
            .get()
          snapEmail.docs.forEach((doc) => orderSnapshots.push(doc.data()))
        }

        isVerifiedPurchase = orderSnapshots.some((orderData) => {
          if (orderData.status === 'cancelled') return false
          const items = orderData.items || orderData.lines || []
          return items.some((item: { productId?: string; slug?: string; id?: string }) =>
            item.productId === canonicalProductId ||
            item.productId === productId ||
            item.slug === productId ||
            item.id === canonicalProductId ||
            (productSlug && (item.productId === productSlug || item.slug === productSlug))
          )
        })
      } catch {
        // Order check best effort
      }

      if (!isVerifiedPurchase) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only customers who have purchased this product can leave a review.',
          },
          { status: 403 }
        )
      }

      const now = new Date()
      const reviewData = {
        productId: canonicalProductId,
        productName: productName || 'Product',
        productSlug: productSlug || productId,
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        rating,
        title: title || '',
        comment,
        status: 'pending' as const, // Admin approval required
        isVerifiedPurchase: true,
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
