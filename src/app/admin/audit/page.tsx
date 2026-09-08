'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import {
  fetchAuditLogs,
  createAuditLog,
  seedAuditLogs,
  deleteAuditLog,
  clearAuditLogs,
} from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import {
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Plus,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import type { AuditLog } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

const ACTIONS = ['', 'create', 'update', 'delete', 'login', 'export', 'feature', 'unfeature']
const RESOURCES = [
  '',
  'product',
  'order',
  'user',
  'inventory',
  'category',
  'discount',
  'review',
  'settings',
  'featured',
]

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-[#F7F4EE]/10 text-[#FAF8F5] border-[#F7F4EE]/30',
  update: 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/20',
  delete: 'bg-[#1C1C1C] text-[#8A8478] border-[#2E2E2E]',
  login: 'bg-[#161616] text-[#FAF8F5] border-[#24221F]',
  export: 'bg-[#1C1C1C] text-[#D4CBBF] border-[#3A352F]',
  feature: 'bg-[#FAF8F5]/10 text-[#FAF8F5] border-[#FAF8F5]/20',
  unfeature: 'bg-[#141414] text-[#8A8478] border-[#24221F]',
}

function formatTs(val: unknown): string {
  try {
    if (!val) return '—'
    const d = val instanceof Date ? val : new Date(val as string)
    return d.toLocaleString('en-LK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function AuditLogPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  // Action loading states
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Form state for manual creation
  const [formAction, setFormAction] = useState('create')
  const [formResource, setFormResource] = useState('product')
  const [formResourceName, setFormResourceName] = useState('')
  const [formDetails, setFormDetails] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  const load = useCallback(
    async (p: number) => {
      if (!user) return
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const params: Record<string, string> = { page: String(p) }
        if (actionFilter) params.action = actionFilter
        if (resourceFilter) params.resource = resourceFilter
        const result = await fetchAuditLogs(token, params)
        setItems(result.items)
        setTotal(result.total)
        setHasMore(result.hasMore)
      } catch (err) {
        console.error('Failed to load audit logs', err)
      } finally {
        setLoading(false)
      }
    },
    [user, actionFilter, resourceFilter]
  )

  useEffect(() => {
    if (authLoading) return
    setPage(1)
    load(1)
  }, [user, authLoading, actionFilter, resourceFilter, load])

  useGSAP(
    () => {
      if (loading) return
      gsap.fromTo(
        '.page-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' }
      )
      const rows = document.querySelectorAll('.item-row')
      if (rows.length > 0) {
        gsap.fromTo(
          '.item-row',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.03, duration: 0.35, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,y' }
        )
      }
    },
    { scope: containerRef, dependencies: [loading] }
  )

  const handleSeed = async () => {
    if (!user) return
    setSeeding(true)
    try {
      const token = await user.getIdToken()
      const res = await seedAuditLogs(token, 20)
      addToast('success', res.message || 'Sample audit events generated')
      await load(1)
    } catch {
      addToast('error', 'Failed to generate sample logs')
    } finally {
      setSeeding(false)
    }
  }

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmittingForm(true)
    try {
      const token = await user.getIdToken()
      await createAuditLog(token, {
        action: formAction,
        resource: formResource,
        resourceName: formResourceName.trim() || undefined,
        details: formDetails.trim() || undefined,
      })
      addToast('success', 'New audit log entry recorded')
      setIsCreateModalOpen(false)
      setFormResourceName('')
      setFormDetails('')
      await load(1)
    } catch {
      addToast('error', 'Failed to create audit log entry')
    } finally {
      setSubmittingForm(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!user) return
    setDeletingId(id)
    try {
      const token = await user.getIdToken()
      await deleteAuditLog(token, id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      addToast('success', 'Audit log entry removed')
    } catch {
      addToast('error', 'Failed to delete audit log entry')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    if (!user) return
    setClearing(true)
    try {
      const token = await user.getIdToken()
      await clearAuditLogs(token)
      setItems([])
      setTotal(0)
      setIsClearModalOpen(false)
      addToast('success', 'All audit logs cleared')
    } catch {
      addToast('error', 'Failed to clear audit logs')
    } finally {
      setClearing(false)
    }
  }

  const handleExportCSV = () => {
    if (items.length === 0) {
      addToast('error', 'No audit logs to export')
      return
    }
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Resource Name', 'Details']
    const rows = items.map((i) => [
      i.id,
      formatTs(i.createdAt),
      `"${i.userEmail}"`,
      i.action,
      i.resource,
      `"${(i.resourceName || '').replace(/"/g, '""')}"`,
      `"${(i.details || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('success', 'Exported audit log CSV')
  }

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.userEmail.toLowerCase().includes(search.toLowerCase()) ||
          (i.resourceName || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.details || '').toLowerCase().includes(search.toLowerCase()) ||
          i.action.toLowerCase().includes(search.toLowerCase()) ||
          i.resource.toLowerCase().includes(search.toLowerCase())
      )
    : items

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    load(newPage)
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div ref={containerRef} className="space-y-6 pb-16">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Audit Log</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            {total.toLocaleString()} administrative and system events recorded
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#FAF8F5] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50"
            title="Generate realistic sample audit logs for demonstration"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#F7F4EE]" />}
            {seeding ? 'Generating...' : 'Seed Sample Logs'}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#FAF8F5] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Entry
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#8A8478] hover:text-[#FAF8F5] rounded-lg text-xs font-medium transition-all"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {total > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] text-[#FAF8F5] hover:bg-[#252525] rounded-lg text-xs font-medium transition-all"
              title="Clear all recorded logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
          <input
            type="text"
            placeholder="Search by user, resource, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-10 pr-4 py-2 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] transition-colors"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#121212] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] cursor-pointer"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a ? `Action: ${a.toUpperCase()}` : 'All Actions'}
            </option>
          ))}
        </select>

        {/* Resource filter */}
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="bg-[#121212] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] cursor-pointer"
        >
          {RESOURCES.map((r) => (
            <option key={r} value={r}>
              {r ? `Resource: ${r.charAt(0).toUpperCase() + r.slice(1)}` : 'All Resources'}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
        </div>
      ) : (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#24221F] bg-[#0E0E0E]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden md:table-cell">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden lg:table-cell">
                    Details
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24221F]/50">
                {filtered.map((log) => (
                  <tr key={log.id} className="item-row hover:bg-[#181818] transition-colors">
                    <td className="px-4 py-3 text-[#8A8478] text-xs font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#8A8478]/60" />
                        {formatTs(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#FAF8F5] text-xs truncate max-w-[180px] font-medium">
                        {log.userEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border capitalize',
                          ACTION_COLORS[log.action] ||
                            'bg-[#8A8478]/10 text-[#8A8478] border-[#8A8478]/30'
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[#8A8478] text-xs capitalize">{log.resource}</span>
                        {log.resourceName && (
                          <span className="text-[#FAF8F5] text-xs truncate max-w-[180px] font-medium">
                            {log.resourceName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-[#8A8478] text-xs truncate max-w-[280px]" title={log.details}>
                        {log.details || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEntry(log.id)}
                        disabled={deletingId === log.id}
                        className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
                        title="Delete log entry"
                      >
                        {deletingId === log.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <ClipboardList className="w-10 h-10 text-[#8A8478]/30 mx-auto mb-3" />
                      <p className="text-[#8A8478] text-sm">No audit events recorded yet</p>
                      <p className="text-[#8A8478]/60 text-xs mt-1 mb-4">
                        Click "Seed Sample Logs" above to generate realistic demo audit records.
                      </p>
                      <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] text-xs font-semibold rounded-lg hover:bg-white transition-all shadow-xs"
                      >
                        {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Seed Sample Audit Logs
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#24221F]">
              <p className="text-xs text-[#8A8478]">
                Page {page} of {totalPages} · {total.toLocaleString()} total events
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#FAF8F5] font-medium">{page}</span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasMore}
                  className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#FAF8F5] hover:bg-[#181818] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#24221F] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#FAF8F5]">Record Audit Log Event</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">Manually document an administrative action</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A8478] hover:text-[#FAF8F5] p-1.5 rounded-lg hover:bg-[#1C1C1C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8A8478] block mb-1">Action</label>
                  <select
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
                  >
                    {ACTIONS.filter(Boolean).map((a) => (
                      <option key={a} value={a} className="capitalize">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8A8478] block mb-1">Resource</label>
                  <select
                    value={formResource}
                    onChange={(e) => setFormResource(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] outline-none focus:border-[#F7F4EE]"
                  >
                    {RESOURCES.filter(Boolean).map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8A8478] block mb-1">
                  Resource Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Velocity Runner White, ORD-2026-901"
                  value={formResourceName}
                  onChange={(e) => setFormResourceName(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#8A8478] block mb-1">Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe the administrative event or reconciliation details..."
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg p-3 text-xs text-[#FAF8F5] placeholder:text-[#8A8478]/50 outline-none focus:border-[#F7F4EE] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24221F]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#8A8478] hover:text-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-xs rounded-lg hover:bg-white disabled:opacity-50 transition-all"
                >
                  {submittingForm ? 'Recording...' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#3A352F] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#FAF8F5]">
              <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-[#24221F] flex items-center justify-center shrink-0 text-[#FAF8F5]">
                <ShieldAlert className="w-5 h-5 text-[#8A8478]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#FAF8F5]">Clear All Audit Logs?</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">This action will permanently delete all {total} log entries.</p>
              </div>
            </div>

            <p className="text-xs text-[#8A8478] bg-[#0E0E0E] p-3 rounded-lg border border-[#24221F]">
              Warning: System event records and audit trails are critical for compliance. Once cleared, previous activity cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs text-[#8A8478] hover:text-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAll}
                className="px-4 py-2 bg-[#1C1C1C] border border-[#3A352F] text-[#FAF8F5] font-semibold text-xs rounded-lg hover:bg-[#252525] disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {clearing ? 'Clearing...' : 'Confirm Clear All'}
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
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto border shadow-xl bg-[#141414]',
              t.type === 'success'
                ? 'text-[#FAF8F5] border-[#F7F4EE]/30'
                : 'text-[#D4CBBF] border-[#3A352F]'
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4 text-[#D4CBBF]" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
