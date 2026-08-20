'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchRoles, createRole, deleteRole } from '@/lib/admin-client'
import { BUILT_IN_ROLE_PERMISSIONS, PERMISSION_GROUPS, type Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Shield, Lock } from 'lucide-react'
import type { CustomRole } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function RolesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setCustomRoles(await fetchRoles(t)) } catch {}
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
    const c = document.querySelectorAll('.role-card')
    if (c.length) gsap.fromTo('.role-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, delay: 0.2, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleCreate = async () => {
    if (!user || !name.trim() || selectedPerms.size === 0) return; setSaving(true)
    try { const t = await user.getIdToken(); await createRole(t, { name, permissions: Array.from(selectedPerms) }); setCustomRoles(await fetchRoles(t)); setShowForm(false); setName(''); setSelectedPerms(new Set()); addToast('success', 'Role created') }
    catch { addToast('error', 'Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!user) return; try { const t = await user.getIdToken(); await deleteRole(t, id); setCustomRoles((p) => p.filter((r) => r.id !== id)); addToast('success', 'Deleted') } catch { addToast('error', 'Failed') }
  }

  const togglePerm = (perm: string) => {
    const next = new Set(selectedPerms)
    if (next.has(perm)) next.delete(perm); else next.add(perm)
    setSelectedPerms(next)
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  const builtInRoles = Object.entries(BUILT_IN_ROLE_PERMISSIONS)

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-[#F0EDE8]">Roles</h1><p className="text-[#6B6B6B] text-sm mt-1">{builtInRoles.length} built-in + {customRoles.length} custom</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium hover:bg-[#E2C270]"><Plus className="w-4 h-4" /> Custom Role</button>
      </div>

      {showForm && (
        <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F0EDE8]">Create Custom Role</h2>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Role Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full max-w-xs bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
          <div className="space-y-3">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs text-[#6B6B6B] font-semibold uppercase tracking-wider mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((perm) => (
                    <button key={perm} onClick={() => togglePerm(perm)} className={cn('px-3 py-1.5 rounded-lg text-xs border transition-colors', selectedPerms.has(perm) ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]' : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F0EDE8]')}>
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#2A2A2A] rounded-lg text-sm text-[#F0EDE8]">Cancel</button><button onClick={handleCreate} disabled={saving || !name.trim() || selectedPerms.size === 0} className="px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create Role'}</button></div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider">Built-in Roles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {builtInRoles.map(([roleName, perms]) => (
          <div key={roleName} className="role-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-5">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-[#C9A84C]" /><h3 className="text-sm font-medium text-[#F0EDE8] capitalize">{roleName}</h3><Lock className="w-3 h-3 text-[#6B6B6B]" /></div>
            <div className="flex flex-wrap gap-1.5">{perms.map((perm) => (<span key={perm} className="px-2 py-0.5 rounded text-[10px] bg-[#2A2A2A] text-[#6B6B6B]">{perm}</span>))}</div>
          </div>
        ))}
      </div>

      {customRoles.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider">Custom Roles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customRoles.map((role) => (
              <div key={role.id} className="role-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-5">
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#C9A84C]" /><h3 className="text-sm font-medium text-[#F0EDE8]">{role.name}</h3></div><button onClick={() => handleDelete(role.id)} className="p-1.5 text-[#6B6B6B] hover:text-[#E05252]"><Trash2 className="w-4 h-4" /></button></div>
                <div className="flex flex-wrap gap-1.5">{role.permissions.map((p) => (<span key={p} className="px-2 py-0.5 rounded text-[10px] bg-[#C9A84C]/10 text-[#C9A84C]">{p}</span>))}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">{toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{t.message}</div>))}</div>
    </div>
  )
}
