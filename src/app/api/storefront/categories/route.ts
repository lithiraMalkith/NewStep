import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/storefront/categories — Public endpoint, no auth required
// Returns categories ordered by `order` field for the storefront Shop by Category section
export async function GET(_req: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(20)
      .get()

    const categories = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name as string,
        slug: data.slug as string,
        description: data.description as string | undefined,
        image: data.image as string | undefined,
        blurb: data.blurb as string | undefined,
        order: data.order as number,
      }
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('GET /api/storefront/categories error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}
