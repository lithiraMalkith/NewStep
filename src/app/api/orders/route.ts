import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDocs, serializeDoc } from '@/lib/admin-service'
import { checkoutSchema } from '@/lib/validations'
import { generateOrderRef } from '@/lib/utils'
import { DELIVERY_CHARGES, FREE_DELIVERY_THRESHOLD } from '@/lib/format'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email'
import type { AdminOrder } from '@/types'

// GET /api/orders — List all orders (admin)
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')

      let query: FirebaseFirestore.Query = adminDb.collection('orders')

      if (status && status !== 'all') {
        // Filter by status only — sort in memory to avoid composite index requirement
        query = query.where('status', '==', status)
      } else {
        // No filter — can use single-field orderBy safely
        query = query.orderBy('createdAt', 'desc')
      }

      const snapshot = await query.limit(200).get()
      let orders = serializeDocs(snapshot)

      // Sort in memory when we filtered by status (no orderBy in query)
      if (status && status !== 'all') {
        orders.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }

      return NextResponse.json({ success: true, data: orders })
    } catch (error) {
      console.error('GET /api/orders error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
    }
  }, 'orders:read')
}

// POST /api/orders — Create order (from storefront checkout)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const now = new Date()

    // Calculate delivery fee server-side (never trust client)
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : (DELIVERY_CHARGES[data.district] ?? 500)

    const orderRef = generateOrderRef()

    const orderData = {
      orderRef,
      items: data.items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        slug: item.slug,
        sku: `NS-${item.size}`,
        colour: item.colour,
        image: item.image,
        size: item.size,
        price: item.price,
        quantity: item.qty,
      })),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: 'pending',
      customer: {
        name: data.fullName,
        email: data.email || '',
        phone: data.phone,
      },
      deliveryAddress: {
        address: data.address,
        city: data.city,
        district: data.district,
        notes: data.notes || '',
      },
      paymentMethod: 'COD',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          updatedBy: 'system',
          note: 'Order placed',
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await adminDb.collection('orders').add(orderData)

    // Update customer record (upsert by phone)
    await upsertCustomer({
      fullName: data.fullName,
      email: data.email || '',
      phone: data.phone,
      address: data.address,
      city: data.city,
      district: data.district,
    }, subtotal + deliveryFee, now)

    // Decrement stock (best-effort)
    await decrementStock(data.items)

    // Build order with ID for email
    const order = {
      id: docRef.id,
      ...orderData,
      createdAt: now,
      updatedAt: now,
    } as unknown as AdminOrder

    // Send emails (fire-and-forget)
    if (data.email) {
      sendOrderConfirmation(order)
    }
    sendNewOrderAlert(order)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          orderRef,
          total: subtotal + deliveryFee,
          status: 'pending',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
  }
}

async function upsertCustomer(
  data: { fullName: string; email: string; phone: string; address: string; city: string; district: string },
  total: number,
  now: Date
) {
  try {
    const existing = await adminDb.collection('customers').where('phone', '==', data.phone).limit(1).get()

    if (existing.empty) {
      await adminDb.collection('customers').add({
        name: data.fullName,
        email: data.email || '',
        phone: data.phone,
        address: { address: data.address, city: data.city, district: data.district },
        orderCount: 1,
        totalSpent: total,
        isRepeat: false,
        firstOrderAt: now,
        lastOrderAt: now,
        createdAt: now,
        verificationStatus: 'unverified',
      })
    } else {
      const customerDoc = existing.docs[0]!
      const customerData = customerDoc.data()
      await customerDoc.ref.update({
        name: data.fullName,
        email: data.email || customerData.email,
        orderCount: (customerData.orderCount || 0) + 1,
        totalSpent: (customerData.totalSpent || 0) + total,
        isRepeat: true,
        lastOrderAt: now,
      })
    }
  } catch (err) {
    console.error('Customer upsert error:', err)
  }
}

async function decrementStock(items: { productId: string; size: number; qty: number }[]) {
  try {
    for (const item of items) {
      // Find product by slug or direct ID lookup
      const productDocs = await adminDb.collection('products')
        .where('slug', '==', item.productId)
        .limit(1)
        .get()

      let productRef: FirebaseFirestore.DocumentReference | null = null
      let productData: FirebaseFirestore.DocumentData | null = null

      if (!productDocs.empty) {
        productRef = productDocs.docs[0]!.ref
        productData = productDocs.docs[0]!.data()
      } else {
        // Try direct ID
        const directDoc = await adminDb.collection('products').doc(item.productId).get()
        if (directDoc.exists) {
          productRef = directDoc.ref
          productData = directDoc.data()!
        }
      }

      if (productRef && productData) {
        const variants = (productData.variants || []).map((v: { size: number; stockQty: number; sku: string }) => {
          if (v.size === item.size) {
            return { ...v, stockQty: Math.max(0, v.stockQty - item.qty) }
          }
          return v
        })
        await productRef.update({ variants, updatedAt: new Date() })
      }
    }
  } catch (err) {
    console.error('Stock decrement error:', err)
  }
}
