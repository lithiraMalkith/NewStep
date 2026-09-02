import { NextRequest, NextResponse } from 'next/server'
import { adminDb, firebaseAdminInitError } from '@/lib/firebase-admin'

// GET /api/reviews/stats?productId=xxx — Public aggregate stats for a product
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

    const snapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .get()

    const totalReviews = snapshot.size
    let totalRating = 0
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    snapshot.docs.forEach((doc) => {
      const rating = doc.data().rating || 0
      totalRating += rating
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1
      }
    })

    const averageRating = totalReviews > 0
      ? Math.round((totalRating / totalReviews) * 10) / 10
      : 0

    return NextResponse.json({
      success: true,
      data: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    })
  } catch (error) {
    console.error('GET /api/reviews/stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch review stats' }, { status: 500 })
  }
}
