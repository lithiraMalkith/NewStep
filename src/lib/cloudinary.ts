import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

/**
 * Upload a base64-encoded image to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(
  base64Data: string,
  folder = 'newstep-products'
): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
  })
  return result.secure_url
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

/**
 * Extract public ID from a Cloudinary URL for deletion.
 */
export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  return match ? match[1]! : null
}
