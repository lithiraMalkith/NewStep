import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { categorySchema } from '@/lib/validations'
import { MAX_CATEGORY_DEPTH } from '@/lib/category-tree'
import { invalidateCache } from '@/lib/server-cache'

// GET /api/categories — returns ALL category nodes (flat), client builds tree
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

// POST /api/categories — create a new category node (root or child)
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()
      const parsed = categorySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
      }

      const data = parsed.data

      // If parentId is set, validate parent exists and enforce max depth
      if (data.parentId) {
        const parentDoc = await adminDb.collection('categories').doc(data.parentId).get()
        if (!parentDoc.exists) {
          return NextResponse.json({ success: false, error: 'Parent category not found' }, { status: 404 })
        }
        const parentDepth = (parentDoc.data()?.depth as number) ?? 0
        if (parentDepth >= MAX_CATEGORY_DEPTH) {
          return NextResponse.json({ success: false, error: `Maximum nesting depth of ${MAX_CATEGORY_DEPTH + 1} levels reached` }, { status: 400 })
        }
        // Compute child depth from parent
        data.depth = parentDepth + 1
      } else {
        data.depth = 0
      }

      // Check for duplicate slug at the same level under the same parent
      const slugQuery = adminDb.collection('categories')
        .where('slug', '==', data.slug)
        .where('parentId', '==', data.parentId)
        .limit(1)
      const slugSnap = await slugQuery.get()
      if (!slugSnap.empty) {
        return NextResponse.json({ success: false, error: 'A category with this slug already exists at this level' }, { status: 409 })
      }

      const now = new Date()
      const categoryData = {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }
      const docRef = await adminDb.collection('categories').add(categoryData)
      invalidateCache()

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...categoryData, createdAt: now.toISOString(), updatedAt: now.toISOString() }
      }, { status: 201 })
    } catch (error) {
      console.error('POST /api/categories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
    }
  }, 'categories:write')
}
