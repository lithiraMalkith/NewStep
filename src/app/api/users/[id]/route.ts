import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'

// GET /api/users/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('users').doc(id).get()
      if (!doc.exists) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      return NextResponse.json({ success: true, data: serializeDoc(doc) })
    } catch (error) {
      console.error('GET /api/users/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
    }
  }, 'users:read')
}

// PUT /api/users/:id — Update role, status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()

      const docRef = adminDb.collection('users').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

      // Update role in Firebase Auth custom claims
      if (body.role) {
        await adminAuth.setCustomUserClaims(id, { role: body.role })
      }

      await docRef.update({ ...body, updatedAt: new Date() })

      return NextResponse.json({ success: true, data: { id, message: 'User updated' } })
    } catch (error) {
      console.error('PUT /api/users/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }
  }, 'users:write')
}

// DELETE /api/users/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      await adminAuth.deleteUser(id)
      await adminDb.collection('users').doc(id).delete()
      return NextResponse.json({ success: true, data: { id, message: 'User deleted' } })
    } catch (error) {
      console.error('DELETE /api/users/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
    }
  }, 'users:write')
}
