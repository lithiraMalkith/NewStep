import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { reviewModerationSchema } from '@/lib/validations'

// PUT /api/reviews/[id] — Admin moderates a review (approve/reject)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const parsed = reviewModerationSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const docRef = adminDb.collection('reviews').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
      }

      await docRef.update({
        status: parsed.data.status,
        updatedAt: new Date(),
      })

      // If approved, update product's aggregate rating
      if (parsed.data.status === 'approved') {
        const productId = doc.data()?.productId
        if (productId) {
          await updateProductRating(productId)
        }
      }

      return NextResponse.json({
        success: true,
        data: { id, message: `Review ${parsed.data.status} successfully` },
      })
    } catch (error) {
      console.error('PUT /api/reviews/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 })
    }
  }, 'reviews:write')
}

// DELETE /api/reviews/[id] — Admin deletes a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const docRef = adminDb.collection('reviews').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
      }

      const productId = doc.data()?.productId
      await docRef.delete()

      // Update product rating after deletion
      if (productId) {
        await updateProductRating(productId)
      }

      return NextResponse.json({
        success: true,
        data: { id, message: 'Review deleted successfully' },
      })
    } catch (error) {
      console.error('DELETE /api/reviews/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 })
    }
  }, 'reviews:delete')
}

/**
 * Recalculate and update a product's average rating and review count
 * based on all approved reviews.
 */
async function updateProductRating(productId: string) {
  try {
    const approvedReviews = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .get()

    const count = approvedReviews.size
    const totalRating = approvedReviews.docs.reduce(
      (sum, doc) => sum + (doc.data().rating || 0),
      0
    )
    const avgRating = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0

    // Update the product document
    const productQuery = await adminDb
      .collection('products')
      .where('slug', '==', productId)
      .limit(1)
      .get()

    if (!productQuery.empty) {
      await productQuery.docs[0]!.ref.update({
        rating: avgRating,
        reviewCount: count,
      })
    } else {
      // Try by document ID
      const productDoc = adminDb.collection('products').doc(productId)
      const exists = await productDoc.get()
      if (exists.exists) {
        await productDoc.update({
          rating: avgRating,
          reviewCount: count,
        })
      }
    }
  } catch (error) {
    console.error('Failed to update product rating:', error)
  }
}
