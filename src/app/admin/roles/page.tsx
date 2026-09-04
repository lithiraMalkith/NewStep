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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  const builtInRoles = Object.entries(BUILT_IN_ROLE_PERMISSIONS)

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F5]">Roles & Permissions</h1>
          <p className="text-[#8A8478] text-sm mt-1">{builtInRoles.length} built-in · {customRoles.length} custom</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Custom Role
        </button>
      </div>

      {showForm && (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#FAF8F5]">Create Custom Role</h2>
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Role Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Editor"
              className="w-full max-w-xs bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div className="space-y-4 pt-2">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs text-[#8A8478] font-semibold uppercase tracking-wider mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePerm(perm)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                        selectedPerms.has(perm)
                          ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B] font-medium'
                          : 'border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#383530]'
                      )}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t border-[#24221F]">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#24221F] rounded-lg text-sm text-[#FAF8F5] hover:bg-[#1C1C1C] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim() || selectedPerms.size === 0}
              className="px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-3">Built-in Roles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {builtInRoles.map(([roleName, perms]) => (
            <div key={roleName} className="role-card bg-[#121212] rounded-xl border border-[#24221F] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#FAF8F5]" />
                <h3 className="text-sm font-semibold text-[#FAF8F5] capitalize">{roleName}</h3>
                <Lock className="w-3 h-3 text-[#8A8478]" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {perms.map((perm) => (
                  <span key={perm} className="px-2 py-0.5 rounded text-[10px] bg-[#1A1A1A] border border-[#24221F] text-[#8A8478]">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {customRoles.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-3">Custom Roles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customRoles.map((role) => (
              <div key={role.id} className="role-card bg-[#121212] rounded-xl border border-[#24221F] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#F7F4EE]" />
                    <h3 className="text-sm font-semibold text-[#FAF8F5]">{role.name}</h3>
                  </div>
                  <button onClick={() => handleDelete(role.id)} className="p-1.5 text-[#8A8478] hover:text-[#E05252] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-[#F7F4EE]/10 border border-[#F7F4EE]/20 text-[#F7F4EE]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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

