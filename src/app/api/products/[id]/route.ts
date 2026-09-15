import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'
import { slugify, getAvailabilityStatus } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import { invalidateCache } from '@/lib/server-cache'

// GET /api/products/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('products').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: serializeDoc(doc) })
    } catch (error) {
      console.error('GET /api/products/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 })
    }
  }, 'products:read')
}

// PUT /api/products/:id — Full update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()

      const docRef = adminDb.collection('products').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const updateData = {
        ...body,
        availabilityStatus: body.variants ? getAvailabilityStatus(body.variants) : undefined,
        updatedAt: new Date(),
      }

      if (!updateData.category && Array.isArray(body.categories) && body.categories.length > 0) {
        updateData.category = body.categories[0]
      }
      if (!updateData.categoryLabel && Array.isArray(body.categoryLabels) && body.categoryLabels.length > 0) {
        updateData.categoryLabel = body.categoryLabels[0]
      }

      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key]
      })

      await docRef.update(updateData)
      invalidateCache()

      // Fire-and-forget audit log
      logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'update',
        resource: 'product',
        resourceId: id,
        resourceName: body.name || id,
        details: `Updated product fields: ${Object.keys(body).filter(k => k !== 'updatedAt').join(', ')}`,
      })

      return NextResponse.json({
        success: true,
        data: { id, message: 'Product updated successfully' },
      })
    } catch (error) {
      console.error('PUT /api/products/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 })
    }
  }, 'products:write')
}

// DELETE /api/products/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const docRef = adminDb.collection('products').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const productName = doc.data()?.name || id
      await docRef.delete()
      invalidateCache()

      logAudit({
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || '',
        action: 'delete',
        resource: 'product',
        resourceId: id,
        resourceName: productName,
      })

      return NextResponse.json({ success: true, data: { id, message: 'Product deleted' } })
    } catch (error) {
      console.error('DELETE /api/products/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 })
    }
  }, 'products:delete')
}
