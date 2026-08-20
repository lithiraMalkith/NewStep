/**
 * Store configuration and contact details.
 */
export const STORE_CONTACT = {
  phone: '0703054532',
  phoneFormatted: '+94 70 305 4532',
  phoneTel: '+94703054532',
  whatsappNumber: '94703054532',
  whatsappUrl: 'https://wa.me/94703054532',
  email: 'hello@newstepfootwear.lk',
  address: 'No. 123, Galle Road, Colombo 06, Sri Lanka',
} as const

/**
 * Generate a WhatsApp chat link with optional pre-filled message.
 */
export function getWhatsAppLink(message?: string): string {
  if (!message) return STORE_CONTACT.whatsappUrl
  return `${STORE_CONTACT.whatsappUrl}?text=${encodeURIComponent(message)}`
}
