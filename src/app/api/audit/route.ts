import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/audit — List audit log entries (paginated, filterable)
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const action = searchParams.get('action')
      const resource = searchParams.get('resource')
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const pageSize = 50

      let query: FirebaseFirestore.Query = adminDb
        .collection('audit_logs')
        .orderBy('createdAt', 'desc')

      if (action) query = query.where('action', '==', action)
      if (resource) query = query.where('resource', '==', resource)

      // Count total (approximate via limit)
      const countSnap = await query.limit(1000).get()
      const total = countSnap.size

      // Paginate
      const offset = (page - 1) * pageSize
      const snapshot = await query.limit(pageSize).offset(offset).get()

      const items = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          items,
          total,
          page,
          pageSize,
          hasMore: offset + pageSize < total,
        },
      })
    } catch (error) {
      console.error('GET /api/audit error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 })
    }
  }, 'audit:read')
}

// Realistic seed data entries for demonstration and testing
const SAMPLE_LOGS = [
  { action: 'login', resource: 'user', resourceName: 'admin@newstep.com', details: 'Administrator logged into the administration console', userEmail: 'admin@newstep.com', minutesAgo: 5 },
  { action: 'feature', resource: 'featured', resourceName: 'Velocity Runner White', details: 'Promoted product to storefront featured showcase (Badge: Bestseller)', userEmail: 'admin@newstep.com', minutesAgo: 25 },
  { action: 'update', resource: 'inventory', resourceName: 'Cloud Strider Black', details: 'Restocked EU 41 (+20 units) and EU 42 (+15 units)', userEmail: 'manager@newstep.com', minutesAgo: 45 },
  { action: 'create', resource: 'product', resourceName: 'Pulse Ultra Horizon', details: 'Created new running shoe in Performance category', userEmail: 'admin@newstep.com', minutesAgo: 90 },
  { action: 'update', resource: 'order', resourceName: 'ORD-2026-8812', details: 'Updated order delivery status from Processing to Dispatched', userEmail: 'fulfillment@newstep.com', minutesAgo: 140 },
  { action: 'create', resource: 'discount', resourceName: 'STEPNEW20', details: 'Configured 20% promotional coupon code (min order: Rs. 10,000)', userEmail: 'manager@newstep.com', minutesAgo: 210 },
  { action: 'update', resource: 'review', resourceName: 'REV-9014', details: 'Approved 5-star customer review for Stealth Trainer Triple Black', userEmail: 'support@newstep.com', minutesAgo: 320 },
  { action: 'export', resource: 'order', resourceName: 'Monthly Sales Report', details: 'Exported customer sales records and order transactions to CSV', userEmail: 'admin@newstep.com', minutesAgo: 540 },
  { action: 'update', resource: 'settings', resourceName: 'Storefront Settings', details: 'Updated islandwide shipping rates and free delivery threshold', userEmail: 'admin@newstep.com', minutesAgo: 720 },
  { action: 'feature', resource: 'featured', resourceName: 'Horizon Glide Grey', details: 'Assigned showcase badge: New Arrival (order #2)', userEmail: 'manager@newstep.com', minutesAgo: 950 },
  { action: 'delete', resource: 'discount', resourceName: 'EXPIRED10', details: 'Removed expired promotional voucher code', userEmail: 'manager@newstep.com', minutesAgo: 1200 },
  { action: 'create', resource: 'user', resourceName: 'kasun.perera@newstep.com', details: 'Provisioned new staff user profile with fulfillment role', userEmail: 'admin@newstep.com', minutesAgo: 1500 },
  { action: 'update', resource: 'product', resourceName: 'Aero Blaze Neon', details: 'Updated pricing from Rs. 24,500 to Rs. 22,900 with sale tag', userEmail: 'manager@newstep.com', minutesAgo: 1900 },
  { action: 'login', resource: 'user', resourceName: 'manager@newstep.com', details: 'Manager user session authenticated from Colombo HQ', userEmail: 'manager@newstep.com', minutesAgo: 2300 },
  { action: 'unfeature', resource: 'featured', resourceName: 'Legacy Canvas Low', details: 'Retired seasonal model from storefront hero rotation', userEmail: 'admin@newstep.com', minutesAgo: 2800 },
  { action: 'update', resource: 'inventory', resourceName: 'Urban Drift Slate', details: 'Audit adjustment: corrected inventory count for EU 43 (-2 units)', userEmail: 'manager@newstep.com', minutesAgo: 3400 },
  { action: 'create', resource: 'category', resourceName: 'Trail Running', details: 'Added new footwear category with slug /shop/trail-running', userEmail: 'admin@newstep.com', minutesAgo: 4200 },
  { action: 'delete', resource: 'review', resourceName: 'REV-8721', details: 'Rejected and purged spam submission on product page', userEmail: 'support@newstep.com', minutesAgo: 5100 },
  { action: 'export', resource: 'user', resourceName: 'Customer Profiles', details: 'Exported verified customer mailing list for loyalty program', userEmail: 'admin@newstep.com', minutesAgo: 6400 },
  { action: 'update', resource: 'order', resourceName: 'ORD-2026-8790', details: 'Payment verified via Bank Transfer — Order marked Paid', userEmail: 'finance@newstep.com', minutesAgo: 7800 },
]

// POST /api/audit — Create manual audit entry OR seed sample logs
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()

      // 1. Check if seed operation
      if (body.action === 'seed') {
        const batch = adminDb.batch()
        const now = Date.now()

        for (const item of SAMPLE_LOGS) {
          const docRef = adminDb.collection('audit_logs').doc()
          const createdAtDate = new Date(now - item.minutesAgo * 60 * 1000)
          batch.set(docRef, {
            userId: authedReq.user.uid,
            userEmail: item.userEmail,
            action: item.action,
            resource: item.resource,
            resourceName: item.resourceName,
            details: item.details,
            createdAt: createdAtDate,
          })
        }

        await batch.commit()

        return NextResponse.json({
          success: true,
          data: {
            message: `Successfully generated ${SAMPLE_LOGS.length} audit logs`,
            seeded: SAMPLE_LOGS.length,
          },
        })
      }

      // 2. Manual audit log creation
      const { action, resource, resourceName, resourceId, details } = body

      if (!action || !resource) {
        return NextResponse.json(
          { success: false, error: 'Action and resource are required' },
          { status: 400 }
        )
      }

      const newEntry = {
        userId: authedReq.user.uid,
        userEmail: authedReq.user.email || 'admin@newstep.com',
        action,
        resource,
        resourceId: resourceId || '',
        resourceName: resourceName || '',
        details: details || '',
        createdAt: new Date(),
      }

      const docRef = await adminDb.collection('audit_logs').add(newEntry)

      return NextResponse.json({
        success: true,
        data: {
          id: docRef.id,
          ...newEntry,
          createdAt: newEntry.createdAt.toISOString(),
        },
      })
    } catch (error) {
      console.error('POST /api/audit error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create audit log' },
        { status: 500 }
      )
    }
  }, 'audit:write')
}

// DELETE /api/audit — Delete single audit log entry or clear all
export async function DELETE(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      let id = searchParams.get('id')
      let clearAll = searchParams.get('clearAll') === 'true'

      if (!id && !clearAll) {
        try {
          const body = await req.json()
          if (body?.clearAll) clearAll = true
          if (body?.id) id = body.id
        } catch {
          // not json
        }
      }

      if (clearAll) {
        const snap = await adminDb.collection('audit_logs').limit(500).get()
        const batch = adminDb.batch()
        snap.docs.forEach((d) => batch.delete(d.ref))
        await batch.commit()

        return NextResponse.json({
          success: true,
          data: { message: `Cleared ${snap.size} audit logs`, deleted: snap.size },
        })
      }

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Audit log ID or clearAll flag is required' },
          { status: 400 }
        )
      }

      await adminDb.collection('audit_logs').doc(id).delete()

      return NextResponse.json({
        success: true,
        data: { message: 'Audit log entry deleted', id },
      })
    } catch (error) {
      console.error('DELETE /api/audit error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete audit log' },
        { status: 500 }
      )
    }
  }, 'audit:delete')
}
