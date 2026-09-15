/* ================================================================
   Category Tree Utilities
   Convert flat CategoryNode[] ↔ nested CategoryTreeNode[]
   Shared by admin panel and storefront.
   ================================================================ */

import type { CategoryNode, CategoryTreeNode } from '@/types'

/**
 * Build a nested tree from a flat list of category nodes.
 * Nodes are linked by `parentId` and sorted by `order` within each level.
 */
export function buildCategoryTree(nodes: CategoryNode[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  // 1. Create tree node wrappers
  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] })
  }

  // 2. Link children to parents
  for (const treeNode of map.values()) {
    if (treeNode.parentId && map.has(treeNode.parentId)) {
      map.get(treeNode.parentId)!.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  }

  // 3. Sort children recursively by order
  const sortChildren = (list: CategoryTreeNode[]) => {
    list.sort((a, b) => a.order - b.order)
    list.forEach((n) => sortChildren(n.children))
  }
  sortChildren(roots)

  return roots
}

/**
 * Flatten a tree back to a flat array (useful for search / iteration).
 */
export function flattenTree(tree: CategoryTreeNode[]): CategoryNode[] {
  const result: CategoryNode[] = []
  const walk = (nodes: CategoryTreeNode[]) => {
    for (const node of nodes) {
      const { children, ...flat } = node
      result.push(flat)
      walk(children)
    }
  }
  walk(tree)
  return result
}

/**
 * Find a node by ID in the tree.
 */
export function findNodeInTree(tree: CategoryTreeNode[], id: string): CategoryTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    const found = findNodeInTree(node.children, id)
    if (found) return found
  }
  return null
}

/**
 * Get all descendant IDs of a node (for cascade operations).
 */
export function getDescendantIds(tree: CategoryTreeNode[], nodeId: string): string[] {
  const node = findNodeInTree(tree, nodeId)
  if (!node) return []
  const ids: string[] = []
  const collect = (children: CategoryTreeNode[]) => {
    for (const child of children) {
      ids.push(child.id)
      collect(child.children)
    }
  }
  collect(node.children)
  return ids
}

/** Max allowed depth (0-indexed: root=0, sub=1, sub-sub=2) */
export const MAX_CATEGORY_DEPTH = 2

const now = new Date('2025-01-01T00:00:00.000Z')

/** Default hierarchical 3-level category dataset for store navigation and seeding */
export const DEFAULT_CATEGORY_NODES: CategoryNode[] = [
  // ─── MEN (Root) ───
  {
    id: 'mens',
    name: "Men",
    slug: 'mens',
    description: "Men's runners, lifestyle and formal footwear",
    image: '/images/banner.jpg',
    blurb: 'Runners, lifestyle sneakers and formal leather',
    parentId: null,
    depth: 0,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Footwear (Sub)
  {
    id: 'mens-footwear',
    name: 'Footwear',
    slug: 'footwear',
    description: "Men's athletic, lifestyle and formal shoes",
    parentId: 'mens',
    depth: 1,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Footwear > Sports (SubSub)
  {
    id: 'mens-footwear-sports',
    name: 'Sports & Running',
    slug: 'sports',
    description: "Performance road runners, trail sneakers and gym trainers",
    parentId: 'mens-footwear',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Footwear > Casual (SubSub)
  {
    id: 'mens-footwear-casual',
    name: 'Casual & Lifestyle',
    slug: 'casual',
    description: "Chunky sneakers, slip-ons and everyday street shoes",
    parentId: 'mens-footwear',
    depth: 2,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Footwear > Formal (SubSub)
  {
    id: 'mens-footwear-formal',
    name: 'Formal & Leather',
    slug: 'formal',
    description: "Full-grain Oxfords, loafers and dress shoes",
    parentId: 'mens-footwear',
    depth: 2,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Clothing (Sub)
  {
    id: 'mens-clothing',
    name: 'Clothing',
    slug: 'clothing',
    description: "Men's apparel and activewear",
    parentId: 'mens',
    depth: 1,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mens-clothing-shirts',
    name: 'Shirts & Tops',
    slug: 'shirts',
    parentId: 'mens-clothing',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mens-clothing-denims',
    name: 'Denims & Pants',
    slug: 'denims',
    parentId: 'mens-clothing',
    depth: 2,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Men > Accessories (Sub)
  {
    id: 'mens-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: "Socks, insoles and shoe care",
    parentId: 'mens',
    depth: 1,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mens-accessories-socks',
    name: 'Socks & Insoles',
    slug: 'socks',
    parentId: 'mens-accessories',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },

  // ─── WOMEN (Root) ───
  {
    id: 'womens',
    name: "Women",
    slug: 'womens',
    description: "Women's court sneakers, casuals, mules and slides",
    image: '/images/p4.jpg',
    blurb: 'Court sneakers, everyday casuals, mules and slides',
    parentId: null,
    depth: 0,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Women > Footwear (Sub)
  {
    id: 'womens-footwear',
    name: 'Footwear',
    slug: 'footwear',
    description: "Sneakers, block heels, flats and mules",
    parentId: 'womens',
    depth: 1,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'womens-footwear-sneakers',
    name: 'Sneakers & Runners',
    slug: 'sneakers',
    description: "Court sneakers, minimalist trainers and performance runners",
    parentId: 'womens-footwear',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'womens-footwear-heels',
    name: 'Heels & Mules',
    slug: 'heels',
    description: "Block heel mules, sandals and dress heels",
    parentId: 'womens-footwear',
    depth: 2,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'womens-footwear-flats',
    name: 'Flats & Slides',
    slug: 'flats',
    description: "Air slides, ballet flats and comfort sandals",
    parentId: 'womens-footwear',
    depth: 2,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Women > Clothing (Sub)
  {
    id: 'womens-clothing',
    name: 'Clothing',
    slug: 'clothing',
    parentId: 'womens',
    depth: 1,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'womens-clothing-tops',
    name: 'Tops & Tees',
    slug: 'tops',
    parentId: 'womens-clothing',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Women > Accessories (Sub)
  {
    id: 'womens-accessories',
    name: 'Accessories',
    slug: 'accessories',
    parentId: 'womens',
    depth: 1,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'womens-accessories-bags',
    name: 'Bags & Care',
    slug: 'bags',
    parentId: 'womens-accessories',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },

  // ─── KIDS (Root) ───
  {
    id: 'kids',
    name: "Kids",
    slug: 'kids',
    description: "School-ready, playground-proof sneakers and sport sandals",
    image: '/images/p6.jpg',
    blurb: 'School-ready and play-proof footwear',
    parentId: null,
    depth: 0,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Kids > Footwear (Sub)
  {
    id: 'kids-footwear',
    name: 'Footwear',
    slug: 'footwear',
    description: "School shoes, light-up sneakers and sport sandals",
    parentId: 'kids',
    depth: 1,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'kids-footwear-school',
    name: 'School Shoes',
    slug: 'school',
    description: "Black and white uniform compliant school shoes",
    parentId: 'kids-footwear',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'kids-footwear-sports',
    name: 'Sports & Play',
    slug: 'sports',
    description: "Cushioned running shoes and light-up trainers",
    parentId: 'kids-footwear',
    depth: 2,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'kids-footwear-sandals',
    name: 'Sandals & Slides',
    slug: 'sandals',
    description: "Water-resistant sport adventure sandals",
    parentId: 'kids-footwear',
    depth: 2,
    order: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  // Kids > Accessories (Sub)
  {
    id: 'kids-accessories',
    name: 'Accessories',
    slug: 'accessories',
    parentId: 'kids',
    depth: 1,
    order: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'kids-accessories-socks',
    name: 'Socks & Gear',
    slug: 'socks',
    parentId: 'kids-accessories',
    depth: 2,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
]

/** Cached default tree */
export const DEFAULT_CATEGORY_TREE: CategoryTreeNode[] = buildCategoryTree(DEFAULT_CATEGORY_NODES)

/** Get subcategories (depth 1) with their children (depth 2) for a given root slug */
export function getSubCategoriesForRootSlug(tree: CategoryTreeNode[], slug: string): CategoryTreeNode[] {
  const root = tree.find((r) => r.slug === slug || r.id === slug)
  return root?.children || []
}

