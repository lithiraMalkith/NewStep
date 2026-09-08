/* ================================================================
   Audit Logger — New Step Footwear Admin
   Call logAudit() from any API route to record admin actions.
   ================================================================ */

import { adminDb } from '@/lib/firebase-admin'
import type { AuditAction, AuditResource } from '@/types'

interface AuditParams {
  userId: string
  userEmail: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  resourceName?: string
  details?: string
  ip?: string
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await adminDb.collection('audit_logs').add({
      ...params,
      createdAt: new Date(),
    })
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('[audit] Failed to write audit log:', err)
  }
}
