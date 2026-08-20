import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'

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

// PUT /api/categories/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const docRef = adminDb.collection('categories').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      await docRef.update({ ...body, updatedAt: new Date() })
      return NextResponse.json({ success: true, data: { id, message: 'Category updated' } })
    } catch (error) {
      console.error('PUT /api/categories/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
    }
  }, 'categories:write')
}

// DELETE /api/categories/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const docRef = adminDb.collection('categories').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      await docRef.delete()
      return NextResponse.json({ success: true, data: { id, message: 'Category deleted' } })
    } catch (error) {
      console.error('DELETE /api/categories/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
    }
  }, 'categories:delete')
}
