import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth, AuthedRequest } from '@/lib/auth-middleware'
import { discountSchema } from '@/lib/validations'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req: AuthedRequest) => {
    try {
      const { id } = params
      const body = await req.json()
      const validated = discountSchema.parse(body)

      // Check if updating code to one that exists
      if (validated.code) {
        const codeCheck = await adminDb.collection('discounts').where('code', '==', validated.code).get()
        const conflict = codeCheck.docs.find(d => d.id !== id)
        if (conflict) {
          return NextResponse.json({ success: false, error: 'Discount code already exists' }, { status: 400 })
        }
      }

      await adminDb.collection('discounts').doc(id).update({
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        updatedAt: new Date(),
      })

      return NextResponse.json({ success: true, data: { id, message: 'Discount updated' } })
    } catch (error: any) {
      console.error('Error updating discount:', error)
      if (error.name === 'ZodError') {
        return NextResponse.json({ success: false, error: 'Validation Error', details: error.flatten().fieldErrors }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }, 'discounts:write')
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req: AuthedRequest) => {
    try {
      const { id } = params
      await adminDb.collection('discounts').doc(id).delete()

      return NextResponse.json({ success: true, data: { id, message: 'Discount deleted' } })
    } catch (error) {
      console.error('Error deleting discount:', error)
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }, 'discounts:delete')
}
