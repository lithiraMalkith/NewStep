'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/admin-client'
import { buildCategoryTree } from '@/lib/category-tree'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, Loader2, AlertCircle, CheckCircle2, FolderTree,
  ChevronDown, ChevronRight, Pencil, X, GripVertical, ArrowUp, ArrowDown,
  Eye, EyeOff, Save,
} from 'lucide-react'
import type { CategoryNode, CategoryTreeNode } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

const DEPTH_LABELS = ['Root Category', 'Sub-Category', 'Sub-Sub-Category'] as const
const DEPTH_COLORS = ['#F7F4EE', '#D4CBBF', '#8A8478'] as const

export default function CategoriesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [flatItems, setFlatItems] = useState<CategoryNode[]>([])
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Expand/collapse state
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Form state
  const [addingUnder, setAddingUnder] = useState<string | null>(null) // parentId (null for root)
  const [showRootForm, setShowRootForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(null)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }, [])

  const loadCategories = useCallback(async () => {
    if (!user) return
    try {
      const t = await user.getIdToken()
      const items = await fetchCategories(t)
      setFlatItems(items)
      setTree(buildCategoryTree(items))
    } catch {
      addToast('error', 'Failed to load categories')
    }
  }, [user, addToast])

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      await loadCategories()
      setLoading(false)
    })()
  }, [user, authLoading, loadCategories])

  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
    const cards = document.querySelectorAll('.tree-node')
    if (cards.length) {
      gsap.fromTo('.tree-node', { opacity: 0, x: -12 }, { opacity: 1, x: 0, stagger: 0.04, duration: 0.3, delay: 0.15, clearProps: 'opacity,x' })
    }
  }, { scope: containerRef, dependencies: [loading, tree] })

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const walk = (nodes: CategoryTreeNode[]) => {
      for (const n of nodes) {
        allIds.add(n.id)
        walk(n.children)
      }
    }
    walk(tree)
    setExpanded(allIds)
  }

  const collapseAll = () => setExpanded(new Set())

  // ─── Create Handler ───
  const handleCreate = async (parentId: string | null, depth: number) => {
    if (!user || !formName.trim()) return
    setSaving(true)
    try {
      const t = await user.getIdToken()

      // Calculate order: count siblings
      const siblings = flatItems.filter((c) =>
        parentId ? c.parentId === parentId : (c.parentId === null || c.parentId === undefined)
      )

      const created = await createCategory(t, {
        name: formName.trim(),
        slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formDescription || undefined,
        parentId,
        depth,
        order: siblings.length,
        isActive: true,
      } as Partial<CategoryNode>)

      await loadCategories()
      resetForm()

      // Auto-expand parent and newly created node so sub-levels can be added immediately
      setExpanded((prev) => {
        const next = new Set(prev)
        if (parentId) next.add(parentId)
        if (created?.id) next.add(created.id)
        return next
      })

      addToast('success', `${DEPTH_LABELS[depth]} created`)
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setAddingUnder(null)
    setShowRootForm(false)
  }

  // ─── Edit Handler ───
  const startEdit = (node: CategoryTreeNode) => {
    setEditingId(node.id)
    setEditName(node.name)
    setEditSlug(node.slug)
    setEditDescription(node.description || '')
  }

  const handleSaveEdit = async () => {
    if (!user || !editingId || !editName.trim()) return
    setSaving(true)
    try {
      const t = await user.getIdToken()
      await updateCategory(t, editingId, {
        name: editName.trim(),
        slug: editSlug,
        description: editDescription || undefined,
      })
      await loadCategories()
      setEditingId(null)
      addToast('success', 'Category updated')
    } catch {
      addToast('error', 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle Active Handler ───
  const handleToggleActive = async (node: CategoryTreeNode) => {
    if (!user) return
    try {
      const t = await user.getIdToken()
      await updateCategory(t, node.id, { isActive: !node.isActive } as Partial<CategoryNode>)
      await loadCategories()
      addToast('success', node.isActive ? 'Category hidden from storefront' : 'Category visible on storefront')
    } catch {
      addToast('error', 'Failed to toggle visibility')
    }
  }

  // ─── Delete Handler ───
  const handleDelete = async () => {
    if (!user || !deleteTarget) return
    try {
      const t = await user.getIdToken()
      await deleteCategory(t, deleteTarget.id)
      await loadCategories()
      setDeleteTarget(null)
      addToast('success', 'Deleted')
    } catch {
      addToast('error', 'Failed to delete')
    }
  }

  // ─── Reorder Handler ───
  const handleMove = async (nodeId: string, parentId: string | null, direction: 'up' | 'down') => {
    if (!user) return
    const siblings = flatItems
      .filter((c) => (parentId ? c.parentId === parentId : (c.parentId === null || c.parentId === undefined)))
      .sort((a, b) => a.order - b.order)

    const idx = siblings.findIndex((c) => c.id === nodeId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === siblings.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updates = siblings.map((c, i) => {
      let newOrder = i
      if (i === idx) newOrder = swapIdx
      if (i === swapIdx) newOrder = idx
      return { id: c.id, order: newOrder }
    })

    try {
      const t = await user.getIdToken()
      await reorderCategories(t, updates)
      await loadCategories()
    } catch {
      addToast('error', 'Failed to reorder')
    }
  }

  // ─── Add Form Component ───
  const AddForm = ({ parentId, depth }: { parentId: string | null; depth: number }) => (
    <div className="bg-[#0B0B0B] rounded-xl border border-[#24221F] p-4 space-y-3 mt-2 animate-in fade-in-50 slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_COLORS[depth] }} />
        <h3 className="text-xs font-semibold text-[#FAF8F5]">New {DEPTH_LABELS[depth]}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#8A8478] mb-1 block uppercase tracking-wider">Name</label>
          <input
            value={formName}
            onChange={(e) => { setFormName(e.target.value); setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }}
            placeholder={`e.g. ${depth === 0 ? 'Men' : depth === 1 ? 'Footwear' : 'Casual'}`}
            className="w-full bg-[#121212] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] placeholder:text-[#3A352F]"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] text-[#8A8478] mb-1 block uppercase tracking-wider">Slug</label>
          <input
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            className="w-full bg-[#121212] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[#8A8478] mb-1 block uppercase tracking-wider">Description (optional)</label>
        <input
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          className="w-full bg-[#121212] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={resetForm} className="px-3 py-1.5 border border-[#24221F] rounded-lg text-xs text-[#FAF8F5] hover:bg-[#181818] transition-colors">Cancel</button>
        <button
          onClick={() => handleCreate(parentId, depth)}
          disabled={saving || !formName.trim()}
          className="px-3 py-1.5 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-xs font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs"
        >
          {saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  )

  // ─── Tree Node Renderer ───
  const TreeNode = ({ node, depth }: { node: CategoryTreeNode; depth: number }) => {
    const isExpanded = expanded.has(node.id)
    const hasChildren = node.children.length > 0
    const isEditing = editingId === node.id
    const canAddChild = depth < 2

    // Calculate siblings for reorder
    const siblings = flatItems
      .filter((c) => (node.parentId ? c.parentId === node.parentId : (c.parentId === null || c.parentId === undefined)))
      .sort((a, b) => a.order - b.order)
    const siblingIdx = siblings.findIndex((c) => c.id === node.id)
    const canMoveUp = siblingIdx > 0
    const canMoveDown = siblingIdx < siblings.length - 1

    return (
      <div className="tree-node" style={{ marginLeft: depth * 24 }}>
        {/* Node Row */}
        <div className={cn(
          'group flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all',
          node.isActive
            ? 'bg-[#121212] border-[#24221F] hover:border-[#3A352F]'
            : 'bg-[#0B0B0B] border-[#1A1816] opacity-60',
          isEditing && 'border-[#F7F4EE]/40 ring-1 ring-[#F7F4EE]/20'
        )}>
          {/* Expand toggle */}
          <button
            onClick={() => hasChildren && toggleExpand(node.id)}
            className={cn(
              'p-0.5 rounded text-[#8A8478] transition-colors',
              hasChildren ? 'hover:text-[#FAF8F5] cursor-pointer' : 'invisible'
            )}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Depth indicator */}
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: DEPTH_COLORS[depth] }} />

          {isEditing ? (
            /* Inline Edit Form */
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }}
                className="flex-1 min-w-0 bg-[#0B0B0B] border border-[#24221F] rounded px-2 py-1 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null) }}
              />
              <input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-32 bg-[#0B0B0B] border border-[#24221F] rounded px-2 py-1 text-xs text-[#8A8478] font-mono outline-none focus:border-[#F7F4EE]"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null) }}
              />
              <button onClick={handleSaveEdit} disabled={saving} className="p-1 rounded text-[#F7F4EE] hover:bg-[#F7F4EE]/10">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Display Mode */
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium truncate', node.isActive ? 'text-[#FAF8F5]' : 'text-[#8A8478] line-through')}>
                    {node.name}
                  </span>
                  <span className="text-[10px] text-[#8A8478] font-mono hidden sm:inline">/{node.slug}</span>
                  {hasChildren && (
                    <span className="text-[10px] text-[#8A8478] bg-[#1A1A1A] px-1.5 py-0.5 rounded-full">
                      {node.children.length}
                    </span>
                  )}
                  {!node.isActive && (
                    <span className="text-[9px] text-[#8A8478] bg-[#1A1A1A] px-1.5 py-0.5 rounded-full border border-[#24221F]">Hidden</span>
                  )}
                </div>
                {node.description && (
                  <p className="text-[11px] text-[#8A8478] truncate mt-0.5">{node.description}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canAddChild && (
                  <button
                    onClick={() => {
                      resetForm()
                      setAddingUnder(node.id)
                      setExpanded((prev) => new Set(prev).add(node.id))
                    }}
                    className="p-1 rounded text-[#FAF8F5] bg-[#F7F4EE]/10 hover:bg-[#F7F4EE]/20 transition-colors"
                    title={`Add ${DEPTH_LABELS[depth + 1]}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleMove(node.id, node.parentId, 'up')}
                  disabled={!canMoveUp}
                  className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1A1A1A] disabled:opacity-20 disabled:pointer-events-none"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMove(node.id, node.parentId, 'down')}
                  disabled={!canMoveDown}
                  className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1A1A1A] disabled:opacity-20 disabled:pointer-events-none"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(node)}
                  className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1A1A1A]"
                  title={node.isActive ? 'Hide from storefront' : 'Show on storefront'}
                >
                  {node.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => startEdit(node)}
                  className="p-1 rounded text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1A1A1A]"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(node)}
                  className="p-1 rounded text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1 border-l border-[#24221F]/50 ml-4">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}

        {/* Add child button or form */}
        {canAddChild && (isExpanded || addingUnder === node.id) && (
          <div style={{ marginLeft: 24 }}>
            {addingUnder === node.id ? (
              <AddForm parentId={node.id} depth={depth + 1} />
            ) : (
              <button
                onClick={() => { resetForm(); setAddingUnder(node.id); setExpanded((prev) => new Set(prev).add(node.id)) }}
                className="flex items-center gap-1.5 mt-1 px-3 py-1.5 text-[11px] text-[#8A8478] hover:text-[#FAF8F5] rounded-lg hover:bg-[#1A1A1A] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add {DEPTH_LABELS[depth + 1]}</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  // ─── Count stats ───
  const rootCount = tree.length
  const totalCount = flatItems.length
  const subCount = flatItems.filter((c) => c.depth === 1).length
  const subSubCount = flatItems.filter((c) => c.depth === 2).length

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Category Tree</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            {rootCount} root · {subCount} sub · {subSubCount} sub-sub · {totalCount} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 border border-[#24221F] rounded-lg text-xs text-[#D4CBBF] hover:bg-[#1A1A1A] transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 border border-[#24221F] rounded-lg text-xs text-[#D4CBBF] hover:bg-[#1A1A1A] transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={() => { resetForm(); setShowRootForm(!showRootForm) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Root Category
          </button>
        </div>
      </div>

      {/* Root Add Form */}
      {showRootForm && <AddForm parentId={null} depth={0} />}

      {/* Tree */}
      <div className="space-y-1.5">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
        {tree.length === 0 && !showRootForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F7F4EE]/5 flex items-center justify-center mb-4">
              <FolderTree className="w-8 h-8 text-[#8A8478]" />
            </div>
            <p className="text-[#FAF8F5] font-medium mb-1">No categories yet</p>
            <p className="text-[#8A8478] text-sm mb-4">Start by adding your first root category</p>
            <button
              onClick={() => setShowRootForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Root Category
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#24221F] rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#FAF8F5] mb-2">Delete Category?</h2>
            <p className="text-sm text-[#8A8478] mb-1">
              <strong className="text-[#FAF8F5]">{deleteTarget.name}</strong>
            </p>
            {deleteTarget.children.length > 0 && (
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-[#E05252]/5 border border-[#E05252]/20">
                <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
                <p className="text-xs text-[#D4CBBF]">
                  This will also delete <strong>{deleteTarget.children.length}</strong> child {deleteTarget.children.length === 1 ? 'category' : 'categories'} and all their descendants.
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-[#24221F] rounded-lg text-[#FAF8F5] hover:bg-[#181818] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-[#E05252] text-white rounded-lg hover:bg-[#C94141] text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto bg-[#141414] border',
              t.type === 'success' ? 'text-[#FAF8F5] border-[#F7F4EE]/30' : 'text-[#D4CBBF] border-[#3A352F]'
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#F7F4EE]" /> : <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
