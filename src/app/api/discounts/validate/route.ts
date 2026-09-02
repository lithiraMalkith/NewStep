import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { discountValidateSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = discountValidateSchema.parse(body)

    const snapshot = await adminDb.collection('discounts').where('code', '==', validated.code.toUpperCase()).limit(1).get()
    
    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: { valid: false, error: 'Invalid discount code' } })
    }

    const doc = snapshot.docs[0]
    const discount = doc.data()

    if (discount.status !== 'active') {
      return NextResponse.json({ success: true, data: { valid: false, error: 'Discount code is inactive' } })
    }

    const now = new Date()
    const startDate = discount.startDate.toDate()
    const endDate = discount.endDate.toDate()

    if (now < startDate || now > endDate) {
      return NextResponse.json({ success: true, data: { valid: false, error: 'Discount code has expired' } })
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ success: true, data: { valid: false, error: 'Discount code limit reached' } })
    }

    if (discount.minOrderAmount && validated.orderTotal < discount.minOrderAmount) {
      return NextResponse.json({ success: true, data: { valid: false, error: `Minimum order amount of Rs. ${discount.minOrderAmount} required` } })
    }

    // Checking categories if applicable (for simplicity, we assume valid if array is empty or intersection exists)
    if (discount.applicableCategories && discount.applicableCategories.length > 0) {
      const hasValidCategory = validated.categories.some((cat: string) => discount.applicableCategories.includes(cat))
      if (!hasValidCategory) {
        return NextResponse.json({ success: true, data: { valid: false, error: 'Not applicable to items in your cart' } })
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = (validated.orderTotal * discount.value) / 100
    } else {
      discountAmount = discount.value
    }

    return NextResponse.json({ success: true, data: { valid: true, discountAmount, discount: { id: doc.id, ...discount } } })
  } catch (error: any) {
    console.error('Error validating discount:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Validation Error', details: error.flatten().fieldErrors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
