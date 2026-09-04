import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, firebaseAdminInitError } from '@/lib/firebase-admin'

// GET /api/reviews/eligibility?productId=xxx — Checks if caller has purchased and is eligible to review
export async function GET(req: NextRequest) {
  try {
    if (firebaseAdminInitError) {
      return NextResponse.json({ success: false, error: firebaseAdminInitError }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: true,
        data: {
          canReview: false,
          hasPurchased: false,
          alreadyReviewed: false,
          isAuthenticated: false,
        },
      })
    }

    const token = authHeader.split('Bearer ')[1]!
    let decoded: any
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          canReview: false,
          hasPurchased: false,
          alreadyReviewed: false,
          isAuthenticated: false,
        },
      })
    }

    const userId = decoded.uid
    const userEmail = (decoded.email || '').toLowerCase().trim()

    // Resolve canonical product info
    let canonicalProductId = productId
    let productSlug = ''

    try {
      const productDoc = await adminDb.collection('products').doc(productId).get()
      if (productDoc.exists) {
        canonicalProductId = productDoc.id
        productSlug = productDoc.data()?.slug || ''
      } else {
        const bySlugSnap = await adminDb.collection('products').where('slug', '==', productId).limit(1).get()
        if (!bySlugSnap.empty) {
          canonicalProductId = bySlugSnap.docs[0]!.id
          productSlug = bySlugSnap.docs[0]!.data().slug || ''
        }
      }
    } catch {
      // Best effort product lookup
    }

    // 1. Check if user already reviewed this product
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

    // 2. Check if user has purchased this product
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

    const hasPurchased = orderSnapshots.some((orderData) => {
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

    return NextResponse.json({
      success: true,
      data: {
        canReview: hasPurchased && !alreadyReviewed,
        hasPurchased,
        alreadyReviewed,
        isAuthenticated: true,
      },
    })
  } catch (error) {
    console.error('GET /api/reviews/eligibility error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify review eligibility' }, { status: 500 })
  }
}
