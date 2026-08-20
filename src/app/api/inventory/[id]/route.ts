import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { getAvailabilityStatus } from '@/lib/utils'

// PATCH /api/inventory/:id — Update stock quantities
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq) => {
    try {
      const { id } = await params
      const body = await authedReq.json()

      const docRef = adminDb.collection('products').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const currentData = doc.data()!
      const variantUpdates = body.variants as { size: number; stockQty: number }[]

      // Merge variant stock updates
      const updatedVariants = (currentData.variants || []).map((v: { size: number; stockQty: number; sku: string }) => {
        const update = variantUpdates.find((u) => u.size === v.size)
        return update ? { ...v, stockQty: update.stockQty } : v
      })

      await docRef.update({
        variants: updatedVariants,
        availabilityStatus: getAvailabilityStatus(updatedVariants),
        updatedAt: new Date(),
      })

      return NextResponse.json({ success: true, data: { id, message: 'Stock updated' } })
    } catch (error) {
      console.error('PATCH /api/inventory/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update stock' }, { status: 500 })
    }
  }, 'inventory:write')
}
