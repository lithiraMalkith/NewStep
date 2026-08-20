import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { serializeDoc } from '@/lib/admin-service'
import { orderStatusSchema } from '@/lib/validations'
import { sendStatusUpdate } from '@/lib/email'
import type { AdminOrder } from '@/types'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'dispatched', 'delivered', 'cancelled'],
  processing: ['dispatched', 'delivered', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

// GET /api/orders/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('orders').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: serializeDoc(doc) })
    } catch (error) {
      console.error('GET /api/orders/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 })
    }
  }, 'orders:read')
}

// PUT /api/orders/:id — Update order status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()

      const parsed = orderStatusSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const docRef = adminDb.collection('orders').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const orderData = doc.data()!
      const currentStatus = orderData.status as string
      const newStatus = parsed.data.status

      // Validate status transition
      const allowed = STATUS_TRANSITIONS[currentStatus] || []
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          { success: false, error: `Cannot transition from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        )
      }

      // Require cancellation reason
      if (newStatus === 'cancelled' && !parsed.data.cancellationReason) {
        return NextResponse.json(
          { success: false, error: 'Cancellation reason is required' },
          { status: 400 }
        )
      }

      const now = new Date()
      const statusEntry = {
        status: newStatus,
        timestamp: now,
        updatedBy: authedReq.user.email || authedReq.user.uid,
        note: parsed.data.note || '',
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
        statusHistory: [...(orderData.statusHistory || []), statusEntry],
        updatedAt: now,
      }

      if (parsed.data.cancellationReason) {
        updateData.cancellationReason = parsed.data.cancellationReason
      }
      if (parsed.data.trackingNumber) {
        updateData.trackingNumber = parsed.data.trackingNumber
      }

      await docRef.update(updateData)

      // Send status update email
      const order = { id, ...orderData, ...updateData } as unknown as AdminOrder
      sendStatusUpdate(order, newStatus, parsed.data.note)

      return NextResponse.json({
        success: true,
        data: { id, message: `Order status updated to ${newStatus}` },
      })
    } catch (error) {
      console.error('PUT /api/orders/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
    }
  }, 'orders:write')
}
