import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// PUT /api/roles/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const docRef = adminDb.collection('roles').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
      await docRef.update({ name: body.name, permissions: body.permissions })
      return NextResponse.json({ success: true, data: { id, message: 'Role updated' } })
    } catch (error) {
      console.error('PUT /api/roles/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 })
    }
  }, 'roles:write')
}

// DELETE /api/roles/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      await adminDb.collection('roles').doc(id).delete()
      return NextResponse.json({ success: true, data: { id, message: 'Role deleted' } })
    } catch (error) {
      console.error('DELETE /api/roles/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 })
    }
  }, 'roles:delete')
}
