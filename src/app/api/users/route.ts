import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { userInviteSchema } from '@/lib/validations'

// GET /api/users
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/users error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
    }
  }, 'users:read')
}

// POST /api/users — Create / invite new admin user
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = userInviteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
      }

      const { email, displayName, role } = parsed.data

      // Create Firebase Auth user
      const userRecord = await adminAuth.createUser({
        email,
        displayName,
        password: body.password || 'NewStep@2026', // Default password
      })

      // Set custom claims
      await adminAuth.setCustomUserClaims(userRecord.uid, { role })

      // Create Firestore profile
      const now = new Date()
      await adminDb.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        role,
        isActive: true,
        createdAt: now,
      })

      return NextResponse.json({
        success: true,
        data: { uid: userRecord.uid, email, displayName, role, message: 'User created' },
      }, { status: 201 })
    } catch (error) {
      console.error('POST /api/users error:', error)
      const errMsg = error instanceof Error ? error.message : 'Failed to create user'
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
    }
  }, 'users:write')
}
