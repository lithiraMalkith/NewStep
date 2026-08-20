import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'
import { customRoleSchema } from '@/lib/validations'

// GET /api/roles
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('roles').get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/roles error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 })
    }
  }, 'roles:read')
}

// POST /api/roles
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()
      const parsed = customRoleSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
      }

      const now = new Date()
      const roleData = { ...parsed.data, isCustom: true, createdBy: authedReq.user.uid, createdAt: now }
      const docRef = await adminDb.collection('roles').add(roleData)

      return NextResponse.json({ success: true, data: { id: docRef.id, ...roleData, createdAt: now.toISOString() } }, { status: 201 })
    } catch (error) {
      console.error('POST /api/roles error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 })
    }
  }, 'roles:write')
}
