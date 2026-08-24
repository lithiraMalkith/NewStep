import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/auth-middleware'

// PATCH /api/messages/[id] — Update message status (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const body = await req.json()

      if (!body.status) {
        return NextResponse.json(
          { success: false, error: 'Status is required' },
          { status: 400 }
        )
      }

      await adminDb.collection('messages').doc(id).update({
        status: body.status,
        updatedAt: new Date(),
      })

      return NextResponse.json({ success: true, data: { id, message: 'Status updated' } })
    } catch (error) {
      console.error('PATCH /api/messages/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update message' }, { status: 500 })
    }
  }, 'dashboard:read')
}

// DELETE /api/messages/[id] — Delete a message (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      await adminDb.collection('messages').doc(id).delete()

      return NextResponse.json({ success: true, data: { id, message: 'Message deleted' } })
    } catch (error) {
      console.error('DELETE /api/messages/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete message' }, { status: 500 })
    }
  }, 'dashboard:read')
}
