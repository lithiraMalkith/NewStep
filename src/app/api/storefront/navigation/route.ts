import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { buildCategoryTree, DEFAULT_CATEGORY_TREE, DEFAULT_CATEGORY_NODES } from '@/lib/category-tree'
import { getCached, setCached } from '@/lib/server-cache'
import type { CategoryNode, CategoryTreeNode } from '@/types'

interface NavCategory {
  id: string
  name: string
  slug: string
  order: number
}

interface NavigationPayload {
  data: NavCategory[]
  tree: CategoryTreeNode[]
}

const CACHE_KEY = 'storefront_navigation_tree'

// Static fallback categories matching the original hardcoded NAV
const STATIC_NAV: NavCategory[] = [
  { id: 'mens', name: "Men", slug: 'mens', order: 0 },
  { id: 'womens', name: "Women", slug: 'womens', order: 1 },
  { id: 'kids', name: "Kids", slug: 'kids', order: 2 },
]

// GET /api/storefront/navigation — Public endpoint, no auth required
// Returns full category tree for the mega-menu navigation
export async function GET(_req: NextRequest) {
  // Check in-memory cache first
  const cached = getCached<NavigationPayload>(CACHE_KEY)
  if (cached) {
    return NextResponse.json({ success: true, ...cached }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
    })
  }

  try {
    const snapshot = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(200)
      .get()

    if (snapshot.empty) {
      const payload: NavigationPayload = { data: STATIC_NAV, tree: DEFAULT_CATEGORY_TREE }
      setCached(CACHE_KEY, payload, 120)
      return NextResponse.json({ success: true, ...payload })
    }

    const nodes: CategoryNode[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name as string,
        slug: data.slug as string,
        description: (data.description as string) || '',
        image: (data.image as string) || '',
        blurb: (data.blurb as string) || '',
        parentId: (data.parentId as string | null) ?? null,
        depth: (data.depth as number) ?? 0,
        order: (data.order as number) ?? 0,
        isActive: data.isActive !== false, // default true for backward compat
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      }
    })

    // Filter to active-only for storefront
    const activeNodes = nodes.filter((n) => n.isActive)

    // Build tree for mega-menu
    const tree = buildCategoryTree(activeNodes)

    // If Firestore only has flat roots without subcategories, fallback to DEFAULT_CATEGORY_TREE for rich navigation
    const hasAnyChildren = tree.some((root) => root.children && root.children.length > 0)
    const finalTree = hasAnyChildren ? tree : DEFAULT_CATEGORY_TREE

    // Also return flat root categories for backward compat (navItems)
    const rootCategories = (activeNodes.length > 0 ? activeNodes : DEFAULT_CATEGORY_NODES)
      .filter((n) => n.parentId === null || n.depth === 0)
      .sort((a, b) => a.order - b.order)
      .map((n) => ({ id: n.id, name: n.name, slug: n.slug, order: n.order }))

    const payload: NavigationPayload = { data: rootCategories, tree: finalTree }
    setCached(CACHE_KEY, payload, 120)

    return NextResponse.json({ success: true, ...payload }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
    })
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string } | undefined
    if (err?.code === 8 || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[Storefront] Firestore quota exceeded in navigation. Serving static navigation fallback.')
    } else {
      console.error('GET /api/storefront/navigation error:', err?.message || error)
    }

    const fallback: NavigationPayload = { data: STATIC_NAV, tree: DEFAULT_CATEGORY_TREE }
    setCached(CACHE_KEY, fallback, 60)
    return NextResponse.json({ success: true, ...fallback }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180' }
    })
  }
}

