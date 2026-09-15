/**
 * In-memory TTL cache for server-side Next.js requests.
 * Significantly reduces Firestore read operations and protects against quota exhaustion.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Global memory cache stored on globalThis to persist across fast-refreshes in development
const globalForCache = globalThis as unknown as {
  __serverCache?: Map<string, CacheEntry<unknown>>
}

const memoryCache = globalForCache.__serverCache || new Map<string, CacheEntry<unknown>>()
if (process.env.NODE_ENV !== 'production') {
  globalForCache.__serverCache = memoryCache
}

/**
 * Retrieve cached item if not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return entry.data as T
}

/**
 * Store item in cache with TTL in seconds (default 120s = 2 minutes)
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number = 120): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Invalidate cache entries by prefix or clear all
 */
export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear()
    return
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key)
    }
  }
}
