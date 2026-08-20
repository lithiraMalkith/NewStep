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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-[#F0EDE8]">Users</h1><p className="text-[#6B6B6B] text-sm mt-1">{items.length} admin users</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium hover:bg-[#E2C270]"><Plus className="w-4 h-4" /> Invite User</button>
      </div>

      {showForm && (
        <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F0EDE8]">New Admin User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-[#6B6B6B] mb-1 block">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
            <div><label className="text-xs text-[#6B6B6B] mb-1 block">Display Name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
            <div><label className="text-xs text-[#6B6B6B] mb-1 block">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
            <div><label className="text-xs text-[#6B6B6B] mb-1 block">Role</label><select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]"><option value="superadmin">Superadmin</option><option value="manager">Manager</option><option value="fulfillment">Fulfillment</option><option value="support">Support</option></select></div>
          </div>
          <div className="flex gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#2A2A2A] rounded-lg text-sm text-[#F0EDE8]">Cancel</button><button onClick={handleCreate} disabled={saving || !email.trim()} className="px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create User'}</button></div>
        </div>
      )}

      <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b border-[#2A2A2A]"><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase">User</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase hidden sm:table-cell">Role</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase hidden md:table-cell">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase hidden lg:table-cell">Last Login</th><th className="w-12 px-4 py-3"></th></tr></thead>
        <tbody className="divide-y divide-[#2A2A2A]/50">{items.map((u) => (
          <tr key={u.uid} className="hover:bg-[#1A1A1A] transition-colors">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] text-xs font-bold shrink-0">{(u.displayName?.[0] || u.email?.[0] || 'U').toUpperCase()}</div><div><p className="font-medium text-[#F0EDE8]">{u.displayName}</p><p className="text-xs text-[#6B6B6B]">{u.email}</p></div></div></td>
            <td className="px-4 py-3 hidden sm:table-cell"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C9A84C]/10 text-[#C9A84C] capitalize"><Shield className="w-3 h-3" />{u.role}</span></td>
            <td className="px-4 py-3 hidden md:table-cell"><span className={cn('px-2 py-0.5 rounded-full text-xs', u.isActive ? 'bg-[#4CAF7D]/10 text-[#4CAF7D]' : 'bg-[#E05252]/10 text-[#E05252]')}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="px-4 py-3 text-[#6B6B6B] text-sm hidden lg:table-cell">{formatDate(u.lastLoginAt)}</td>
            <td className="px-4 py-3"><button onClick={() => setDeleteId(u.uid)} className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#E05252] hover:bg-[#E05252]/10"><Trash2 className="w-4 h-4" /></button></td>
          </tr>
        ))}</tbody>
      </table></div></div>

      {deleteId && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-sm mx-4"><h2 className="text-lg font-semibold text-[#F0EDE8] mb-4">Delete User?</h2><p className="text-[#6B6B6B] text-sm mb-4">This will also delete their Firebase Auth account.</p><div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-[#2A2A2A] rounded-lg text-[#F0EDE8]">Cancel</button><button onClick={handleDelete} className="flex-1 px-4 py-2 bg-[#E05252] text-white rounded-lg">Delete</button></div></div></div>)}

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">{toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{t.message}</div>))}</div>
    </div>
  )
}
