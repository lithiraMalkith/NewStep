import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

interface NavCategory {
  id: string
  name: string
  slug: string
  order: number
}

// Static fallback categories matching the original hardcoded NAV
const STATIC_NAV: NavCategory[] = [
  { id: 'mens', name: "Men", slug: 'mens', order: 0 },
  { id: 'womens', name: "Women", slug: 'womens', order: 1 },
  { id: 'kids', name: "Kids", slug: 'kids', order: 2 },
]

// GET /api/storefront/navigation — Public endpoint, no auth required
// Returns categories for the top navigation bar, ordered by `order` field
export async function GET(_req: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(20)
      .get()

    let categories: NavCategory[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name as string,
        slug: data.slug as string,
        order: (data.order as number) ?? 0,
      }
    })

    // Fallback to static nav if Firestore has no categories
    if (categories.length === 0) {
      categories = STATIC_NAV
    }

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('GET /api/storefront/navigation error:', error)
    // On error, return static fallback so navbar is never empty
    return NextResponse.json({ success: true, data: STATIC_NAV })
  }
}
