import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
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

// POST /api/messages — Submit a new message (Authenticated or guest inquiries)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    if (!body.name || (!body.contact && !body.email) || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let userId = 'guest'
    const authorization = req.headers.get('Authorization')
    if (authorization?.startsWith('Bearer ')) {
      try {
        const token = authorization.split('Bearer ')[1]!
        const decoded = await adminAuth.verifyIdToken(token)
        userId = decoded.uid
      } catch {
        // Continue as guest
      }
    }

    const messageData = {
      name: String(body.name).trim(),
      contact: String(body.contact || body.email).trim(),
      message: String(body.message).trim(),
      userId,
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
}
