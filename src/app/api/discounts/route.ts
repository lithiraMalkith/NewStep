import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth, AuthedRequest } from '@/lib/auth-middleware'
import { discountSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthedRequest) => {
    try {
      const snapshot = await adminDb.collection('discounts').orderBy('createdAt', 'desc').get()
      const discounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.() || doc.data().startDate,
        endDate: doc.data().endDate?.toDate?.() || doc.data().endDate,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }))

      return NextResponse.json({ success: true, data: discounts })
    } catch (error) {
      console.error('Error fetching discounts:', error)
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }, 'discounts:read')
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthedRequest) => {
    try {
      const body = await req.json()
      const validated = discountSchema.parse(body)

      const codeCheck = await adminDb.collection('discounts').where('code', '==', validated.code).limit(1).get()
      if (!codeCheck.empty) {
        return NextResponse.json({ success: false, error: 'Discount code already exists' }, { status: 400 })
      }

      const now = new Date()
      const discountData = {
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        usedCount: 0,
        status: 'active',
        createdBy: req.user.uid,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await adminDb.collection('discounts').add(discountData)

      return NextResponse.json({ success: true, data: { id: docRef.id, ...discountData } })
    } catch (error: any) {
      console.error('Error creating discount:', error)
      if (error.name === 'ZodError') {
        return NextResponse.json({ success: false, error: 'Validation Error', details: error.flatten().fieldErrors }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }, 'discounts:write')
}
