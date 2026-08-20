import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { uploadImage } from '@/lib/cloudinary'

// POST /api/upload — Upload image to Cloudinary
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    try {
      const body = await authedReq.json()

      if (!body.image) {
        return NextResponse.json(
          { success: false, error: 'No image data provided' },
          { status: 400 }
        )
      }

      const url = await uploadImage(body.image, body.folder || 'newstep-products')

      return NextResponse.json({
        success: true,
        data: { url },
      })
    } catch (error) {
      console.error('POST /api/upload error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      )
    }
  }, 'products:write')
}
