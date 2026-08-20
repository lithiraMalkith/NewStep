import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs, serializeDoc } from '@/lib/admin-service'

// GET /api/account/orders?email=...&phone=...&ref=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const ref = searchParams.get('ref')

    if (!email && !phone && !ref) {
      return NextResponse.json(
        { success: false, error: 'Please provide email, phone, or order reference' },
        { status: 400 }
      )
    }

    let orders: any[] = []

    if (ref) {
      // Direct lookup by orderRef
      const snapshot = await adminDb
        .collection('orders')
        .where('orderRef', '==', ref.trim())
        .limit(1)
        .get()

      if (!snapshot.empty) {
        orders = serializeDocs(snapshot)
      } else {
        // Try looking up by document ID
        const doc = await adminDb.collection('orders').doc(ref.trim()).get()
        if (doc.exists) {
          orders = [serializeDoc(doc)]
        }
      }
    } else if (email) {
      const snapshot = await adminDb
        .collection('orders')
        .where('customer.email', '==', email.trim().toLowerCase())
        .limit(50)
        .get()
      orders = serializeDocs(snapshot)
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (phone) {
      const cleanPhone = phone.replace(/\s|-/g, '')
      const snapshot = await adminDb
        .collection('orders')
        .where('customer.phone', '==', cleanPhone)
        .limit(50)
        .get()
      orders = serializeDocs(snapshot)
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('GET /api/account/orders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    )
  }
}
