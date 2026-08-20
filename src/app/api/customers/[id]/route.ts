import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'

// GET /api/customers/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('customers').doc(id).get()
      if (!doc.exists) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      return NextResponse.json({ success: true, data: serializeDoc(doc) })
    } catch (error) {
      console.error('GET /api/customers/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch customer' }, { status: 500 })
    }
  }, 'customers:read')
}

// PUT /api/customers/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const docRef = adminDb.collection('customers').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      await docRef.update({ ...body, updatedAt: new Date() })
      return NextResponse.json({ success: true, data: { id, message: 'Customer updated' } })
    } catch (error) {
      console.error('PUT /api/customers/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update customer' }, { status: 500 })
    }
  }, 'customers:write')
}

// DELETE /api/customers/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      await adminDb.collection('customers').doc(id).delete()
      return NextResponse.json({ success: true, data: { id, message: 'Customer deleted' } })
    } catch (error) {
      console.error('DELETE /api/customers/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete customer' }, { status: 500 })
    }
  }, 'customers:write')
}
