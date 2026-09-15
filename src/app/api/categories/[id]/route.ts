import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'
import { invalidateCache } from '@/lib/server-cache'

// GET /api/categories/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('categories').doc(id).get()
      if (!doc.exists) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      return NextResponse.json({ success: true, data: serializeDoc(doc) })
    } catch (error) {
      console.error('GET /api/categories/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
    }
  }, 'categories:read')
}

// PUT /api/categories/:id — update a single node (supports re-parenting)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const docRef = adminDb.collection('categories').doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })

      // If re-parenting, recalculate depth
      if (body.parentId !== undefined) {
        if (body.parentId === id) {
          return NextResponse.json({ success: false, error: 'Category cannot be its own parent' }, { status: 400 })
        }
        if (body.parentId) {
          const parentDoc = await adminDb.collection('categories').doc(body.parentId).get()
          if (!parentDoc.exists) {
            return NextResponse.json({ success: false, error: 'Parent category not found' }, { status: 404 })
          }
          const parentDepth = (parentDoc.data()?.depth as number) ?? 0
          if (parentDepth >= 2) {
            return NextResponse.json({ success: false, error: 'Maximum nesting depth reached' }, { status: 400 })
          }
          body.depth = parentDepth + 1
        } else {
          body.depth = 0
        }
      }

      await docRef.update({ ...body, updatedAt: new Date() })
      invalidateCache()
      return NextResponse.json({ success: true, data: { id, message: 'Category updated' } })
    } catch (error) {
      console.error('PUT /api/categories/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
    }
  }, 'categories:write')
}

// DELETE /api/categories/:id — cascade-deletes all descendants
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const docRef = adminDb.collection('categories').doc(id)
      if (!(await docRef.get()).exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      // Cascade delete: find all descendants by parentId chain
      const toDelete = [id]
      const collectDescendants = async (parentId: string) => {
        const children = await adminDb.collection('categories').where('parentId', '==', parentId).get()
        for (const child of children.docs) {
          toDelete.push(child.id)
          await collectDescendants(child.id)
        }
      }
      await collectDescendants(id)

      // Batch delete (Firestore limit 500 per batch)
      const batch = adminDb.batch()
      for (const docId of toDelete) {
        batch.delete(adminDb.collection('categories').doc(docId))
      }
      await batch.commit()
      invalidateCache()

      return NextResponse.json({
        success: true,
        data: { id, message: `Deleted category and ${toDelete.length - 1} descendants` }
      })
    } catch (error) {
      console.error('DELETE /api/categories/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
    }
  }, 'categories:delete')
}
