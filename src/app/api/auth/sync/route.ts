import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * POST /api/auth/sync
 * Called after login to sync Firebase custom claims and create/update user profile in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization' },
        { status: 401 }
      )
    }

    const token = authorization.split('Bearer ')[1]!
    const decoded = await adminAuth.verifyIdToken(token)
    const { uid, email, name: displayName, picture: photoURL } = decoded

    // Check if user profile exists in Firestore
    const userRef = adminDb.collection('users').doc(uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      // First login — create user profile with default role
      const now = new Date()
      const userData = {
        uid,
        email: email || '',
        displayName: displayName || email?.split('@')[0] || 'User',
        photoURL: photoURL || null,
        role: 'support', // Default role for new users
        isActive: true,
        createdAt: now,
        lastLoginAt: now,
      }

      await userRef.set(userData)

      // Set custom claim for role
      await adminAuth.setCustomUserClaims(uid, { role: 'support' })
    } else {
      // Existing user — update last login
      const existingData = userDoc.data()!
      await userRef.update({ lastLoginAt: new Date() })

      // Ensure custom claims are in sync
      const existingRole = existingData.role || 'support'
      await adminAuth.setCustomUserClaims(uid, { role: existingRole })
    }

    return NextResponse.json({ success: true, data: { message: 'Auth synced' } })
  } catch (error) {
    console.error('POST /api/auth/sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Auth sync failed' },
      { status: 500 }
    )
  }
}
