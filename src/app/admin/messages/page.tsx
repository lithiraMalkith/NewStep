'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchMessages, updateMessageStatus, deleteMessage } from '@/lib/admin-client'
import { cn, formatDate } from '@/lib/utils'
import { Search, Loader2, AlertCircle, CheckCircle2, Mail, MailOpen, MessageSquare, Trash2, Reply } from 'lucide-react'
import type { Message } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function MessagesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all')
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selected, setSelected] = useState<Message | null>(null)

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    const load = async () => {
      try {
        const t = await user.getIdToken()
        setItems(await fetchMessages(t))
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleStatus = async (id: string, status: string) => {
    if (!user) return; try { const t = await user.getIdToken(); await updateMessageStatus(t, id, status); setItems((p) => p.map((m) => m.id === id ? { ...m, status: status as Message['status'] } : m)); addToast('success', 'Updated') } catch { addToast('error', 'Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!user) return; try { const t = await user.getIdToken(); await deleteMessage(t, id); setItems((p) => p.filter((m) => m.id !== id)); setSelected(null); addToast('success', 'Deleted') } catch { addToast('error', 'Failed') }
  }

  const filtered = items.filter((m) => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.message?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'all' || m.status === filter)
  })

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      <div className="page-header">
        <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F5]">Customer Inquiries</h1>
        <p className="text-[#8A8478] text-sm mt-1">{items.filter((m) => m.status === 'new').length} unread inquiries</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'new', 'read', 'replied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
              filter === f
                ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B]'
                : 'border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#383530]'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
        <input
          type="text"
          placeholder="Search by name or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#121212] border border-[#24221F] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/40 outline-none focus:border-[#F7F4EE] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                setSelected(m)
                if (m.status === 'new') handleStatus(m.id, 'read')
              }}
              className={cn(
                'bg-[#121212] rounded-xl border p-5 cursor-pointer transition-all',
                selected?.id === m.id ? 'border-[#FAF8F5]' : 'border-[#24221F] hover:border-[#383530]',
                m.status === 'new' && 'border-l-4 border-l-[#F7F4EE]'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#FAF8F5]">{m.name}</span>
                  {m.status === 'new' && <span className="w-2 h-2 rounded-full bg-[#F7F4EE]" />}
                </div>
                <span className="text-xs text-[#8A8478]">{formatDate(m.createdAt)}</span>
              </div>
              <p className="text-xs text-[#8A8478] mt-0.5">{m.contact}</p>
              <p className="text-sm text-[#FAF8F5]/80 mt-2 line-clamp-2">{m.message}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-[#8A8478] text-sm">No messages match your criteria</p>}
        </div>

        {selected && (
          <div className="bg-[#121212] rounded-xl border border-[#24221F] p-6 sticky top-20 self-start shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#FAF8F5]">{selected.name}</h3>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border',
                selected.status === 'new'
                  ? 'bg-[#F7F4EE]/10 border-[#F7F4EE]/20 text-[#F7F4EE]'
                  : selected.status === 'replied'
                  ? 'bg-[#1A1A1A] border-[#24221F] text-[#FAF8F5]'
                  : 'bg-[#181818] border-[#24221F] text-[#8A8478]'
              )}>
                {selected.status}
              </span>
            </div>
            <p className="text-xs text-[#8A8478] mb-1">{selected.contact}</p>
            <p className="text-xs text-[#8A8478] mb-4">{formatDate(selected.createdAt)}</p>
            <p className="text-sm text-[#FAF8F5] leading-relaxed mb-6 bg-[#0B0B0B] border border-[#24221F] p-3.5 rounded-lg">{selected.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatus(selected.id, 'replied')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] transition-all shadow-xs"
              >
                <Reply className="w-3.5 h-3.5" /> Mark Replied
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-2 border border-[#E05252]/30 text-[#E05252] rounded-lg hover:bg-[#E05252]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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

