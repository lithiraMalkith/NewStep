import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from './firebase-admin'
import { BUILT_IN_ROLE_PERMISSIONS, type Permission } from './permissions'
import type { DecodedIdToken } from 'firebase-admin/auth'

export interface AuthedRequest extends NextRequest {
  user: DecodedIdToken & { role?: string }
}

/**
 * API route authentication wrapper.
 * Verifies Firebase ID token and optionally checks permissions.
 *
 * Usage:
 * ```ts
 * export async function GET(req: NextRequest) {
 *   return withAuth(req, async (authedReq) => {
 *     // ... your handler
 *   }, 'products:read')
 * }
 * ```
 */
export async function withAuth(
  req: NextRequest,
  handler: (authedReq: AuthedRequest) => Promise<NextResponse>,
  requiredPermission?: string
): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.split('Bearer ')[1]!
    const decoded = await adminAuth.verifyIdToken(token)

    // Get role from custom claims
    const role = (decoded.role as string) || 'support'

    // Check permission if required
    if (requiredPermission) {
      const hasPermission = await checkPermission(role, requiredPermission as Permission)
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Attach decoded token to request
    const authedReq = req as AuthedRequest
    authedReq.user = { ...decoded, role }

    return handler(authedReq)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Check if a role has the required permission.
 * Superadmin bypasses all checks.
 * Built-in roles checked against BUILT_IN_ROLE_PERMISSIONS.
 * Custom roles fetched from Firestore.
 */
async function checkPermission(role: string, permission: Permission): Promise<boolean> {
  // Superadmin can do everything
  if (role === 'superadmin') return true

  // Check built-in roles
  const builtInPerms = BUILT_IN_ROLE_PERMISSIONS[role]
  if (builtInPerms) {
    return builtInPerms.includes(permission)
  }

  // Check custom roles from Firestore
  try {
    const roleDoc = await adminDb.collection('roles').doc(role).get()
    if (!roleDoc.exists) return false
    const roleData = roleDoc.data()
    return (roleData?.permissions as string[] || []).includes(permission)
  } catch {
    return false
  }
}
