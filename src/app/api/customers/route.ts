import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs } from '@/lib/admin-service'

// GET /api/customers
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('customers').orderBy('lastOrderAt', 'desc').limit(200).get()
      return NextResponse.json({ success: true, data: serializeDocs(snapshot) })
    } catch (error) {
      console.error('GET /api/customers error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
    }
  }, 'customers:read')
}
