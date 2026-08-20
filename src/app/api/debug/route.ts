import { NextResponse } from 'next/server'
import { firebaseAdminInitError } from '@/lib/firebase-admin'

/**
 * GET /api/debug
 * Temporary diagnostic endpoint — shows env var presence + Firebase init status.
 * DELETE THIS ROUTE before going to production!
 */
export async function GET() {
  const check = (val: string | undefined) => (val ? '✅ SET' : '❌ MISSING')

  return NextResponse.json({
    firebaseAdminInitError: firebaseAdminInitError ?? '✅ OK — Firebase Admin initialized successfully',
    env: {
      FIREBASE_PROJECT_ID:            check(process.env.FIREBASE_PROJECT_ID),
      FIREBASE_CLIENT_EMAIL:          check(process.env.FIREBASE_CLIENT_EMAIL),
      FIREBASE_PRIVATE_KEY:           check(process.env.FIREBASE_PRIVATE_KEY),
      FIREBASE_PRIVATE_KEY_length:    process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
      FIREBASE_PRIVATE_KEY_starts:    process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) ?? 'N/A',
      NEXT_PUBLIC_FIREBASE_API_KEY:   check(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      CLOUDINARY_CLOUD_NAME:          check(process.env.CLOUDINARY_CLOUD_NAME),
      RESEND_API_KEY:                 check(process.env.RESEND_API_KEY),
      NEXT_PUBLIC_SITE_URL:           process.env.NEXT_PUBLIC_SITE_URL ?? '❌ MISSING',
    },
  })
}
