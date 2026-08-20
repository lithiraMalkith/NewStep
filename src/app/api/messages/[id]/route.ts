import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// PATCH /api/messages/:id — Update status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const docRef = adminDb.collection('messages').doc(id)
      if (!(await docRef.get()).exists) return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })

      await docRef.update({
        status: body.status,
        repliedBy: authedReq.user.email || authedReq.user.uid,
        updatedAt: new Date(),
      })

      return NextResponse.json({ success: true, data: { id, message: 'Message updated' } })
    } catch (error) {
      console.error('PATCH /api/messages/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update message' }, { status: 500 })
    }
  }, 'messages:write')
}

// DELETE /api/messages/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      await adminDb.collection('messages').doc(id).delete()
      return NextResponse.json({ success: true, data: { id, message: 'Message deleted' } })
    } catch (error) {
      console.error('DELETE /api/messages/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete message' }, { status: 500 })
    }
  }, 'messages:delete')
}
