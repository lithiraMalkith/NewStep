import { Resend } from 'resend'
import type { AdminOrder } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@newstepfootwear.lk'

/** Send order confirmation email to customer (fire-and-forget) */
export function sendOrderConfirmation(order: AdminOrder) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.productName} (EU ${item.size})</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join('')

  resend
    .emails.send({
      from: FROM_EMAIL,
      to: order.customer.email,
      subject: `Order Confirmed — ${order.orderRef}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h1 style="font-size:24px;color:#0a0a0a;margin-bottom:8px">Thanks for your order!</h1>
          <p style="color:#767676;font-size:14px">Order ref: <strong>${order.orderRef}</strong></p>

          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <thead>
              <tr style="border-bottom:2px solid #0a0a0a">
                <th style="padding:8px 0;text-align:left">Item</th>
                <th style="padding:8px 0;text-align:center">Qty</th>
                <th style="padding:8px 0;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <p style="font-size:14px"><strong>Subtotal:</strong> Rs. ${order.subtotal.toLocaleString()}</p>
          <p style="font-size:14px"><strong>Delivery:</strong> Rs. ${order.deliveryFee.toLocaleString()}</p>
          <p style="font-size:18px;font-weight:bold;margin-top:12px">Total: Rs. ${order.total.toLocaleString()}</p>

          <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />

          <p style="font-size:14px;color:#767676">
            Payment: Cash on Delivery<br/>
            Delivery to: ${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.district}<br/>
            We'll call before dispatch to confirm.
          </p>

          <p style="font-size:12px;color:#999;margin-top:24px">
            New Step Footwear Store — Colombo, Sri Lanka
          </p>
        </div>
      `,
    })
    .catch((err) => console.error('Email send error:', err))
}

/** Notify admin of a new order (fire-and-forget) */
export function sendNewOrderAlert(order: AdminOrder) {
  const adminEmail = process.env.RESEND_FROM_EMAIL || 'admin@newstepfootwear.lk'

  resend
    .emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `🛒 New Order ${order.orderRef} — Rs. ${order.total.toLocaleString()}`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>New Order Received</h2>
          <p><strong>Ref:</strong> ${order.orderRef}</p>
          <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.phone})</p>
          <p><strong>Items:</strong> ${order.items.length} item(s)</p>
          <p><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
          <p><strong>District:</strong> ${order.deliveryAddress.district}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}">View Order →</a></p>
        </div>
      `,
    })
    .catch((err) => console.error('Admin alert email error:', err))
}

/** Notify customer of order status update (fire-and-forget) */
export function sendStatusUpdate(order: AdminOrder, newStatus: string, note?: string) {
  if (!order.customer.email) return

  const statusLabels: Record<string, string> = {
    processing: 'Being Prepared',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  resend
    .emails.send({
      from: FROM_EMAIL,
      to: order.customer.email,
      subject: `Order ${order.orderRef} — ${statusLabels[newStatus] || newStatus}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h1 style="font-size:24px;color:#0a0a0a">Order Update</h1>
          <p>Your order <strong>${order.orderRef}</strong> is now: <strong>${statusLabels[newStatus] || newStatus}</strong></p>
          ${note ? `<p style="color:#767676">${note}</p>` : ''}
          ${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ''}
          ${newStatus === 'cancelled' && order.cancellationReason ? `<p style="color:#d43f21">Reason: ${order.cancellationReason}</p>` : ''}
          <p style="font-size:12px;color:#999;margin-top:24px">
            New Step Footwear Store — Colombo, Sri Lanka
          </p>
        </div>
      `,
    })
    .catch((err) => console.error('Status update email error:', err))
}
