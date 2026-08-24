import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs, serializeDoc } from '@/lib/admin-service'

// GET /api/account/orders?email=...&phone=...&ref=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')?.trim()
    const phone = searchParams.get('phone')?.trim()
    const ref = searchParams.get('ref')?.trim()

    if (!email && !phone && !ref) {
      return NextResponse.json(
        { success: false, error: 'Please provide valid email, phone, or order reference' },
        { status: 400 }
      )
    }

    let ordersMap = new Map<string, any>()

    if (ref) {
      // Direct lookup by orderRef
      const snapshot = await adminDb
        .collection('orders')
        .where('orderRef', '==', ref.trim())
        .limit(1)
        .get()

      if (!snapshot.empty) {
        serializeDocs(snapshot).forEach((o: any) => { if (o) ordersMap.set(o.id, o) })
      } else {
        // Try looking up by document ID
        const doc = await adminDb.collection('orders').doc(ref.trim()).get()
        if (doc.exists) {
          const serialized = serializeDoc(doc)
          if (serialized) ordersMap.set(serialized.id, serialized)
        }
      }
    } else {
      if (email) {
        const lowerEmail = email.toLowerCase()
        const snapshot1 = await adminDb
          .collection('orders')
          .where('customer.email', '==', lowerEmail)
          .limit(50)
          .get()
        serializeDocs(snapshot1).forEach((o: any) => { if (o) ordersMap.set(o.id, o) })
        
        // Sometimes emails are stored with mixed casing since we didn't force lowercase earlier
        if (email !== lowerEmail) {
          const snapshot2 = await adminDb
            .collection('orders')
            .where('customer.email', '==', email)
            .limit(50)
            .get()
          serializeDocs(snapshot2).forEach((o: any) => { if (o) ordersMap.set(o.id, o) })
        }
        
        // What if they are saved as completely empty string but matching happens? 
        // We only queried specific email so we are good.
      }

      if (phone) {
        const cleanPhone = phone.replace(/\s|-/g, '')
        const snapshot = await adminDb
          .collection('orders')
          .where('customer.phone', '==', cleanPhone)
          .limit(50)
          .get()
        serializeDocs(snapshot).forEach((o: any) => { if (o) ordersMap.set(o.id, o) })
      }
    }

    let orders = Array.from(ordersMap.values())
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('GET /api/account/orders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    )
  }
}
