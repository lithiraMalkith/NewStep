/* ================================================================
   Admin Service — Server-side Firestore helpers
   Reusable query patterns for API routes.
   ================================================================ */

import { adminDb } from './firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/** Convert Firestore Timestamp fields to ISO strings for JSON serialization */
export function serializeDoc(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    ...Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value && typeof value === 'object' && 'toDate' in value) {
          return [key, (value as { toDate: () => Date }).toDate().toISOString()]
        }
        // Handle arrays of objects with timestamps (e.g., statusHistory)
        if (Array.isArray(value)) {
          return [
            key,
            value.map((item) => {
              if (item && typeof item === 'object') {
                return Object.fromEntries(
                  Object.entries(item).map(([k, v]) => {
                    if (v && typeof v === 'object' && 'toDate' in v) {
                      return [k, (v as { toDate: () => Date }).toDate().toISOString()]
                    }
                    return [k, v]
                  })
                )
              }
              return item
            }),
          ]
        }
        return [key, value]
      })
    ),
  }
}

/** Serialize all docs from a Firestore query snapshot */
export function serializeDocs(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map(serializeDoc).filter(Boolean)
}

/** Get a Firestore server timestamp */
export function serverTimestamp() {
  return FieldValue.serverTimestamp()
}

/** Increment a field value */
export function increment(n: number) {
  return FieldValue.increment(n)
}

/** Get collection reference with type safety */
export function collection(name: string) {
  return adminDb.collection(name)
}

/** Get document reference */
export function doc(collectionName: string, id: string) {
  return adminDb.collection(collectionName).doc(id)
}

/**
 * Fetch paginated documents from a collection.
 */
export async function fetchPaginated(
  collectionName: string,
  options: {
    orderBy?: string
    direction?: 'asc' | 'desc'
    limit?: number
    where?: [string, FirebaseFirestore.WhereFilterOp, unknown][]
  } = {}
) {
  const { orderBy = 'createdAt', direction = 'desc', limit = 100, where: conditions } = options

  let query: FirebaseFirestore.Query = adminDb.collection(collectionName)

  if (conditions) {
    for (const [field, op, value] of conditions) {
      query = query.where(field, op, value)
    }
  }

  query = query.orderBy(orderBy, direction).limit(limit)
  const snapshot = await query.get()
  return serializeDocs(snapshot)
}
