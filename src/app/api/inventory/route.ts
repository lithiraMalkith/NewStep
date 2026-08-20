import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'

// GET /api/inventory — Products with stock focus
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('products').orderBy('name', 'asc').get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/inventory error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 })
    }
  }, 'inventory:read')
}
