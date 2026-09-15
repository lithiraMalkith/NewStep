import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { buildCategoryTree, DEFAULT_CATEGORY_TREE } from '@/lib/category-tree'
import type { CategoryNode } from '@/types'

// GET /api/storefront/categories — Public endpoint, no auth required
// Returns full category tree for the storefront Shop by Category section
export async function GET(_req: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(200)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_TREE })
    }

    const nodes: CategoryNode[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name as string,
        slug: data.slug as string,
        description: (data.description as string) || undefined,
        image: (data.image as string) || undefined,
        blurb: (data.blurb as string) || undefined,
        parentId: (data.parentId as string | null) ?? null,
        depth: (data.depth as number) ?? 0,
        order: (data.order as number) ?? 0,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      }
    })

    // Filter to active-only for storefront
    const activeNodes = nodes.filter((n) => n.isActive)
    const tree = buildCategoryTree(activeNodes)
    const hasAnyChildren = tree.some((root) => root.children && root.children.length > 0)
    const finalTree = hasAnyChildren ? tree : DEFAULT_CATEGORY_TREE

    return NextResponse.json({ success: true, data: finalTree })
  } catch (error) {
    console.error('GET /api/storefront/categories error:', error)
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_TREE })
  }
}

