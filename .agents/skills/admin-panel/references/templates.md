# Admin Panel — Code Templates

Copy-paste-ready templates for each type of file in the admin panel.

---

## Template 1: List Page (`/admin/[module]/page.tsx`)

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchEntities } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { Entity } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function EntitiesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<Entity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const data = await fetchEntities(token)
        setItems(
          data.map((item) => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          }))
        )
      } catch (error) {
        console.error('Failed to load entities:', error)
        addToast('error', 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const rows = document.querySelectorAll('.item-row')
    if (rows.length > 0) {
      gsap.from('.item-row', {
        opacity: 0, y: 15, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2,
      })
    }
  }, { scope: containerRef })

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Entities</h1>
          <p className="text-brand-muted text-sm mt-1">{items.length} total</p>
        </div>
        <button
          onClick={() => router.push('/admin/entities/new')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Entity
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="item-row">
                  <td>
                    <p className="font-medium text-brand-text">{item.name}</p>
                  </td>
                  <td>{/* Status badge */}</td>
                  <td>
                    <span className="text-sm text-brand-muted">
                      {item.createdAt.toLocaleDateString('en-LK', {
                        month: 'short', day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 py-1">
                          <button onClick={() => { setActiveMenu(null); router.push(`/admin/entities/${item.id}`) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => { setActiveMenu(null); router.push(`/admin/entities/${item.id}/edit`) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => { setActiveMenu(null); setDeleteConfirmId(item.id) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-danger hover:bg-brand-danger/10">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <p className="text-brand-muted text-sm">No items found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Delete?</h2>
            <p className="text-brand-muted text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover disabled:opacity-50">
                Cancel
              </button>
              <button onClick={/* handleDelete */() => {}} disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-brand-danger text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto',
            toast.type === 'success' && 'bg-brand-success/10 text-brand-success border border-brand-success/30',
            toast.type === 'error' && 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
            toast.type === 'info' && 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30',
          )}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Template 2: API Route (`/api/[module]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { entitySchema } from '@/lib/validations'

// GET /api/entities — List all
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const snapshot = await adminDb
        .collection('entities')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      const entities = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        }
      })

      return NextResponse.json({ success: true, data: entities })
    } catch (error) {
      console.error('GET /api/entities error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch entities' },
        { status: 500 }
      )
    }
  }, 'entities:read')
}

// POST /api/entities — Create
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()

      // Validate
      const parsed = entitySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const now = new Date()
      const entityData = {
        ...parsed.data,
        createdBy: authedReq.user.uid,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await adminDb.collection('entities').add(entityData)

      return NextResponse.json(
        {
          success: true,
          data: {
            id: docRef.id,
            ...entityData,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/entities error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create entity' },
        { status: 500 }
      )
    }
  }, 'entities:write')
}
```

---

## Template 3: API Route with ID (`/api/[module]/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/entities/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('entities').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: 'Entity not found' },
          { status: 404 }
        )
      }

      const data = doc.data()!
      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('GET /api/entities/:id error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch entity' },
        { status: 500 }
      )
    }
  }, 'entities:read')
}

// PUT /api/entities/:id — Full update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()

      const docRef = adminDb.collection('entities').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: 'Entity not found' },
          { status: 404 }
        )
      }

      const updateData = {
        ...body,
        updatedAt: new Date(),
      }

      await docRef.update(updateData)

      return NextResponse.json({
        success: true,
        data: { id, message: 'Entity updated successfully' },
      })
    } catch (error) {
      console.error('PUT /api/entities/:id error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update entity' },
        { status: 500 }
      )
    }
  }, 'entities:write')
}

// DELETE /api/entities/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const docRef = adminDb.collection('entities').doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: 'Entity not found' },
          { status: 404 }
        )
      }

      await docRef.delete()

      return NextResponse.json({
        success: true,
        data: { id, message: 'Entity deleted successfully' },
      })
    } catch (error) {
      console.error('DELETE /api/entities/:id error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete entity' },
        { status: 500 }
      )
    }
  }, 'entities:delete')
}
```

---

## Template 4: Client API Functions (`lib/admin-client.ts` additions)

```typescript
export async function fetchEntities(token: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return fetchApi<Entity[]>(`/api/entities${query}`, token)
}

export async function fetchEntity(token: string, id: string) {
  return fetchApi<Entity>(`/api/entities/${id}`, token)
}

export async function createEntity(token: string, payload: CreateEntityPayload) {
  return fetchApi<Entity>(`/api/entities`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateEntity(token: string, id: string, payload: Partial<Entity>) {
  return fetchApi<{ id: string; message: string }>(`/api/entities/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteEntity(token: string, id: string) {
  return fetchApi<{ id: string; message: string }>(`/api/entities/${id}`, token, {
    method: 'DELETE',
  })
}
```

---

## Template 5: Detail/View Page (`/admin/[module]/[id]/page.tsx`)

```tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchEntity } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import type { Entity } from '@/types'

export default function ViewEntityPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)

  const entityId = params.id as string

  useGSAP(() => {
    const sections = document.querySelectorAll('.form-section')
    if (sections.length > 0) {
      gsap.from('.form-section', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  useEffect(() => {
    const loadEntity = async () => {
      if (!user || !entityId) return
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const data = await fetchEntity(token, entityId)
        setEntity({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        })
      } catch (error) {
        console.error('Failed to load entity:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEntity()
  }, [user, entityId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-brand-danger" />
        <div>
          <h2 className="text-xl font-semibold text-brand-text">Not Found</h2>
          <p className="text-brand-muted mt-1">The item you're looking for doesn't exist.</p>
        </div>
        <button onClick={() => router.push('/admin/entities')}
          className="px-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover">
          Back to List
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/entities')}
          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">{entity.name}</h1>
          <p className="text-brand-muted text-sm mt-1">
            Created {entity.createdAt.toLocaleDateString('en-LK', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main content sections */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">
              Details
            </h2>
            {/* Content here */}
          </div>
        </div>

        <div className="space-y-6">
          {/* Sidebar sections */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">
              Metadata
            </h2>
            {/* Metadata here */}
          </div>
        </div>
      </div>
    </div>
  )
}
```
