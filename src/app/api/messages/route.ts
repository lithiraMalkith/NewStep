import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { messageSchema } from '@/lib/validations'

// GET /api/messages — Admin: list all messages
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('messages').orderBy('createdAt', 'desc').limit(100).get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/messages error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
    }
  }, 'messages:read')
}

// POST /api/messages — Public: submit contact form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const now = new Date()
    const messageData = {
      ...parsed.data,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await adminDb.collection('messages').add(messageData)

    return NextResponse.json({ success: true, data: { id: docRef.id, message: 'Message sent' } }, { status: 201 })
  } catch (error) {
    console.error('POST /api/messages error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
