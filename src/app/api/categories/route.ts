import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { categorySchema } from '@/lib/validations'

// GET /api/categories
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('categories').orderBy('order', 'asc').get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/categories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
    }
  }, 'categories:read')
}

// POST /api/categories
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()
      const parsed = categorySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
      }

      const now = new Date()
      const categoryData = { ...parsed.data, subCategories: [], createdAt: now, updatedAt: now }
      const docRef = await adminDb.collection('categories').add(categoryData)

      return NextResponse.json({ success: true, data: { id: docRef.id, ...categoryData, createdAt: now.toISOString(), updatedAt: now.toISOString() } }, { status: 201 })
    } catch (error) {
      console.error('POST /api/categories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
    }
  }, 'categories:write')
}
