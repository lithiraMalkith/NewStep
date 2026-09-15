import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// POST /api/categories/reorder — batch-update order (and optionally parentId)
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()
      const updates: { id: string; order: number; parentId?: string | null }[] = body.updates

      if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json({ success: false, error: 'Updates array is required' }, { status: 400 })
      }

      const batch = adminDb.batch()
      const now = new Date()

      for (const item of updates) {
        const ref = adminDb.collection('categories').doc(item.id)
        const updateData: Record<string, unknown> = { order: item.order, updatedAt: now }
        if (item.parentId !== undefined) {
          updateData.parentId = item.parentId
        }
        batch.update(ref, updateData)
      }

      await batch.commit()
      return NextResponse.json({ success: true, data: { message: `Reordered ${updates.length} categories` } })
    } catch (error) {
      console.error('POST /api/categories/reorder error:', error)
      return NextResponse.json({ success: false, error: 'Failed to reorder categories' }, { status: 500 })
    }
  }, 'categories:write')
}
