import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Normalise the private key regardless of how Vercel stores it.
 * Strips surrounding quotes and converts literal \n to real newlines.
 */
function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const stripped = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  return stripped.replace(/\\n/g, '\n')
}

/**
 * Initialise Firebase Admin SDK once, never throwing at module level.
 * Returns a descriptive error string if something goes wrong, so API routes
 * can return a readable JSON 503 instead of a blank Vercel HTML 500.
 */
function initAdmin(): string | null {
  if (getApps().length) return null

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY)

  const missing: string[] = []
  if (!projectId)   missing.push('FIREBASE_PROJECT_ID')
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
  if (!privateKey)  missing.push('FIREBASE_PRIVATE_KEY')

  if (missing.length) {
    const msg = `Firebase Admin: missing env vars on Vercel: ${missing.join(', ')}`
    console.error('[firebase-admin]', msg)
    return msg
  }

  try {
    initializeApp({
      credential: cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! }),
    })
    return null
  } catch (e: unknown) {
    const msg = `Firebase Admin init failed: ${e instanceof Error ? e.message : String(e)}`
    console.error('[firebase-admin]', msg)
    return msg
  }
}

// Run init — captures any error as a string instead of crashing the module
export const firebaseAdminInitError: string | null = initAdmin()

// These are safe to call after initAdmin() — if init failed they will throw,
// but each API route wraps its handler in try/catch so the error surfaces as JSON.
export const adminAuth: Auth = getApps().length ? getAuth() : (null as unknown as Auth)
export const adminDb: Firestore = getApps().length ? getFirestore() : (null as unknown as Firestore)
