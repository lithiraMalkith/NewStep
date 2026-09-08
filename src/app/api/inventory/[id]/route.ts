import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { getAvailabilityStatus } from '@/lib/utils'

// PATCH /api/inventory/:id — Update stock quantities with size and colour breakdowns
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
      const variantUpdates = (body.variants || []) as {
        size: number
        stockQty?: number
        colours?: { colour: string; stockQty: number; sku?: string }[]
      }[]

      const currentVariants = (currentData.variants || []) as {
        size: number
        stockQty?: number
        sku?: string
        colours?: { colour: string; stockQty: number; sku?: string }[]
      }[]

      // Merge existing variants with size and colour updates
      const updatedVariants = currentVariants.map((v) => {
        const update = variantUpdates.find((u) => u.size === v.size)
        if (!update) return v

        if (update.colours && Array.isArray(update.colours)) {
          const totalFromColours = update.colours.reduce(
            (s, c) => s + (Math.max(0, Number(c.stockQty)) || 0),
            0
          )
          return {
            ...v,
            stockQty: totalFromColours,
            colours: update.colours.map((c) => ({
              colour: c.colour,
              stockQty: Math.max(0, Number(c.stockQty) || 0),
              sku:
                c.sku ||
                `NS-${v.size}-${c.colour.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}`,
            })),
          }
        }

        return { ...v, stockQty: Math.max(0, Number(update.stockQty) || 0) }
      })

      // Add any newly provided sizes not already in the variant list
      for (const update of variantUpdates) {
        if (!updatedVariants.some((v) => v.size === update.size)) {
          const totalFromColours =
            update.colours?.reduce((s, c) => s + (Math.max(0, Number(c.stockQty)) || 0), 0) ??
            (update.stockQty || 0)
          updatedVariants.push({
            size: update.size,
            sku: `NS-${update.size}`,
            stockQty: totalFromColours,
            colours: (update.colours || []).map((c) => ({
              colour: c.colour,
              stockQty: Math.max(0, Number(c.stockQty) || 0),
              sku:
                c.sku ||
                `NS-${update.size}-${c.colour.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}`,
            })),
          })
        }
      }

      updatedVariants.sort((a, b) => a.size - b.size)

      const availabilityStatus = getAvailabilityStatus(updatedVariants)

      await docRef.update({
        variants: updatedVariants,
        availabilityStatus,
        updatedAt: new Date(),
      })

      // Non-blocking audit log
      try {
        await adminDb.collection('audit_logs').add({
          action: 'update',
          resource: 'inventory',
          resourceId: id,
          resourceName: currentData.name || 'Product Inventory',
          userEmail: authedReq.user?.email || 'admin@newstep.lk',
          userId: authedReq.user?.uid || 'admin',
          details: `Restocked inventory for ${currentData.name} across sizes and colours`,
          timestamp: new Date(),
        })
      } catch (e) {
        console.warn('Inventory audit log skip:', e)
      }

      return NextResponse.json({
        success: true,
        data: { id, message: 'Stock updated successfully', variants: updatedVariants },
      })
    } catch (error) {
      console.error('PATCH /api/inventory/:id error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update stock' }, { status: 500 })
    }
  }, 'inventory:write')
}
