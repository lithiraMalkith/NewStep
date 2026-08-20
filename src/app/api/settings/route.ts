import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { siteSettingsSchema } from '@/lib/validations'

const SETTINGS_DOC = 'settings/site'

// GET /api/settings
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const doc = await adminDb.doc(SETTINGS_DOC).get()

      if (!doc.exists) {
        // Return defaults
        const defaults = {
          siteName: 'New Step Footwear Store',
          siteDescription: 'Shop shoes online in Sri Lanka with cash on delivery and island-wide delivery.',
          ownerEmail: 'admin@newstepfootwear.lk',
          ownerPhone: '+94 70 305 4532',
          currency: 'LKR',
          codEnabled: true,
          deliveryZones: [
            { id: '1', name: 'Colombo', fee: 350, isActive: true },
            { id: '2', name: 'Gampaha', fee: 400, isActive: true },
            { id: '3', name: 'Kalutara', fee: 400, isActive: true },
            { id: '4', name: 'Kandy', fee: 450, isActive: true },
            { id: '5', name: 'Galle', fee: 450, isActive: true },
          ],
          socialLinks: {},
        }
        return NextResponse.json({ success: true, data: defaults })
      }

      return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } })
    } catch (error) {
      console.error('GET /api/settings error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
    }
  }, 'settings:read')
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()
      const parsed = siteSettingsSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
      }

      await adminDb.doc(SETTINGS_DOC).set(
        { ...parsed.data, updatedAt: new Date() },
        { merge: true }
      )

      return NextResponse.json({ success: true, data: { message: 'Settings updated' } })
    } catch (error) {
      console.error('PUT /api/settings error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
  }, 'settings:write')
}
