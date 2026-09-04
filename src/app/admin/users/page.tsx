'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchUsers, createUser, deleteUser } from '@/lib/admin-client'
import { cn, formatDate } from '@/lib/utils'
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, UserCog, Shield } from 'lucide-react'
import type { UserProfile } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function UsersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('support')
  const [password, setPassword] = useState('NewStep@2026')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setItems(await fetchUsers(t)) } catch {}
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleCreate = async () => {
    if (!user || !email.trim()) return; setSaving(true)
    try { const t = await user.getIdToken(); await createUser(t, { email, displayName, role, password }); setItems(await fetchUsers(t)); setShowForm(false); setEmail(''); setDisplayName(''); addToast('success', 'User created') }
    catch (e) { addToast('error', e instanceof Error ? e.message : 'Failed') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!user || !deleteId) return; try { const t = await user.getIdToken(); await deleteUser(t, deleteId); setItems((p) => p.filter((u) => u.uid !== deleteId)); setDeleteId(null); addToast('success', 'Deleted') } catch { addToast('error', 'Failed') }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F5]">Team & Staff</h1>
          <p className="text-[#8A8478] text-sm mt-1">{items.length} active administrative accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {showForm && (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#FAF8F5]">New Admin User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
              >
                <option value="superadmin">Superadmin</option>
                <option value="manager">Manager</option>
                <option value="fulfillment">Fulfillment</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#24221F]">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !email.trim()}
              className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#24221F]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8478] uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8478] uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                <th className="w-12 px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24221F]/50">
              {items.map((u) => (
                <tr key={u.uid} className="hover:bg-[#181818] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F7F4EE] flex items-center justify-center text-[#0B0B0B] text-xs font-bold shrink-0 shadow-xs">
                        {(u.displayName?.[0] || u.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#FAF8F5]">{u.displayName}</p>
                        <p className="text-xs text-[#8A8478]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1A1A1A] border border-[#24221F] text-[#FAF8F5] capitalize">
                      <Shield className="w-3 h-3 text-[#8A8478]" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                      u.isActive
                        ? 'bg-[#181818] border-[#24221F] text-[#FAF8F5]'
                        : 'bg-[#E05252]/10 border-[#E05252]/30 text-[#E05252]'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', u.isActive ? 'bg-[#F7F4EE]' : 'bg-[#E05252]')} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#8A8478] text-sm hidden lg:table-cell">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setDeleteId(u.uid)}
                      className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#24221F] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold text-[#FAF8F5] mb-2">Delete User?</h2>
            <p className="text-[#8A8478] text-sm mb-5">This will also delete their Firebase Auth account and revoke permissions.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-[#E05252] text-white font-medium text-sm rounded-lg hover:bg-[#C84040] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto border shadow-lg',
              t.type === 'success' ? 'bg-[#121212] text-[#FAF8F5] border-[#24221F]' : 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30'
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}

