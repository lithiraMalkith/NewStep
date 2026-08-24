import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/auth-middleware'
import { serializeDocs } from '@/lib/admin-service'

// GET /api/messages — Fetch all messages (Admin only)
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()
      
      const messages = serializeDocs(snapshot)
      return NextResponse.json({ success: true, data: messages })
    } catch (error) {
      console.error('GET /api/messages error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
    }
  }, 'dashboard:read') // Using dashboard:read as fallback permission since messages:read might not exist yet
}

// POST /api/messages — Submit a new message (Authenticated users only)
export async function POST(req: NextRequest) {
  // We use withAuth without a requiredPermission so any logged-in user can submit
  return withAuth(req, async (authedReq) => {
    try {
      const body = await req.json()
      
      if (!body.name || !body.contact || !body.message) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const messageData = {
        name: body.name,
        contact: body.contact,
        message: body.message,
        userId: authedReq.user.uid, // Tie message to the authenticated user
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await adminDb.collection('messages').add(messageData)

      return NextResponse.json(
        { success: true, data: { id: docRef.id, ...messageData } },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/messages error:', error)
      return NextResponse.json({ success: false, error: 'Failed to submit message' }, { status: 500 })
    }
  })
}
